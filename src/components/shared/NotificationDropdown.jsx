import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Video, FileText, Calendar, Trash2, X, Clock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function NotificationDropdown() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            loadNotifications();
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n._id !== id));
            if (notifications.find(n => n._id === id && !n.read)) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.read) markAsRead(notif._id);
        setIsOpen(false);

        // Navigation logic based on data
        if (notif.type === 'ClassStarted' && notif.data?.liveClassId) {
            navigate(`/student/class/${notif.data.liveClassId}`);
        } else if (notif.type === 'RecordingAvailable') {
            navigate('/student/library');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'ClassStarted': return <Video className="text-red-500" size={16} />;
            case 'RecordingAvailable': return <CheckCircle2 className="text-green-500" size={16} />;
            case 'ClassCancelled': return <X className="text-gray-500" size={16} />;
            case 'ClassRescheduled': return <Calendar className="text-blue-500" size={16} />;
            default: return <Bell className="text-blue-500" size={16} />;
        }
    };

    const formatTime = (ts) => {
        const date = new Date(ts);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-xl transition-all ${
                    isOpen || unreadCount > 0
                        ? isDark ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600'
                        : isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white dark:border-[#111118]"></span>
                )}
            </button>

            {isOpen && (
                <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl overflow-hidden z-50 transform origin-top-right transition-all border ${
                    isDark ? 'bg-[#1a1a24] border-white/5' : 'bg-white border-gray-200'
                }`}>
                    <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllRead}
                                className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-wider"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center opacity-50">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                                <p className="text-xs">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-4 border-b last:border-0 cursor-pointer flex gap-3 transition-colors relative group ${
                                        isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
                                    } ${!n.read ? isDark ? 'bg-blue-500/5' : 'bg-blue-50/50' : ''}`}
                                >
                                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                        !n.read ? isDark ? 'bg-blue-500/20' : 'bg-blue-100' : isDark ? 'bg-white/5' : 'bg-gray-100'
                                    }`}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-gray-500 whitespace-nowrap flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatTime(n.createdAt)}
                                            </span>
                                        </div>
                                        <p className={`text-[11px] leading-relaxed line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {n.message}
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full scale-y-0 group-hover:scale-y-100 transition-transform"></div>
                                    )}
                                    <button
                                        onClick={(e) => deleteNotification(e, n._id)}
                                        className="absolute right-3 bottom-2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className={`p-2 border-t text-center ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                        <button 
                            onClick={() => { navigate(user.role === 'Student' ? '/student/notifications' : '/teacher/notifications'); setIsOpen(false); }}
                            className="text-[10px] font-bold text-gray-500 hover:text-blue-500 uppercase tracking-tighter"
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

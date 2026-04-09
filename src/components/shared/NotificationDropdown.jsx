import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Video, FileText, Calendar, Trash2, X, Clock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function NotificationDropdown() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const dropdownPanelStyle = {
        backgroundColor: 'color-mix(in srgb, var(--surface-container-high), transparent 15%)',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
    };

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
            case 'ClassStarted': return <Video className="text-error" size={16} />;
            case 'RecordingAvailable': return <CheckCircle2 className="text-secondary" size={16} />;
            case 'ClassCancelled': return <X className="text-on-surface-variant" size={16} />;
            case 'ClassRescheduled': return <Calendar className="text-primary" size={16} />;
            default: return <Bell className="text-primary" size={16} />;
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
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-container-high hover:bg-surface-bright text-on-surface-variant/60'
                }`}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse border-2 border-surface"></span>
                )}
            </button>

             {isOpen && (
                <div
                    className="absolute right-0 mt-3 w-80 rounded-2xl overflow-hidden z-[100] transform origin-top-right transition-all border border-outline-variant/20 backdrop-blur-2xl"
                    style={dropdownPanelStyle}
                >
                    <div className="p-4 border-b border-outline-variant/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-on-surface">Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllRead}
                                className="text-[10px] font-bold text-primary hover:text-secondary uppercase tracking-wider"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center opacity-50">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-on-surface-variant" />
                                <p className="text-xs">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                 <div
                                    key={n._id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-4 border-b border-outline-variant/5 last:border-0 cursor-pointer flex gap-3 transition-colors relative group hover:bg-surface-bright/10 ${!n.read ? 'bg-primary/5' : ''}`}
                                >
                                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                        !n.read ? 'bg-primary/20' : 'bg-surface-container-highest'
                                    }`}>
                                        {getIcon(n.type)}
                                    </div>
                                     <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <p className="text-xs font-bold truncate text-on-surface">
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-on-surface-variant/40 whitespace-nowrap flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatTime(n.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed line-clamp-2 text-on-surface-variant/70">
                                            {n.message}
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full scale-y-0 group-hover:scale-y-100 transition-transform"></div>
                                    )}
                                    <button
                                        onClick={(e) => deleteNotification(e, n._id)}
                                        className="absolute right-3 bottom-2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-error/10 text-error transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                     <div className="p-2 border-t border-outline-variant/5 bg-surface-container-highest/20 text-center">
                        <button 
                            onClick={() => { 
                                const basePath = user?.role === 'Student' ? 'student' : user?.role === 'Teacher' ? 'teacher' : 'admin';
                                navigate(`/${basePath}/notifications`); 
                                setIsOpen(false); 
                            }}
                            className="text-[10px] font-bold text-on-surface-variant/50 hover:text-primary uppercase tracking-tighter"
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

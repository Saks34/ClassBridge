import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Bell, AlertTriangle, Calendar, Clock, CheckCircle } from 'lucide-react';
import api from '../../services/api';

export default function Notifications() {
    const { isDark } = useTheme();
    const [notifications, setNotifications] = useState([]);

    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const cardBg = isDark ? 'bg-gray-900/60 backdrop-blur-xl border-white/10' : 'bg-white/60 backdrop-blur-xl border-gray-200/50';
    const itemHoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-violet-50/50';

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data || []);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (e) { console.error(e); }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getIcon = (type) => {
        switch (type) {
            case 'class_cancelled': return <AlertTriangle className="text-red-500" size={24} />;
            case 'teacher_joined': return <CheckCircle className="text-green-500" size={24} />;
            case 'system': return <Bell className="text-blue-500" size={24} />;
            default: return <Bell className="text-violet-500" size={24} />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className={`text-3xl font-bold ${textPrimary}`}>Notifications</h1>
                <p className={`${textSecondary} mt-1`}>System events and updates</p>
            </div>

            {notifications.length === 0 ? (
                <div className={`p-16 text-center ${cardBg} border rounded-2xl`}>
                    <div className="flex justify-center mb-6">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-violet-50'}`}>
                            <Bell className={isDark ? 'text-gray-500' : 'text-violet-300'} size={40} />
                        </div>
                    </div>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>No notifications</h3>
                    <p className={textSecondary}>
                        You're all caught up! New notifications will appear here.
                    </p>
                </div>
            ) : (
                <div className={`${cardBg} border rounded-2xl overflow-hidden shadow-xl`}>
                    <div className="divide-y divide-white/5">
                        {notifications.map((notification) => (
                            <div 
                                key={notification._id} 
                                onClick={() => !notification.read && markAsRead(notification._id)}
                                className={`p-6 ${itemHoverBg} transition-all cursor-pointer group ${!notification.read ? 'bg-blue-500/5' : ''}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'} group-hover:scale-110 transition-transform shadow-inner relative`}>
                                        {getIcon(notification.type)}
                                        {!notification.read && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-gray-900 animate-pulse"></span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className={`text-base font-bold ${textPrimary} ${!notification.read ? 'text-blue-400' : ''}`}>{notification.title}</h4>
                                            <div className={`flex items-center gap-1.5 text-xs ${textSecondary} px-2 py-1 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                <Clock size={12} />
                                                <span>{formatTimestamp(notification.timestamp || notification.createdAt)}</span>
                                            </div>
                                        </div>
                                        <p className={`${textSecondary} text-sm leading-relaxed`}>{notification.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

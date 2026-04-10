import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Bell, AlertTriangle, Calendar, Clock, CheckCircle, Radio, Activity, Zap, Shield, Info, Trash2 } from 'lucide-react';
import api from '../../services/api';
import EmptyState from '../../components/shared/EmptyState';
import usePageTitle from '../../hooks/usePageTitle';

export default function Notifications() {
    const { role } = useAuth();
    usePageTitle('Event Intercepts', role);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => { loadNotifications(); }, []);

    const loadNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications || []);
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

    const deleteNotification = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
            toast.success('Notification cleared');
        } catch (err) {
            console.error('Failed to clear notification', err);
            toast.error('Failed to clear notification');
        }
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
            case 'class_cancelled': return <AlertTriangle className="text-error" size={24} />;
            case 'teacher_joined': return <Radio className="text-secondary animate-pulse" size={24} />;
            case 'system': return <Shield className="text-primary" size={24} />;
            default: return <Bell className="text-primary" size={24} />;
        }
    };

    return (
        <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
             <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none mb-4">
                   System <span className="text-gradient-primary">Notifications</span>
                </h1>
                <p className="text-on-surface-variant font-body text-sm opacity-70">
                    Stay updated with system activities, class alerts, and important updates across the platform.
                </p>
            </header>

            {notifications.length === 0 ? (
                <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] p-20 shadow-2xl">
                    <EmptyState 
                        icon={Bell} 
                        message="Transmission Log Clear" 
                        subMessage="No anomalous events detected in the current cycle. All instructional paths are operational." 
                    />
                </div>
            ) : (
                <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                     <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-secondary/10 via-primary/10 to-secondary/10 opacity-20"></div>
                     <div className="divide-y divide-outline-variant/10">
                        {notifications.map((notification) => (
                            <div 
                                key={notification._id} 
                                onClick={() => !notification.read && markAsRead(notification._id)}
                                className={`p-8 hover:bg-surface-bright/5 transition-all cursor-pointer group relative overflow-hidden ${!notification.read ? 'bg-secondary/5' : ''}`}
                            >
                                {!notification.read && (
                                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary shadow-[0_0_15px_rgba(98,250,227,0.5)]"></div>
                                )}
                                <div className="flex items-start gap-8 relative z-10">
                                    <div className="p-4 rounded-2xl bg-surface-container-highest group-hover:scale-110 transition-transform shadow-inner border border-outline-variant/5 relative">
                                        {getIcon(notification.type)}
                                        {!notification.read && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-surface animate-pulse shadow-[0_0_8px_rgba(var(--secondary-rgb),0.8)]"></span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <h4 className={`text-xl font-bold font-headline tracking-tight ${!notification.read ? 'text-secondary' : 'text-on-surface'}`}>
                                                {notification.title}
                                            </h4>
                                            <div className="flex items-center gap-2 text-[10px] font-label font-black uppercase tracking-[0.1em] text-on-surface-variant/60 px-3 py-1.5 rounded-full bg-surface-container-highest border border-outline-variant/5">
                                                <Clock size={12} className="text-secondary" />
                                                <span>{formatTimestamp(notification.timestamp || notification.createdAt)}</span>
                                            </div>
                                        </div>
                                        <p className="text-on-surface-variant font-body text-base leading-relaxed max-w-4xl">{notification.message}</p>
                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-outline-variant/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toast.success('Analyzing notification sequence telemetry...');
                                                }}
                                                className="text-[10px] font-label font-black uppercase tracking-widest text-secondary hover:text-on-surface flex items-center gap-2 transition-colors"
                                            >
                                                <Activity size={12} /> Analyze Schedule
                                            </button>
                                            <button 
                                                onClick={(e) => deleteNotification(notification._id, e)} 
                                                className="text-[10px] font-label font-black uppercase tracking-widest text-error hover:text-error/80 flex items-center gap-2 transition-colors"
                                            >
                                                <Trash2 size={12} /> Clear Event
                                            </button>
                                            {!notification.read && (
                                                 <button onClick={(e) => {
                                                     e.stopPropagation();
                                                     markAsRead(notification._id);
                                                 }} className="text-[10px] font-label font-black uppercase tracking-widest text-on-surface-variant/60 hover:text-on-surface flex items-center gap-2 transition-colors">
                                                    <CheckCircle size={12} /> Acknowledge Log
                                                 </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* System Status Footer */}
            <div className="flex flex-wrap gap-8 items-center justify-center pt-8 border-t border-outline-variant/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <div className="flex items-center gap-2 font-label text-[10px] uppercase font-bold tracking-widest text-on-surface">
                    <Zap size={14} className="text-secondary" /> Transmissions Active
                </div>
                <div className="flex items-center gap-2 font-label text-[10px] uppercase font-bold tracking-widest text-on-surface">
                    <Shield size={14} className="text-primary" /> Encryption Level 4
                </div>
                <div className="flex items-center gap-2 font-label text-[10px] uppercase font-bold tracking-widest text-on-surface">
                    <Info size={14} className="text-secondary" /> Nodal Sync
                </div>
            </div>
        </div>
    );
}

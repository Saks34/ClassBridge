import { useState, useEffect } from 'react';
import api from '../../services/api';
import AnalyticsCard from '../../components/teacher/AnalyticsCard';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import { BarChart3, Users, Video, BookCheck, MessageSquare, Eye, AlertCircle, Zap, Shield, Globe, Activity, TrendingUp } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

export default function AdminAnalytics() {
    usePageTitle('Analytics', 'Admin');
    const { toggleTheme } = useTheme();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        try {
            const { data } = await api.get('/analytics/admin');
            setStats(data.data);
        } catch (error) {
            console.error('Failed to load admin analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><LoadingSpinner centered /></div>;

    if (!stats) {
        return (
            <EmptyState 
                icon={AlertCircle} 
                message="Data Loading Failed" 
                subMessage="There was an error loading the analytics data. Please refresh the page." 
            />
        );
    }

    return (
        <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
             <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none mb-4">
                   Platform <span className="text-gradient-primary">Analytics</span>
                </h1>
                <p className="text-on-surface-variant text-base md:text-lg font-body max-w-2xl leading-relaxed">
                    Real-time monitoring of learning activities. Visualize platform usage and learning statistics across the platform.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard 
                    icon={<BarChart3 className="text-primary" />} 
                    label="Total Classes" 
                    value={stats.totalClasses || 0} 
                    subtext={`${stats.scheduledClasses || 0} Scheduled Classes`} 
                    color="primary" 
                />
                <StatCard 
                    icon={<Video className="text-secondary" size={24} />} 
                    label="Live Classes" 
                    value={stats.liveClasses || 0} 
                    subtext="Currently Running" 
                    color="secondary" 
                />
                <StatCard 
                    icon={<BookCheck className="text-primary" size={24} />} 
                    label="Completed Classes" 
                    value={stats.completedClasses || 0} 
                    subtext="Successfully Ended" 
                    color="primary" 
                />
                <StatCard 
                    icon={<Eye className="text-secondary" size={24} />} 
                    label="Total Attendance" 
                    value={stats.totalViews || 0} 
                    subtext="Total Views Across All Classes" 
                    color="secondary" 
                />
                <StatCard 
                    icon={<Users className="text-primary" size={24} />} 
                    label="Avg. Viewers" 
                    value={stats.avgPeakViewers || 0} 
                    subtext="Average Peak Viewer Count" 
                    color="primary" 
                />
                <StatCard 
                    icon={<MessageSquare className="text-secondary" size={24} />} 
                    label="Chat Messages" 
                    value={stats.totalChatMessages || 0} 
                    subtext="Total Messages Sent" 
                    color="secondary" 
                />
            </div>

            <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-20"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h2 className="text-2xl font-bold font-headline text-on-surface tracking-tight">System Status Report</h2>
                        <p className="text-on-surface-variant/60 font-body text-sm mt-1">Platform stability and traffic monitoring</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 rounded-full border border-outline-variant/10 bg-surface-container-high/50 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-label text-on-surface uppercase font-bold tracking-widest">System Online</span>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <DetailItem icon={<Shield className="text-primary" />} title="Security Status" value={stats.encryption} />
                    <DetailItem icon={<Globe className="text-secondary" />} title="Platform Status" value={stats.nodeStatus === 'Healthy' ? 'Operational' : stats.nodeStatus} />
                    <DetailItem icon={<Zap className="text-primary" />} title="Performance" value={`${stats.latency}ms Latency`} />
                </div>

                 <div className="mt-12 space-y-4 pt-10 border-t border-outline-variant/5">
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <p className="text-sm font-body text-on-surface-variant/70 group-hover:text-on-surface transition-colors">System status is optimal.</p>
                        </div>
                        <TrendingUp size={14} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"></div>
                            <p className="text-sm font-body text-on-surface-variant/70 group-hover:text-on-surface transition-colors">{stats.liveClasses || 0} active classes currently running.</p>
                        </div>
                        <Activity size={14} className="text-primary" />
                    </div>
                </div>
            </div>
        </div>
    );
}

 const StatCard = ({ icon, label, value, subtext, color }) => (
    <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 group hover:border-primary/20 transition-all shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2`}></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className={`w-12 h-12 rounded-2xl bg-surface-container-high/80 backdrop-blur-xl flex items-center justify-center border border-outline-variant/5 shadow-inner group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold">{label}</span>
        </div>
        <div className="text-5xl font-bold text-on-surface font-headline relative z-10 tracking-tight">{value}</div>
        <div className="text-[10px] text-on-surface-variant/50 mt-3 uppercase font-label font-bold relative z-10 tracking-widest">{subtext}</div>
    </div>
);

const DetailItem = ({ icon, title, value }) => (
    <div className="flex items-center gap-4 p-6 rounded-3xl bg-surface-container-high/30 border border-outline-variant/5 group hover:bg-surface-bright/5 transition-all">
        <div className="p-3 bg-surface-container-high rounded-xl border border-outline-variant/10 transition-transform group-hover:rotate-12">{icon}</div>
        <div>
            <div className="text-[9px] font-label text-on-surface-variant/60 uppercase tracking-widest font-black mb-1 leading-none">{title}</div>
            <div className="text-on-surface font-bold font-headline">{value}</div>
        </div>
    </div>
);

import { useState, useEffect } from 'react';
import { 
    Video, 
    Search, 
    Calendar as CalendarIcon, 
    User, 
    Play, 
    Clock, 
    Filter,
    ChevronRight,
    MonitorPlay,
    Sparkles,
    Trash2,
    X,
    Trophy,
    BookOpen,
    FileText,
    Share2,
    CheckCircle2,
    Zap,
    History
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import CustomYouTubePlayer from '../../components/shared/CustomYouTubePlayer';
import ClassSummary from '../../components/shared/ClassSummary';
import toast from 'react-hot-toast';

export default function VODLibrary() {
    const { user } = useAuth();
    const { isDark } = useTheme();

    const [loading, setLoading] = useState(true);
    const [recordings, setRecordings] = useState([]);
    const [filteredRecordings, setFilteredRecordings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [selectedLiveClassId, setSelectedLiveClassId] = useState(null);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [stats, setStats] = useState({ totalHours: 0, completedCount: 0 });

    useEffect(() => {
        loadRecordings();
    }, [user]);

    useEffect(() => {
        filterRecordings();
    }, [searchTerm, selectedSubject, recordings]);

    const loadRecordings = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const batchId = user.batch?._id || user.batch;
            const endpoint = batchId 
                ? `/live-classes/batch/${batchId}/recordings` 
                : `/live-classes/completed`;
            
            const { data } = await api.get(endpoint);
            const items = data.data || [];
            setRecordings(items);

            // Calculate stats
            const totalSec = items.reduce((acc, curr) => acc + (curr.actualDuration || 0), 0);
            const completed = items.filter(i => i.isWatched).length;
            setStats({
                totalHours: Math.round(totalSec / 3600),
                completedCount: completed
            });
        } catch (error) {
            console.error('Failed to load recordings:', error);
            toast.error('Failed to load recordings');
        } finally {
            setLoading(false);
        }
    };

    const filterRecordings = () => {
        let results = [...recordings];
        
        if (selectedSubject !== 'All') {
            results = results.filter(r => (r.timetableId?.subject === selectedSubject || r.subject === selectedSubject));
        }

        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            results = results.filter(r => 
                (r.title?.toLowerCase().includes(low)) || 
                (r.timetableId?.subject?.toLowerCase().includes(low)) ||
                (r.timetableId?.teacher?.name?.toLowerCase().includes(low))
            );
        }

        setFilteredRecordings(results);
    };

    const subjects = ['All', ...new Set(recordings.map(r => r.timetableId?.subject || r.subject).filter(Boolean))];

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleShare = (id) => {
        const url = `${window.location.origin}/student/class/${id}`;
        navigator.clipboard.writeText(url);
        toast.success('Resource link copied to clipboard!');
    };

    if (loading) return <LoadingSpinner centered />;

    const featuredVideo = filteredRecordings.length > 0 ? filteredRecordings[0] : null;

    return (
        <div className="min-h-screen bg-surface text-on-surface pb-20">
            {/* Hero Section */}
            <div className="relative h-[480px] overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[120%] bg-primary/10 blur-[130px] rounded-full animate-pulse-slow"></div>
                    <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[120%] bg-secondary/10 blur-[130px] rounded-full animate-pulse-slow-reverse"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-[1600px] mx-auto px-8 h-full flex flex-col justify-center">
                    <div className="max-w-3xl space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 animate-fade-in">
                                <Zap size={14} className="fill-primary" />
                                Exclusive Archives
                            </div>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter leading-none animate-fade-in-up">
                            KNOWLEDGE <br />
                            <span className="text-gradient-primary">QUANTUM VAULT</span>
                        </h1>
                        <p className="text-lg text-on-surface-variant font-body max-w-xl leading-relaxed opacity-80 animate-fade-in-up delay-100">
                            Access every session, every insight, and every fundamental building block. Synthesized by AI, stored for your academic mastery.
                        </p>
                        
                        <div className="flex flex-wrap gap-8 pt-6 animate-fade-in-up delay-200">
                            <div className="flex items-center gap-4 group cursor-default">
                                <div className="w-12 h-12 rounded-[1.25rem] bg-surface-container-high border border-outline-variant/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase text-on-surface-variant/40 tracking-widest">Studied Time</div>
                                    <div className="text-2xl font-black font-headline">{stats.totalHours} <span className="text-xs font-bold text-on-surface-variant/40">HRS</span></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group cursor-default">
                                <div className="w-12 h-12 rounded-[1.25rem] bg-surface-container-high border border-outline-variant/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase text-on-surface-variant/40 tracking-widest">Completed Sessions</div>
                                    <div className="text-2xl font-black font-headline">{stats.completedCount} / {recordings.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Blur Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-surface to-transparent z-10"></div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1600px] mx-auto px-8 -mt-20 relative z-20">
                
                {/* Search & Filter Bar */}
                <div className="sticky top-6 p-4 rounded-[2.5rem] bg-surface-container/60 backdrop-blur-2xl border border-outline-variant/10 shadow-2xl flex flex-col lg:flex-row gap-6 mb-12 animate-fade-in transition-all">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-all duration-300 w-5 h-5 opacity-40" />
                        <input
                            type="text"
                            placeholder="Quantum scan titles, faculty, or topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-6 py-4 rounded-[1.75rem] bg-surface/50 hover:bg-surface transition-all outline-none text-on-surface placeholder:text-on-surface-variant/30 font-body text-sm border border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 shadow-inner"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 lg:pb-0 px-2">
                        {subjects.map((s, i) => (
                            <button
                                key={s}
                                onClick={() => setSelectedSubject(s)}
                                className={`h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap flex items-center gap-2 ${
                                    selectedSubject === s
                                        ? 'bg-primary text-on-primary shadow-xl shadow-primary/20 scale-105 z-10'
                                        : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/5 hover:border-outline-variant/20 hover:text-on-surface'
                                }`}
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                {s === 'All' ? <History size={14} /> : <BookOpen size={14} />}
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid Header */}
                <div className="flex items-center justify-between mb-8 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></div>
                        <h2 className="text-sm font-black uppercase tracking-[0.4em] text-on-surface-variant/60">Search Results</h2>
                        <span className="px-2 py-0.5 rounded-md bg-surface-container-high border border-outline-variant/10 text-[10px] font-black text-primary">
                            {filteredRecordings.length} NODES
                        </span>
                    </div>
                </div>

                {/* Cards Grid */}
                {filteredRecordings.length === 0 ? (
                    <div className="py-32">
                        <EmptyState 
                            icon={MonitorPlay} 
                            message="No knowledge fragments found" 
                            subMessage="The archive nodes match zero patterns for your current search. Broaden your quantum scan range." 
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {filteredRecordings.map((rec, idx) => {
                            const videoId = rec.recordings?.[0]?.youtubeVideoId;
                            return (
                                <div 
                                    key={rec._id}
                                    className="group relative flex flex-col bg-surface-container/40 rounded-[2.5rem] border border-outline-variant/10 hover:border-primary/30 transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] cursor-pointer overflow-hidden animate-fade-in-up"
                                    style={{ animationDelay: `${idx * 80}ms` }}
                                >
                                    {/* Thumbnail Area */}
                                    <div 
                                        className="aspect-[16/10] relative overflow-hidden bg-black"
                                        onClick={() => {
                                            setSelectedVideoId(videoId);
                                            setSelectedLiveClassId(rec._id);
                                        }}
                                    >
                                        <img 
                                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                                            alt={rec.title}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                                            onError={(e) => { e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }}
                                        />
                                        
                                        {/* Play Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-125 group-hover:scale-100">
                                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
                                                <Play fill="white" size={32} />
                                            </div>
                                        </div>

                                        {/* Top Badges */}
                                        <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                                            <span className="px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md text-white border border-white/10 shadow-lg select-none">
                                                {rec.timetableId?.subject || rec.subject}
                                            </span>
                                            
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleShare(rec._id);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white/60 hover:text-white border border-white/10 flex items-center justify-center transition-all hover:bg-primary/40 hover:scale-110"
                                                >
                                                    <Share2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Duration */}
                                        <div className="absolute bottom-5 right-5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-primary text-[9px] font-black tracking-widest border border-primary/20 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                                            {rec.actualDuration ? `${Math.floor(rec.actualDuration / 60)}m` : '00:00'}
                                        </div>

                                        {/* Progress Bar (Visual Only) */}
                                        {rec.isWatched && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
                                                <div className="h-full bg-primary w-full"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-[10px] flex items-center gap-2 text-on-surface-variant font-black uppercase tracking-[0.2em] opacity-40">
                                                <CalendarIcon size={12} className="text-primary" />
                                                {formatDate(rec.actualEndTime || rec.createdAt)}
                                            </span>
                                            {rec.isWatched && (
                                                <div className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-secondary/10">
                                                    <Trophy size={10} />
                                                    MASTERY
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-black font-headline text-on-surface leading-tight tracking-tight uppercase mb-6 line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors">
                                            {rec.title || rec.timetableId?.subject}
                                        </h3>

                                        <div className="mt-auto space-y-6 pt-6 border-t border-outline-variant/10">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full border border-outline-variant/20 overflow-hidden bg-surface-container-highest group-hover:rotate-6 transition-transform">
                                                        <img 
                                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(rec.timetableId?.teacher?.name || 'T')}&background=060e20&color=62fae3`} 
                                                            alt="Teacher"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-on-surface-variant/40 font-black uppercase tracking-widest leading-none mb-1">Archived by</div>
                                                        <div className="text-[12px] text-on-surface font-bold">
                                                            {rec.timetableId?.teacher?.name || 'Academic Observer'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedLiveClassId(rec._id);
                                                        setShowSummaryModal(true);
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface-variant border border-outline-variant/10 flex items-center justify-center transition-all group/btn"
                                                    title="View AI Summary"
                                                >
                                                    <Sparkles size={18} className="group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Video Player Modal */}
            {selectedVideoId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-3xl animate-fade-in">
                    {/* Floating Background Orbs */}
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

                    {/* Navigation Buttons */}
                    <button 
                        onClick={() => setSelectedVideoId(null)}
                        className="absolute top-10 right-10 p-4 rounded-2xl bg-white/5 hover:bg-error hover:text-on-error text-white transition-all duration-500 group z-[110] border border-white/10"
                    >
                        <X size={28} className="group-hover:rotate-90 transition-transform" />
                    </button>

                    <div className="w-full max-w-[1400px] flex flex-col gap-10 relative z-[105]">
                        <div className="w-full aspect-video bg-black rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 ring-1 ring-white/5">
                            <CustomYouTubePlayer 
                                videoId={selectedVideoId} 
                                liveClassId={selectedLiveClassId} 
                                autoplay={true} 
                            />
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 px-6 animate-fade-in-up">
                            <div className="max-w-3xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em]">
                                        Observing Playback Node
                                    </div>
                                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                                        ID: {selectedLiveClassId?.slice(-8)}
                                    </span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-white font-headline tracking-tighter uppercase leading-tight">
                                    {recordings.find(r => r._id === selectedLiveClassId)?.title || 'Video Recording'}
                                </h2>
                            </div>
                            
                            <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Context Summary</div>
                                    <button 
                                        onClick={() => setShowSummaryModal(true)}
                                        className="text-white hover:text-primary font-bold transition-colors uppercase tracking-widest text-xs flex items-center gap-2"
                                    >
                                        OPEN AI ANALYSIS
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Summary Modal */}
            {showSummaryModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-2xl animate-fade-in">
                    <div className="w-full max-w-5xl bg-surface rounded-[3rem] border border-outline-variant/10 shadow-3xl overflow-hidden relative max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-high">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-on-surface font-headline uppercase tracking-tight">AI Insights Summary</h3>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">Session Node Analysis</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowSummaryModal(false)}
                                className="p-3 rounded-2xl hover:bg-error hover:text-on-error text-on-surface-variant transition-all transition-duration-500"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            <ClassSummary liveClassId={selectedLiveClassId} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Utility animation classes in App.css should be:
/*
.animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.animate-pulse-slow-reverse { animation: pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.text-gradient-primary { background: linear-gradient(135deg, #62fae3 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
*/

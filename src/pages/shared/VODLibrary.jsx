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
    History,
    LayoutGrid,
    ArrowLeft
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

    const formatDuration = (seconds) => {
        if (!seconds) return null;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const handleShare = (id) => {
        const url = `${window.location.origin}/student/class/${id}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
    };

    const openVideo = (rec) => {
        const videoId = rec.recordings?.[0]?.youtubeVideoId;
        setSelectedVideoId(videoId);
        setSelectedLiveClassId(rec._id);
    };

    const closeVideo = () => {
        setSelectedVideoId(null);
        // keep selectedLiveClassId so summary modal still works
    };

    const selectedRec = recordings.find(r => r._id === selectedLiveClassId);

    if (loading) return <LoadingSpinner centered />;

    return (
        <div className="min-h-screen bg-surface text-on-surface pb-24">

            {/* ── Page Header ─────────────────────────────────────────── */}
            <div className="relative overflow-hidden border-b border-outline-variant/10">
                {/* Ambient blobs — restrained, not full-bleed */}
                <div className="pointer-events-none absolute inset-0 -z-0">
                    <div className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-primary/10 blur-[100px]" />
                    <div className="absolute -bottom-20 right-0 w-[360px] h-[360px] rounded-full bg-secondary/8 blur-[90px]" />
                </div>

                <div className="relative z-10 max-w-[1600px] mx-auto px-5 md:px-10 py-10 md:py-14">
                    {/* Label row */}
                    <div className="flex items-center gap-2 mb-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-[0.25em]">
                            <Zap size={12} className="fill-primary" />
                            Recorded Sessions
                        </span>
                    </div>

                    {/* Title + Stats in one row on desktop */}
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
                                Knowledge Vault
                                <span className="block text-gradient-primary text-2xl md:text-4xl mt-1 font-bold opacity-80">
                                    Every lecture, on demand.
                                </span>
                            </h1>
                            <p className="mt-3 text-sm text-on-surface-variant/60 max-w-lg leading-relaxed">
                                Revisit any session, get AI-generated summaries, and track your study progress across all subjects.
                            </p>
                        </div>

                        {/* Stats pills */}
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface-container border border-outline-variant/10">
                                <Clock size={18} className="text-primary shrink-0" />
                                <div>
                                    <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest leading-none">Watch time</div>
                                    <div className="text-lg font-black leading-tight">{stats.totalHours}<span className="text-xs font-semibold text-on-surface-variant/40 ml-1">hrs</span></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface-container border border-outline-variant/10">
                                <CheckCircle2 size={18} className="text-secondary shrink-0" />
                                <div>
                                    <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest leading-none">Completed</div>
                                    <div className="text-lg font-black leading-tight">
                                        {stats.completedCount}
                                        <span className="text-xs font-semibold text-on-surface-variant/40 ml-1">/ {recordings.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sticky Filter Bar ────────────────────────────────────── */}
            <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by title, teacher, or topic…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/10 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none text-sm text-on-surface placeholder:text-on-surface-variant/30 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Subject chips — scrollable row */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                        {subjects.map((s) => (
                            <button
                                key={s}
                                onClick={() => setSelectedSubject(s)}
                                className={`h-9 px-4 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all duration-200 ${
                                    selectedSubject === s
                                        ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                                        : 'bg-surface-container-high text-on-surface-variant/70 border border-outline-variant/10 hover:border-outline-variant/30 hover:text-on-surface'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main Content ─────────────────────────────────────────── */}
            <div className="max-w-[1600px] mx-auto px-5 md:px-10 pt-8">

                {/* Result count */}
                <div className="flex items-center gap-2 mb-6">
                    <LayoutGrid size={14} className="text-on-surface-variant/40" />
                    <span className="text-xs font-semibold text-on-surface-variant/50 uppercase tracking-widest">
                        {filteredRecordings.length} {filteredRecordings.length === 1 ? 'session' : 'sessions'}
                        {selectedSubject !== 'All' && <span className="text-primary ml-1">· {selectedSubject}</span>}
                        {searchTerm && <span className="text-primary ml-1">· "{searchTerm}"</span>}
                    </span>
                </div>

                {/* Grid */}
                {filteredRecordings.length === 0 ? (
                    <div className="py-24 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/10 flex items-center justify-center text-on-surface-variant/30">
                            <MonitorPlay size={28} />
                        </div>
                        <div>
                            <p className="font-bold text-on-surface/60">No recordings found</p>
                            <p className="text-sm text-on-surface-variant/40 mt-1">Try adjusting your search or filter.</p>
                        </div>
                        {(searchTerm || selectedSubject !== 'All') && (
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedSubject('All'); }}
                                className="mt-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                        {filteredRecordings.map((rec, idx) => {
                            const videoId = rec.recordings?.[0]?.youtubeVideoId;
                            const duration = formatDuration(rec.actualDuration);
                            const subject = rec.timetableId?.subject || rec.subject;
                            const teacher = rec.timetableId?.teacher?.name || 'Academic Observer';
                            const title = rec.title || subject;
                            const date = formatDate(rec.actualEndTime || rec.createdAt);

                            return (
                                <div 
                                    key={rec._id}
                                    className="group flex flex-col bg-surface-container/50 rounded-2xl border border-outline-variant/10 hover:border-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 overflow-hidden"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* Thumbnail */}
                                    <button
                                        onClick={() => openVideo(rec)}
                                        className="relative block aspect-video w-full overflow-hidden bg-surface-container-highest focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        aria-label={`Play ${title}`}
                                    >
                                        <img 
                                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                                            alt={title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => { e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }}
                                        />

                                        {/* Dark overlay on hover */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Play button */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-xl">
                                                <Play fill="white" size={22} className="ml-0.5" />
                                            </div>
                                        </div>

                                        {/* Subject badge */}
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/50 backdrop-blur-sm text-white border border-white/10">
                                                {subject}
                                            </span>
                                        </div>

                                        {/* Actions: share */}
                                        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleShare(rec._id); }}
                                                className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-white border border-white/10 flex items-center justify-center transition-colors"
                                                aria-label="Copy link"
                                            >
                                                <Share2 size={13} />
                                            </button>
                                        </div>

                                        {/* Duration pill */}
                                        {duration && (
                                            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white/90 border border-white/10">
                                                {duration}
                                            </div>
                                        )}

                                        {/* Watched bar */}
                                        {rec.isWatched && (
                                            <div className="absolute bottom-0 inset-x-0 h-[3px] bg-secondary/80" />
                                        )}
                                    </button>

                                    {/* Card Body */}
                                    <div className="flex flex-col flex-1 p-5">
                                        {/* Date + watched badge */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] text-on-surface-variant/40 font-medium flex items-center gap-1.5">
                                                <CalendarIcon size={11} />
                                                {date}
                                            </span>
                                            {rec.isWatched && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/15 text-secondary text-[9px] font-bold uppercase tracking-wide border border-secondary/15">
                                                    <Trophy size={9} />
                                                    Watched
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-base font-bold text-on-surface leading-snug line-clamp-2 mb-4 group-hover:text-primary transition-colors duration-200 min-h-[2.75rem]">
                                            {title}
                                        </h3>

                                        {/* Footer: teacher + AI summary */}
                                        <div className="mt-auto pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <img 
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacher)}&background=060e20&color=62fae3&size=64`} 
                                                    alt={teacher}
                                                    className="w-7 h-7 rounded-full border border-outline-variant/20 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-[10px] text-on-surface-variant/35 font-semibold uppercase tracking-wider leading-none mb-0.5">Teacher</div>
                                                    <div className="text-xs font-semibold text-on-surface truncate">{teacher}</div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedLiveClassId(rec._id);
                                                    setShowSummaryModal(true);
                                                }}
                                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface-variant border border-outline-variant/10 hover:border-transparent text-[11px] font-semibold transition-all duration-200"
                                                title="View AI Summary"
                                            >
                                                <Sparkles size={12} />
                                                AI Notes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Video Player Modal ───────────────────────────────────── */}
            {selectedVideoId && (
                <div className="fixed inset-0 left-[var(--sidebar-offset,0px)] z-[100] flex flex-col bg-black/97 backdrop-blur-2xl animate-fade-in">
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/8 bg-white/3 shrink-0">
                        <div className="flex items-center gap-4 min-w-0">
                            <button
                                onClick={closeVideo}
                                className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold transition-colors"
                            >
                                <ArrowLeft size={16} />
                                <span className="hidden sm:inline">Back to Library</span>
                            </button>
                            <div className="w-px h-5 bg-white/10 hidden sm:block" />
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wide border border-primary/20 shrink-0">
                                    {selectedRec?.timetableId?.subject || selectedRec?.subject || 'Recording'}
                                </span>
                                <h2 className="text-white font-bold text-sm truncate hidden md:block">
                                    {selectedRec?.title || 'Video Recording'}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button 
                                onClick={() => { setShowSummaryModal(true); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 hover:bg-primary/20 hover:text-primary text-white/70 border border-white/10 hover:border-primary/30 text-xs font-semibold transition-all duration-200"
                            >
                                <Sparkles size={14} />
                                <span className="hidden sm:inline">AI Summary</span>
                            </button>
                            <button 
                                onClick={closeVideo}
                                className="p-2 rounded-xl bg-white/8 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Player */}
                    <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-0">
                        <div className="w-full max-w-[1200px] aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/8">
                            <CustomYouTubePlayer 
                                videoId={selectedVideoId} 
                                liveClassId={selectedLiveClassId} 
                                autoplay={true} 
                            />
                        </div>
                    </div>

                    {/* Bottom info bar */}
                    <div className="shrink-0 px-6 md:px-10 py-4 border-t border-white/8 bg-white/3">
                        <h2 className="text-white font-bold text-base md:text-xl leading-tight line-clamp-1">
                            {selectedRec?.title || 'Video Recording'}
                        </h2>
                        {selectedRec?.timetableId?.teacher?.name && (
                            <p className="text-white/40 text-xs mt-1">
                                {selectedRec.timetableId.teacher.name} · {formatDate(selectedRec.actualEndTime || selectedRec.createdAt)}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ── AI Summary Modal ─────────────────────────────────────── */}
            {showSummaryModal && (
                <div
                    className="fixed inset-0 left-[var(--sidebar-offset,0px)] z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/70 backdrop-blur-xl animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowSummaryModal(false); }}
                >
                    <div className="w-full sm:max-w-3xl max-h-[90vh] bg-surface rounded-t-3xl sm:rounded-3xl border border-outline-variant/10 shadow-2xl overflow-hidden flex flex-col">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 bg-surface-container shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary shrink-0">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-on-surface leading-tight">AI Session Summary</h3>
                                    <p className="text-[11px] text-on-surface-variant/50 font-medium">
                                        {selectedRec?.title || 'Recording analysis'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowSummaryModal(false)}
                                className="p-2 rounded-xl hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-all"
                                aria-label="Close summary"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <ClassSummary liveClassId={selectedLiveClassId} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
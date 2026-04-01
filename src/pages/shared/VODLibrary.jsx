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
    MonitorPlay
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import CustomYouTubePlayer from '../../components/shared/CustomYouTubePlayer';
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
            // For students, fetch by batch
            // For teachers, maybe we need a different endpoint, but let's try a general one or institution-wide
            const batchId = user.batch?._id || user.batch;
            const endpoint = batchId 
                ? `/live-classes/batch/${batchId}/recordings` 
                : `/live-classes/completed`; // Fallback for teachers (need to implement this if it doesn't exist)
            
            const { data } = await api.get(endpoint);
            setRecordings(data);
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

    if (loading) return <LoadingSpinner centered />;

    return (
        <div className={`min-h-screen p-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <MonitorPlay className="text-blue-500" />
                    Video Library
                </h1>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Access all your past lecture recordings and study materials.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by topic, subject, or teacher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                            isDark 
                                ? 'bg-[#1a1a24] border-white/5 focus:border-blue-500/50 outline-none' 
                                : 'bg-white border-gray-200 shadow-sm focus:border-blue-500 outline-none'
                        }`}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {subjects.map(s => (
                        <button
                            key={s}
                            onClick={() => setSelectedSubject(s)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                selectedSubject === s
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : isDark
                                        ? 'bg-[#1a1a24] text-gray-400 hover:text-white border border-white/5'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {filteredRecordings.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                    <Video className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-xl">No recordings found</p>
                    <p className="text-sm">Try adjusting your filters or search term.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRecordings.map((rec) => {
                        const videoId = rec.recordings?.[0]?.youtubeVideoId;
                        return (
                            <div 
                                key={rec._id}
                                className={`group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                                    isDark ? 'bg-[#1a1a24] border border-white/5 hover:border-white/10' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
                                }`}
                                onClick={() => {
                                    setSelectedVideoId(videoId);
                                    setSelectedLiveClassId(rec._id);
                                }}
                            >
                                {/* Thumbnail */}
                                <div className="aspect-video relative overflow-hidden">
                                    <img 
                                        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                                        alt={rec.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/480x270?text=No+Thumbnail'; }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform">
                                            <Play fill="currentColor" size={24} />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                                        {rec.actualDuration ? `${Math.floor(rec.actualDuration / 60)}m` : 'VOD'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {rec.timetableId?.subject || rec.subject}
                                        </span>
                                        <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            <CalendarIcon size={10} />
                                            {formatDate(rec.actualEndTime || rec.createdAt)}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-sm mb-2 line-clamp-2 transition-colors group-hover:text-blue-500">
                                        {rec.title || rec.timetableId?.subject}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                {(rec.timetableId?.teacher?.name || 'T')[0]}
                                            </div>
                                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {rec.timetableId?.teacher?.name || 'Teacher'}
                                            </span>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Video Player Modal */}
            {selectedVideoId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-sm">
                    <button 
                        onClick={() => setSelectedVideoId(null)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div className="w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                        <CustomYouTubePlayer videoId={selectedVideoId} liveClassId={selectedLiveClassId} />
                    </div>
                </div>
            )}
        </div>
    );
}

function X({ size, className }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M18 6 6 18"/><path d="m 6 6 12 12"/>
        </svg>
    );
}

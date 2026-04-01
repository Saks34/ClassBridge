import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, Clock, Calendar, Video, BookOpen, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import usePageTitle from '../../hooks/usePageTitle';

export default function VODLibrary() {
    const { id: courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isDark = true; // Premium Dark Theme

    const [loading, setLoading] = useState(true);
    const [recordings, setRecordings] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    usePageTitle('Video Library', 'Student');

    useEffect(() => {
        loadRecordings();
    }, [courseId]);

    const loadRecordings = async () => {
        setLoading(true);
        try {
            // Priority 2: Use batchId for recordings retrieval
            const batchId = user?.batch?._id || user?.batch;
            const { data } = await api.get(`/live-classes/batch/${batchId}/recordings`);
            setRecordings(data || []);
        } catch (error) {
            console.error('Failed to load recordings:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRecordings = recordings.filter(rec => {
        const matchesSearch = (rec.title || rec.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    if (loading) return <LoadingSpinner centered />;

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f] text-white' : 'bg-gray-50 text-gray-900'} p-6`}>
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <Video className="w-8 h-8 text-[#3ea6ff]" />
                            VOD Library
                        </h1>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            Access all past recordings of your live classes
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search recordings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    isDark ? 'bg-[#1a1a1a] border-[#303030] text-white' : 'bg-white border-gray-200'
                                }`}
                            />
                        </div>
                    </div>
                </div>

                {filteredRecordings.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-xl">No recordings found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRecordings.map((rec) => {
                            const recording = rec.recordings?.[0]; // Get the first recording entry
                            const thumbnail = recording?.thumbnail || `https://img.youtube.com/vi/${recording?.youtubeVideoId}/maxresdefault.jpg`;
                            
                            return (
                                <div 
                                    key={rec._id}
                                    className={`group cursor-pointer rounded-xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                                        isDark ? 'bg-[#1a1a1a] border-[#303030] hover:border-blue-500/50' : 'bg-white border-gray-200'
                                    }`}
                                    onClick={() => navigate(`/live-class/${rec._id}`)}
                                >
                                    {/* Thumbnail Placeholder */}
                                    <div className="aspect-video relative overflow-hidden bg-black">
                                        <img 
                                            src={thumbnail} 
                                            alt={rec.title || rec.subject}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            onError={(e) => { e.target.src = 'https://placehold.co/640x360/000000/FFFFFF?text=No+Thumbnail'; }}
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                        
                                        {/* Play Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-xl">
                                                <Play className="w-6 h-6 text-white fill-white" />
                                            </div>
                                        </div>

                                        {/* Duration Badge */}
                                        {recording?.duration && (
                                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white uppercase">
                                                {recording.duration}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-bold text-lg mb-1 truncate group-hover:text-blue-500 transition-colors">
                                            {rec.title || rec.subject}
                                        </h3>
                                        
                                        <div className="flex flex-wrap items-center gap-3 text-xs opacity-60">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(rec.actualEndTime || rec.createdAt).toLocaleDateString()}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 font-medium text-blue-400">
                                                By {rec.timetableId?.teacher?.name || 'Assigned Teacher'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

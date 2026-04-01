import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ChatPanel from '../../components/student/ChatPanel';
import { useAuth } from '../../context/AuthContext';
import CustomYouTubePlayer from '../../components/shared/CustomYouTubePlayer';
import CommentSection from '../../components/student/CommentSection';
import QAPanel from '../../components/shared/QAPanel';
import usePageTitle from '../../hooks/usePageTitle';
import {
    Video,
    BookOpen,
    Clock,
    Download,
    MessageCircle,
    FileText,
    Radio,
    ArrowLeft,
    HelpCircle,
    Users,
    Hand
} from 'lucide-react';

export default function StudentClassDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    // Hardcoded Dark Theme for consistency
    const isDark = true;
    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState(null);
    const [notes, setNotes] = useState([]);
    const [error, setError] = useState(null);
    const [rightPanelTab, setRightPanelTab] = useState('chat'); // 'chat' or 'qa'
    const [viewerCount, setViewerCount] = useState(0);
    const [hasRaisedHand, setHasRaisedHand] = useState(false);
    const { user } = useAuth();
    const socketRef = useRef(null);

    usePageTitle(classData?.subject || 'Class Detail', 'Student');

    useEffect(() => {
        loadClassData();
        loadNotes();
    }, [id]);

    const loadClassData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get(`/live-classes/${id}`);
            setClassData(data);
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to load class details');
        } finally {
            setLoading(false);
        }
    };

    const loadNotes = async () => {
        try {
            const batchId = user?.batch?._id || user?.batch;
            if (!batchId) return;

            const { data } = await api.get('/notes/by-batch', {
                params: { batchId },
            });
            setNotes(data.notes || []);
        } catch (e) {
            console.error('Failed to load notes:', e);
        }
    };

    // Socket Logic for Real-time Status and Auto-refresh
    useEffect(() => {
        if (!classData?._id) return;

        const socket = io('http://localhost:5000/live-classes', {
            auth: { token: localStorage.getItem('accessToken') },
            transports: ['websocket']
        });

        socket.on('connect_error', (err) => console.error('Socket connection error:', err));

        socket.emit('join-room', { liveClassId: classData._id, batchId: user?.batch?._id || user?.batch });

        socket.on('class-live', (data) => {
            console.log('Class went live:', data);
            setClassData(prev => ({ ...prev, status: 'Live', streamInfo: data.streamInfo }));
        });

        socket.on('class-ended', () => {
            console.log('Class ended');
            setClassData(prev => ({ ...prev, status: 'Completed', streamInfo: { ...prev.streamInfo, broadcastId: null } }));
        });

        socket.on('viewer-count', ({ count }) => {
            setViewerCount(count);
        });

        socket.on('handraise-history', ({ queue }) => {
            const userId = user?._id || user?.sub;
            const alreadyIn = queue.some(item => String(item.userId) === String(userId));
            setHasRaisedHand(alreadyIn);
        });

        socket.on('handraise:cleared', () => {
            setHasRaisedHand(false);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [classData?._id]);

    const playerRef = useRef(null);

    const handleJumpToLive = () => {
        if (playerRef.current) {
            playerRef.current.seekToLive();
        }
    };

    const getStatusConfig = () => {
        if (!classData) return {};
        const status = classData.status;

        const configs = {
            Live: {
                badge: 'bg-red-600',
                text: 'LIVE NOW',
                icon: Radio,
                pulse: true
            },
            Scheduled: {
                badge: 'bg-blue-600',
                text: 'UPCOMING',
                icon: Clock,
                pulse: false
            },
            Completed: {
                badge: 'bg-green-600',
                text: 'RECORDED',
                icon: Video,
                pulse: false
            }
        };
        return configs[status] || configs.Scheduled;
    };

    if (loading) {
        return <LoadingSpinner centered />;
    }

    if (error || !classData) {
        return (
            <div className="p-8 text-center rounded-xl border bg-red-900/10 border-red-900/20 text-red-400">
                {error || 'Class not found'}
            </div>
        );
    }

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon || Clock;

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            <div className="max-w-[1920px] mx-auto">
                {/* Hero Section: Video + Chat */}
                <div className="flex flex-col lg:flex-row bg-[#0f0f0f] border-b border-[#303030]">
                    {/* Video Player Section */}
                    <div className="flex-1 relative group bg-black">
                        {/* Aspect Ratio Container for Video */}
                        <div className="w-full aspect-video relative">
                            {/* Back Button Overlay */}
                            <div className="absolute top-4 left-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Status Overlay */}
                            {classData.status === 'Live' && (
                                <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-sm text-xs font-bold shadow-xl animate-pulse cursor-default">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                                        <span>LIVE</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white rounded-sm text-xs font-bold border border-white/10">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{viewerCount}</span>
                                    </div>
                                </div>
                            )}
                            {classData.status === 'Completed' && (
                                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-sm text-xs font-bold shadow-xl pointer-events-none">
                                    <Video className="w-3 h-3" />
                                    <span>RECORDING</span>
                                </div>
                            )}

                            {/* Video Logic */}
                            {classData.status === 'Live' || classData.status === 'Completed' ? (
                                <div className="absolute inset-0 group/player">
                                    <CustomYouTubePlayer
                                        ref={playerRef}
                                        videoId={
                                            (classData.status === 'Completed' && classData.recordings?.length > 0)
                                                ? classData.recordings[0].youtubeVideoId
                                                : (classData.streamInfo?.broadcastId ||
                                                    classData.streamInfo?.liveUrl?.split('v=')[1]?.split('&')[0] ||
                                                    classData.youtubeUrl?.split('v=')[1]?.split('&')[0])
                                        }
                                        autoplay={true}
                                    />

                                    {/* Jump to Live Button */}
                                    {classData.status === 'Live' && (
                                        <button
                                            onClick={handleJumpToLive}
                                            className="absolute bottom-16 right-4 z-40 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 opacity-0 group-hover/player:opacity-100 transition-opacity"
                                        >
                                            <Radio className="w-3 h-3" />
                                            JUMP TO LIVE
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white bg-black">
                                    <div className="p-6 rounded-full bg-[#212121] mb-4">
                                        <Video className="w-12 h-12 text-gray-500" />
                                    </div>
                                    <p className="text-xl font-bold text-gray-300 mb-2">
                                        {classData.status === 'Scheduled' ? 'Waiting for Stream' : 'No Stream Available'}
                                    </p>
                                    <p className="text-gray-500">
                                        {classData.status === 'Scheduled'
                                            ? 'The teacher will start soon. Please wait...'
                                            : 'This class does not have a stream.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Chat/Comments */}
                    <div className="w-full lg:w-[350px] xl:w-[400px] flex flex-col border-l border-[#303030] bg-[#212121] z-20">
                        <div className="h-full relative min-h-[500px] lg:min-h-0 bg-[#212121]">
                            {classData.status === 'Completed' ? (
                                <div className="absolute inset-0 flex flex-col bg-[#212121]">
                                    <div className="p-4 border-b border-[#303030]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-[#3ea6ff]/10">
                                                <MessageCircle className="w-5 h-5 text-[#3ea6ff]" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">
                                                    Comments
                                                </h3>
                                                <p className="text-xs text-gray-400">
                                                    Discuss this class
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-hidden relative">
                                        <CommentSection liveClassId={id} />
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col bg-[#212121]">
                                    {/* Tabs inside panel logic if we want, or just switch */}
                                    <div className="flex border-b border-[#303030] sticky top-0 bg-[#212121] z-10">
                                        <button 
                                            onClick={() => setRightPanelTab('chat')}
                                            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                                                rightPanelTab === 'chat' ? 'text-[#3ea6ff] border-b-2 border-[#3ea6ff] bg-white/5' : 'text-gray-500 hover:text-white'
                                            }`}
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            CHAT
                                        </button>
                                        <button 
                                            onClick={() => setRightPanelTab('qa')}
                                            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                                                rightPanelTab === 'qa' ? 'text-[#3ea6ff] border-b-2 border-[#3ea6ff] bg-white/5' : 'text-gray-500 hover:text-white'
                                            }`}
                                        >
                                            <HelpCircle className="w-3.5 h-3.5" />
                                            Q&A
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (!hasRaisedHand) {
                                                    socketRef.current?.emit('handraise:request', { liveClassId: id }, (ack) => {
                                                        if (ack?.ok) setHasRaisedHand(true);
                                                    });
                                                }
                                            }}
                                            disabled={hasRaisedHand}
                                            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                                                hasRaisedHand ? 'text-orange-500 bg-orange-500/10 cursor-default' : 'text-gray-500 hover:text-white'
                                            }`}
                                        >
                                            <Hand className={`w-3.5 h-3.5 ${hasRaisedHand ? 'fill-orange-500' : ''}`} />
                                            {hasRaisedHand ? 'HAND RAISED' : 'RAISE HAND'}
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-hidden relative">
                                        {rightPanelTab === 'chat' ? (
                                            <ChatPanel liveClassId={id} />
                                        ) : (
                                            <QAPanel liveClassId={id} />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Section (Below Header) */}
                <div className="p-3 lg:p-4 space-y-4 max-w-[1600px] mx-auto">

                    {/* Header / Info Section */}
                    <div className="space-y-3">
                        {/* Title & Status */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <h1 className="text-xl lg:text-2xl font-medium mb-1 text-white">
                                    {classData.subject}
                                </h1>

                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#3ea6ff] flex items-center justify-center text-black font-bold text-sm">
                                            {/* Initials */}
                                            {classData.teacher?.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'T'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">
                                                {classData.teacher?.name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {classData.batch?.name || classData.batch}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="px-3 py-1 rounded text-xs font-medium border border-[#303030] text-gray-400">
                                        {classData.startTime} - {classData.endTime}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description Expansion - ONLY IF EXISTS */}
                        {classData.description && (
                            <div className="p-3 rounded bg-[#212121] border border-[#303030]">
                                <p className="text-sm text-gray-300">
                                    {classData.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Study Materials */}
                    {notes.length > 0 && (
                        <div className="rounded border p-6 bg-[#212121] border-[#303030]">
                            <div className="flex items-center gap-3 mb-4">
                                <BookOpen className="w-5 h-5 text-[#3ea6ff]" />
                                <h2 className="text-lg font-medium text-white">
                                    Study Materials
                                </h2>
                            </div>

                            <div className="space-y-2">
                                {notes.map((note) => (
                                    <div
                                        key={note._id || note.id}
                                        className="flex items-center justify-between p-3 rounded transition-all cursor-pointer bg-[#282828] hover:bg-[#303030]"
                                        onClick={() => window.open(note.secureUrl || note.fileUrl, '_blank')}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileText className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm font-medium truncate text-gray-200">
                                                {note.title}
                                            </span>
                                        </div>
                                        <Download className="w-4 h-4 text-gray-400 hover:text-gray-200" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

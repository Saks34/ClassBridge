import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { API_BASE } from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ChatPanel from '../../components/student/ChatPanel';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import CustomYouTubePlayer from '../../components/shared/CustomYouTubePlayer';
import CommentSection from '../../components/student/CommentSection';
import QAPanel from '../../components/shared/QAPanel';
import ClassSummary from '../../components/shared/ClassSummary';
import ClassTimer from '../../components/shared/ClassTimer';
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
    Hand,
    Edit3,
    Sun,
    Moon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentClassDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState(null);
    const [notes, setNotes] = useState([]);
    const [error, setError] = useState(null);
    const [rightPanelTab, setRightPanelTab] = useState('chat'); // 'chat' or 'qa'
    const [viewerCount, setViewerCount] = useState(0);
    const [hasRaisedHand, setHasRaisedHand] = useState(false);
    const { isDark, toggleTheme } = useTheme();
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
            setClassData(data.data);
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
            setNotes(data.data || []);
        } catch (e) {
            console.error('Failed to load notes:', e);
        }
    };

    useEffect(() => {
        if (!classData?._id) return;

        const socket = io((import.meta.env.VITE_SOCKET_URL || API_BASE) + '/live-classes', {
            auth: { token: localStorage.getItem('accessToken') },
            transports: ['websocket']
        });

        socketRef.current = socket;

        socket.on('connect_error', (err) => console.error('Socket connection error:', err));

        socket.emit('join-room', { liveClassId: classData._id, batchId: user?.batch?._id || user?.batch });

        socket.on('class-live', (data) => {
            setClassData(prev => ({ ...prev, status: 'Live', streamInfo: data.streamInfo }));
        });

        socket.on('class-ended', () => {
            setClassData(prev => ({ ...prev, status: 'Completed' }));
        });

        socket.on('viewer-count', ({ count }) => {
            setViewerCount(count);
        });

        socket.on('whiteboard-updated', ({ whiteboardUrl }) => {
            setClassData(prev => ({ ...prev, whiteboardUrl }));
            toast.success('Teacher updated the whiteboard');
        });

        socket.on('handraise-history', ({ queue }) => {
            const userId = user?._id || user?.sub;
            const alreadyIn = queue.some(item => String(item.userId) === String(userId));
            setHasRaisedHand(alreadyIn);
        });

        socket.on('handraise:cleared', () => {
            setHasRaisedHand(false);
        });

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

    if (loading) return <LoadingSpinner centered />;

    if (error || !classData) {
        return (
            <div className="p-8 text-center rounded-xl border bg-error/10 border-error/20 text-error">
                {error || 'Class not found'}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface text-on-surface">
            <div className="max-w-[1920px] mx-auto">
                {/* Top Section: Player and Sidebar Panels */}
                <div className="flex flex-col lg:flex-row bg-surface border-b border-outline-variant/10">
                    <div className="flex-1 relative group bg-black">
                        <div className="w-full aspect-video relative">
                            {/* Player Overlays */}
                            <div className="absolute top-4 left-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                            </div>

                            {classData.status === 'Live' && (
                                <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-error text-on-error rounded-sm text-xs font-bold shadow-xl animate-pulse">
                                        <span className="w-1.5 h-1.5 bg-on-error rounded-full animate-ping"></span>
                                        <span>LIVE</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high/80 backdrop-blur-md text-on-surface rounded-sm text-xs font-bold border border-outline-variant/50">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{viewerCount}</span>
                                    </div>
                                </div>
                            )}

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
                                        liveClassId={classData._id}
                                        isLive={classData.status === 'Live'}
                                        title={classData.subject}
                                    />
                                    {classData.status === 'Live' && (
                                        <button
                                            onClick={handleJumpToLive}
                                            className="absolute bottom-16 right-4 z-40 bg-error hover:bg-error/90 text-on-error text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 opacity-0 group-hover/player:opacity-100 transition-opacity"
                                        >
                                            <Radio className="w-3 h-3" />
                                            JUMP TO LIVE
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white bg-black">
                                    <div className="p-6 rounded-full bg-surface-container mb-4">
                                        <Video className="w-12 h-12 text-on-surface-variant/40" />
                                    </div>
                                    <p className="text-xl font-bold text-on-surface mb-2">
                                        {classData.status === 'Scheduled' ? 'Waiting for Stream' : 'No Stream Available'}
                                    </p>
                                    <p className="text-on-surface-variant/70">
                                        {classData.status === 'Scheduled'
                                            ? 'The teacher will start soon. Please wait...'
                                            : 'This class does not have a stream.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Chat, Q&A, Comments */}
                    <div className="w-full lg:w-[350px] xl:w-[400px] flex flex-col border-l border-outline-variant/10 bg-surface-container z-20">
                        <div className="h-full relative min-h-[500px] lg:min-h-0 bg-surface-container">
                            {classData.status === 'Completed' ? (
                                <div className="absolute inset-0 flex flex-col bg-surface-container">
                                    <div className="p-4 border-b border-outline-variant/10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-primary/10">
                                                <MessageCircle className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-on-surface">Comments</h3>
                                                <p className="text-xs text-on-surface-variant/70">Discuss this class</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-hidden relative">
                                        <CommentSection liveClassId={id} />
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col bg-surface-container">
                                    <div className="flex border-b border-outline-variant/10 sticky top-0 bg-surface-container z-10">
                                        <button 
                                            onClick={() => setRightPanelTab('chat')}
                                            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                                                rightPanelTab === 'chat' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-on-surface-variant/60 hover:text-on-surface'
                                            }`}
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            CHAT
                                        </button>
                                        <button 
                                            onClick={() => setRightPanelTab('qa')}
                                            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                                                rightPanelTab === 'qa' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-on-surface-variant/60 hover:text-on-surface'
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
                                                hasRaisedHand ? 'text-secondary bg-secondary/10 cursor-default' : 'text-on-surface-variant/60 hover:text-on-surface'
                                            }`}
                                        >
                                            <Hand className={`w-3.5 h-3.5 ${hasRaisedHand ? 'fill-secondary' : ''}`} />
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

                {/* Content Section: Info, Whiteboard, Materials */}
                <div className="p-3 lg:p-4 space-y-4 max-w-[1600px] mx-auto">
                    {/* Class Info Header */}
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <h1 className="text-xl lg:text-3xl font-bold mb-1 text-on-surface font-headline tracking-tight">
                                    {classData.subject}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-lg shadow-primary/20">
                                            {classData.teacher?.name?.[0] || 'T'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-on-surface">{classData.teacher?.name}</p>
                                            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/70 font-bold">{classData.batch?.name || classData.batch}</p>
                                        </div>
                                    </div>
                                    
                                    <ClassTimer 
                                        startTime={classData.startTime} 
                                        endTime={classData.endTime} 
                                        status={classData.status} 
                                    />
                                    
                                    <div className="flex items-center gap-2 md:ml-auto">
                                        <button 
                                            onClick={toggleTheme}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-primary transition-all active:scale-95 border border-outline-variant/10 shadow-sm"
                                        >
                                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {classData.description && (
                            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/10">
                                <p className="text-sm text-on-surface-variant/80 font-body leading-relaxed">{classData.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Class Summary (for recordings) */}
                    {classData.status === 'Completed' && (
                        <div className="rounded-2xl border p-8 bg-surface-container border-outline-variant/10 shadow-xl overflow-hidden relative group">
                             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                <Radio className="w-48 h-48" />
                             </div>
                            <ClassSummary liveClassId={id} />
                        </div>
                    )}

                    {/* Whiteboard Section */}
                    {classData.whiteboardUrl && (
                        <div className="rounded-2xl border p-6 bg-surface-container border-outline-variant/10 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                                        <Edit3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-on-surface font-headline">Live Whiteboard</h2>
                                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60">Real-time sync with teacher</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => window.open(classData.whiteboardUrl, '_blank')}
                                    className="text-[10px] font-bold uppercase tracking-widest bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-lg border border-outline-variant/10 transition-all"
                                >
                                    Open Fullscreen
                                </button>
                            </div>
                            <div className="w-full aspect-video md:h-[700px] rounded-xl border border-outline-variant/10 overflow-hidden bg-white shadow-inner">
                                <iframe 
                                    src={classData.whiteboardUrl} 
                                    title="Whiteboard"
                                    className="w-full h-full border-0"
                                    allow="camera; microphone; display-capture; autoplay"
                                />
                            </div>
                        </div>
                    )}

                    {/* Materials Section */}
                    {notes.length > 0 && (
                        <div className="rounded-2xl border p-6 bg-surface-container border-outline-variant/10 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-on-surface font-headline">Study Materials</h2>
                                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60">Provided for this module</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {notes.map((note) => (
                                    <div
                                        key={note._id || note.id}
                                        className="flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer bg-surface-container-high border border-outline-variant/5 hover:border-primary/20 hover:bg-surface-container-highest group shadow-sm"
                                        onClick={() => window.open(note.secureUrl || note.fileUrl, '_blank')}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded bg-on-surface/5 flex items-center justify-center text-on-surface-variant opacity-40 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold truncate text-on-surface font-body">
                                                {note.title}
                                            </span>
                                        </div>
                                        <Download className="w-4 h-4 text-on-surface-variant/20 group-hover:text-primary transition-all group-hover:translate-y-0.5" />
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

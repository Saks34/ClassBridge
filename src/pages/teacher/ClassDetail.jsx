import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
    Video,
    BookOpen,
    Clock,
    Users,
    Radio,
    Settings,
    Play,
    Square,
    MessageCircle,
    Shield,
    Ban,
    Eye,
    BarChart3,
    FileText,
    Plus,
    Trash2,
    Download,
    Pin,
    MoreVertical,
    EyeOff,
    Server,
    Key,
    Copy,
    Check,
    Monitor,
    TrendingUp,
    Activity,
    Wifi,
    Signal,
    ArrowLeft,
    HelpCircle,
    Hand,
    Edit3,
    Link,
    Save,
    Sparkles
} from 'lucide-react';
import ThemeToggle from '../../components/shared/ThemeToggle';
import toast from 'react-hot-toast';
import { confirmToast } from '../../utils/confirmToast';
import api, { API_BASE } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ChatPanel from '../../components/teacher/ChatPanel';
import CommentSection from '../../components/student/CommentSection';
import CustomYouTubePlayer from '../../components/shared/CustomYouTubePlayer';
import QAPanel from '../../components/shared/QAPanel';
import ClassSummary from '../../components/shared/ClassSummary';
import ClassTimer from '../../components/shared/ClassTimer';

export default function TeacherClassControl() {
    const { id: liveClassId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();


    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState(null);
    const [activeTab, setActiveTab] = useState('stream');
    const [viewerCount, setViewerCount] = useState(0);
    const [handRaises, setHandRaises] = useState([]);
    const [rightPanelTab, setRightPanelTab] = useState('chat'); // 'chat' or 'qa'
    const { isDark, toggleTheme } = useTheme();

    // Stream Setup State
    const [streamKey, setStreamKey] = useState('');
    const [ingestionUrl, setIngestionUrl] = useState('');
    const [scheduling, setScheduling] = useState(false);
    const [isCheckingConfig, setIsCheckingConfig] = useState(false);

    // Settings State
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [savingSettings, setSavingSettings] = useState(false);

    // Notes State
    const [notes, setNotes] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);

    const playerRef = useRef(null);
    const socketRef = useRef(null);

    const handleJumpToLive = () => {
        if (playerRef.current) {
            playerRef.current.seekToLive();
        }
    };

    const summaryRef = useRef(null);
    const scrollToSummary = () => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Initialization
    useEffect(() => {
        loadClassData();
    }, [liveClassId]);

    useEffect(() => {
        if (classData) {
            if (classData._id) loadStreamKey(classData._id);
            setTitle(classData.title || classData.subject || '');
        }
    }, [classData]);

    useEffect(() => {
        if (activeTab === 'materials' && classData?.batch) {
            loadNotes();
        }
    }, [activeTab, classData]);

    // Socket connection for real-time viewer count and status
    useEffect(() => {
        if (!classData?._id) return;

        const socket = io((import.meta.env.VITE_SOCKET_URL || API_BASE) + '/live-classes', {
            auth: { token: localStorage.getItem('accessToken') },
            transports: ['websocket']
        });

        socket.on('connect_error', (err) => console.error('Socket connection error:', err));

        // Join room
        socket.emit('join-room', {
            liveClassId: classData._id,
            batchId: typeof classData.batch === 'object' ? classData.batch._id : classData.batch
        });

        socket.on('viewer-count', ({ count }) => {
            setViewerCount(count);
        });

        socket.on('handraise-history', ({ queue }) => {
            setHandRaises(queue || []);
        });

        socket.on('handraise:new', (entry) => {
            setHandRaises(prev => [...prev, entry]);
            toast(`${entry.name} raised their hand!`, { icon: 'âœ‹' });
        });

        socket.on('handraise:cleared', () => {
            setHandRaises([]);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [classData?._id]);

    const loadClassData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/live-classes/by-timetable/${liveClassId}`);
            setClassData(data.data);
        } catch (error) {
            console.error('Failed to load class:', error);
            toast.error('Failed to load class details');
        } finally {
            setLoading(false);
        }
    };

    const loadStreamKey = async (realLiveClassId) => {
        try {
            const { data } = await api.get(`/live-classes/${realLiveClassId}/stream-key`);
            setStreamKey(data.data.streamKey);
            setIngestionUrl(data.data.ingestionAddress);
        } catch (error) {
            console.error('Failed to load stream key:', error);
        }
    };

    const loadNotes = async () => {
        if (!classData?.batch) return;
        setLoadingNotes(true);
        try {
            const batchId = typeof classData.batch === 'object' ? classData.batch._id : classData.batch;
            const { data } = await api.get('/notes/by-batch', {
                params: { batchId },
            });
            setNotes(data.data.notes || []);
        } catch (error) {
            console.error('Failed to load notes:', error);
            toast.error('Failed to load materials');
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        if (!classData?._id) return;
        setSavingSettings(true);
        try {
            await api.patch(`/live-classes/${classData._id}/details`, { title });
            toast.success('Settings saved');
            setSettingsOpen(false);
            await loadClassData();
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleCreateStream = async () => {
        if (!classData?._id) return;
        setScheduling(true);
        try {
            await api.post(`/live-classes/${classData._id}/schedule`, { title });
            toast.success('Stream configuration created! Set up OBS next.');
            await loadClassData();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to start stream');
        } finally {
            setScheduling(false);
        }
    };

    const handleGoLive = async () => {
        // This button checks if the user has actually started streaming in OBS and updates status
        if (!classData?._id) return;
        setIsCheckingConfig(true);
        try {
            const { data } = await api.get(`/live-classes/${classData._id}/status`);
            const statusData = data.data;
            if (statusData.youtubeStatus === 'live' || statusData.status === 'Live') {
                // Force local update if backend says live
                toast.success('You are LIVE!');
                await loadClassData();
            } else {
                toast('Waiting for video signal from OBS...');
                // check again in 2s
                setTimeout(() => loadClassData(), 2000);
            }
        } catch (error) {
            toast.error('Failed to check stream status');
        } finally {
            setIsCheckingConfig(false);
        }
    };

    const handleEndStream = async () => {
        if (!classData?._id) return;
        const confirmed = await confirmToast('Are you sure you want to end the stream?', { 
            confirmLabel: 'End Stream', 
            variant: 'danger' 
        });
        if (!confirmed) return;
        setScheduling(true);
        try {
            await api.post(`/live-classes/${classData._id}/end`);
            toast.success('Stream ended successfully');
            await loadClassData();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to end stream');
        } finally {
            setScheduling(false);
        }
    };


    if (loading) return <LoadingSpinner centered />;
    if (!classData) return (
        <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
            <div className="text-center">
                <p className="text-xl font-bold">Class Not Found</p>
                <button onClick={() => navigate('/teacher/dashboard')} className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-xl hover:shadow-primary/20 hover:shadow-lg transition">
                    Back to Dashboard
                </button>
            </div>
        </div>
    );

    const getStatusConfig = () => {
        const status = classData.status || 'Scheduled';
        const configs = {
            Live: { badge: 'bg-error text-on-error', text: 'LIVE', icon: Radio, pulse: true },
            Scheduled: { badge: 'bg-primary text-on-primary', text: 'UPCOMING', icon: Clock, pulse: false },
            Completed: { badge: 'bg-secondary text-on-secondary', text: 'ENDED', icon: Video, pulse: false },
            Cancelled: { badge: 'bg-surface-container-highest text-on-surface', text: 'CANCELLED', icon: Ban, pulse: false }
        };
        return configs[status] || configs.Scheduled;
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    const videoId = (classData.status === 'Completed' && classData.recordings?.length > 0)
        ? classData.recordings[0].youtubeVideoId
        : (classData.streamInfo?.broadcastId ||
            classData.streamInfo?.liveUrl?.split('v=')[1]?.split('&')[0] ||
            classData.youtubeUrl?.split('v=')[1]?.split('&')[0]);

    const liveUrl = classData.streamInfo?.liveUrl || `https://youtube.com/watch?v=${videoId || ''}`;

    const analytics = classData.analytics || {
        peakViewers: 0,
        totalViews: 0,
        totalLikes: 0,
        totalChatMessages: 0
    };

    // Derive display analytics
    const displayAnalytics = {
        peakViewers: analytics.peakViewers || classData.onlineStudents?.length || 0,
        avgViewTime: '0 min', // Placeholder as backend doesn't serve this yet
        chatMessages: analytics.totalChatMessages || 0,
        likes: analytics.totalLikes || 0,
        retention: 100 // Placeholder
    };

    // Logic for refined button flow
    const hasStreamConfig = !!classData.streamInfo?.broadcastId;
    const isLive = classData.status === 'Live';
    const isCompleted = classData.status === 'Completed';

    return (
        <div className="min-h-screen bg-surface">
            {/* Settings Modal */}
            {settingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="w-full max-w-md p-8 rounded-[2rem] shadow-2xl bg-surface-container border border-outline-variant/10">
                        <h2 className="text-xl font-bold mb-6 text-on-surface font-headline">Class Settings</h2>
                        <form onSubmit={handleSaveSettings}>
                            <div className="mb-6">
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-primary/70 mb-2">
                                    Stream Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                                    placeholder="Enter stream title"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSettingsOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:shadow-primary/20 transition disabled:opacity-50"
                                >
                                    {savingSettings ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
                <div className="max-w-[1920px] mx-auto px-4 lg:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/teacher/dashboard')}
                                className="p-2.5 rounded-xl border border-outline-variant/10 hover:bg-surface-container transition text-on-surface-variant hover:text-primary active:scale-95"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-on-surface font-headline leading-none mb-1.5 flex items-center gap-3">
                                    {classData.subject}
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.badge}`}>
                                        <StatusIcon className={`w-3 h-3 ${statusConfig.pulse ? 'animate-pulse' : ''}`} />
                                        {statusConfig.text}
                                    </span>
                                </h1>
                                <p className="text-xs text-on-surface-variant font-label tracking-widest uppercase opacity-60">
                                    {classData.title || 'Live Controller'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            <ThemeToggle />
                            <button
                                onClick={() => setSettingsOpen(true)}
                                className="p-2.5 rounded-xl border border-outline-variant/10 hover:bg-surface-container transition text-on-surface-variant hover:text-primary active:scale-95"
                                title="Stream Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>

                            {/* Button Flow Logic */}
                            {!isCompleted && (
                                <>
                                    {!hasStreamConfig && (
                                        <button
                                            onClick={handleCreateStream}
                                            disabled={scheduling}
                                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary hover:shadow-primary/20 hover:shadow-lg text-on-primary transition flex items-center gap-2 disabled:opacity-50 active:scale-95">
                                            <Plus className="w-4 h-4" />
                                            Create Stream
                                        </button>
                                    )}

                                    {hasStreamConfig && !isLive && (
                                        <button
                                            onClick={handleGoLive}
                                            disabled={isCheckingConfig}
                                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-secondary hover:shadow-secondary/20 hover:shadow-lg text-on-secondary transition flex items-center gap-2 disabled:opacity-50 active:scale-95">
                                            <Radio className="w-4 h-4" />
                                            {isCheckingConfig ? 'Connecting...' : 'Go Live'}
                                        </button>
                                    )}

                                    {isLive && (
                                        <button
                                            onClick={handleEndStream}
                                            disabled={scheduling}
                                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-error hover:shadow-error/20 hover:shadow-lg text-on-error transition flex items-center gap-2 disabled:opacity-50 active:scale-95">
                                            <Square className="w-4 h-4" />
                                            End Stream
                                        </button>
                                    )}
                                </>
                            )}

                            {isCompleted && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={scrollToSummary}
                                        className="px-5 py-2.5 rounded-xl text-sm font-bold bg-surface-container-highest hover:bg-white/5 text-primary transition flex items-center gap-2 border border-primary/20 active:scale-95"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        AI Summary
                                    </button>
                                    <button disabled className="px-5 py-2.5 rounded-xl text-sm font-bold bg-surface-container-highest text-on-surface-variant cursor-not-allowed border border-outline-variant/10">
                                        Stream Ended
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1920px] mx-auto p-4 lg:p-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Main Content Area */}
                    <div className="col-span-12 lg:col-span-9 space-y-4">
                        {/* Video Preview Card */}
                        <div className="rounded-2xl bg-surface-container border border-outline-variant/10">
                            <div className="aspect-video bg-black relative group/player">
                                {/* Video Player */}
                                {videoId ? (
                                    <CustomYouTubePlayer
                                        ref={playerRef}
                                        videoId={videoId}
                                        isLive={classData.status === 'Live'}
                                        title={classData.title || classData.subject}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                                        <Video className="w-16 h-16 mb-4 opacity-50" />
                                        <p>Stream Preview Offline</p>
                                    </div>
                                )}

                                {/* Stream Overlays Removed */}

                                {classData.status === 'Live' && (
                                    <>
                                        <div className="absolute top-3 right-3 bg-error px-2.5 py-1.5 rounded text-on-error text-xs font-medium pointer-events-none">
                                            LIVE
                                        </div>
                                        <button
                                            onClick={handleJumpToLive}
                                            className="absolute bottom-16 right-4 z-40 bg-error hover:bg-error/90 text-on-error text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 opacity-0 group-hover/player:opacity-100 transition-opacity"
                                        >
                                            <Radio className="w-3 h-3" />
                                            JUMP TO LIVE
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Status bar below video */}
                            <div className="px-4 py-3 border-t border-outline-variant/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-on-surface-variant/70">
                                            {classData.batch?.name || classData.batchName}
                                        </span>
                                        <span className="text-on-surface-variant/40">â€¢</span>
                                        <span className="text-on-surface-variant/70">
                                            {classData.startTime} - {classData.endTime}
                                        </span>
                                        <span className="text-on-surface-variant/40">â€¢</span>
                                        <span className="flex items-center gap-1.5 text-on-surface-variant/70">
                                            <Users className="w-4 h-4" />
                                            {viewerCount} students
                                        </span>
                                        {handRaises.length > 0 && (
                                            <>
                                                <span className="text-on-surface-variant/40">â€¢</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1.5 text-orange-500 font-bold animate-pulse">
                                                        <Hand className="w-4 h-4" />
                                                        {handRaises.length} Raised Hands
                                                    </span>
                                                    <button 
                                                        onClick={() => socketRef.current?.emit('handraise:clear', { liveClassId: classData._id })}
                                                        className="text-[10px] uppercase tracking-wider text-gray-500 hover:text-white underline underline-offset-2"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <span className="text-sm text-on-surface-variant/70">
                                        {new Date().toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* AI Class Summary - Show for Completed Classes */}
                        {isCompleted && (
                            <div ref={summaryRef} className="rounded-2xl border p-8 bg-surface-container border-outline-variant/10 shadow-2xl animate-fade-in-up">
                                <ClassSummary liveClassId={liveClassId} isTeacher={true} />
                            </div>
                        )}



                        {/* Tabs Section */}
                        <div className="rounded-2xl bg-surface-container border border-outline-variant/10">
                            {/* Tab Navigation */}
                            <div className="border-b border-outline-variant/10">
                                <div className="flex px-3 overflow-x-auto">
                                    {[
                                        { id: 'stream', label: 'Stream setup', icon: Server },
                                        { id: 'whiteboard', label: 'Whiteboard', icon: Edit3 },
                                        { id: 'materials', label: 'Materials', icon: FileText },
                                        { id: 'attendance', label: 'Attendance', icon: Users },
                                        ...(classData.status === 'Completed' ? [{ id: 'comments', label: 'Comments', icon: MessageCircle }] : [])
                                    ].map(({ id, label, icon: Icon }) => (
                                        <button
                                            key={id}
                                            onClick={() => setActiveTab(id)}
                                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium relative transition shrink-0 ${activeTab === id
                                                ? 'text-primary'
                                                : 'text-on-surface-variant/60 hover:text-on-surface'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {label}
                                            {activeTab === id && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                {activeTab === 'stream' && <StreamSetupTab streamKey={streamKey} ingestionUrl={ingestionUrl} />}
                                {activeTab === 'whiteboard' && <WhiteboardTab liveClassId={classData._id} initialUrl={classData.whiteboardUrl} />}
                                {activeTab === 'materials' && <MaterialsTab notes={notes} loading={loadingNotes} classData={classData} onUpdate={loadNotes} />}
                                {activeTab === 'attendance' && <AttendanceTab liveClassId={classData._id} />}
                                {activeTab === 'comments' && classData.status === 'Completed' && (
                                    <div className="h-[600px] border border-outline-variant/10 rounded-2xl overflow-hidden">
                                        <CommentSection liveClassId={classData._id} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Chat */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="lg:sticky lg:top-20 h-[600px] lg:h-[calc(100vh-100px)] flex flex-col bg-surface-container rounded-2xl border border-outline-variant/10 overflow-hidden">
                            <div className="flex border-b border-outline-variant/10 bg-surface-container">
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
                                    onClick={() => setRightPanelTab('moderation')}
                                    className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                                        rightPanelTab === 'moderation' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-on-surface-variant/60 hover:text-on-surface'
                                    }`}
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    MODERATION
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                {rightPanelTab === 'chat' ? (
                                    <ChatPanel
                                        liveClassId={classData._id}
                                        batchId={classData.batch?._id}
                                        token={localStorage.getItem('accessToken')}
                                        user={user}
                                    />
                                ) : rightPanelTab === 'qa' ? (
                                    <QAPanel liveClassId={classData._id} />
                                ) : (
                                    <ModerationPanel liveClassId={classData._id} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stream Setup Tab
function StreamSetupTab({ streamKey, ingestionUrl }) {
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const copyToClipboard = async (text, setter) => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="text-sm font-medium mb-2 block text-on-surface">
                    Stream URL
                </label>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={ingestionUrl || 'Generate stream first...'}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-mono bg-surface-container-high border border-outline-variant/10 text-on-surface outline-none"
                    />
                    <button
                        onClick={() => copyToClipboard(ingestionUrl, setCopiedUrl)}
                        disabled={!ingestionUrl}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center min-w-[60px] ${copiedUrl ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary hover:shadow-primary/20'}`}
                    >
                        {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-on-surface">
                        Stream Key
                    </label>
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="text-xs flex items-center gap-1 text-on-surface-variant/60 hover:text-on-surface transition"
                    >
                        {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showKey ? 'Hide' : 'Show'}
                    </button>
                </div>
                <div className="flex gap-2">
                    <input
                        readOnly
                        type={showKey ? 'text' : 'password'}
                        value={streamKey || ''}
                        placeholder="Generate stream first..."
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-mono bg-surface-container-high border border-outline-variant/10 text-on-surface outline-none"
                    />
                    <button
                        onClick={() => copyToClipboard(streamKey, setCopiedKey)}
                        disabled={!streamKey}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center min-w-[60px] ${copiedKey ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary hover:shadow-primary/20'}`}
                    >
                        {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <h4 className="text-sm font-medium mb-2 text-primary">
                    Setup Instructions
                </h4>
                <ol className="space-y-1 text-sm text-on-surface-variant/80">
                    <li>1. Open OBS Studio</li>
                    <li>2. Go to Settings â†’ Stream</li>
                    <li>3. Select "Custom" service</li>
                    <li>4. Paste the URL and Key above</li>
                    <li>5. Click "Start Streaming"</li>
                </ol>
            </div>
        </div>
    );
}



// Materials Tab
function MaterialsTab({ notes, loading, classData, onUpdate }) {
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [materialTitle, setMaterialTitle] = useState('');
    const [showUpload, setShowUpload] = useState(false);

    if (loading) return <LoadingSpinner centered />;

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !materialTitle) {
            toast.error('Please select a file and enter a title');
            return;
        }

        setUploading(true);
        try {
            // 1. Upload file to Cloudinary via backend
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await api.post('/uploads/notes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { secure_url, public_id, resource_type } = uploadRes.data;

            // 2. Create note record
            const noteData = {
                institutionId: classData.institutionId,
                batchId: classData.batch?._id || classData.batch,
                subjectId: classData.subjectId || 'default',
                teacherId: classData.teacher?._id || classData.teacher,
                liveClassId: classData._id,
                title: materialTitle,
                secureUrl: secure_url,
                publicId: public_id,
                resourceType: resource_type
            };

            await api.post('/notes', noteData);

            toast.success('Material uploaded successfully');
            setFile(null);
            setMaterialTitle('');
            setShowUpload(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(error?.response?.data?.message || 'Failed to upload material');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (noteId) => {
        const confirmed = await confirmToast('Are you sure you want to delete this material?', {
            confirmLabel: 'Delete Material',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            await api.delete(`/notes/${noteId}`);
            toast.success('Material deleted');
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Failed to delete material');
        }
    };

    return (
        <div className="space-y-6">
            {!showUpload ? (
                <button
                    onClick={() => setShowUpload(true)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 bg-primary text-on-primary hover:shadow-primary/20 hover:shadow-lg">
                    <Plus className="w-4 h-4" />
                    Upload material
                </button>
            ) : (
                <form onSubmit={handleUpload} className="p-4 rounded-xl border border-outline-variant/10 bg-surface-container-high">
                    <h3 className="text-sm font-semibold mb-3 text-on-surface">Upload New Material</h3>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium mb-1 text-on-surface-variant/70">Title</label>
                            <input
                                type="text"
                                value={materialTitle}
                                onChange={(e) => setMaterialTitle(e.target.value)}
                                placeholder="e.g. Chapter 1 Notes"
                                className="w-full px-3 py-2 rounded-lg text-sm bg-surface-container-high border border-outline-variant/10 text-on-surface outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1 text-on-surface-variant/70">File</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="w-full text-sm text-on-surface-variant/80"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowUpload(false)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className={`px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                {notes.length === 0 ? (
                    <div className="text-center py-8 text-on-surface-variant/60">
                        <p>No materials uploaded yet.</p>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div
                            key={note._id || note.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high hover:bg-surface-bright/10 transition"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-red-500" />
                                <div>
                                    <p className="text-sm font-medium text-on-surface">
                                        {note.title}
                                    </p>
                                    <p className="text-xs text-on-surface-variant/60">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.open(note.secureUrl || note.fileUrl, '_blank')}
                                    className="p-2 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition">
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(note._id || note.id)}
                                    className={`p-2 rounded hover:bg-red-500/10 text-red-500`}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// Attendance Tab
function AttendanceTab({ liveClassId }) {
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = async () => {
        try {
            const { data } = await api.get(`/attendance/${liveClassId}`);
            setAttendanceData(data.data);
        } catch (error) {
            console.error('Failed to load attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
        const interval = setInterval(fetchAttendance, 10000); // 10s refresh rate
        return () => clearInterval(interval);
    }, [liveClassId]);

    if (loading && !attendanceData) return <LoadingSpinner centered />;
    if (!attendanceData) return <div className="p-4 text-on-surface-variant/60">Unable to load attendance data.</div>;

    const { status, elapsedTime, records } = attendanceData;
    const isLive = status === 'live';

    const downloadCSV = () => {
        if (!records?.length) return toast.error('No attendance records to export');
        
        const headers = ['Student Name', 'Email', 'Present Duration', 'Attendance %', 'Status'];
        const rows = records.map(r => [
            r.studentId?.name || 'Unknown',
            r.studentId?.email || 'N/A',
            `${Math.floor(r.duration / 60)}m ${r.duration % 60}s`,
            `${r.percentage}%`,
            r.status
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Attendance_Report_${liveClassId}_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-on-surface">
                    Session Attendance {isLive && <span className="bg-red-600 px-2 py-0.5 rounded text-white text-xs ml-2">Live</span>}
                </h3>
                <div className="flex items-center gap-4">
                    {isLive && elapsedTime > 0 && (
                        <span className="text-sm text-on-surface-variant/70">
                            Duration: {Math.floor(elapsedTime / 60)} min
                        </span>
                    )}
                    <button 
                        onClick={downloadCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition bg-surface-container-high hover:bg-primary/10 text-on-surface-variant hover:text-primary"
                    >
                        <Download className="w-3.5 h-3.5" />
                        EXPORT CSV
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-on-surface-variant">
                    <thead>
                        <tr className="border-b border-outline-variant/10">
                            <th className="py-2 px-3">Student</th>
                            <th className="py-2 px-3">Present Time</th>
                            <th className="py-2 px-3">Percentage</th>
                            <th className="py-2 px-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records?.map((record, idx) => {
                            const student = record.studentId;
                            const isPresent = record.status === 'present';
                            return (
                                <tr key={idx} className="border-b last:border-0 border-outline-variant/10">
                                    <td className="py-3 px-3 flex items-center gap-2">
                                        <img src={student?.avatarUrl || 'https://ui-avatars.com/api/?name=' + (student?.name || 'U')} alt="Avatar" className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                                        <div>
                                            <p className="font-medium text-on-surface">{student?.name}</p>
                                            <p className="text-xs opacity-70">{student?.email}</p>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3">{Math.floor(record.duration / 60)}m {record.duration % 60}s</td>
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${record.percentage >= 75 ? 'bg-green-500' : record.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${Math.min(100, record.percentage)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs">{record.percentage}%</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${isPresent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {isPresent ? 'Present' : 'Absent'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {(!records || records.length === 0) && (
                            <tr>
                                <td colSpan="4" className="py-4 text-center opacity-50">No students enrolled or found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Whiteboard Tab
function WhiteboardTab({ liveClassId, initialUrl }) {
    const [url, setUrl] = useState(initialUrl || `https://wbo.ophir.dev/boards/class-${liveClassId}`);
    const [saving, setSaving] = useState(false);

    const handleSync = async () => {
        setSaving(true);
        try {
            await api.patch(`/live-classes/${liveClassId}/whiteboard`, { whiteboardUrl: url });
            toast.success('Whiteboard synced to students');
        } catch (error) {
            toast.error('Failed to sync whiteboard URL');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-3 rounded-xl border border-outline-variant/10 bg-surface-container-high">
                <div className="flex-1 w-full relative h-[42px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-full">
                        <Link className="h-4 w-4 text-on-surface-variant/50" />
                    </div>
                    <input 
                        type="url" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Excalidraw or Whiteboard URL"
                        className="pl-10 w-full h-full px-3 text-sm rounded-lg bg-surface-container border border-outline-variant/10 text-on-surface outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <button 
                    onClick={handleSync}
                    disabled={saving || !url}
                    className="flex items-center gap-2 h-[42px] px-4 bg-primary text-on-primary text-sm font-semibold rounded-xl transition hover:shadow-primary/20 disabled:opacity-50 whitespace-nowrap"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Syncing...' : 'Sync to Students'}
                </button>
            </div>
            
            <div className="w-full aspect-video md:h-[600px] rounded-2xl border border-outline-variant/10 overflow-hidden bg-white">
                <iframe 
                    src={url} 
                    title="Whiteboard"
                    className="w-full h-full border-0"
                    allow="camera; microphone; display-capture; autoplay"
                />
            </div>
        </div>
    );
}

// Moderation Queue Panel
function ModerationPanel({ liveClassId }) {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [processingJobId, setProcessingJobId] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchQueue = async ({ silent = false } = {}) => {
        if (!silent) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        try {
            const { data } = await api.get(`/live-classes/${liveClassId}/moderation-queue`);
            setQueue(data.data || []);
            setErrorMessage('');
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to fetch moderation queue:', error);
            setErrorMessage(error?.response?.data?.message || 'Unable to load flagged messages right now.');
        } finally {
            if (!silent) {
                setLoading(false);
            } else {
                setRefreshing(false);
            }
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(() => fetchQueue({ silent: true }), 5000);
        return () => clearInterval(interval);
    }, [liveClassId]);

    const handleAction = async (jobId, action) => {
        setProcessingJobId(jobId);
        try {
            await api.post(`/live-classes/moderation-queue/${jobId}/${action}`);
            toast.success(action === 'approve' ? 'Message approved' : 'Message rejected');
            setQueue(prev => prev.filter(j => j.jobId !== jobId));
            setLastUpdated(new Date());
        } catch (error) {
            toast.error(error?.response?.data?.message || `Failed to ${action} message`);
        } finally {
            setProcessingJobId(null);
        }
    };

    const formatTimestamp = (value) => {
        if (!value) return 'Just now';
        return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1a1a]">
            <div className="p-4 border-b border-[#303030] space-y-3">
                <div className="flex justify-between items-center gap-3">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            MODERATION QUEUE
                        </h3>
                        <p className="mt-1 text-[11px] text-gray-400">
                            Review flagged chat messages before they appear to students.
                        </p>
                    </div>
                    <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-6 text-center">
                        {queue.length}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-[10px] text-gray-500">
                    <span>
                        {lastUpdated ? `Updated at ${formatTimestamp(lastUpdated)}` : 'Waiting for first sync'}
                    </span>
                    <button
                        onClick={() => fetchQueue()}
                        disabled={loading || refreshing}
                        className="px-2.5 py-1 rounded-md border border-outline-variant/20 text-gray-200 hover:bg-white/5 disabled:opacity-50 transition"
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : errorMessage ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-center">
                        <p className="text-xs font-semibold text-red-300">Moderation queue unavailable</p>
                        <p className="mt-1 text-[11px] text-red-200/80">{errorMessage}</p>
                        <button
                            onClick={() => fetchQueue()}
                            className="mt-3 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-200 text-[11px] font-semibold border border-red-500/20 hover:bg-red-500/25 transition"
                        >
                            Try again
                        </button>
                    </div>
                ) : queue.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Check className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-semibold text-gray-300">No pending messages to review</p>
                        <p className="mt-1 text-[11px] text-gray-500">
                            Flagged student messages will appear here automatically.
                        </p>
                    </div>
                ) : (
                    queue.map((item) => (
                        <div key={item.jobId} className="p-3 rounded bg-[#212121] border border-red-500/20 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{item.senderName}</span>
                                <span className="text-[9px] ml-2 px-1 rounded bg-red-900/30 text-red-400">FLAGGED</span>
                                </div>
                                <span className="text-[9px] text-gray-600">{formatTimestamp(item.ts)}</span>
                            </div>
                            <p className="text-xs text-white bg-black/30 p-2 rounded italic border-l-2 border-red-500">
                                "{item.text}"
                            </p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleAction(item.jobId, 'approve')}
                                    disabled={processingJobId === item.jobId}
                                    className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-[10px] font-bold rounded transition"
                                >
                                    {processingJobId === item.jobId ? 'PROCESSING...' : 'APPROVE'}
                                </button>
                                <button 
                                    onClick={() => handleAction(item.jobId, 'reject')}
                                    disabled={processingJobId === item.jobId}
                                    className="flex-1 py-1.5 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-60 text-red-500 text-[10px] font-bold rounded transition border border-red-500/30"
                                >
                                    REJECT
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-3 bg-red-900/10 border-t border-red-900/20">
                <p className="text-[10px] text-red-300 leading-tight">
                    Messages containing blocked keywords are held here for manual review before appearing in chat.
                </p>
            </div>
        </div>
    );
}

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
    Hand
} from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ChatPanel from '../../components/teacher/ChatPanel';
import CommentSection from '../../components/student/CommentSection';
import CustomYouTubePlayer from '../../components/shared/CustomYouTubePlayer';
import QAPanel from '../../components/shared/QAPanel';

export default function TeacherClassControl() {
    const { id: liveClassId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark } = useTheme();

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState(null);
    const [activeTab, setActiveTab] = useState('stream');
    const [viewerCount, setViewerCount] = useState(0);
    const [handRaises, setHandRaises] = useState([]);
    const [rightPanelTab, setRightPanelTab] = useState('chat'); // 'chat' or 'qa'

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

        const socket = io('http://localhost:5000/live-classes', {
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
            toast(`${entry.name} raised their hand!`, { icon: '✋' });
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
            setClassData(data);
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
            setStreamKey(data.streamKey);
            setIngestionUrl(data.ingestionAddress);
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
            setNotes(data.notes || []);
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
            if (data.youtubeStatus === 'live' || data.youtubeStatus === 'ready' || data.status === 'Live') {
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
        if (!confirm('Are you sure you want to end the stream?')) return;
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
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0f0f0f] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="text-center">
                <p className="text-xl font-bold">Class Not Found</p>
                <button onClick={() => navigate('/teacher/dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Back to Dashboard
                </button>
            </div>
        </div>
    );

    const getStatusConfig = () => {
        const status = classData.status || 'Scheduled';
        const configs = {
            Live: { badge: 'bg-red-600', text: 'LIVE', icon: Radio, pulse: true },
            Scheduled: { badge: 'bg-blue-600', text: 'UPCOMING', icon: Clock, pulse: false },
            Completed: { badge: 'bg-green-600', text: 'ENDED', icon: Video, pulse: false },
            Cancelled: { badge: 'bg-gray-600', text: 'CANCELLED', icon: Ban, pulse: false }
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
        <div className={`min-h-screen ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
            {/* Settings Modal */}
            {settingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-md p-6 rounded-xl shadow-2xl ${isDark ? 'bg-[#212121]' : 'bg-white'}`}>
                        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Class Settings</h2>
                        <form onSubmit={handleSaveSettings}>
                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                    Stream Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-[#0f0f0f] border-[#303030] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    placeholder="Enter stream title"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setSettingsOpen(false)}
                                    className={`px-4 py-2 rounded text-sm font-medium ${isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {savingSettings ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Top Bar - YouTube Studio Style */}
            <div className={`border-b sticky top-0 z-50 ${isDark ? 'bg-[#212121] border-[#303030]' : 'bg-white border-gray-200'}`}>
                <div className="max-w-[1920px] mx-auto px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/teacher/dashboard')} className={`p-1.5 rounded-full hover:bg-opacity-10 hover:bg-gray-500 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className={`text-xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {classData.title || classData.subject}
                            </h1>

                            <div className={`flex items-center gap-2 px-3 py-1 rounded-sm text-white text-sm font-medium ${statusConfig.badge}`}>
                                {statusConfig.pulse && <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>}
                                {statusConfig.text}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 mr-2">
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {classData.batch?.name || classData.batchName}
                                </span>
                            </div>
                            <button
                                onClick={() => setSettingsOpen(true)}
                                className={`px-4 py-2 rounded-sm text-sm font-medium transition ${isDark ? 'text-[#3ea6ff] hover:bg-[#263850]' : 'text-blue-600 hover:bg-blue-50'
                                    }`}>
                                <Settings className="w-4 h-4 inline mr-2" />
                                Settings
                            </button>

                            {/* Button Flow Logic */}
                            {!isCompleted && (
                                <>
                                    {!hasStreamConfig && (
                                        <button
                                            onClick={handleCreateStream}
                                            disabled={scheduling}
                                            className="px-4 py-2 rounded-sm text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-2 disabled:opacity-50">
                                            <Plus className="w-3.5 h-3.5" />
                                            Create Stream
                                        </button>
                                    )}

                                    {hasStreamConfig && !isLive && (
                                        <button
                                            onClick={handleGoLive}
                                            disabled={isCheckingConfig}
                                            className="px-4 py-2 rounded-sm text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition flex items-center gap-2 disabled:opacity-50">
                                            <Radio className="w-3.5 h-3.5" />
                                            {isCheckingConfig ? 'Connecting...' : 'Go Live'}
                                        </button>
                                    )}

                                    {isLive && (
                                        <button
                                            onClick={handleEndStream}
                                            disabled={scheduling}
                                            className="px-4 py-2 rounded-sm text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-2 disabled:opacity-50">
                                            <Square className="w-3.5 h-3.5" />
                                            End Stream
                                        </button>
                                    )}
                                </>
                            )}

                            {isCompleted && (
                                <button disabled className="px-4 py-2 rounded-sm text-sm font-medium bg-gray-600 text-white cursor-not-allowed">
                                    Stream Ended
                                </button>
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
                        <div className={`rounded ${isDark ? 'bg-[#212121]' : 'bg-white border border-gray-200'}`}>
                            <div className="aspect-video bg-black relative group/player">
                                {/* Video Player */}
                                {videoId ? (
                                    <CustomYouTubePlayer ref={playerRef} videoId={videoId} />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                                        <Video className="w-16 h-16 mb-4 opacity-50" />
                                        <p>Stream Preview Offline</p>
                                    </div>
                                )}

                                {/* Stream Overlays Removed */}

                                {classData.status === 'Live' && (
                                    <>
                                        <div className="absolute top-3 right-3 bg-red-600 px-2.5 py-1.5 rounded text-white text-xs font-medium pointer-events-none">
                                            LIVE
                                        </div>
                                        <button
                                            onClick={handleJumpToLive}
                                            className="absolute bottom-16 right-4 z-40 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 opacity-0 group-hover/player:opacity-100 transition-opacity"
                                        >
                                            <Radio className="w-3 h-3" />
                                            JUMP TO LIVE
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Status bar below video */}
                            <div className={`px-4 py-3 border-t ${isDark ? 'border-[#303030]' : 'border-gray-200'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                            {classData.batch?.name || classData.batchName}
                                        </span>
                                        <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>•</span>
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                            {classData.startTime} - {classData.endTime}
                                        </span>
                                        <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>•</span>
                                        <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <Users className="w-4 h-4" />
                                            {viewerCount} students
                                        </span>
                                        {handRaises.length > 0 && (
                                            <>
                                                <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>•</span>
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
                                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {new Date().toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>



                        {/* Tabs Section */}
                        <div className={`rounded ${isDark ? 'bg-[#212121]' : 'bg-white border border-gray-200'}`}>
                            {/* Tab Navigation */}
                            <div className={`border-b ${isDark ? 'border-[#303030]' : 'border-gray-200'}`}>
                                <div className="flex px-3 overflow-x-auto">
                                    {[
                                        { id: 'stream', label: 'Stream setup', icon: Server },
                                        { id: 'materials', label: 'Materials', icon: FileText },
                                        ...(classData.status === 'Completed' ? [{ id: 'comments', label: 'Comments', icon: MessageCircle }] : [])
                                    ].map(({ id, label, icon: Icon }) => (
                                        <button
                                            key={id}
                                            onClick={() => setActiveTab(id)}
                                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium relative transition shrink-0 ${activeTab === id
                                                ? isDark ? 'text-[#3ea6ff]' : 'text-blue-600'
                                                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {label}
                                            {activeTab === id && (
                                                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-[#3ea6ff]' : 'bg-blue-600'
                                                    }`} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6">
                                {activeTab === 'stream' && <StreamSetupTab isDark={isDark} streamKey={streamKey} ingestionUrl={ingestionUrl} />}
                                {activeTab === 'materials' && <MaterialsTab isDark={isDark} notes={notes} loading={loadingNotes} classData={classData} onUpdate={loadNotes} />}
                                {activeTab === 'comments' && classData.status === 'Completed' && (
                                    <div className="h-[600px] border border-[#303030] rounded overflow-hidden">
                                        <CommentSection liveClassId={classData._id} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Chat */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="lg:sticky lg:top-20 h-[600px] lg:h-[calc(100vh-100px)] flex flex-col bg-[#212121] rounded border border-[#303030] overflow-hidden">
                            <div className="flex border-b border-[#303030] bg-[#212121]">
                                <button 
                                    onClick={() => setRightPanelTab('chat')}
                                    className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                                        rightPanelTab === 'chat' ? 'text-[#3ea6ff] border-b-2 border-[#3ea6ff] bg-white/5' : 'text-gray-400 hover:text-white'
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
                            </div>
                            <div className="flex-1 overflow-hidden">
                                {rightPanelTab === 'chat' ? (
                                    <ChatPanel
                                        liveClassId={classData._id}
                                        batchId={classData.batch?._id}
                                        token={localStorage.getItem('accessToken')}
                                        user={user}
                                    />
                                ) : (
                                    <QAPanel liveClassId={classData._id} />
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
function StreamSetupTab({ isDark, streamKey, ingestionUrl }) {
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
                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Stream URL
                </label>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={ingestionUrl || 'Generate stream first...'}
                        className={`flex-1 px-3 py-2 rounded text-sm font-mono ${isDark ? 'bg-[#0f0f0f] border-[#303030] text-gray-300' : 'bg-white border-gray-300 text-gray-900'
                            } border outline-none focus:border-blue-500`}
                    />
                    <button
                        onClick={() => copyToClipboard(ingestionUrl, setCopiedUrl)}
                        disabled={!ingestionUrl}
                        className={`px-4 py-2 rounded text-sm font-medium transition flex items-center justify-center min-w-[60px] ${copiedUrl
                            ? 'bg-green-600 text-white'
                            : isDark
                                ? 'bg-[#3ea6ff] hover:bg-[#65b8ff] text-black'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Stream Key
                    </label>
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
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
                        className={`flex-1 px-3 py-2 rounded text-sm font-mono ${isDark ? 'bg-[#0f0f0f] border-[#303030] text-gray-300' : 'bg-white border-gray-300 text-gray-900'
                            } border outline-none focus:border-blue-500`}
                    />
                    <button
                        onClick={() => copyToClipboard(streamKey, setCopiedKey)}
                        disabled={!streamKey}
                        className={`px-4 py-2 rounded text-sm font-medium transition flex items-center justify-center min-w-[60px] ${copiedKey
                            ? 'bg-green-600 text-white'
                            : isDark
                                ? 'bg-[#3ea6ff] hover:bg-[#65b8ff] text-black'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className={`p-4 rounded ${isDark ? 'bg-[#263850]' : 'bg-blue-50'}`}>
                <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-[#3ea6ff]' : 'text-blue-900'}`}>
                    Setup Instructions
                </h4>
                <ol className={`space-y-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>1. Open OBS Studio</li>
                    <li>2. Go to Settings → Stream</li>
                    <li>3. Select "Custom" service</li>
                    <li>4. Paste the URL and Key above</li>
                    <li>5. Click "Start Streaming"</li>
                </ol>
            </div>
        </div>
    );
}



// Materials Tab
function MaterialsTab({ isDark, notes, loading, classData, onUpdate }) {
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
        if (!confirm('Are you sure you want to delete this material?')) return;
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
                    className={`w-full px-4 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-2 ${isDark ? 'bg-[#3ea6ff] hover:bg-[#65b8ff] text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}>
                    <Plus className="w-4 h-4" />
                    Upload material
                </button>
            ) : (
                <form onSubmit={handleUpload} className={`p-4 rounded border ${isDark ? 'bg-[#282828] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Upload New Material</h3>

                    <div className="space-y-3">
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Title</label>
                            <input
                                type="text"
                                value={materialTitle}
                                onChange={(e) => setMaterialTitle(e.target.value)}
                                placeholder="e.g. Chapter 1 Notes"
                                className={`w-full px-3 py-2 rounded text-sm ${isDark ? 'bg-[#0f0f0f] border-gray-700 text-white chat-input' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            />
                        </div>

                        <div>
                            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>File</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowUpload(false)}
                                className={`px-3 py-1.5 rounded text-xs font-medium ${isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-200'}`}
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
                    <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <p>No materials uploaded yet.</p>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div
                            key={note._id || note.id}
                            className={`flex items-center justify-between p-3 rounded ${isDark ? 'bg-[#282828] hover:bg-[#303030]' : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-red-500" />
                                <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {note.title}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.open(note.secureUrl || note.fileUrl, '_blank')}
                                    className={`p-2 rounded ${isDark ? 'hover:bg-[#404040] text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
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

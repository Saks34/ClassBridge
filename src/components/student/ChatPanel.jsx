import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    Send,
    MessageCircle,
    Smile,
    X,
    Pin,
    AlertCircle,
    Wifi,
    WifiOff,
    VolumeX,
    Clock,
    CheckCheck,
    Ban,
    BarChart3,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatPanel({ liveClassId }) {
    // Hardcoded Dark Theme for consistency with Teacher Panel ("YouTube Studio" style)
    const _isDark = true;
    const { user } = useAuth();

    // State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [connected, setConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showTopChat, setShowTopChat] = useState(false);

    // Polls / Quizzes (realtime)
    const [interactive, setInteractive] = useState(null);
    const [interactiveResults, setInteractiveResults] = useState(null);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
    const [hasSubmittedInteractive, setHasSubmittedInteractive] = useState(false);

    // Moderation State
    const [slowMode, setSlowMode] = useState(0); // seconds
    const [chatPaused, setChatPaused] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState(0);

    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const interactiveRef = useRef(null);

    const token = localStorage.getItem('accessToken');

    // Socket Connection
    useEffect(() => {
        if (!liveClassId || !token) return;

        const socket = io(`${API_BASE}/live-classes`, {
            auth: { token },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            const batchId = user?.batch?._id || user?.batch;

            socket.emit('join-room', {
                liveClassId,
                batchId,
                historyLimit: 50
            }, (ack) => {
                if (!ack?.ok) {
                    console.error('Failed to join chat room:', ack?.error);
                }
            });
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('message', (msg) => {
            if (msg.liveClassId === liveClassId) {
                setMessages((prev) => [...prev, msg]);
            }
        });

        socket.on('chat-history', (payload) => {
            if (payload && payload.messages) {
                // Filter out join/leave messages as per request
                const filtered = payload.messages.filter(m => !(m.type === 'system' && (m.text === 'user-joined' || m.text === 'user-left')));
                setMessages(filtered);

                // Sync moderation state
                if (payload.slowMode !== undefined) setSlowMode(payload.slowMode);
                if (payload.chatPaused !== undefined) setChatPaused(payload.chatPaused);
                if (payload.isMuted !== undefined) setIsMuted(payload.isMuted);
            }
        });

        // Active poll/quiz on join
        socket.on('interactive:active', (active) => {
            if (!active || String(active.liveClassId) !== String(liveClassId)) return;
            setInteractive(active);
            setInteractiveResults(null);
            setSelectedOptionIndex(null);
            setHasSubmittedInteractive(false);
        });

        socket.on('interactive:new', (active) => {
            if (!active || String(active.liveClassId) !== String(liveClassId)) return;
            setInteractive(active);
            setInteractiveResults(null);
            setSelectedOptionIndex(null);
            setHasSubmittedInteractive(false);
            toast(active.kind === 'quiz' ? 'New quiz started' : 'New poll started');
        });

        socket.on('interactive:results', (payload) => {
            if (!payload || String(payload.liveClassId) !== String(liveClassId)) return;
            if (!interactiveRef.current || payload.interactiveId !== interactiveRef.current.interactiveId) return;
            setInteractiveResults(payload);
        });

        socket.on('interactive:closed', (payload) => {
            if (!payload || String(payload.liveClassId) !== String(liveClassId)) return;
            if (!interactiveRef.current || payload.interactiveId !== interactiveRef.current.interactiveId) return;
            setInteractiveResults(payload);
            toast('Poll/quiz closed');
        });

        // Real-time Moderation Events
        socket.on('slow-mode-updated', ({ slowMode }) => {
            setSlowMode(slowMode);
            toast(slowMode > 0 ? `Slow mode: ${slowMode}s` : 'Slow mode disabled');
        });

        socket.on('chat-pause-updated', ({ paused }) => {
            setChatPaused(paused);
            toast(paused ? 'Chat paused by moderator' : 'Chat resumed');
        });

        socket.on('message-pinned', ({ messageId, isPinned }) => {
            setMessages(prev => prev.map(m => (m.id === messageId || m._id === messageId) ? { ...m, isPinned } : m));
        });

        socket.on('message-deleted', ({ messageId }) => {
            setMessages(prev => prev.filter(m => m.id !== messageId && m._id !== messageId));
        });

        socket.on('system', (evt) => {
            if (evt.liveClassId !== liveClassId) return;
            if (evt.type === 'user-joined' || evt.type === 'user-left') return;

            // Handle Mut/Unmute
            if (evt.type === 'muted' && String(evt.targetUserId) === String(user.id || user._id)) {
                setIsMuted(true);
                toast.error('You have been muted');
            }
            if (evt.type === 'unmuted' && String(evt.targetUserId) === String(user.id || user._id)) {
                setIsMuted(false);
                toast.success('You have been unmuted');
            }
            if (evt.type === 'chat-cleared') {
                setMessages([]);
                toast('Chat history cleared');
            }
            if (evt.type === 'class-ended') {
                setChatPaused(true);
                toast('Class ended');
            }

            // Show relevant system messages
            if (['chat-cleared', 'class-ended'].includes(evt.type)) {
                setMessages((prev) => [...prev, { ...evt, role: 'system', type: 'system', text: evt.text || evt.type }]);
            }
        });

        return () => {
            if (socket) {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('message');
                socket.off('chat-history');
                socket.off('system');
                socket.off('slow-mode-updated');
                socket.off('chat-pause-updated');
                socket.off('interactive:active');
                socket.off('interactive:new');
                socket.off('interactive:results');
                socket.off('interactive:closed');
                socket.emit('leave-room', { liveClassId });
                socket.disconnect();
            }
        };
    }, [liveClassId, token, user]);

    useEffect(() => {
        interactiveRef.current = interactive;
    }, [interactive]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showTopChat]);

    const handleSendMessage = (e) => {
        e?.preventDefault();
        const trimmed = newMessage.trim();

        if (!trimmed || !socketRef.current || isMuted) return;

        // Chat Pause Check
        if (chatPaused) {
            toast.error('Chat is currently paused');
            return;
        }

        // Slow Mode Check
        const now = Date.now();
        if (slowMode > 0) {
            const timeSinceLast = (now - lastMessageTime) / 1000;
            if (timeSinceLast < slowMode) {
                const waitTime = Math.ceil(slowMode - timeSinceLast);
                toast.error(`Slow mode: wait ${waitTime}s`);
                return;
            }
        }

        const batchId = user?.batch?._id || user?.batch;

        socketRef.current.emit('send-message', {
            liveClassId,
            text: trimmed,
            batchId
        }, (ack) => {
            if (!ack?.ok) {
                console.error('Failed to send message:', ack?.error);
                if (ack?.error.includes('Muted')) {
                    setIsMuted(true);
                    toast.error('You have been muted by a moderator.');
                }
            } else {
                setNewMessage('');
                setShowEmojiPicker(false);
                setLastMessageTime(Date.now());
            }
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const emojis = ['😊', '👍', '❤️', '🎉', '👏', '🔥', '💯', '✅', '🤔', '📚', '✏️', '💡'];

    const totalAnswers = interactiveResults?.participation?.answered ?? (
        interactiveResults?.optionCounts?.reduce((sum, o) => sum + (o.count || 0), 0) || 0
    );

    const optionCount = (idx) => {
        const entry = interactiveResults?.optionCounts?.find(o => o.optionIndex === idx);
        return entry?.count || 0;
    };

    const submitInteractive = () => {
        if (!socketRef.current || !interactive) return;
        if (selectedOptionIndex === null || selectedOptionIndex === undefined) {
            return toast.error('Select an option');
        }
        socketRef.current.emit(
            'interactive:submit',
            {
                liveClassId,
                interactiveId: interactive.interactiveId,
                selectedOptionIndex
            },
            (ack) => {
                if (!ack?.ok) {
                    toast.error(ack?.error || 'Failed to submit');
                    return;
                }
                setHasSubmittedInteractive(true);
                toast.success('Submitted');
            }
        );
    };

    const displayedMessages = showTopChat
        ? messages.filter(m => m.isPinned || m.role === 'Teacher' || m.role === 'teacher')
        : messages;

    return (
        <div className="flex flex-col h-full rounded-xl bg-surface-container border border-outline-variant/20">
            {/* Header */}
            <div className="px-4 py-3 border-b border-outline-variant/20">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-on-surface flex items-center gap-2">
                        Live chat
                        {!connected && <span className="text-[10px] text-error">(Connecting...)</span>}
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
                            {connected ? (
                                <Wifi className="w-3 h-3 text-secondary" />
                            ) : (
                                <WifiOff className="w-3 h-3 text-error" />
                            )}
                        </div>
                        <button
                            onClick={() => setShowTopChat(!showTopChat)}
                            className={`text-xs px-2 py-1 rounded font-medium transition ${showTopChat
                                ? 'bg-secondary text-on-secondary'
                                : 'text-on-surface-variant opacity-70 hover:opacity-100 hover:text-on-surface'
                                }`}
                        >
                            {showTopChat ? 'Show all' : 'Top chat'}
                        </button>
                    </div>
                </div>

                {/* Status Banners */}
                <div className="space-y-1">
                    {/* Pinned Messages */}
                    {messages.filter(m => m.isPinned).length > 0 && (
                        <div className="p-2 rounded-xl bg-secondary/10 border border-secondary/20 mb-1">
                            <div className="flex items-start gap-2">
                                <Pin className="w-3 h-3 mt-0.5 flex-shrink-0 text-secondary" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold font-label uppercase tracking-wider text-secondary mb-0.5">
                                        Pinned by Teacher
                                    </p>
                                    <p className="text-xs text-on-surface line-clamp-2">
                                        {messages.filter(m => m.isPinned)[0].text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {slowMode > 0 && (
                        <div className="text-xs px-2 py-1.5 rounded-lg bg-tertiary/10 text-tertiary flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Slow mode: {slowMode} sec limit
                        </div>
                    )}
                    {chatPaused && (
                        <div className="text-xs px-2 py-1.5 rounded-lg bg-error/10 text-error flex items-center gap-2 border border-error/20">
                            <Ban className="w-3 h-3" />
                            Chat is paused
                        </div>
                    )}
                    {isMuted && (
                        <div className="text-xs px-2 py-1.5 rounded-lg bg-error/10 text-error flex items-center gap-2 border border-error/20">
                            <VolumeX className="w-3 h-3" />
                            You have been muted
                        </div>
                    )}
                </div>
            </div>

            {/* Active Poll / Quiz */}
            {interactive && (
                <div className="px-3 py-3 border-b border-outline-variant/20 bg-surface-container">
                    <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${interactive.kind === 'quiz' ? 'text-tertiary' : 'text-secondary'}`}>
                                        {interactive.kind === 'quiz' ? 'Quiz' : 'Poll'}
                                    </span>
                                    <span className="text-[10px] text-on-surface-variant/60 font-label">
                                        <BarChart3 className="w-3 h-3 inline mr-1" />
                                        {interactiveResults?.participation
                                            ? `${interactiveResults.participation.answered}/${interactiveResults.participation.viewers} answered (${interactiveResults.participation.percentage}%)`
                                            : 'Live'}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-on-surface mt-1">{interactive.question}</p>
                            </div>
                        </div>

                        <div className="mt-3 space-y-2">
                            {interactive.options?.map((opt, idx) => {
                                const count = optionCount(idx);
                                const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
                                const isCorrect = interactive.kind === 'quiz' && idx === interactive.correctOptionIndex;
                                const isSelected = selectedOptionIndex === idx;
                                const reveal = hasSubmittedInteractive || interactiveResults?.closedAt;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => !hasSubmittedInteractive && setSelectedOptionIndex(idx)}
                                        disabled={hasSubmittedInteractive}
                                        className={`w-full text-left p-2.5 rounded-xl border transition ${isSelected
                                                ? 'border-secondary bg-secondary/10'
                                                : 'border-outline-variant/20 hover:bg-surface-container-high'
                                            } ${hasSubmittedInteractive ? 'opacity-90 cursor-default' : ''}`}
                                    >
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <div className="min-w-0 flex items-center gap-2">
                                                <span className="truncate">{opt}</span>
                                                {interactive.kind === 'quiz' && reveal && isCorrect && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Correct
                                                    </span>
                                                )}
                                            </div>
                                            {interactiveResults && (
                                                <span className="text-xs text-on-surface-variant/70 whitespace-nowrap">
                                                    {count} ({pct}%)
                                                </span>
                                            )}
                                        </div>
                                        {interactiveResults && (
                                            <div className="mt-2 w-full h-2 rounded-full bg-surface-variant/30 overflow-hidden">
                                                <div
                                                    className={`h-full ${interactive.kind === 'quiz' && reveal && isCorrect ? 'bg-green-500' : 'bg-secondary'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}

                            {!hasSubmittedInteractive && (
                                <button
                                    onClick={submitInteractive}
                                    disabled={selectedOptionIndex === null || !connected || isMuted || chatPaused}
                                    className="w-full mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold transition hover:shadow-primary/20 disabled:opacity-50"
                                >
                                    Submit
                                </button>
                            )}

                            {interactive.kind === 'quiz' && interactiveResults?.quizStats && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center justify-between">
                                        <span className="flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Right
                                        </span>
                                        <span className="font-bold">{interactiveResults.quizStats.rightCount}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-error/10 border border-error/20 text-error text-xs flex items-center justify-between">
                                        <span className="flex items-center gap-1">
                                            <XCircle className="w-4 h-4" />
                                            Wrong
                                        </span>
                                        <span className="font-bold">{interactiveResults.quizStats.wrongCount}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-3 py-2 bg-surface-container-lowest/50">
                <div className="space-y-1">
                    {displayedMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-on-surface-variant opacity-60">
                            <MessageCircle className="w-10 h-10 mb-2 opacity-50" />
                            <p className="text-xs">Welcome to live chat!</p>
                        </div>
                    ) : (
                        displayedMessages.map((msg, idx) => {
                            if (msg.type === 'system') {
                                return (
                                    <div key={msg.id || idx} className="flex items-center gap-3 py-2 text-on-surface-variant opacity-60">
                                        <div className="flex-1 h-px bg-outline-variant/20"></div>
                                        <span className="text-xs italic flex items-center gap-1.5 font-label">
                                            <AlertCircle className="w-3 h-3" />
                                            {msg.text || msg.type}
                                        </span>
                                        <div className="flex-1 h-px bg-outline-variant/20"></div>
                                    </div>
                                );
                            }

                            const userId = user.id || user._id;
                            const isMe = String(msg.senderId) === String(userId) || msg.senderId === 'current';
                            const isTeacher = msg.role === 'Teacher' || msg.role === 'teacher';

                            return (
                                <div key={msg.id || idx} className={`group p-1.5 rounded-xl transition flex items-start gap-2 ${msg.isPinned ? 'bg-secondary/10 border border-secondary/20' : 'hover:bg-surface-variant/40'}`}>
                                    {/* Avatar */}
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-inner ${isTeacher ? 'bg-primary text-on-primary' :
                                            isMe ? 'bg-tertiary text-on-tertiary' : 'bg-secondary text-on-secondary'
                                        }`}>
                                        {isMe ? 'Y' : (msg.senderName ? msg.senderName.charAt(0) : 'U')}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`text-[11px] font-bold font-body ${isTeacher ? 'text-primary' :
                                                    isMe ? 'text-tertiary' : 'text-secondary'
                                                }`}>
                                                {isMe ? 'You' : (msg.senderName || 'User')}
                                            </span>
                                            {isTeacher && (
                                                <span className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20 leading-none">
                                                    MOD
                                                </span>
                                            )}
                                            <span className="text-[10px] text-on-surface-variant opacity-60 font-label">
                                                {msg.ts && formatTime(msg.ts)}
                                            </span>
                                        </div>
                                        <p className="text-[13px] leading-tight text-on-surface break-words mt-0.5">
                                            {msg.text || msg.message}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="px-3 py-3 border-t border-outline-variant/20 bg-surface-container">
                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="mb-2 p-2 rounded-xl bg-surface-container-high border border-outline-variant/20 shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant font-bold">Reactions</span>
                            <button onClick={() => setShowEmojiPicker(false)} className="text-on-surface-variant hover:text-on-surface"><X className="w-3 h-3" /></button>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                            {emojis.map((emoji, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setNewMessage(prev => prev + emoji)}
                                    className="text-lg p-1 hover:bg-surface-variant/40 rounded-lg text-center transition"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={!connected || isMuted || chatPaused}
                        className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface transition disabled:opacity-50"
                    >
                        <Smile className="w-5 h-5" />
                    </button>

                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            !connected ? 'Connecting...' :
                                chatPaused ? 'Chat is paused' :
                                    isMuted ? 'You are muted' :
                                        'Chat...'
                        }
                        disabled={!connected || isMuted || chatPaused}
                        className="flex-1 px-4 py-2 rounded-xl text-sm outline-none transition bg-surface-variant/20 border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary disabled:opacity-50"
                        maxLength={200}
                    />

                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || !connected || isMuted || chatPaused}
                        className="p-2 rounded-xl text-on-surface-variant hover:text-secondary hover:bg-secondary/10 transition disabled:opacity-50 flex items-center justify-center"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </button>
                </div>
                <div className="text-[10px] text-on-surface-variant opacity-60 text-right mt-1 px-1 font-label">
                    {newMessage.length}/200
                </div>
            </div>
        </div>
    );
}

import { useEffect, useRef, useState } from 'react';
import {
    Send,
    MessageCircle,
    Trash2,
    Pin,
    MoreVertical,
    Clock,
    Ban,
    Eye,
    UserX,
    AlertCircle,
    BarChart3,
    Plus,
    X,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { API_BASE } from '../../services/api';
import { confirmToast } from '../../utils/confirmToast';
import Modal from '../shared/Modal';

export default function ChatPanel({ liveClassId, batchId, token, user }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [hoveredMsg, setHoveredMsg] = useState(null);
    const [slowMode, setSlowMode] = useState(0); // seconds, 0 = off
    const [chatPaused, setChatPaused] = useState(false);
    const [showTopChat, setShowTopChat] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);

    // Polls / Quizzes (realtime)
    const [interactive, setInteractive] = useState(null); // { interactiveId, kind, question, options, correctOptionIndex?, ... }
    const [interactiveResults, setInteractiveResults] = useState(null); // { optionCounts, participation, quizStats, correctOptionIndex? }

    // Teacher composer modal
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerKind, setComposerKind] = useState('poll'); // 'poll' | 'quiz'
    const [composerQuestion, setComposerQuestion] = useState('');
    const [composerOptions, setComposerOptions] = useState(['', '', '', '']);
    const [composerCorrectIndex, setComposerCorrectIndex] = useState(0);
    const [composerDurationSec, setComposerDurationSec] = useState(300);

    const bottomRef = useRef(null);
    const socketRef = useRef(null);
    const interactiveRef = useRef(null);

    const isTeacher = user?.role?.toLowerCase() === 'teacher' || user?.role === 'admin';
    const isModerator = isTeacher || user?.role?.toLowerCase() === 'moderator'; // Assuming moderator role exists or teacher acts as one

    // Initial connection
    useEffect(() => {
        if (!liveClassId || !token) return;

        const socket = io((import.meta.env.VITE_SOCKET_URL || API_BASE) + '/live-classes', {
            auth: { token },
            transports: ['websocket']
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setSocketConnected(true);
            console.log('Connected to chat server');
            socket.emit('join-room', { liveClassId, batchId, historyLimit: 50 }, (ack) => {
                if (!ack?.ok) {
                    console.error('Failed to join chat room:', ack?.error);
                    toast.error('Failed to connect to chat');
                }
            });
        });

        socket.on('disconnect', () => {
            setSocketConnected(false);
            console.log('Disconnected from chat server');
        });

        socket.on('chat-history', (payload) => {
            if (payload.liveClassId === liveClassId) {
                setMessages(payload.messages || []);
                setChatPaused(!!payload.chatPaused);
                setSlowMode(payload.slowMode || 0);
            }
        });

        // Active poll/quiz on join
        socket.on('interactive:active', (active) => {
            if (!active || String(active.liveClassId) !== String(liveClassId)) return;
            setInteractive(active);
            setInteractiveResults(null);
        });

        socket.on('interactive:new', (active) => {
            if (!active || String(active.liveClassId) !== String(liveClassId)) return;
            setInteractive(active);
            setInteractiveResults(null);
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

        socket.on('message', (msg) => {
            if (msg.liveClassId === liveClassId) {
                setMessages(prev => [...prev, msg]);
            }
        });

        socket.on('user-joined', () => {
            // Optional: show user joined? The user asked to remove "user joined" messages in previous task.
            // We will respect that request and NOT add them to the visible list.
            // But we might want to update participant count or similar if we had that feature.
        });

        socket.on('user-left', () => {
            // Same as above
        });

        socket.on('system', (evt) => {
            if (evt.liveClassId !== liveClassId) return;

            // Handle specific system events that update state
            if (evt.type === 'chat-cleared') {
                setMessages([]);
                toast('Chat cleared by moderator');
            } else if (evt.type === 'class-ended') {
                toast('Class ended');
                setChatPaused(true);
            } else if (evt.type === 'muted' && evt.targetUserId === user?.id) {
                toast.error('You have been muted');
            } else if (evt.type === 'unmuted' && evt.targetUserId === user?.id) {
                toast.success('You have been unmuted');
            } else if (evt.type === 'removed' && evt.targetUserId === user?.id) {
                toast.error('You have been removed from the class');
                // Optionally redirect or disconnect
            }

            // Add system message to chat log if it's relevant to everyone
            // E.g. "Chat cleared", "Slow mode enabled" (though slow mode has its own event usually)
            if (['chat-cleared', 'class-ended'].includes(evt.type)) {
                setMessages(prev => [...prev, { ...evt, role: 'system', text: evt.text || evt.type }]);
            }
        });

        socket.on('message-pinned', ({ messageId, isPinned }) => {
            setMessages(prev => prev.map(m => m.id === messageId || m._id === messageId ? { ...m, isPinned } : m));
        });

        socket.on('message-deleted', ({ messageId }) => {
            // Remove from view
            setMessages(prev => prev.filter(m => m.id !== messageId && m._id !== messageId));
        });

        socket.on('slow-mode-updated', ({ slowMode }) => {
            setSlowMode(slowMode);
            toast(slowMode > 0 ? `Slow mode: ${slowMode}s` : 'Slow mode disabled');
        });

        socket.on('chat-pause-updated', ({ paused }) => {
            setChatPaused(paused);
            toast(paused ? 'Chat paused' : 'Chat resumed');
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [liveClassId, batchId, token, user?.id]);

    useEffect(() => {
        interactiveRef.current = interactive;
    }, [interactive]);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, showTopChat]);

    const send = (e) => {
        e?.preventDefault();
        const trimmed = (text || '').trim();
        if (!trimmed) return;
        if (chatPaused && !isModerator) return;

        // Optimistic UI update? No, let's wait for ack or echo to ensure consistency, 
        // but standard pattern is echo from server. 
        // We will clear input immediately though.
        // Check slow mode locally first if student
        if (!isModerator && slowMode > 0) {
            // Find last message by me
            const myMsgs = messages.filter(m => m.senderId === user.id && m.type !== 'system');
            const last = myMsgs[myMsgs.length - 1];
            if (last) {
                const diff = (Date.now() - new Date(last.ts).getTime()) / 1000;
                if (diff < slowMode) {
                    toast.error(`Slow mode: wait ${Math.ceil(slowMode - diff)}s`);
                    return;
                }
            }
        }

        if (socketRef.current) {
            socketRef.current.emit('send-message', { liveClassId, text: trimmed, batchId }, (ack) => {
                if (!ack?.ok) {
                    toast.error(ack?.error || 'Failed to send');
                }
            });
        }
        setText('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(e);
        }
    };

    // Moderation Actions
    const deleteMessage = (msgId) => {
        if (!socketRef.current) return;
        socketRef.current.emit('delete-message', { liveClassId, messageId: msgId });
    };

    const pinMessage = (msgId, currentPinnedState) => {
        if (!socketRef.current) return;
        socketRef.current.emit('pin-message', { liveClassId, messageId: msgId, isPinned: !currentPinnedState });
    };

    const timeoutUser = (userId) => {
        if (!socketRef.current) return;
        socketRef.current.emit('mute-user', { liveClassId, targetUserId: userId }, (ack) => {
            if (ack?.ok) toast.success('User muted');
            else toast.error('Failed to mute');
        });
    };

    const hideUser = async (userId) => {
        // "Hide user" usually means ban or remove. Let's map to remove-user for now.
        const confirmed = await confirmToast('Hide/Remove this user from class?', { confirmLabel: 'Remove' });
        if (!confirmed) return;
        if (!socketRef.current) return;
        socketRef.current.emit('remove-user', { liveClassId, targetUserId: userId }, (ack) => {
            if (ack?.ok) toast.success('User removed');
            else toast.error('Failed to remove');
        });
    };

    const toggleSlowMode = () => {
        if (!socketRef.current) return;
        const newMode = slowMode === 0 ? 5 : 0; // Toggle 5s or Off
        socketRef.current.emit('toggle-slow-mode', { liveClassId, duration: newMode });
    };

    const toggleChatPause = () => {
        if (!socketRef.current) return;
        socketRef.current.emit('toggle-chat-pause', { liveClassId, paused: !chatPaused });
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const resetComposer = () => {
        setComposerKind('poll');
        setComposerQuestion('');
        setComposerOptions(['', '', '', '']);
        setComposerCorrectIndex(0);
        setComposerDurationSec(300);
    };

    const openComposer = () => {
        resetComposer();
        setComposerOpen(true);
    };

    const pushInteractive = () => {
        const question = composerQuestion.trim();
        const options = composerOptions.map(o => (o || '').trim()).filter(Boolean);
        if (!socketRef.current) return;
        if (!question) return toast.error('Enter a question');
        if (options.length < 2) return toast.error('Add at least 2 options');
        if (options.length > 6) return toast.error('Max 6 options');
        if (composerKind === 'quiz' && (composerCorrectIndex < 0 || composerCorrectIndex >= options.length)) {
            return toast.error('Select a valid correct option');
        }

        socketRef.current.emit(
            'interactive:push',
            {
                liveClassId,
                kind: composerKind,
                question,
                options,
                correctOptionIndex: composerKind === 'quiz' ? composerCorrectIndex : undefined,
                durationSec: composerDurationSec,
            },
            (ack) => {
                if (!ack?.ok) return toast.error(ack?.error || 'Failed to start');
                setComposerOpen(false);
                toast.success(composerKind === 'quiz' ? 'Quiz started' : 'Poll started');
            }
        );
    };

    const closeInteractive = async () => {
        if (!interactive?.interactiveId || !socketRef.current) return;
        const confirmed = await confirmToast('Close the active poll/quiz?', { confirmLabel: 'Close', variant: 'danger' });
        if (!confirmed) return;
        socketRef.current.emit('interactive:close', { liveClassId, interactiveId: interactive.interactiveId }, (ack) => {
            if (!ack?.ok) toast.error(ack?.error || 'Failed to close');
        });
    };

    const optionCount = (idx) => {
        const entry = interactiveResults?.optionCounts?.find(o => o.optionIndex === idx);
        return entry?.count || 0;
    };

    const totalAnswers = interactiveResults?.participation?.answered ?? (
        interactiveResults?.optionCounts?.reduce((sum, o) => sum + (o.count || 0), 0) || 0
    );

    const displayedMessages = showTopChat
        ? messages.filter(m => m.isPinned || m.role === 'Teacher' || m.role === 'teacher') // 'Teacher' from backend is capitalized usually? Checked model, it just stores string. Assuming 'Teacher' or 'teacher'
        : messages;

    return (
        <div className="rounded-xl flex flex-col h-full bg-surface-container border border-outline-variant/20">
            {/* Header */}
            <div className="px-4 py-3 border-b border-outline-variant/20">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-on-surface flex items-center gap-2">
                        Live chat
                        {!socketConnected && <span className="text-[10px] text-error">(Connecting...)</span>}
                    </h3>
                    <div className="flex items-center gap-2">
                        {isModerator && (
                            <button
                                onClick={openComposer}
                                className="text-xs px-2 py-1 rounded font-medium transition bg-primary text-on-primary hover:shadow-primary/20 flex items-center gap-1"
                                title="Create a realtime poll or quiz"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Poll/Quiz
                            </button>
                        )}
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

                {/* Moderation Controls */}
                {isModerator && (
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={toggleSlowMode}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition flex items-center justify-center gap-1 ${slowMode > 0
                                ? 'bg-tertiary text-on-tertiary'
                                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                                }`}
                            title="Slow mode - limits how often users can send messages"
                        >
                            <Clock className="w-3 h-3" />
                            {slowMode > 0 ? `${slowMode}s` : 'Slow'}
                        </button>
                        <button
                            onClick={toggleChatPause}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition flex items-center justify-center gap-1 ${chatPaused
                                ? 'bg-error text-on-error'
                                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                                }`}
                            title={chatPaused ? 'Resume chat' : 'Pause chat'}
                        >
                            <Ban className="w-3 h-3" />
                            {chatPaused ? 'Resume' : 'Pause'}
                        </button>
                    </div>
                )}

                {/* Status Messages */}
                {slowMode > 0 && (
                    <div className="text-xs px-2 py-1.5 rounded mb-2 bg-tertiary/10 text-tertiary flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Slow mode: {slowMode} sec limit
                    </div>
                )}
                {chatPaused && (
                    <div className="text-xs px-2 py-1.5 rounded mb-2 bg-error/10 text-error flex items-center gap-2 border border-error/20">
                        <Ban className="w-3 h-3" />
                        Chat is paused
                    </div>
                )}

                {/* Active Poll / Quiz Summary */}
                {interactive && (
                    <div className="mt-2 p-3 rounded-xl bg-surface-container-high border border-outline-variant/20">
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
                                            : 'Live results'}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-on-surface mt-1 line-clamp-2">{interactive.question}</p>
                            </div>
                            {isModerator && (
                                <button
                                    onClick={closeInteractive}
                                    className="text-xs px-2 py-1 rounded bg-error/10 text-error border border-error/20 hover:bg-error/20 transition flex items-center gap-1"
                                    title="Close poll/quiz"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Close
                                </button>
                            )}
                        </div>

                        <div className="mt-3 space-y-2">
                            {interactive.options?.map((opt, idx) => {
                                const count = optionCount(idx);
                                const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
                                const isCorrect = interactive.kind === 'quiz' && idx === interactive.correctOptionIndex;
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center justify-between gap-3 text-xs">
                                            <div className="min-w-0 flex items-center gap-2">
                                                <span className="truncate text-on-surface">{opt}</span>
                                                {interactive.kind === 'quiz' && (
                                                    isCorrect ? (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Correct
                                                        </span>
                                                    ) : null
                                                )}
                                            </div>
                                            <span className="text-on-surface-variant/70 whitespace-nowrap">{count} ({pct}%)</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-surface-variant/30 overflow-hidden">
                                            <div
                                                className={`h-full ${interactive.kind === 'quiz' && isCorrect ? 'bg-green-500' : 'bg-secondary'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

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
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
                <div className="space-y-1">
                    {displayedMessages.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-on-surface-variant opacity-40 border-outline-variant" />
                            <p className="text-sm text-on-surface-variant opacity-60">
                                No messages yet
                            </p>
                        </div>
                    ) : (
                        displayedMessages.map((m) => {
                            // Normalize ID
                            const msgId = m.id || m._id;

                            if (m.type === 'system') {
                                return (
                                    <div key={msgId} className="flex items-center gap-3 py-2 text-on-surface-variant opacity-60">
                                        <div className="flex-1 h-px bg-outline-variant/20"></div>
                                        <span className="text-xs italic flex items-center gap-1.5 font-label">
                                            <AlertCircle className="w-3 h-3" />
                                            {m.text}
                                        </span>
                                        <div className="flex-1 h-px bg-outline-variant/20"></div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={msgId}
                                    onMouseEnter={() => setHoveredMsg(msgId)}
                                    onMouseLeave={() => setHoveredMsg(null)}
                                    className={`group p-2 rounded-xl transition ${m.isPinned
                                        ? 'bg-secondary/10 border border-secondary/20'
                                        : 'hover:bg-surface-variant/40'
                                        }`}
                                >
                                    {/* Pinned Indicator */}
                                    {m.isPinned && (
                                        <div className="flex items-center gap-1 mb-1">
                                            <Pin className="w-3 h-3 text-secondary" />
                                            <span className="text-xs text-secondary font-bold font-label uppercase tracking-wider">
                                                Pinned
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-2">
                                        {/* Avatar */}
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-inner ${m.role === 'Teacher' || m.role === 'teacher'
                                            ? 'bg-primary text-on-primary'
                                            : 'bg-secondary text-on-secondary'
                                            }`}>
                                            {m.senderName ? m.senderName.charAt(0) : 'U'}
                                        </div>

                                        {/* Message Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`text-xs font-bold font-body ${m.role === 'Teacher' || m.role === 'teacher'
                                                    ? 'text-primary'
                                                    : 'text-secondary'
                                                    }`}>
                                                    {m.senderName || 'User'}
                                                </span>
                                                {(m.role === 'Teacher' || m.role === 'teacher') && (
                                                    <span className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20">
                                                        MOD
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-on-surface-variant opacity-60 font-label">
                                                    {formatTime(m.ts)}
                                                </span>
                                            </div>
                                            <p className="text-xs mt-0.5 break-words text-on-surface">
                                                {m.text}
                                            </p>
                                        </div>

                                        {/* Moderation Menu */}
                                        {isModerator && m.senderId !== user?.id && (
                                            <div className={`flex-shrink-0 transition-opacity ${hoveredMsg === msgId ? 'opacity-100' : 'opacity-0'
                                                }`}>
                                                <div className="flex gap-0.5 rounded-lg p-0.5 bg-surface-container-high border border-outline-variant/20">
                                                    <button
                                                        onClick={() => pinMessage(msgId, m.isPinned)}
                                                        className="p-1 rounded-md transition hover:bg-surface-variant/40"
                                                        title={m.isPinned ? 'Unpin message' : 'Pin message'}
                                                    >
                                                        <Pin className={`w-3 h-3 ${m.isPinned ? 'text-secondary' : 'text-on-surface-variant'
                                                            }`} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteMessage(msgId)}
                                                        className="p-1 rounded-md transition hover:bg-error/10 hover:text-error"
                                                        title="Delete message"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-on-surface-variant hover:text-error" />
                                                    </button>
                                                    <button
                                                        onClick={() => timeoutUser(m.senderId)}
                                                        className="p-1 rounded-md transition hover:bg-tertiary/10 hover:text-tertiary"
                                                        title="Timeout user (Mute)"
                                                    >
                                                        <Clock className="w-3 h-3 text-on-surface-variant hover:text-tertiary" />
                                                    </button>
                                                    <button
                                                        onClick={() => hideUser(m.senderId)}
                                                        className="p-1 rounded-md transition hover:bg-error/10 hover:text-error"
                                                        title="Hide user from chat (Remove)"
                                                    >
                                                        <Eye className="w-3 h-3 text-on-surface-variant hover:text-error" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="px-3 py-3 border-t border-outline-variant/20 bg-surface-container">
                 <div className="flex gap-2">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={chatPaused && !isModerator ? 'Chat is paused' : isModerator ? 'Chat as moderator...' : 'Say something...'}
                        disabled={(!isModerator && chatPaused) || !socketConnected}
                        className="flex-1 px-4 py-2 rounded-xl text-sm outline-none transition bg-surface-variant/20 border border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary disabled:opacity-50"
                    />
                    <button
                        onClick={send}
                        disabled={!text.trim() || (!isModerator && chatPaused)}
                        className="px-4 py-2 rounded-xl text-sm font-bold transition bg-gradient-secondary text-on-secondary shadow-lg hover:shadow-secondary/20 disabled:opacity-50 flex items-center justify-center"
                    >
                        <MessageCircle className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <Modal
                isOpen={composerOpen}
                onClose={() => setComposerOpen(false)}
                title="Create realtime Poll / Quiz"
                size="lg"
            >
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setComposerKind('poll')}
                            className={`p-3 rounded-xl border text-left transition ${composerKind === 'poll'
                                ? 'border-secondary bg-secondary/10'
                                : 'border-outline-variant/20 hover:bg-surface-container-high'
                                }`}
                        >
                            <p className="text-sm font-bold">Poll</p>
                            <p className="text-xs text-on-surface-variant/70">Students vote, live percentages</p>
                        </button>
                        <button
                            onClick={() => setComposerKind('quiz')}
                            className={`p-3 rounded-xl border text-left transition ${composerKind === 'quiz'
                                ? 'border-tertiary bg-tertiary/10'
                                : 'border-outline-variant/20 hover:bg-surface-container-high'
                                }`}
                        >
                            <p className="text-sm font-bold">Quiz</p>
                            <p className="text-xs text-on-surface-variant/70">Right vs wrong + correct option</p>
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2">
                            Question
                        </label>
                        <input
                            value={composerQuestion}
                            onChange={(e) => setComposerQuestion(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline-variant/20 outline-none focus:ring-1 focus:ring-secondary"
                            placeholder="Type your question..."
                            maxLength={200}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">
                                Options (2–6)
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setComposerOptions(prev => (prev.length < 6 ? [...prev, ''] : prev))}
                                    className="text-xs px-2 py-1 rounded bg-surface-container-high border border-outline-variant/20 hover:bg-surface-container-highest transition"
                                >
                                    + Add
                                </button>
                                <button
                                    onClick={() => setComposerOptions(prev => (prev.length > 2 ? prev.slice(0, -1) : prev))}
                                    className="text-xs px-2 py-1 rounded bg-surface-container-high border border-outline-variant/20 hover:bg-surface-container-highest transition"
                                >
                                    − Remove
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {composerOptions.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    {composerKind === 'quiz' ? (
                                        <input
                                            type="radio"
                                            name="correct"
                                            checked={composerCorrectIndex === idx}
                                            onChange={() => setComposerCorrectIndex(idx)}
                                            className="accent-green-500"
                                            title="Mark as correct answer"
                                        />
                                    ) : (
                                        <div className="w-4" />
                                    )}
                                    <input
                                        value={opt}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setComposerOptions(prev => prev.map((p, i) => (i === idx ? v : p)));
                                        }}
                                        className="flex-1 px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant/20 outline-none focus:ring-1 focus:ring-secondary"
                                        placeholder={`Option ${idx + 1}`}
                                        maxLength={80}
                                    />
                                </div>
                            ))}
                        </div>
                        {composerKind === 'quiz' && (
                            <p className="text-xs text-on-surface-variant/70">
                                Select the radio button to mark the correct option.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2">
                                Duration (seconds)
                            </label>
                            <input
                                type="number"
                                min={10}
                                max={3600}
                                value={composerDurationSec}
                                onChange={(e) => setComposerDurationSec(parseInt(e.target.value || '300', 10))}
                                className="w-full px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant/20 outline-none focus:ring-1 focus:ring-secondary"
                            />
                        </div>
                        <div className="flex items-end justify-end gap-2">
                            <button
                                onClick={() => setComposerOpen(false)}
                                className="px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant/20 hover:bg-surface-container-highest transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={pushInteractive}
                                className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:shadow-primary/20 transition font-bold"
                            >
                                Start
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

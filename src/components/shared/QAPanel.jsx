import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    MessageSquare,
    Send,
    ThumbsUp,
    CheckCircle2,
    Clock,
    Trash2,
    ChevronUp,
    HelpCircle,
    User,
    Check,
    MessageCircle,
    X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function QAPanel({ liveClassId }) {
    const { user } = useAuth();
    const isTeacher = user?.role === 'Teacher' || user?.role === 'teacher' || ['InstitutionAdmin', 'AcademicAdmin', 'SuperAdmin'].includes(user?.role);
    
    // State
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // questionId for input focus
    const [replyText, setReplyText] = useState('');
    const [connected, setConnected] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'unanswered', 'answered'
    
    const socketRef = useRef(null);
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (!liveClassId || !token) return;

        const socket = io(`${API_BASE}/live-classes`, {
            auth: { token },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join-room', { liveClassId }, (ack) => {
                if (!ack?.ok) console.error('Failed to join QA room:', ack?.error);
            });
        });

        socket.on('qa-history', (payload) => {
            if (payload && payload.questions) {
                setQuestions(payload.questions);
            }
        });

        socket.on('qa:new-question', (question) => {
            setQuestions(prev => [question, ...prev]);
        });

        socket.on('qa:question-updated', (updated) => {
            setQuestions(prev => prev.map(q => (q._id === updated._id) ? updated : q));
        });

        socket.on('qa:question-deleted', ({ questionId }) => {
            setQuestions(prev => prev.filter(q => q._id !== questionId));
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [liveClassId, token]);

    const handlePostQuestion = (e) => {
        e?.preventDefault();
        const trimmed = newQuestion.trim();
        if (!trimmed || !socketRef.current) return;

        socketRef.current.emit('qa:question', { liveClassId, text: trimmed }, (ack) => {
            if (ack?.ok) {
                setNewQuestion('');
                toast.success('Question posted');
            } else {
                toast.error(ack?.error || 'Failed to post question');
            }
        });
    };

    const handleUpvote = (questionId) => {
        if (!socketRef.current) return;
        socketRef.current.emit('qa:upvote', { liveClassId, questionId });
    };

    const handleMarkAsAnswered = (questionId, isAnswered, answerText = '') => {
        if (!socketRef.current) return;
        socketRef.current.emit('qa:answered', { liveClassId, questionId, isAnswered, answerText });
    };

    const handlePostReply = (questionId) => {
        if (!replyText.trim()) return;
        handleMarkAsAnswered(questionId, true, replyText.trim());
        setReplyText('');
        setReplyingTo(null);
    };

    const handleDelete = (questionId) => {
        if (!socketRef.current || !window.confirm('Delete this question?')) return;
        socketRef.current.emit('qa:delete', { liveClassId, questionId });
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const filteredQuestions = questions.filter(q => {
        if (filter === 'answered') return q.isAnswered;
        if (filter === 'unanswered') return !q.isAnswered;
        return true;
    }).sort((a, b) => {
        // Unanswered first if not in "answered" filter? Or just by upvotes
        const upvotesA = a.upvotes?.length || 0;
        const upvotesB = b.upvotes?.length || 0;
        if (upvotesA !== upvotesB) return upvotesB - upvotesA;
        return new Date(b.ts) - new Date(a.ts);
    });

    return (
        <div className="flex flex-col h-full bg-[#212121] border border-[#303030] rounded overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#303030] bg-[#212121]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        Questions & Answers
                        <span className="px-1.5 py-0.5 rounded bg-[#3ea6ff]/10 text-[#3ea6ff] text-[10px]">
                            {questions.length}
                        </span>
                    </h3>
                    <div className="flex bg-[#0f0f0f] rounded p-0.5 border border-[#303030]">
                        {['all', 'unanswered', 'answered'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2 py-1 text-[10px] rounded transition capitalize ${
                                    filter === f ? 'bg-[#3ea6ff] text-black font-medium' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#1f1f1f]">
                {filteredQuestions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-50">
                        <HelpCircle className="w-10 h-10 mb-2" />
                        <p className="text-xs text-gray-400">No questions yet.</p>
                        <p className="text-[10px] text-gray-500 mt-1">Be the first to ask something!</p>
                    </div>
                ) : (
                    filteredQuestions.map((q) => (
                        <div key={q._id} className={`p-3 rounded border transition flex flex-col gap-2 ${
                            q.isAnswered ? 'bg-[#1b2a1b] border-green-900/30' : 'bg-[#282828] border-[#383838]'
                        }`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        q.role === 'Teacher' ? 'bg-red-600' : 'bg-[#3ea6ff] text-black'
                                    }`}>
                                        {q.senderName?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-300">{q.senderName}</span>
                                            {q.isAnswered && (
                                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-green-400 px-1 py-0.5 rounded bg-green-400/10">
                                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                                    ANSWERED
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[9px] text-gray-500 uppercase tracking-tighter">{formatTime(q.ts)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {(isTeacher || q.senderId === user?._id) && (
                                        <button 
                                            onClick={() => handleDelete(q._id)}
                                            className="p-1.5 rounded hover:bg-black/20 text-gray-500 hover:text-red-500"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="text-[13px] text-gray-200 break-words leading-relaxed">
                                {q.text}
                            </p>

                            {/* Answer Section */}
                            {q.isAnswered && q.answerText && (
                                <div className="bg-[#0f0f0f]/50 p-2.5 rounded border border-[#303030] mt-1 space-y-1">
                                    <p className="text-[10px] font-bold text-[#3ea6ff] flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> TEACHER'S ANSWER
                                    </p>
                                    <p className="text-xs text-gray-300 leading-tight italic">
                                        "{q.answerText}"
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#383838]">
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleUpvote(q._id)}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition ${
                                            q.upvotes?.includes(String(user?._id)) 
                                                ? 'bg-[#3ea6ff] text-black font-bold' 
                                                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#323232] border border-[#303030]'
                                        }`}
                                    >
                                        <ChevronUp className={`w-3.5 h-3.5 ${q.upvotes?.includes(String(user?._id)) ? 'stroke-[3px]' : ''}`} />
                                        {q.upvotes?.length || 0}
                                    </button>

                                    {isTeacher && !q.isAnswered && replyingTo !== q._id && (
                                        <button
                                            onClick={() => setReplyingTo(q._id)}
                                            className="flex items-center gap-1 text-[10px] font-medium text-[#3ea6ff] hover:underline"
                                        >
                                            <MessageCircle className="w-3 h-3" /> Reply
                                        </button>
                                    )}
                                </div>

                                {isTeacher && (
                                    <button
                                        onClick={() => handleMarkAsAnswered(q._id, !q.isAnswered)}
                                        className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1.5 border ${
                                            q.isAnswered 
                                                ? 'bg-transparent border-green-500 text-green-500 hover:bg-green-500 hover:text-black' 
                                                : 'bg-[#3ea6ff] border-transparent text-black hover:bg-white'
                                        }`}
                                    >
                                        {q.isAnswered ? 'UNMARK' : 'MARK'} ANSWERED
                                    </button>
                                )}
                            </div>

                            {/* Reply Input for Teacher */}
                            {replyingTo === q._id && (
                                <div className="mt-2 space-y-2 anim-fade-in">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your answer..."
                                        className="w-full p-2 bg-[#0a0a0a] border border-[#3ea6ff]/30 rounded text-xs text-white focus:outline-none focus:border-[#3ea6ff]"
                                        rows={2}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                            className="px-2 py-1 text-[10px] text-gray-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => handlePostReply(q._id)}
                                            className="px-3 py-1 bg-[#3ea6ff] text-black rounded text-[10px] font-bold hover:bg-white"
                                        >
                                            Post Answer
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Input Area (Only for students / when not teacher acting as one) */}
            {(!isTeacher || filter === 'all') && (
                <div className="p-3 bg-[#212121] border-t border-[#303030]">
                    <form onSubmit={handlePostQuestion} className="relative">
                        <textarea
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="Ask a question..."
                            className="w-full pl-3 pr-10 py-2.5 bg-[#0f0f0f] border border-[#303030] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#3ea6ff] resize-none min-h-[44px] max-h-[120px]"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handlePostQuestion();
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!newQuestion.trim() || !connected}
                            className="absolute right-2 bottom-2 p-1.5 rounded-md bg-[#3ea6ff] text-black hover:bg-white transition disabled:opacity-50 disabled:bg-gray-600"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <p className="text-[9px] text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Questions are visible to everyone
                    </p>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { confirmToast } from '../../utils/confirmToast';
import { API_BASE } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    Send,
    ThumbsUp,
    CheckCircle2,
    Trash2,
    ChevronUp,
    HelpCircle,
    MessageCircle,
    Sparkles,
    Bot,
    Loader2,
    X,
    CornerDownRight,
    Clock,
    Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '../../components/shared/EmptyState';

/* ─── tiny helpers ─────────────────────────────────────────────── */
const fmtTime = (ts) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const Avatar = ({ name, role, size = 32 }) => {
    const initials = (name || 'U')[0].toUpperCase();
    const isTeacher = role === 'Teacher' || role === 'teacher';
    return (
        <div
            style={{ width: size, height: size, minWidth: size }}
            className={`rounded-full flex items-center justify-center text-xs font-semibold select-none ${
                isTeacher
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary/20 text-secondary'
            }`}
        >
            {initials}
        </div>
    );
};

/* ─── Filter pill ──────────────────────────────────────────────── */
const FilterPill = ({ label, active, count, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            active
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'bg-surface-container-high text-on-surface-variant/70 hover:bg-surface-container-highest'
        }`}
    >
        {label}
        {count !== undefined && (
            <span className={`ml-1.5 ${active ? 'opacity-70' : 'opacity-40'}`}>
                {count}
            </span>
        )}
    </button>
);

/* ─── Single question card ─────────────────────────────────────── */
const QuestionCard = ({
    q,
    user,
    isTeacher,
    replyingTo,
    replyText,
    onUpvote,
    onDelete,
    onStartReply,
    onCancelReply,
    onReplyTextChange,
    onSubmitReply,
    onToggleAnswered,
}) => {
    const isOwn = q.senderId === user?._id;
    const upvoteCount = q.upvotes?.length || 0;
    const hasUpvoted = q.upvotes?.includes(String(user?._id));
    const isReplying = replyingTo === q._id;
    const isAI = q.answeredBy === 'AI Tutor';

    return (
        <div
            className={`rounded-2xl border transition-all duration-300 hover:shadow-xl hover:shadow-black/5 ${
                q.isAnswered
                    ? 'bg-secondary/5 border-secondary/20'
                    : 'bg-surface-container border-outline-variant/10'
            }`}
        >
            {/* Question header */}
            <div className="p-4 pb-3">
                <div className="flex items-start gap-3">
                    <Avatar name={q.senderName} role={q.role} size={34} />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-on-surface leading-none">
                                {q.senderName}
                            </span>
                            {(q.role === 'Teacher' || q.role === 'teacher') && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                                    Teacher
                                </span>
                            )}
                            {q.isAnswered && (
                                <span
                                    className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                        isAI
                                            ? 'bg-tertiary-container text-on-tertiary-container'
                                            : 'bg-secondary/10 text-secondary'
                                    }`}
                                >
                                    {isAI ? (
                                        <Bot className="w-3 h-3" />
                                    ) : (
                                        <CheckCircle2 className="w-3 h-3" />
                                    )}
                                    {isAI ? 'AI answered' : 'Answered'}
                                </span>
                            )}
                            <span className="text-[11px] text-on-surface-variant/40 flex items-center gap-1 ml-auto">
                                <Clock className="w-3 h-3" />
                                {fmtTime(q.ts)}
                            </span>
                        </div>

                        <p className="mt-2 text-[14px] text-on-surface/80 leading-relaxed break-words">
                            {q.text}
                        </p>
                    </div>

                    {/* Delete */}
                    {(isTeacher || isOwn) && (
                        <button
                            onClick={() => onDelete(q._id)}
                            className="p-1.5 rounded-lg text-on-surface-variant/20 hover:text-error hover:bg-error/10 transition-all shrink-0"
                            title="Delete question"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Answer block */}
            {q.isAnswered && q.answerText && (
                <div
                    className={`mx-4 mb-3 p-3 rounded-xl border-l-2 ${
                        isAI
                            ? 'bg-tertiary-container/30 border-tertiary'
                            : 'bg-secondary/10 border-secondary'
                    }`}
                >
                    <p
                        className={`text-[11px] font-semibold flex items-center gap-1.5 mb-1.5 ${
                            isAI ? 'text-tertiary' : 'text-secondary'
                        }`}
                    >
                        {isAI ? (
                            <Bot className="w-3.5 h-3.5" />
                        ) : (
                            <CornerDownRight className="w-3.5 h-3.5" />
                        )}
                        {isAI ? 'AI Tutor' : q.answeredBy || 'Teacher'}
                    </p>
                    <p className="text-[13px] text-on-surface/70 leading-relaxed">
                        {q.answerText}
                    </p>
                </div>
            )}

            {/* Reply input (teacher only) */}
            {isReplying && (
                <div className="mx-4 mb-3 space-y-2">
                    <textarea
                        value={replyText}
                        onChange={(e) => onReplyTextChange(e.target.value)}
                        placeholder="Type your reply…"
                        className="w-full px-3 py-2 text-sm bg-surface-container-highest border border-outline-variant/10 rounded-xl resize-none focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-on-surface"
                        rows={2}
                        autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={onCancelReply}
                            className="px-3 py-1.5 text-xs text-on-surface-variant/60 hover:text-on-surface rounded-lg hover:bg-surface-container-highest transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSubmitReply(q._id)}
                            disabled={!replyText.trim()}
                            className="px-4 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-lg hover:shadow-lg hover:shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Send Reply
                        </button>
                    </div>
                </div>
            )}

            {/* Actions row */}
            <div className="px-4 pb-3 flex items-center gap-2 border-t border-outline-variant/5 pt-3">
                {/* Upvote */}
                <button
                    onClick={() => onUpvote(q._id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        hasUpvoted
                            ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                            : 'bg-surface-container-high text-on-surface-variant/60 hover:bg-surface-container-highest'
                    }`}
                >
                    <ChevronUp className="w-3.5 h-3.5" />
                    {upvoteCount}
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Teacher controls */}
                {isTeacher && !q.isAnswered && !isReplying && (
                    <button
                        onClick={() => onStartReply(q._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-all"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Reply
                    </button>
                )}

                {isTeacher && (
                    <button
                        onClick={() => onToggleAnswered(q._id, !q.isAnswered)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            q.isAnswered
                                ? 'border-secondary/20 text-secondary bg-secondary/10 hover:bg-secondary/20'
                                : 'border-outline-variant/20 text-on-surface-variant/60 hover:border-secondary/20 hover:text-secondary hover:bg-secondary/10'
                        }`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {q.isAnswered ? 'Answered' : 'Mark as answered'}
                    </button>
                )}
            </div>
        </div>
    );
};

/* ─── Main Panel ───────────────────────────────────────────────── */
export default function QAPanel({ liveClassId }) {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const isTeacher =
        user?.role === 'Teacher' ||
        user?.role === 'teacher' ||
        ['InstitutionAdmin', 'AcademicAdmin', 'SuperAdmin'].includes(user?.role);

    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [connected, setConnected] = useState(false);
    const [filter, setFilter] = useState('all');
    const [askingAI, setAskingAI] = useState(false);
    const [isAILoading, setIsAILoading] = useState(false);

    const socketRef = useRef(null);
    const token = localStorage.getItem('accessToken');
    const textareaRef = useRef(null);

    /* ── socket setup ── */
    useEffect(() => {
        if (!liveClassId || !token) return;
        const socket = io((import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000') + '/live-classes', { auth: { token } });
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join-room', { liveClassId }, (ack) => {
                if (!ack?.ok) console.error('Failed to join QA room:', ack?.error);
            });
        });
        socket.on('disconnect', () => setConnected(false));
        socket.on('qa-history', (p) => p?.questions && setQuestions(p.questions));
        socket.on('qa:new-question', (q) => setQuestions((prev) => [q, ...prev]));
        socket.on('qa:question-updated', (u) =>
            setQuestions((prev) => prev.map((q) => (q._id === u._id ? u : q)))
        );
        socket.on('qa:question-deleted', ({ questionId }) =>
            setQuestions((prev) => prev.filter((q) => q._id !== questionId))
        );
        return () => socket.disconnect();
    }, [liveClassId, token]);

    /* ── derived counts ── */
    const answeredCount = questions.filter((q) => q.isAnswered).length;
    const unansweredCount = questions.filter((q) => !q.isAnswered).length;

    /* ── filtered + sorted ── */
    const filtered = questions
        .filter((q) => {
            if (filter === 'answered') return q.isAnswered;
            if (filter === 'unanswered') return !q.isAnswered;
            return true;
        })
        .sort((a, b) => {
            const ua = a.upvotes?.length || 0;
            const ub = b.upvotes?.length || 0;
            if (ua !== ub) return ub - ua;
            return new Date(b.ts) - new Date(a.ts);
        });

    /* ── handlers ── */
    const handlePost = (e) => {
        e?.preventDefault();
        const text = newQuestion.trim();
        if (!text || !socketRef.current) return;

        if (askingAI) {
            setIsAILoading(true);
            socketRef.current.emit('qa:ask-ai', { liveClassId, text }, (ack) => {
                setIsAILoading(false);
                if (ack?.ok) {
                    setNewQuestion('');
                    setAskingAI(false);
                    toast.success('AI Tutor is responding…');
                } else {
                    toast.error(ack?.error || 'AI Tutor is busy');
                }
            });
            return;
        }

        socketRef.current.emit('qa:question', { liveClassId, text }, (ack) => {
            if (ack?.ok) {
                setNewQuestion('');
                toast.success('Question posted!');
            } else {
                toast.error(ack?.error || 'Failed to post question');
            }
        });
    };

    const handleUpvote = (questionId) =>
        socketRef.current?.emit('qa:upvote', { liveClassId, questionId });

    const handleMarkAnswered = (questionId, isAnswered, answerText = '') =>
        socketRef.current?.emit('qa:answered', {
            liveClassId,
            questionId,
            isAnswered,
            answerText,
        });

    const handleSubmitReply = (questionId) => {
        if (!replyText.trim()) return;
        handleMarkAnswered(questionId, true, replyText.trim());
        setReplyText('');
        setReplyingTo(null);
    };

    const handleDelete = async (questionId) => {
        if (!socketRef.current) return;
        const ok = await confirmToast('Delete this question?', {
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            variant: 'danger',
        });
        if (ok) socketRef.current.emit('qa:delete', { liveClassId, questionId });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handlePost();
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface-container rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">

            {/* ── Header ── */}
            <div className="px-5 pt-4 pb-3 border-b border-outline-variant/10 bg-surface-container">
               

                {/* Filter tabs */}
                <div className="flex items-center gap-1.5">
                    <FilterPill
                        label="All"
                        count={questions.length}
                        active={filter === 'all'}
                        onClick={() => setFilter('all')}
                    />
                    <FilterPill
                        label="Unanswered"
                        count={unansweredCount}
                        active={filter === 'unanswered'}
                        onClick={() => setFilter('unanswered')}
                    />
                    <FilterPill
                        label="Answered"
                        count={answeredCount}
                        active={filter === 'answered'}
                        onClick={() => setFilter('answered')}
                    />
                </div>
            </div>

            {/* ── Questions list ── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-surface/30">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                        <HelpCircle className="w-10 h-10 text-on-surface-variant/10 mb-3" />
                        <p className="text-sm font-medium text-on-surface-variant/40">No questions yet</p>
                        <p className="text-xs text-on-surface-variant/20 mt-1">Be the first to ask something!</p>
                    </div>
                ) : (
                    filtered.map((q) => (
                        <QuestionCard
                            key={q._id}
                            q={q}
                            user={user}
                            isTeacher={isTeacher}
                            replyingTo={replyingTo}
                            replyText={replyText}
                            onUpvote={handleUpvote}
                            onDelete={handleDelete}
                            onStartReply={(id) => { setReplyingTo(id); setReplyText(''); }}
                            onCancelReply={() => { setReplyingTo(null); setReplyText(''); }}
                            onReplyTextChange={setReplyText}
                            onSubmitReply={handleSubmitReply}
                            onToggleAnswered={handleMarkAnswered}
                        />
                    ))
                )}
            </div>

            {/* ── Input area ── */}
            {(!isTeacher || filter === 'all') && (
                <div className="px-4 pt-3 pb-4 border-t border-outline-variant/10 bg-surface-container space-y-2.5">

                    {/* AI toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setAskingAI(!askingAI)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                askingAI
                                    ? 'bg-tertiary text-on-tertiary shadow-lg shadow-tertiary/20 border-tertiary'
                                    : 'bg-surface-container-high border-outline-variant/10 text-on-surface-variant hover:border-tertiary/50 hover:text-tertiary'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Ask AI Tutor
                        </button>
                        {askingAI && (
                            <span className="text-xs text-tertiary flex items-center gap-1 animate-pulse">
                                <Bot className="w-3.5 h-3.5" />
                                AI will respond to your question
                            </span>
                        )}
                    </div>

                    {/* Textarea + send */}
                    <form onSubmit={handlePost} className="relative">
                        <textarea
                            ref={textareaRef}
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isAILoading}
                            placeholder={
                                askingAI
                                    ? 'Ask the AI Tutor anything about the class…'
                                    : 'Ask the teacher a question… (Enter to send)'
                            }
                            rows={2}
                            className={`w-full pl-4 pr-12 py-3 text-sm border rounded-xl resize-none focus:outline-none transition-all text-on-surface ${
                                askingAI
                                    ? 'border-tertiary/20 bg-tertiary/5 placeholder:text-tertiary/30 focus:border-tertiary/50 focus:ring-4 focus:ring-tertiary/10'
                                    : 'border-outline-variant/10 bg-surface-container-high placeholder:text-on-surface-variant/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/10'
                            } disabled:opacity-60`}
                        />
                        <button
                            type="submit"
                            disabled={!newQuestion.trim() || !connected || isAILoading}
                            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${
                                askingAI
                                    ? 'bg-tertiary text-on-tertiary hover:shadow-lg hover:shadow-tertiary/20'
                                    : 'bg-primary text-on-primary hover:shadow-lg hover:shadow-primary/20'
                            }`}
                        >
                            {isAILoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </form>

                    <p className="text-[10px] text-on-surface-variant/20 text-center uppercase tracking-widest font-bold">
                        All students and the teacher can see your question
                    </p>
                </div>
            )}
        </div>
    );
}
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageCircle, MoreVertical, Trash2, User } from 'lucide-react';
import { confirmToast } from '../../utils/confirmToast';
import EmptyState from '../../components/shared/EmptyState';
import toast from 'react-hot-toast';

export default function CommentSection({ liveClassId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    // Hardcoded Dark Theme for consistency
    const isDark = true;

    useEffect(() => {
        loadComments();
    }, [liveClassId]);

    const loadComments = async () => {
        try {
            const { data } = await api.get('/comments', { params: { liveClassId } });
            setComments(data.comments || []);
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            await api.post('/comments', { liveClassId, text: newComment });
            setNewComment('');
            loadComments();
            toast.success('Comment posted');
        } catch (error) {
            console.error('Failed to add comment:', error);
            toast.error('Failed to post comment');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (commentId) => {
        const confirmed = await confirmToast('Are you sure you want to delete this comment?', {
            confirmLabel: 'Delete',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            await api.delete(`/comments/${commentId}`);
            loadComments();
            toast.success('Comment deleted');
        } catch (error) {
            console.error('Failed to delete comment:', error);
            toast.error('Failed to delete comment');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-full flex flex-col bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                    <EmptyState 
                        icon={MessageCircle} 
                        message="No comments yet" 
                        subMessage="Be the first to start the discussion!" 
                    />
                ) : (
                    comments.map((comment) => {
                        const isMe = user?._id === comment.user?._id;
                        const isTeacher = comment.user?.role === 'Teacher' || comment.user?.role === 'Admin'; // Assuming Admin might comment too

                        return (
                            <div key={comment._id} className="flex gap-3 group bg-surface-container-low p-3 rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-colors">
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-inner ${isTeacher ? 'bg-primary text-on-primary' :
                                        isMe ? 'bg-tertiary text-on-tertiary' :
                                            'bg-secondary text-on-secondary'
                                    }`}>
                                    {comment.user?.name?.[0] || 'U'}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold font-body ${isTeacher ? 'text-primary' :
                                                    isMe ? 'text-tertiary' :
                                                        'text-on-surface'
                                                }`}>
                                                {comment.user?.name || 'Unknown User'}
                                            </span>
                                            {isTeacher && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider">
                                                    Teacher
                                                </span>
                                            )}
                                            <span className="text-[10px] uppercase font-label tracking-wider text-on-surface-variant opacity-60">
                                                {formatDate(comment.createdAt)}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        {(isMe || user?.role === 'Teacher' || user?.role === 'Admin') && (
                                            <button
                                                onClick={() => handleDelete(comment._id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-error/10 text-error hover:bg-error hover:text-white transition-all shadow-sm"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-on-surface mt-1 break-words leading-relaxed">
                                        {comment.text}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-outline-variant/20 bg-surface-container-high">
                <form onSubmit={handleAddComment} className="flex gap-3 items-end">
                    <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary text-sm font-bold shrink-0 shadow-inner">
                        {user?.name?.[0] || 'Y'}
                    </div>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full px-5 py-2.5 bg-surface border border-outline-variant/20 rounded-full text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all pr-12 shadow-inner"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            className="absolute right-1.5 top-1.5 p-1.5 rounded-full bg-gradient-secondary text-on-secondary hover:shadow-lg hover:shadow-secondary/20 disabled:opacity-0 disabled:pointer-events-none transition-all flex items-center justify-center"
                        >
                            <Send className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

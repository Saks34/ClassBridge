import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Calendar, Upload, Download, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import usePageTitle from '../../hooks/usePageTitle';

export default function StudentAssignments() {
    usePageTitle('Assignments', 'Student');
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [activeAssignment, setActiveAssignment] = useState(null);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user?.batchId) fetchData();
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [assData, subData] = await Promise.all([
                api.get(`/assignments/batch/${user.batchId}`),
                api.get(`/assignments/batch/${user.batchId}/my-submissions`)
            ]);
            setAssignments(assData.data.data || []);
            setSubmissions(subData.data.data || []);
        } catch (error) {
            toast.error('Failed to load assignments');
        } finally { setLoading(false); }
    };

    const handleOpenSubmit = (assignment) => {
        if (new Date() > new Date(assignment.dueDate)) return toast.error('Deadline has passed');
        setActiveAssignment(assignment);
        setIsSubmitOpen(true);
        setFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return toast.error('Please select a file');
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const uploadRes = await api.post('/uploads/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await api.post(`/assignments/${activeAssignment._id}/submit`, { fileUrl: uploadRes.data.secure_url, fileType: uploadRes.data.resource_type });
            toast.success('Assignment submitted!');
            setIsSubmitOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Submission failed');
        } finally { setSubmitting(false); }
    };

    const getSubmissionForTask = (assignmentId) => submissions.find(s => s.assignmentId === assignmentId);

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><LoadingSpinner centered /></div>;

    return (
        <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none mb-4">
                    My <span className="text-gradient-secondary">Assignments</span>
                </h1>
                <p className="text-on-surface-variant text-base font-body max-w-2xl leading-relaxed">
                    Track and submit your pending assignments before the deadline.
                </p>
            </header>

            {assignments.length === 0 ? (
                <div className="text-center py-16 rounded-[2rem] border border-outline-variant/10 bg-surface-container-low/50">
                    <CheckCircle className="w-12 h-12 text-secondary mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-on-surface font-headline">All caught up!</h3>
                    <p className="text-on-surface-variant/70 mt-1 font-body text-sm">No assignments currently from your teachers.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {assignments.map(a => {
                        const sub = getSubmissionForTask(a._id);
                        const isPastDue = new Date() > new Date(a.dueDate);
                        return (
                            <div key={a._id} className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/10 flex flex-col hover:border-secondary/20 transition-all shadow-xl">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg line-clamp-1 mb-1 text-on-surface font-headline">{a.title}</h3>
                                    <p className="text-sm text-on-surface-variant/70 mb-4 line-clamp-2 font-body">{a.description || 'No description'}</p>
                                    <div className={`flex items-center gap-2 text-sm font-medium mb-4 ${isPastDue && (!sub || sub.status === 'late') ? 'text-error' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                        <Clock className="w-4 h-4" />
                                        <span>Due: {new Date(a.dueDate).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mt-auto">
                                    {sub ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center bg-secondary/10 text-secondary px-3 py-2 rounded-xl border border-secondary/20 text-sm font-medium">
                                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Submitted</div>
                                                <button onClick={() => window.open(sub.fileUrl)}><Download className="w-4 h-4" /></button>
                                            </div>
                                            {sub.grade && (
                                                <div className="p-3 rounded-xl border border-outline-variant/10 bg-surface-container-high flex flex-col gap-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Teacher Grade</span>
                                                        <span className="text-xs font-bold text-on-surface">{sub.grade}</span>
                                                    </div>
                                                    {sub.feedback && <p className="text-[11px] text-on-surface-variant/70 italic">"{sub.feedback}"</p>}
                                                </div>
                                            )}
                                        </div>
                                    ) : isPastDue ? (
                                        <div className="bg-error/10 text-error px-3 py-2 rounded-xl border border-error/20 text-sm font-medium text-center">
                                            Deadline Missed
                                        </div>
                                    ) : (
                                        <button onClick={() => handleOpenSubmit(a)} className="w-full flex justify-center items-center gap-2 px-3 py-2.5 text-sm rounded-xl font-semibold bg-secondary text-on-secondary transition hover:shadow-secondary/20 hover:shadow-lg">
                                            <Upload className="w-4 h-4" /> Submit Now
                                        </button>
                                    )}
                                    {a.attachmentUrl && (
                                        <button onClick={() => window.open(a.attachmentUrl)} className="w-full flex justify-center items-center gap-2 px-3 py-2 text-sm rounded-xl font-medium border border-outline-variant/20 bg-surface-container-high hover:bg-surface-bright/10 text-on-surface-variant transition">
                                            <FileText className="w-4 h-4" /> View Reference Material
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Submission Modal */}
            {isSubmitOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <form onSubmit={handleSubmit} className="w-full max-w-md p-8 rounded-[2rem] shadow-2xl bg-surface-container border border-outline-variant/10">
                        <h2 className="text-xl font-bold mb-1 text-on-surface font-headline">Submit Assignment</h2>
                        <h3 className="text-sm mb-6 text-primary">{activeAssignment?.title}</h3>
                        <div className="p-6 mb-6 rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-high text-center">
                            <label className="block text-sm font-medium mb-3 text-on-surface-variant">Upload your work (PDF/Image)</label>
                            <input type="file" required onChange={e => setFile(e.target.files[0])} className="w-full text-sm text-on-surface-variant/70 mx-auto block max-w-[250px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setIsSubmitOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition">Cancel</button>
                            <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-on-secondary hover:shadow-secondary/20 hover:shadow-lg disabled:opacity-50 transition">{submitting ? 'Submitting...' : 'Submit Assignment'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

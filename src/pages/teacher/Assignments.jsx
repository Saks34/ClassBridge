import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, FileText, Calendar, CheckCircle, PackageOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { confirmToast } from '../../utils/confirmToast';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import usePageTitle from '../../hooks/usePageTitle';

export default function TeacherAssignments() {
    usePageTitle('Assignments', 'Teacher');
    const [assignments, setAssignments] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', dueDate: '', attachmentUrl: '' });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [viewingAssignment, setViewingAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [gradeData, setGradeData] = useState({ grade: '', feedback: '' });
    const [submittingGrade, setSubmittingGrade] = useState(false);

    useEffect(() => { fetchBatches(); }, []);
    useEffect(() => { if (selectedBatch) fetchAssignments(selectedBatch); else setAssignments([]); }, [selectedBatch]);

    const fetchBatches = async () => {
        try {
            const { data } = await api.get('/batches');
            setBatches(data.data || []);
            if (data.data?.length > 0) setSelectedBatch(data.data[0]._id);
        } catch (error) { toast.error('Failed to load batches'); }
    };

    const fetchAssignments = async (batchId) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/assignments/batch/${batchId}`);
            setAssignments(data.data || []);
        } catch (error) { toast.error('Failed to load assignments'); }
        finally { setLoading(false); }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!selectedBatch) return toast.error('Please select a batch first');
        setUploading(true);
        try {
            let attachmentUrl = '', attachmentType = '';
            if (file) {
                const fd = new FormData();
                fd.append('file', file);
                const uploadRes = await api.post('/uploads/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                attachmentUrl = uploadRes.data.secure_url;
                attachmentType = uploadRes.data.resource_type;
            }
            await api.post('/assignments', { batchId: selectedBatch, title: formData.title, description: formData.description, dueDate: formData.dueDate, attachmentUrl, attachmentType });
            toast.success('Assignment created');
            setIsModalOpen(false);
            setFormData({ title: '', description: '', dueDate: '', attachmentUrl: '' });
            setFile(null);
            fetchAssignments(selectedBatch);
        } catch (error) { toast.error('Failed to create assignment'); }
        finally { setUploading(false); }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirmToast('Are you sure you want to delete this assignment?', {
            confirmLabel: 'Delete',
            variant: 'danger'
        });
        if (!confirmed) return;
        try { await api.delete(`/assignments/${id}`); toast.success('Assignment deleted'); fetchAssignments(selectedBatch); }
        catch (error) { toast.error('Failed to delete assignment'); }
    };

    const handleViewSubmissions = async (assignment) => {
        setViewingAssignment(assignment);
        setLoadingSubmissions(true);
        try {
            const { data } = await api.get(`/assignments/${assignment._id}/submissions`);
            setSubmissions(data.data || []);
        } catch (error) { toast.error('Failed to load submissions'); }
        finally { setLoadingSubmissions(false); }
    };

    const handleGrade = async (e) => {
        e.preventDefault();
        setSubmittingGrade(true);
        try {
            await api.patch(`/assignments/submissions/${gradingSubmission._id}/grade`, gradeData);
            toast.success('Graded successfully');
            setSubmissions(prev => prev.map(s => s._id === gradingSubmission._id ? { ...s, ...gradeData, gradedAt: new Date() } : s));
            setGradingSubmission(null);
            setGradeData({ grade: '', feedback: '' });
        } catch (error) { toast.error('Failed to submit grade'); }
        finally { setSubmittingGrade(false); }
    };

    return (
        <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none mb-4">
                        Assignment <span className="text-gradient-primary">Matrix</span>
                    </h1>
                    <p className="text-on-surface-variant text-base font-body max-w-2xl leading-relaxed">
                        Create, manage and grade assignments across your assigned batch clusters.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}
                        className="px-5 py-3 rounded-2xl bg-surface-container-high border border-outline-variant/10 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-body text-sm appearance-none">
                        {batches.map(v => (<option key={v._id} value={v._id}>{v.name}</option>))}
                    </select>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all">
                        <Plus className="w-4 h-4" /> Create Assignment
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="h-[40vh] flex items-center justify-center"><LoadingSpinner centered /></div>
            ) : assignments.length === 0 ? (
                <EmptyState icon={FileText} message="No assignments found" subMessage="Create an assignment to get started." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {assignments.map(a => (
                        <div key={a._id} className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/10 flex flex-col hover:border-primary/20 transition-all shadow-xl">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-lg line-clamp-1 text-on-surface font-headline">{a.title}</h3>
                                <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg hover:text-error hover:bg-error/10 text-on-surface-variant/60 transition">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-on-surface-variant/70 mb-4 line-clamp-2 font-body">{a.description || 'No description provided'}</p>
                            <div className="flex items-center gap-2 text-sm font-medium mb-6 text-yellow-600 dark:text-yellow-400">
                                <Calendar className="w-4 h-4" />
                                <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <button onClick={() => handleViewSubmissions(a)} className="flex-1 px-3 py-2.5 text-sm rounded-xl font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition">
                                    View Submissions
                                </button>
                                {a.attachmentUrl && (
                                    <button onClick={() => window.open(a.attachmentUrl)} className="px-3 py-2.5 text-sm rounded-xl font-medium border border-outline-variant/20 bg-surface-container-high hover:bg-surface-bright/10 text-on-surface-variant transition" title="View Attachment">
                                        <Download className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <form onSubmit={handleCreateAssignment} className="w-full max-w-md p-8 rounded-[2rem] shadow-2xl bg-surface-container border border-outline-variant/10">
                        <h2 className="text-xl font-bold mb-6 text-on-surface font-headline">Create Assignment</h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-primary/70 mb-2">Title</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-primary/70 mb-2">Description (optional)</label>
                                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-primary/70 mb-2">Due Date</label>
                                <input type="datetime-local" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-primary/70 mb-2">Attachment (PDF/Image)</label>
                                <input type="file" onChange={e => setFile(e.target.files[0])} className="w-full text-sm text-on-surface-variant/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition">Cancel</button>
                            <button type="submit" disabled={uploading} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:shadow-primary/20 hover:shadow-lg disabled:opacity-50 transition">{uploading ? 'Creating...' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Submissions Modal */}
            {viewingAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="w-full max-w-4xl max-h-[85vh] flex flex-col p-8 rounded-[2rem] shadow-2xl bg-surface-container border border-outline-variant/10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-on-surface font-headline">Submissions: {viewingAssignment.title}</h2>
                                <p className="text-sm text-on-surface-variant/70 mt-1">Total: {submissions.length}</p>
                            </div>
                            <button onClick={() => setViewingAssignment(null)} className="p-2 hover:bg-surface-container-high rounded-full transition text-on-surface-variant">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto min-h-[300px]">
                            {loadingSubmissions ? (
                                <div className="flex justify-center py-12"><LoadingSpinner centered /></div>
                            ) : submissions.length === 0 ? (
                                <EmptyState icon={PackageOpen} message="No submissions yet" subMessage="Students haven't submitted anything yet." />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {submissions.map(s => (
                                        <div key={s._id} className="p-5 rounded-2xl border border-outline-variant/10 bg-surface-container-low flex flex-col gap-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <img src={s.studentId?.avatarUrl || `https://ui-avatars.com/api/?name=${s.studentId?.name}`} className="w-10 h-10 rounded-full border border-outline-variant/20" alt="" />
                                                    <div>
                                                        <p className="font-semibold text-sm text-on-surface">{s.studentId?.name}</p>
                                                        <p className="text-[10px] text-on-surface-variant/60">Submitted: {new Date(s.createdAt).toLocaleString()}</p>
                                                        <span className={`text-[10px] mt-1 inline-block px-2 py-0.5 rounded-lg font-bold uppercase ${s.status === 'on-time' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                                                            {s.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button onClick={() => window.open(s.fileUrl)} className="p-2 rounded-lg bg-surface-container-high hover:bg-primary/10 text-primary transition" title="Download Submission"><Download className="w-4 h-4" /></button>
                                            </div>

                                            {s.grade ? (
                                                <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/10">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <CheckCircle className="w-3.5 h-3.5 text-secondary" />
                                                        <span className="text-xs font-bold text-secondary">GRADED</span>
                                                        <span className="text-xs font-bold ml-auto text-on-surface">{s.grade}</span>
                                                    </div>
                                                    <p className="text-xs text-on-surface-variant/70 italic">"{s.feedback}"</p>
                                                    <button onClick={() => { setGradingSubmission(s); setGradeData({ grade: s.grade, feedback: s.feedback }); }} className="mt-2 text-[10px] text-primary hover:underline">Edit Grade</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setGradingSubmission(s)} className="w-full py-2.5 text-xs font-bold bg-primary text-on-primary rounded-xl hover:shadow-primary/20 hover:shadow-lg transition">
                                                    GRADE NOW
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Grading Modal */}
            {gradingSubmission && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <form onSubmit={handleGrade} className="w-full max-w-sm p-8 rounded-[2rem] shadow-2xl bg-surface-container border border-outline-variant/10">
                        <h2 className="text-xl font-bold mb-1 text-on-surface font-headline">Grade Submission</h2>
                        <p className="text-xs text-on-surface-variant/70 mb-6">Student: <span className="font-semibold text-on-surface">{gradingSubmission.studentId?.name}</span></p>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-primary/70 mb-2">Grade (Score/Letter)</label>
                                <input type="text" required placeholder="Ex: 95/100 or A+" value={gradeData.grade} onChange={e => setGradeData({...gradeData, grade: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-primary/70 mb-2">Feedback</label>
                                <textarea rows="3" required placeholder="Good work! But some parts could be improved..." value={gradeData.feedback} onChange={e => setGradeData({...gradeData, feedback: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" onClick={() => setGradingSubmission(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition">Cancel</button>
                            <button type="submit" disabled={submittingGrade} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-on-secondary hover:shadow-secondary/20 hover:shadow-lg disabled:opacity-50 transition">
                                {submittingGrade ? 'Saving...' : 'Submit Grade'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

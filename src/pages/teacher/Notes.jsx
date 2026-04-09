import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Table from '../../components/shared/Table';
import { confirmToast } from '../../utils/confirmToast';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Eye, Trash2, FileText } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

export default function TeacherNotes() {
    usePageTitle('My Notes', 'Teacher');
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadNotes(); }, []);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/notes');
            setNotes(data.data || []);
        } catch (error) {
            console.error('Failed to load notes:', error);
        } finally { setLoading(false); }
    };

    const deleteNote = async (noteId) => {
        const confirmed = await confirmToast('Are you sure you want to delete this note?', {
            confirmLabel: 'Delete',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            await api.delete(`/notes/${noteId}`);
            toast.success('Note deleted successfully');
            loadNotes();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete note');
        }
    };

    const columns = [
        { header: 'Title', accessor: 'title', render: (row) => <span className="font-medium text-on-surface">{row.title}</span> },
        { header: 'Subject', render: (row) => <span className="text-on-surface-variant/70">{row.subjectId?.name || row.subjectId || 'N/A'}</span> },
        { header: 'Batch', render: (row) => <span className="text-on-surface-variant/70">{row.batchId?.name || row.batchId || 'N/A'}</span> },
        {
            header: 'Type',
            render: (row) => (
                <span className="px-2 py-1 rounded-lg text-xs font-bold uppercase bg-surface-container-high text-on-surface-variant/70 border border-outline-variant/10">
                    {row.resourceType || row.fileType || 'N/A'}
                </span>
            ),
        },
        {
            header: 'Actions',
            render: (row) => (
                <div className="flex gap-2">
                    <a href={row.secureUrl || row.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg transition-colors hover:bg-primary/10 text-primary" title="View Note">
                        <Eye size={18} />
                    </a>
                    <button onClick={() => deleteNote(row._id)}
                        className="p-2 rounded-lg transition-colors hover:bg-error/10 text-error/70 hover:text-error" title="Delete Note">
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ];

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><LoadingSpinner centered /></div>;

    return (
        <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none mb-4">
                    My <span className="text-gradient-primary">Notes</span>
                </h1>
                <p className="text-on-surface-variant font-body text-base">View and manage all uploaded notes and study materials.</p>
            </header>

            <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] p-8 shadow-2xl">
                <Table
                    columns={columns}
                    data={notes}
                    emptyMessage="No notes uploaded yet. Notes uploaded from live classes will appear here."
                />
            </div>
        </div>
    );
}

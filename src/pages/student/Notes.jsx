import { useEffect, useState } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import NotesList from '../../components/student/NotesList';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Search, FolderOpen, HardDrive, Sparkles, Filter } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { Shield } from 'lucide-react';

export default function StudentNotes() {
    usePageTitle('Study Materials', 'Student');
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState([]);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();

    useEffect(() => { loadNotes(); }, []);

    const loadNotes = async () => {
        setLoading(true);
        setError(null);
        try {
            const batchId = user?.batch?._id || user?.batch;
            if (!batchId) { setError('No batch identifier assigned to your account.'); setLoading(false); return; }
            const { data } = await api.get('/notes/by-batch', { params: { batchId } });
            setNotes(data.data || []);
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to retrieve study materials.');
        } finally { setLoading(false); }
    };

    const filteredNotes = notes.filter(note =>
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subjectId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <LoadingSpinner centered />;

    return (
        <div className="min-h-screen bg-surface">
             {/* Header Section */}
             <div className="relative pt-12 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[140%] bg-secondary/5 blur-[120px] rounded-full animate-pulse-slow-reverse"></div>
                </div>

                <div className="relative z-10 max-w-[1600px] mx-auto px-8">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/10 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                <Sparkles size={14} className="fill-secondary" />
                                Resource Library
                            </div>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter leading-none mb-6 animate-fade-in-up">
                            STUDY <span className="text-gradient-primary">MATERIALS</span>
                        </h1>
                        <p className="text-lg text-on-surface-variant font-body max-w-xl leading-relaxed opacity-80 animate-fade-in-up delay-100">
                            The centralized library for all your academic materials. Access class notes, reference documents, and insights from your teachers.
                        </p>
                    </div>

                    <div className="mt-12 flex flex-wrap gap-4 animate-fade-in-up delay-200">
                        <div className="px-6 py-4 rounded-3xl bg-surface-container/40 backdrop-blur-xl border border-outline-variant/10 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <HardDrive size={20} />
                            </div>
                            <div>
                                <div className="text-[9px] font-black uppercase text-on-surface-variant/40 tracking-widest leading-none mb-1">Total Documents</div>
                                <div className="text-xl font-black font-headline leading-none">{notes.length} FILES</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-8">
                {/* Search & Filter */}
                <div className="sticky top-6 p-4 rounded-[2.5rem] bg-surface-container/60 backdrop-blur-2xl border border-outline-variant/10 shadow-2xl flex flex-col md:flex-row gap-6 mb-16 z-30">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-all duration-300 w-5 h-5 opacity-40" />
                        <input
                            type="text"
                            placeholder="Search document names or subjects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 py-4 rounded-[1.75rem] bg-surface/50 hover:bg-surface transition-all outline-none text-on-surface placeholder:text-on-surface-variant/30 font-body text-sm border border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 shadow-inner"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-12 p-6 bg-error/5 border border-error/20 rounded-[2rem] flex items-center gap-4 animate-shake">
                        <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-error uppercase tracking-widest leading-none mb-1">Access Error</h4>
                            <p className="text-xs text-on-surface-variant opacity-70 font-body">{error}</p>
                        </div>
                    </div>
                )}

                <NotesList notes={filteredNotes} loading={loading} />
            </div>
        </div>
    );
}

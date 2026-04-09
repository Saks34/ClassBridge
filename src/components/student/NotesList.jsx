import { Download, FileText, Calendar, FolderOpen, Shield, File, ExternalLink, HardDrive } from 'lucide-react';
import EmptyState from '../../components/shared/EmptyState';
import toast from 'react-hot-toast';

export default function NotesList({ notes, loading }) {
    const handleDownload = (note) => {
        const url = note.secureUrl || note.fileUrl;
        if (!url) {
            toast.error('Secure resource link not identified.');
            return;
        }
        window.open(url, '_blank');
    };

    const getFileMeta = (fileName, resourceType) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        const config = {
            pdf: { icon: '📕', color: 'bg-error/10 text-error', label: 'PDF DOCUMENT' },
            doc: { icon: '📘', color: 'bg-primary/10 text-primary', label: 'WORD DOC' },
            docx: { icon: '📘', color: 'bg-primary/10 text-primary', label: 'WORD DOC' },
            ppt: { icon: '📙', color: 'bg-tertiary/10 text-tertiary', label: 'PRESENTATION' },
            pptx: { icon: '📙', color: 'bg-tertiary/10 text-tertiary', label: 'PRESENTATION' },
            jpg: { icon: '🖼️', color: 'bg-secondary/10 text-secondary', label: 'IMAGE' },
            jpeg: { icon: '🖼️', color: 'bg-secondary/10 text-secondary', label: 'IMAGE' },
            png: { icon: '🖼️', color: 'bg-secondary/10 text-secondary', label: 'IMAGE' },
        };
        return config[ext] || { icon: '📄', color: 'bg-primary/10 text-primary', label: 'GENERAL FILE' };
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-8 rounded-[2rem] animate-pulse bg-surface-container/50 border border-outline-variant/10">
                        <div className="w-16 h-16 rounded-2xl mb-6 bg-surface-container-highest"></div>
                        <div className="h-6 w-3/4 rounded-lg mb-4 bg-surface-container-highest"></div>
                        <div className="h-4 w-1/2 rounded-lg bg-surface-container-highest"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!notes || notes.length === 0) {
        return (
            <div className="py-20 flex justify-center">
                <EmptyState 
                    icon={HardDrive} 
                    message="No Knowledge Artifacts" 
                    subMessage="The document vault is currently empty. Resources appear here once distributed by the academic observers." 
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
            {notes.map((note, idx) => {
                const meta = getFileMeta(note.fileName || note.title, note.resourceType);
                return (
                    <div
                        key={note._id || idx}
                        className="group relative flex flex-col p-8 rounded-[2.5rem] bg-surface-container/40 border border-outline-variant/10 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 cursor-default group"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        {/* Status Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        {/* File Icon */}
                        <div className={`w-14 h-14 rounded-2xl ${meta.color} flex items-center justify-center text-2xl mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                            {meta.icon}
                        </div>

                        <div className="flex-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-2 font-label">
                                {meta.label}
                            </div>
                            <h3 className="text-lg font-black font-headline text-on-surface leading-tight tracking-tight mb-4 group-hover:text-primary transition-colors line-clamp-2">
                                {note.title || note.fileName}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-3 mb-8">
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/10 text-[10px] font-bold text-on-surface-variant/60">
                                    <Shield size={12} className="text-secondary" />
                                    {note.batch?.name || note.batch || 'GENERAL'}
                                </span>
                                <span className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/40">
                                    <Calendar size={12} />
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleDownload(note)}
                                className="flex-1 h-12 rounded-2xl bg-primary text-on-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                                <Download size={14} />
                                DOWNLOAD
                            </button>
                            <button
                                onClick={() => window.open(note.secureUrl || note.fileUrl, '_blank')}
                                className="w-12 h-12 rounded-2xl bg-surface-container-high text-on-surface-variant hover:text-primary border border-outline-variant/10 flex items-center justify-center transition-all group/btn hover:border-primary/20"
                                title="Open in New Tab"
                            >
                                <ExternalLink size={16} className="group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Table from '../../components/shared/Table';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Edit2, Trash2, BookOpen, Search, AlertTriangle, Layers, Zap, Compass, Activity, Upload } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import BulkImportModal from '../../components/shared/BulkImportModal';

export default function Batches() {
    usePageTitle('Batch Management', 'Admin');
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); 
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ name: '', academicYear: '', description: '' });

    useEffect(() => { loadBatches(); }, []);

    const loadBatches = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/batches');
            setBatches(data.data?.batches || []);
        } catch (error) {
            console.error('Failed to load batches:', error);
            toast.error(error?.response?.data?.message || 'Failed to load batches');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        try {
            await api.post('/batches', formData);
            toast.success('Batch created successfully');
            setFormData({ name: '', academicYear: '', description: '' });
            setShowCreateModal(false);
            loadBatches();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to create batch');
        }
    };

    const handleEditBatch = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/batches/${selectedBatch._id}`, formData);
            toast.success('Batch updated successfully');
            setShowEditModal(false);
            setSelectedBatch(null);
            setFormData({ name: '', academicYear: '', description: '' });
            loadBatches();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update batch');
        }
    };

    const handleDeleteBatch = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/batches/${deleteTarget.id}`);
            toast.success('Batch removed successfully');
            setDeleteTarget(null);
            loadBatches();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to remove batch');
        }
    };

    const openEditModal = (batch) => {
        setSelectedBatch(batch);
        setFormData({ name: batch.name, academicYear: batch.academicYear || '', description: batch.description || '' });
        setShowEditModal(true);
    };

    const filteredBatches = batches.filter(b =>
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.academicYear?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        { 
            header: 'BATCH NAME', 
            accessor: 'name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/10 flex items-center justify-center font-headline font-bold text-primary group-hover:scale-110 transition-transform shadow-lg">
                        {row.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors leading-none mb-1">{row.name}</div>
                        <div className="text-[10px] text-on-surface-variant opacity-50 font-label tracking-tighter uppercase font-bold">Active Batch</div>
                    </div>
                </div>
            )
        },
        { 
            header: 'ACADEMIC YEAR', 
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Compass size={14} className="text-secondary" />
                    <span className="font-body text-on-surface-variant opacity-70 font-medium">{row.academicYear || 'All Time'}</span>
                </div>
            )
        },
        {
            header: 'STUDENTS',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <span className="font-headline font-bold text-on-surface">{row.studentCount || 0}</span>
                    <span className="font-label text-[10px] uppercase font-bold text-on-surface-variant opacity-50 tracking-tighter transition-colors group-hover:text-secondary group-hover:opacity-100">Enrolled</span>
                </div>
            ),
        },
        { 
            header: 'CREATED AT', 
            render: (row) => (
                <span className="font-body text-[12px] text-on-surface-variant opacity-60 font-medium">{new Date(row.createdAt).toLocaleDateString()}</span>
            )
        },
        {
            header: 'ACTIONS',
            render: (row) => (
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-primary border border-outline-variant opacity-10 border-solid border-opacity-10 transition-all hover:bg-primary hover:bg-opacity-10"
                        title="Edit Batch"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: row._id, name: row.name }); }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-error border border-outline-variant/10 transition-all hover:bg-error/10"
                        title="Remove Batch"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><LoadingSpinner centered /></div>;

    return (
        <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none">
                       Batch <span className="text-gradient-primary">Management</span>
                    </h1>
                    <p className="text-on-surface-variant text-base md:text-lg font-body max-w-2xl leading-relaxed">
                        Create and organize student batches. Assign students and teachers to specific sections and timing.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex lg:mb-1 items-center gap-3 px-8 py-4 bg-surface-container-high text-on-surface-variant font-label text-[10px] font-black tracking-[0.2em] uppercase rounded-full shadow-lg hover:shadow-primary/5 hover:scale-105 transition-all group border border-outline-variant/10"
                    >
                        <Upload size={16} className="group-hover:translate-y-[-2px] transition-transform" />
                        Bulk Import
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex lg:mb-1 items-center gap-3 px-8 py-4 bg-primary text-on-primary font-label text-[10px] font-black tracking-[0.2em] uppercase rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all group"
                    >
                        <Layers size={16} className="group-hover:translate-y-[-2px] transition-transform" />
                        Create Batch
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <StatCard icon={<BookOpen className="text-primary" />} label="Total Batches" value={`${batches.length}`} subtext="Sections Created" color="primary" />
                 <StatCard icon={<Activity className="text-secondary" />} label="Total Students" value={`${batches.reduce((acc, b) => acc + (b.studentCount || 0), 0)}`} subtext="Enrolled across batches" color="secondary" />
                 <StatCard icon={<Zap className="text-primary" />} label="Batch Status" value="ACTIVE" subtext="All systems operational" color="primary" />
            </div>

            <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-20"></div>

                <div className="relative group max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search batches by name or schedule..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-body text-sm"
                    />
                </div>
                <div className="rounded-[2rem] overflow-hidden border border-outline-variant/5">
                    <Table
                        columns={columns}
                        data={filteredBatches}
                        emptyMessage={searchQuery ? `No batches match search "${searchQuery}"` : 'Batch list is empty. Create your first student batch.'}
                    />
                </div>
            </div>

            <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setFormData({ name: '', academicYear: '', description: '' }); }} title="Create New Batch" size="md">
                <form onSubmit={handleCreateBatch} className="space-y-6">
                    <InputField label="BATCH NAME" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Class 7B, Morning Batch" />
                    <InputField label="ACADEMIC YEAR" value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })} placeholder="e.g. 2024-2025" />
                    <div className="space-y-2">
                        <label className="font-label text-[10px] uppercase tracking-widest text-primary opacity-70 font-bold">DESCRIPTION</label>
                        <textarea
                            className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body min-h-[120px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional notes for this batch..."
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
                            CREATE BATCH
                        </button>
                        <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">
                            CANCEL
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedBatch(null); setFormData({ name: '', academicYear: '', description: '' }); }} title="Edit Batch Details" size="md">
                <form onSubmit={handleEditBatch} className="space-y-6">
                    <InputField label="BATCH NAME" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    <InputField label="ACADEMIC YEAR" value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })} />
                    <div className="space-y-2">
                        <label className="font-label text-[10px] uppercase tracking-widest text-primary opacity-70 font-bold">DESCRIPTION</label>
                        <textarea
                            className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body min-h-[120px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
                            SAVE CHANGES
                        </button>
                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">
                            CANCEL
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Batch" size="sm">
                <div className="space-y-6 text-center">
                    <div className="flex flex-col items-center py-4">
                         <div className="w-16 h-16 rounded-full bg-error bg-opacity-10 flex items-center justify-center mb-6 border border-error border-opacity-20">
                            <AlertTriangle className="text-error" size={32} />
                         </div>
                         <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Confirm Delete</h3>
                         <p className="text-on-surface-variant font-body text-sm">
                            You are about to delete batch <span className="text-on-surface font-bold">{deleteTarget?.name}</span>. All student assignments for this batch will be cleared. This action is irreversible.
                         </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleDeleteBatch} className="flex-1 py-4 bg-error text-on-error rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-error/20 transition-all active:scale-95">DELETE BATCH</button>
                        <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">CANCEL</button>
                    </div>
                </div>
            </Modal>

            <BulkImportModal 
                isOpen={showBulkModal} 
                onClose={() => setShowBulkModal(false)} 
                type="batches" 
                onSuccess={loadBatches} 
            />
        </div>
    );
}

const StatCard = ({ icon, label, value, subtext, color }) => (
    <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/10 group hover:border-primary/20 transition-all shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2`}></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/5 shadow-inner group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60 font-bold">{label}</span>
        </div>
        <div className="text-4xl font-bold text-on-surface font-headline relative z-10">{value}</div>
        <div className="text-[10px] text-on-surface-variant opacity-50 mt-2 uppercase font-label font-bold relative z-10">{subtext}</div>
    </div>
);

const InputField = ({ label, type = "text", required = false, value, onChange, placeholder }) => {
    return (
        <div className="space-y-2">
            <label className="font-label text-[10px] uppercase tracking-widest text-primary opacity-70 font-bold">
                {label} {required && <span className="text-error font-extrabold">*</span>}
            </label>
            <input
                type={type}
                required={required}
                className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body text-sm"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    );
};

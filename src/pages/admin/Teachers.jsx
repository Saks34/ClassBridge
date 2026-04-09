import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Table from '../../components/shared/Table';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Trash2, Edit, UserPlus, Search, AlertTriangle, Shield, Compass, Zap, Activity, Upload } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import BulkImportModal from '../../components/shared/BulkImportModal';

export default function Teachers() {
    usePageTitle('Teachers', 'Admin');
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); 
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', role: 'Teacher', sendEmail: true });

    useEffect(() => { loadTeachers(); }, []);

    const loadTeachers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/institutions/staff?role=Teacher');
            setTeachers(data.staff || []);
        } catch (error) {
            console.error('Failed to load teachers:', error);
            toast.error(error?.response?.data?.message || 'Failed to load teachers');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        try {
            await api.post('/institutions/staff', formData);
            toast.success('Teacher added successfully');
            setShowAddModal(false);
            setFormData({ name: '', email: '', role: 'Teacher', sendEmail: true });
            loadTeachers();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to add teacher');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/institutions/staff/${deleteTarget.id}`);
            toast.success('Teacher removed successfully');
            setDeleteTarget(null);
            loadTeachers();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to remove teacher');
        }
    };

    const handleEdit = (teacher) => {
        setEditingTeacher(teacher);
        setFormData({ name: teacher.name, email: teacher.email, role: teacher.role, sendEmail: false });
        setShowEditModal(true);
    };

    const handleUpdateTeacher = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/institutions/staff/${editingTeacher.id}`, { name: formData.name, role: formData.role });
            toast.success('Teacher updated successfully');
            setShowEditModal(false);
            setEditingTeacher(null);
            loadTeachers();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update teacher');
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        { 
            header: 'NAME', 
            accessor: 'name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/10 flex items-center justify-center font-headline font-bold text-primary group-hover:scale-110 transition-transform">
                        {row.name.charAt(0)}
                    </div>
                    <div className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{row.name}</div>
                </div>
            )
        },
        { 
            header: 'EMAIL ADDRESS', 
            accessor: 'email',
            render: (row) => <span className="font-body text-on-surface-variant/70 group-hover:text-primary/70 transition-colors">{row.email}</span>
        },
        { 
            header: 'ROLE', 
            accessor: 'role',
            render: (row) => (
                <span className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-secondary bg-secondary/10 px-3 py-1 rounded-lg border border-secondary/20">
                    {row.role}
                </span>
            )
        },
        {
            header: 'STATUS',
            render: () => (
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
                    <span className="font-label text-[8px] font-black uppercase tracking-widest text-on-surface-variant/60">Active</span>
                </div>
            ),
        },
        {
            header: 'ACTIONS',
            render: (row) => (
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-primary border border-outline-variant/10 transition-all hover:bg-primary/10"
                        title="Edit Teacher"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: row.id, name: row.name }); }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-error border border-outline-variant/10 transition-all hover:bg-error/10"
                        title="Remove Teacher"
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
                <div>
                    <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none mb-4">
                       Teacher <span className="text-gradient-primary">Management</span>
                    </h1>
                    <p className="text-on-surface-variant text-base md:text-lg font-body max-w-2xl leading-relaxed">
                        Manage your teaching staff and their account settings. Ensure all teachers are correctly assigned to their respective roles.
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
                        onClick={() => setShowAddModal(true)}
                        className="flex lg:mb-1 items-center gap-3 px-8 py-4 bg-primary text-on-primary font-label text-[10px] font-black tracking-[0.2em] uppercase rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all group"
                    >
                        <UserPlus size={16} className="group-hover:rotate-12 transition-transform" />
                        Add Teacher
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <StatCard icon={<Shield className="text-primary" />} label="Staff Support" value="99.8%" subtext="Resource Availability" color="primary" />
                <StatCard icon={<Activity className="text-secondary" />} label="Teachers Online" value={`${teachers.length}`} subtext="Across All Batches" color="secondary" />
                <StatCard icon={<Zap className="text-primary" />} label="System Status" value="OPTIMAL" subtext="All Services Operational" color="primary" />
            </div>

            <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-20"></div>
                
                <div className="relative group max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-body text-sm"
                    />
                </div>

                <div className="rounded-[2rem] overflow-hidden border border-outline-variant/5">
                    <Table
                        columns={columns}
                        data={filteredTeachers}
                        emptyMessage={searchQuery ? `No records found for "${searchQuery}"` : 'Teacher records are currently empty. Add your first teacher to begin.'}
                    />
                </div>
            </div>

            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Teacher" size="md">
                <form onSubmit={handleAddTeacher} className="space-y-6">
                    <InputField label="FULL NAME" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter teacher's name" />
                    <InputField label="EMAIL ADDRESS" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="teacher@school.edu" />
                    <div className="space-y-2">
                        <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 font-bold">ASSIGN ROLE</label>
                        <select
                            className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="Teacher">Teacher</option>
                            <option value="Moderator">Moderator</option>
                        </select>
                    </div>
                    <div className="space-y-4 pt-2">
                        <label className="flex items-center gap-4 cursor-pointer group">
                           <div className="relative">
                                <input type="checkbox" checked={formData.sendEmail} onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })} className="peer sr-only" />
                                <div className="w-5 h-5 rounded-md border-2 border-outline-variant/30 peer-checked:bg-primary peer-checked:border-primary transition-all"></div>
                                <Zap size={10} className="absolute inset-0 m-auto text-on-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
                           </div>
                           <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/70 group-hover:text-on-surface transition-colors select-none font-bold">Send login details via email</span>
                        </label>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
                            ADD TEACHER
                        </button>
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">
                            CANCEL
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Teacher Details" size="md">
                <form onSubmit={handleUpdateTeacher} className="space-y-6">
                    <InputField label="FULL NAME" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter teacher's name" />
                    <InputField label="EMAIL ADDRESS" type="email" value={formData.email} placeholder="teacher@school.edu" disabled />
                    <div className="space-y-2">
                         <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 font-bold">ASSIGN ROLE</label>
                         <select
                            className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="Teacher">Teacher</option>
                            <option value="Moderator">Moderator</option>
                        </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-primary/20 transition-all active:scale-95">SAVE CHANGES</button>
                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">CANCEL</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Teacher" size="sm">
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center py-4">
                         <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-6 border border-error/20">
                            <AlertTriangle className="text-error" size={32} />
                         </div>
                         <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Confirm Removal</h3>
                         <p className="text-on-surface-variant font-body text-sm">
                            Are you sure you want to remove <span className="text-on-surface font-bold">{deleteTarget?.name}</span>? This action cannot be undone and all associated data will be lost.
                         </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleDelete} className="flex-1 py-4 bg-error text-on-error rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-error/20 transition-all active:scale-95">CONFIRM DELETE</button>
                        <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">CANCEL</button>
                    </div>
                </div>
            </Modal>

            <BulkImportModal 
                isOpen={showBulkModal} 
                onClose={() => setShowBulkModal(false)} 
                type="users" 
                role="Teacher" 
                onSuccess={loadTeachers} 
            />
        </div>
    );
}

const StatCard = ({ icon, label, value, subtext, color }) => (
    <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 group hover:border-primary/20 transition-all shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2`}></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/5 shadow-inner group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold">{label}</span>
        </div>
        <div className="text-3xl font-bold text-on-surface font-headline relative z-10">{value}</div>
        <div className="text-[10px] text-on-surface-variant/50 mt-1 uppercase font-label relative z-10">{subtext}</div>
    </div>
);

const InputField = ({ label, type = "text", required = false, value, onChange, placeholder, disabled }) => {
    return (
        <div className="space-y-2">
            <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 font-bold">
                {label} {required && <span className="text-error">*</span>}
            </label>
            <input
                type={type}
                required={required}
                className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
            />
        </div>
    );
};

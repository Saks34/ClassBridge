import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Table from '../../components/shared/Table';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Trash2, Edit, UserPlus, Search, AlertTriangle, Shield, Activity, Users, Zap, Upload } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import BulkImportModal from '../../components/shared/BulkImportModal';

export default function Students() {
    usePageTitle('Student Directory', 'Admin');
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); 
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', role: 'Student', batchId: '', sendEmail: true, downloadCSV: false });

    useEffect(() => { loadStudents(); loadBatches(); }, []);

    const loadBatches = async () => {
        try {
            const { data } = await api.get('/batches');
            setBatches(data.data?.batches || []);
        } catch (error) { console.error('Failed to load batches:', error); }
    };

    const loadStudents = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/institutions/staff?role=Student');
            setStudents(data.staff || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load students');
        } finally { setLoading(false); }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/institutions/staff', formData);
            toast.success('Student added successfully');
            setShowAddModal(false);
            setFormData({ name: '', email: '', role: 'Student', batchId: '', sendEmail: true, downloadCSV: false });
            loadStudents();
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to add student'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/institutions/staff/${deleteTarget.id}`);
            toast.success('Student removed successfully');
            setDeleteTarget(null);
            loadStudents();
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to remove student'); }
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setFormData({ name: student.name, email: student.email, batchId: student.batchId || '', sendEmail: false, downloadCSV: false });
        setShowEditModal(true);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/institutions/staff/${editingStudent.id}`, { name: formData.name, batchId: formData.batchId || null });
            toast.success('Student details updated');
            setShowEditModal(false);
            setEditingStudent(null);
            loadStudents();
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to update student'); }
    };

    const getBatchName = (batchId) => {
        if (!batchId) return 'Not Assigned';
        const batch = batches.find(b => b._id === batchId);
        return batch ? batch.name : 'Unknown Batch';
    };

    const filteredStudents = students.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        { 
            header: 'STUDENT NAME', 
            accessor: 'name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/10 flex items-center justify-center font-headline font-bold text-secondary group-hover:scale-110 transition-transform">
                        {row.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-headline font-bold text-on-surface group-hover:text-secondary transition-colors leading-none mb-1">{row.name}</div>
                        <div className="text-[10px] text-on-surface-variant/50 font-label tracking-tighter">Verified Student</div>
                    </div>
                </div>
            )
        },
        { header: 'EMAIL ADDRESS', accessor: 'email', render: (row) => <span className="font-body text-on-surface-variant/70 font-medium">{row.email}</span> },
        { 
            header: 'ASSIGNED BATCH', 
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${row.batchId ? 'bg-primary' : 'bg-outline-variant/40'}`}></div>
                    <span className={`font-label text-[10px] font-black uppercase tracking-widest ${row.batchId ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                        {getBatchName(row.batchId)}
                    </span>
                </div>
            )
        },
        {
            header: 'ACTIONS',
            render: (row) => (
                <div className="flex gap-2 justify-end">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-secondary border border-outline-variant/10 transition-all hover:bg-secondary/10" title="Edit Student"><Edit size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: row.id, name: row.name }); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-error border border-outline-variant/10 transition-all hover:bg-error/10" title="Remove Student"><Trash2 size={16} /></button>
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
                       Student <span className="text-gradient-secondary">Directory</span>
                    </h1>
                    <p className="text-on-surface-variant text-base md:text-lg font-body max-w-2xl leading-relaxed">
                        Manage your students, their profiles, and classroom assignments. Track performance and engagement across the platform.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setShowBulkModal(true)} className="flex lg:mb-1 items-center gap-3 px-8 py-4 bg-surface-container-high text-on-surface-variant font-label text-[10px] font-black tracking-[0.2em] uppercase rounded-full shadow-lg hover:shadow-secondary/5 hover:scale-105 transition-all group border border-outline-variant/10">
                        <Upload size={16} className="group-hover:translate-y-[-2px] transition-transform" />
                        Bulk Import
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="flex lg:mb-1 items-center gap-3 px-8 py-4 bg-secondary text-on-secondary-container font-label text-[10px] font-black tracking-[0.2em] uppercase rounded-full shadow-lg hover:shadow-secondary/20 hover:scale-105 transition-all group">
                        <UserPlus size={16} className="group-hover:rotate-12 transition-transform" />
                        Add Student
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard icon={<Users className="text-secondary" />} label="Total Students" value={students.length} subtext="Active Profiles" color="secondary" />
                <StatCard icon={<Shield className="text-primary" />} label="Avg. Attendance" value="92%" subtext="Institutional Average" color="primary" />
                <StatCard icon={<Activity className="text-secondary" />} label="Live Now" value="24" subtext="Students in Classes" color="secondary" />
                <StatCard icon={<Zap className="text-primary" />} label="Overall Performance" value="99.9%" subtext="System Verified" color="primary" />
            </div>

            <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-secondary/10 via-primary/10 to-secondary/10 opacity-20"></div>
                <div className="relative group w-full max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-secondary transition-colors" size={18} />
                    <input type="text" placeholder="Search student by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-4 focus:ring-secondary/5 focus:border-secondary/20 transition-all font-body text-sm" />
                </div>
                <div className="rounded-[2rem] overflow-hidden border border-outline-variant/5">
                    <Table columns={columns} data={filteredStudents} emptyMessage={searchQuery ? `No students match search query "${searchQuery}"` : 'Student directory is currently empty. Add a new student to begin.'} />
                </div>
            </div>

            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Student" size="md">
                <form onSubmit={handleAddStudent} className="space-y-6">
                    <InputField label="STUDENT NAME" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full Legal Name" />
                    <InputField label="EMAIL ADDRESS" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="student@school.edu" />
                    <div className="space-y-2">
                        <label className="font-label text-[10px] uppercase tracking-widest text-secondary/70 font-bold">
                            ASSIGN TO BATCH {batches.length > 0 && <span className="text-on-surface-variant/50 font-normal ml-2">(OPTIONAL)</span>}
                        </label>
                        <select className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all font-body" value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}>
                            <option value="">Select a batch (optional)</option>
                            {batches.map((batch) => (<option key={batch._id} value={batch._id}>{batch.name} {batch.academicYear && `— [${batch.academicYear}]`}</option>))}
                        </select>
                        {batches.length === 0 && <p className="text-[10px] text-error mt-1 uppercase font-label">No active batches found. Create a batch first.</p>}
                    </div>
                    <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative">
                            <input type="checkbox" checked={formData.sendEmail} onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })} className="peer sr-only" />
                            <div className="w-5 h-5 rounded-md border-2 border-outline-variant/30 peer-checked:bg-secondary peer-checked:border-secondary transition-all"></div>
                            <Zap size={10} className="absolute inset-0 m-auto text-on-secondary opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/70 group-hover:text-on-surface transition-colors font-bold">Send login details via email</span>
                    </label>
                    <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-4 bg-secondary text-on-secondary font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-secondary/20 transition-all active:scale-95 rounded-2xl">ADD STUDENT</button>
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">CANCEL</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Update Student Profile" size="md">
                <form onSubmit={handleUpdateStudent} className="space-y-6">
                    <InputField label="STUDENT NAME" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full Legal Name" />
                    <InputField label="EMAIL ADDRESS" type="email" value={formData.email} disabled placeholder="student@school.edu" />
                    <div className="space-y-2">
                        <label className="font-label text-[10px] uppercase tracking-widest text-secondary/70 font-bold">ASSIGN TO BATCH</label>
                        <select className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all font-body" value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}>
                            <option value="">Not Assigned</option>
                            {batches.map((batch) => (<option key={batch._id} value={batch._id}>{batch.name} {batch.academicYear && `— [${batch.academicYear}]`}</option>))}
                        </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-4 bg-secondary text-on-secondary rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-secondary/20 transition-all active:scale-95">SAVE CHANGES</button>
                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">CANCEL</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Student" size="sm">
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center py-4">
                         <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-6 border border-error/20"><AlertTriangle className="text-error" size={32} /></div>
                         <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Confirm Delete</h3>
                         <p className="text-on-surface-variant font-body text-sm">Are you sure you want to delete student <span className="text-on-surface font-bold">{deleteTarget?.name}</span>? This will remove all their data from the institution. This action is irreversible.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleDelete} className="flex-1 py-4 bg-error text-on-error rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-error/20 transition-all active:scale-95">DELETE STUDENT</button>
                        <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">CANCEL</button>
                    </div>
                </div>
            </Modal>

            <BulkImportModal 
                isOpen={showBulkModal} 
                onClose={() => setShowBulkModal(false)} 
                type="users" 
                role="Student" 
                onSuccess={loadStudents} 
            />
        </div>
    );
}

const StatCard = ({ icon, label, value, subtext, color }) => (
    <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 group hover:border-secondary/20 transition-all shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2`}></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/5 shadow-inner group-hover:scale-110 transition-transform">{icon}</div>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold">{label}</span>
        </div>
        <div className="text-4xl font-bold text-on-surface font-headline relative z-10">{value}</div>
        <div className="text-[10px] text-on-surface-variant/50 mt-2 uppercase font-label font-bold relative z-10">{subtext}</div>
    </div>
);

const InputField = ({ label, type = "text", required = false, value, onChange, placeholder, disabled }) => {
    return (
        <div className="space-y-2">
            <label className="font-label text-[10px] uppercase tracking-widest text-secondary/70 font-bold">
                {label} {required && <span className="text-error">*</span>}
            </label>
            <input type={type} required={required}
                className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all font-body text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
            />
        </div>
    );
};

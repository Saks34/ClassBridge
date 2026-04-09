import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Table from '../../components/shared/Table';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Shield, Trash2, Edit, UserPlus, Search, AlertTriangle, Zap, Activity, Globe, Lock } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

export default function Moderators() {
    usePageTitle('Moderators', 'Admin');
    const [moderators, setModerators] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingModerator, setEditingModerator] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', role: 'Moderator', sendEmail: true });

    useEffect(() => { loadModerators(); }, []);

    const loadModerators = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/institutions/staff?role=Moderator');
            setModerators(data.staff || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load moderators');
        } finally { setLoading(false); }
    };

    const handleAddModerator = async (e) => {
        e.preventDefault();
        try {
            await api.post('/institutions/staff', { ...formData, role: 'Moderator' });
            toast.success('Moderator added successfully');
            setShowAddModal(false);
            setFormData({ name: '', email: '', role: 'Moderator', sendEmail: true });
            loadModerators();
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to add moderator'); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/institutions/staff/${deleteTarget.id}`);
            toast.success('Moderator removed successfully');
            setDeleteTarget(null);
            loadModerators();
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to remove moderator'); }
    };

    const handleEdit = (moderator) => {
        setEditingModerator(moderator);
        setFormData({ name: moderator.name, email: moderator.email, role: 'Moderator', sendEmail: false });
        setShowEditModal(true);
    };

    const handleUpdateModerator = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/institutions/staff/${editingModerator.id}`, { name: formData.name, role: 'Moderator' });
            toast.success('Moderator updated successfully');
            setShowEditModal(false);
            setEditingModerator(null);
            loadModerators();
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to update moderator'); }
    };

    const filteredModerators = moderators.filter(m =>
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        { 
            header: 'FULL NAME', accessor: 'name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/10 flex items-center justify-center font-headline font-bold text-secondary group-hover:scale-110 transition-transform shadow-lg">
                        {row.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-headline font-bold text-on-surface group-hover:text-secondary transition-colors leading-none mb-1">{row.name}</div>
                        <div className="text-[10px] text-on-surface-variant/50 font-label tracking-tighter uppercase font-bold">Platform Moderator</div>
                    </div>
                </div>
            )
        },
        { header: 'EMAIL ADDRESS', accessor: 'email', render: (row) => <span className="font-body text-on-surface-variant/70 font-medium">{row.email}</span> },
        {
            header: 'STATUS',
            render: () => (
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    <span className="font-label text-[10px] font-black uppercase tracking-widest text-secondary">Active</span>
                </div>
            ),
        },
        {
            header: 'ACTIONS',
            render: (row) => (
                <div className="flex gap-2 justify-end">
                    <button onClick={() => handleEdit(row)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-secondary border border-outline-variant/10 transition-all hover:bg-secondary/10" title="Edit Moderator"><Edit size={16} /></button>
                    <button onClick={() => setDeleteTarget({ id: row.id, name: row.name })} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-error border border-outline-variant/10 transition-all hover:bg-error/10" title="Remove Moderator"><Trash2 size={16} /></button>
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
                       Moderator <span className="text-gradient-secondary">Management</span>
                    </h1>
                    <p className="text-on-surface-variant text-base md:text-lg font-body max-w-2xl leading-relaxed">
                        Manage platform moderators and staff. These team members help maintain the quality and support for all live classes.
                    </p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="flex lg:mb-1 items-center gap-3 px-8 py-4 bg-secondary text-on-secondary-container font-label text-[10px] font-black tracking-[0.2em] uppercase rounded-full shadow-lg hover:shadow-secondary/20 hover:scale-105 transition-all group">
                    <Shield size={16} className="group-hover:rotate-12 transition-transform" />
                    Add Moderator
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard icon={<Lock className="text-secondary" />} label="Security" value="Active" subtext="Protected" color="secondary" />
                <StatCard icon={<Globe className="text-primary" />} label="Engagement" value="High" subtext="Live Support" color="primary" />
                <StatCard icon={<Activity className="text-secondary" />} label="Total Moderators" value={moderators.length} subtext="Active Staff" color="secondary" />
                <StatCard icon={<Zap className="text-primary" />} label="Engagement Level" value="98%" subtext="Response Rate" color="primary" />
            </div>

            <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-secondary/10 via-primary/10 to-secondary/10 opacity-20"></div>
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
                    <input type="text" placeholder="Search moderators by name…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all font-body text-sm" />
                </div>
                <div className="rounded-[2rem] overflow-hidden border border-outline-variant/5">
                    <Table columns={columns} data={filteredModerators} emptyMessage={searchQuery ? `No moderators match "${searchQuery}"` : 'No moderators found. Add your first moderator to begin.'} />
                </div>
            </div>

            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Moderator" size="md">
                <form onSubmit={handleAddModerator} className="space-y-6">
                    <InputField label="FULL NAME" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter moderator's name" />
                    <InputField label="EMAIL ADDRESS" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="moderator@school.edu" />
                    <label className="flex items-center gap-4 cursor-pointer group pt-2">
                        <div className="relative">
                            <input type="checkbox" checked={formData.sendEmail} onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })} className="peer sr-only" />
                            <div className="w-5 h-5 rounded-md border-2 border-outline-variant/30 peer-checked:bg-secondary peer-checked:border-secondary transition-all"></div>
                            <Zap size={10} className="absolute inset-0 m-auto text-on-secondary opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/70 group-hover:text-on-surface transition-colors font-bold">Send login details via email</span>
                    </label>
                    <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-4 bg-secondary text-on-secondary rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-secondary/20 transition-all active:scale-95">ADD MODERATOR</button>
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">CANCEL</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Moderator Details" size="md">
                <form onSubmit={handleUpdateModerator} className="space-y-6">
                    <InputField label="FULL NAME" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter moderator's name" />
                    <InputField label="EMAIL ADDRESS" type="email" value={formData.email} disabled />
                    <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-4 bg-secondary text-on-secondary rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-secondary/20 transition-all active:scale-95">SAVE CHANGES</button>
                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">CANCEL</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Moderator" size="sm">
                <div className="space-y-8 text-center p-4">
                    <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto border border-error/20 animate-bounce">
                        <AlertTriangle size={40} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xl font-bold font-headline text-on-surface tracking-tight">Confirm Removal</h4>
                        <p className="text-on-surface-variant text-sm font-body leading-relaxed">
                            Are you sure you want to remove <span className="text-error font-bold">{deleteTarget?.name}</span> from the moderator list? This account will lose all access immediately.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleDelete} className="flex-1 py-4 bg-error text-on-error rounded-xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-error/80 transition-all active:scale-95">CONFIRM DELETE</button>
                        <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 bg-surface-container-high text-on-surface rounded-xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 transition-all">CANCEL</button>
                    </div>
                </div>
            </Modal>
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

const InputField = ({ label, type = "text", required = false, value, onChange, placeholder, disabled }) => (
    <div className="space-y-2">
        <label className="font-label text-[10px] uppercase tracking-widest text-secondary/70 font-bold">
            {label} {required && <span className="text-error font-extrabold">*</span>}
        </label>
        <input type={type} required={required}
            className={`w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all font-body text-sm ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        />
    </div>
);

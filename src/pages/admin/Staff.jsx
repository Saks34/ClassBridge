import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Table from '../../components/shared/Table';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Eye, Trash2, UserPlus, Users, GraduationCap, Mail, Shield, BookOpen, Hash, Zap, Activity, Globe } from 'lucide-react';
import { confirmToast } from '../../utils/confirmToast';
import usePageTitle from '../../hooks/usePageTitle';
import BulkImportModal from '../../components/shared/BulkImportModal';
import { Upload } from 'lucide-react';

export default function Staff() {
    usePageTitle('User Directory', 'Admin');
    const [activeTab, setActiveTab] = useState('teachers');
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [detailsUser, setDetailsUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Teacher',
        batchId: '',
        sendEmail: true,
        downloadCSV: false,
    });

    useEffect(() => {
        loadStaff();
        loadBatches();
    }, []);

    const loadBatches = async () => {
        try {
            const { data } = await api.get('/batches');
            setBatches(data.data?.batches || []);
        } catch (error) {
            console.error('Failed to load batches:', error);
        }
    };

    const loadStaff = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/institutions/staff');
            const staff = data.staff || [];
            setTeachers(staff.filter(s => s.role === 'Teacher'));
            setStudents(staff.filter(s => s.role === 'Student'));
        } catch (error) {
            console.error('Failed to load staff:', error);
            toast.error(error?.response?.data?.message || 'Failed to load user directory');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            await api.post('/institutions/staff', formData);
            toast.success('User added successfully');
            setShowAddModal(false);
            setFormData({
                name: '',
                email: '',
                role: 'Teacher',
                batchId: '',
                sendEmail: true,
                downloadCSV: false,
            });
            loadStaff();
        } catch (error) {
            console.error('Error adding staff:', error);
            toast.error(error?.response?.data?.message || 'Failed to add user');
        }
    };

    const handleDelete = async (userId) => {
        const confirmed = await confirmToast('Are you sure you want to remove this user?', {
            confirmLabel: 'Confirm Removal',
            cancelLabel: 'Cancel',
            variant: 'danger',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/institutions/staff/${userId}`);
            toast.success('User removed successfully');
            loadStaff();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to remove user');
        }
    };

    const getBatchName = (batchId) => {
        if (!batchId) return 'Not Assigned';
        const batch = batches.find(b => b._id === batchId);
        return batch ? batch.name : 'Unknown Batch';
    };

    const commonColumns = [
        { 
            header: 'FULL NAME', 
            accessor: 'name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/10 flex items-center justify-center font-headline font-bold text-primary group-hover:scale-110 transition-transform shadow-lg">
                        {row.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors leading-none mb-1">{row.name}</div>
                        <div className="text-[10px] text-on-surface-variant/60 font-label tracking-tighter uppercase font-bold">Active User</div>
                    </div>
                </div>
            )
        },
        { 
            header: 'EMAIL ADDRESS', 
            accessor: 'email',
            render: (row) => <span className="font-body text-on-surface-variant/70 font-medium">{row.email}</span>
        },
    ];

    const teacherColumns = [
        ...commonColumns,
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
                    <button onClick={() => setDetailsUser(row)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant/70 hover:text-on-surface border border-outline-variant/10 transition-all hover:bg-surface-bright/10" title="View Details">
                        <Eye size={16} />
                    </button>
                    <button onClick={() => handleDelete(row._id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant/70 hover:text-error border border-outline-variant/10 transition-all hover:bg-error/10" title="Remove User">
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    const studentColumns = [
        ...commonColumns,
        {
            header: 'BATCH',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${row.batchId ? 'bg-primary' : 'bg-surface-variant'}`}></div>
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
                    <button onClick={() => setDetailsUser(row)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant/70 hover:text-on-surface border border-outline-variant/10 transition-all hover:bg-surface-bright/10" title="View Details">
                        <Eye size={16} />
                    </button>
                    <button onClick={() => handleDelete(row._id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant/70 hover:text-error border border-outline-variant/10 transition-all hover:bg-error/10" title="Remove User">
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
                       User <span className="text-gradient-secondary">Directory</span>
                    </h1>
                    <p className="text-on-surface-variant text-base md:text-lg font-body max-w-2xl leading-relaxed">
                        Manage your institution's staff and students from a single centralized directory. Track classroom assignments and profile configurations.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex lg:mb-1 items-center gap-3 px-8 py-4 bg-surface-container-high text-on-surface-variant font-label text-[10px] font-black tracking-[0.2em] uppercase rounded-full shadow-lg hover:shadow-secondary/5 hover:scale-105 transition-all group border border-outline-variant/10"
                    >
                        <Upload size={16} className="group-hover:translate-y-[-2px] transition-transform" />
                        Bulk Import
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex lg:mb-1 items-center gap-3 px-8 py-4 bg-secondary text-on-secondary-container font-label text-[10px] font-black tracking-[0.2em] uppercase rounded-full shadow-[0_10px_30px_rgba(98,250,227,0.1)] hover:shadow-[0_15px_40px_rgba(98,250,227,0.2)] hover:scale-105 transition-all group"
                    >
                        <UserPlus size={16} className="group-hover:rotate-12 transition-transform" />
                        Add New User
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard icon={<Users className="text-secondary" />} label="Total Teachers" value={teachers.length} subtext="Staff Members" color="secondary" />
                <StatCard icon={<GraduationCap className="text-primary" />} label="Total Students" value={students.length} subtext="Enrolled Students" color="primary" />
                <StatCard icon={<Activity className="text-secondary" />} label="System Health" value="99.9%" subtext="Operational" color="secondary" />
                <StatCard icon={<Globe className="text-primary" />} label="Total Accounts" value={teachers.length + students.length} subtext="System Users" color="primary" />
            </div>

            <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-secondary/10 via-primary/10 to-secondary/10 opacity-20"></div>

                <div className="flex border-b border-white/5 px-6 pt-4 gap-12">
                    <button
                        onClick={() => setActiveTab('teachers')}
                        className={`pb-4 px-2 border-b-2 font-label text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeTab === 'teachers' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant/60 hover:text-on-surface'}`}
                    >
                        <Users size={16} />
                        Teachers
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`pb-4 px-2 border-b-2 font-label text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeTab === 'students' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant/60 hover:text-on-surface'}`}
                    >
                        <GraduationCap size={16} />
                        Students
                    </button>
                </div>

                <div className="rounded-[2rem] overflow-hidden border border-outline-variant/5">
                    {activeTab === 'teachers' ? (
                        <Table columns={teacherColumns} data={teachers} emptyMessage="No teachers found. Add your first staff member to begin." />
                    ) : (
                        <Table columns={studentColumns} data={students} emptyMessage="No students found. Add your first student to begin." />
                    )}
                </div>
            </div>

            {/* Add Staff Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={`Add New ${formData.role}`} size="md">
                <form onSubmit={handleAddStaff} className="space-y-6">
                    <InputField label="FULL NAME" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full Legal Name" />
                    <InputField label="EMAIL ADDRESS" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@school.edu" />
                    <div className="space-y-2">
                        <label className="font-label text-[10px] uppercase tracking-widest text-secondary/70 font-bold">SELECT ROLE</label>
                        <select
                            className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all font-body"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="Teacher">Teacher</option>
                            <option value="Student">Student</option>
                        </select>
                    </div>

                    {formData.role === 'Student' && (
                        <div className="space-y-2">
                            <label className="font-label text-[10px] uppercase tracking-widest text-secondary/70 font-bold">ASSIGN TO BATCH {batches.length > 0 && <span className="text-on-surface-variant/40 font-normal ml-2">(OPTIONAL)</span>}</label>
                            <select
                                className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all font-body"
                                value={formData.batchId}
                                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                            >
                                <option value="">Select a batch (optional)</option>
                                {batches.map((batch) => (
                                    <option key={batch._id} value={batch._id}>{batch.name} {batch.academicYear && `— [${batch.academicYear}]`}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-4 py-2">
                        <label className="flex items-center gap-4 cursor-pointer group">
                             <div className="relative">
                                <input type="checkbox" checked={formData.sendEmail} onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })} className="peer sr-only" />
                                <div className="w-5 h-5 rounded-md border-2 border-outline-variant/30 peer-checked:bg-secondary peer-checked:border-secondary transition-all"></div>
                                <Zap size={10} className="absolute inset-0 m-auto text-on-secondary opacity-0 peer-checked:opacity-100 transition-opacity" />
                           </div>
                           <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/60 group-hover:text-on-surface transition-colors font-bold">Send login details via email</span>
                        </label>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-4 bg-secondary text-on-secondary font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-secondary/20 transition-all active:scale-95">
                            ADD USER
                        </button>
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant/60 rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">
                            CANCEL
                        </button>
                    </div>
                </form>
            </Modal>

            {/* User Details Modal */}
            <Modal isOpen={!!detailsUser} onClose={() => setDetailsUser(null)} title="User Details" size="sm">
                {detailsUser && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center text-secondary text-4xl font-headline font-black border border-outline-variant/10 shadow-xl">
                                {detailsUser.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-headline text-on-surface tracking-tight leading-none mb-2">{detailsUser.name}</h3>
                                <span className={`px-4 py-1 rounded-full font-label text-[9px] font-black uppercase tracking-widest border ${
                                    detailsUser.role === 'Teacher'
                                        ? 'bg-secondary/10 text-secondary border-secondary/20'
                                        : 'bg-primary/10 text-primary border-primary/20'
                                }`}>{detailsUser.role}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <DetailRow icon={<Mail size={16} />} label="Email Address" value={detailsUser.email} />
                            <DetailRow icon={<Shield size={16} />} label="Account Type" value={detailsUser.role} />
                            {detailsUser.batchId && <DetailRow icon={<BookOpen size={16} />} label="Assigned Batch" value={getBatchName(detailsUser.batchId)} />}
                            <DetailRow icon={<Hash size={16} />} label="User ID" value={detailsUser._id || detailsUser.id} mono />
                        </div>

                        <button
                            onClick={() => setDetailsUser(null)}
                            className="w-full py-4 bg-surface-container-high text-on-surface rounded-xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 transition-all"
                        >
                            CLOSE
                        </button>
                    </div>
                )}
            </Modal>

            <BulkImportModal 
                isOpen={showBulkModal} 
                onClose={() => setShowBulkModal(false)} 
                type="users" 
                role={activeTab === 'teachers' ? 'Teacher' : 'Student'} 
                onSuccess={loadStaff} 
            />
        </div>
    );
}

const StatCard = ({ icon, label, value, subtext, color }) => (
    <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 group hover:border-secondary/20 transition-all shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2`}></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className={`w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/5 shadow-inner group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold">{label}</span>
        </div>
        <div className="text-4xl font-bold text-on-surface font-headline relative z-10">{value}</div>
        <div className="text-[10px] text-on-surface-variant/40 mt-2 uppercase font-label font-bold relative z-10">{subtext}</div>
    </div>
);

const DetailRow = ({ icon, label, value, mono }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-high/50 border border-outline-variant/5 group hover:border-secondary/10 transition-all">
        <div className="text-secondary opacity-60">{icon}</div>
        <div>
            <p className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant/60 font-bold mb-0.5">{label}</p>
            <p className={`text-sm font-body text-on-surface font-medium ${mono ? 'font-mono text-xs text-on-surface-variant/50' : ''}`}>{value}</p>
        </div>
    </div>
);

const InputField = ({ label, type = "text", required = false, value, onChange, placeholder }) => (
    <div className="space-y-2">
        <label className="font-label text-[10px] uppercase tracking-widest text-secondary/70 font-bold">
            {label} {required && <span className="text-error font-extrabold">*</span>}
        </label>
        <input
            type={type}
            required={required}
            className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all font-body text-sm"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    </div>
);

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { confirmToast } from '../../utils/confirmToast';
import TimetableCalendar from '../../components/shared/TimetableCalendar';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Plus, Clock, Globe, Shield, Activity, Zap, Upload } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import BulkImportModal from '../../components/shared/BulkImportModal';

function todayISODate() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

const SelectField = ({ label, value, onChange, options, required = false, placeholder }) => (
    <div className="space-y-2">
        <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 font-bold">
            {label} {required && <span className="text-error font-extrabold">*</span>}
        </label>
        <select required={required}
            className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body text-sm appearance-none cursor-pointer"
            value={value} onChange={onChange}
        >
            <option value="">{placeholder}</option>
            {options.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
    </div>
);

const InputField = ({ label, type = "text", required = false, value, onChange, placeholder }) => (
    <div className="space-y-2">
        <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 font-bold">
            {label} {required && <span className="text-error font-extrabold">*</span>}
        </label>
        <input type={type} required={required}
            className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-body text-sm"
            value={value} onChange={onChange} placeholder={placeholder}
        />
    </div>
);

export default function Timetable() {
    usePageTitle('Class Schedule', 'Admin');
    const { user } = useAuth();
    const navigate = useNavigate();
    const [slots, setSlots] = useState([]);
    const [batches, setBatches] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    const initialFormState = { batchId: '', subject: '', teacherId: '', date: todayISODate(), startTime: '', endTime: '' };
    const [formData, setFormData] = useState(initialFormState);
    const [editingSlotId, setEditingSlotId] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [timetableRes, batchesRes, teachersRes] = await Promise.all([
                api.get('/timetables'),
                api.get('/batches'),
                api.get('/institutions/staff?role=Teacher')
            ]);
            setSlots(timetableRes.data.data?.slots || []);
            setBatches(batchesRes.data.data?.batches || []);
            setTeachers(teachersRes.data.staff || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally { setLoading(false); }
    };

    const handleCreateOrUpdateSlot = async (e) => {
        e.preventDefault();
        const dateObj = new Date(formData.date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = days[dateObj.getDay()];
        const payload = { day, startTime: formData.startTime, endTime: formData.endTime, subject: formData.subject, batch: formData.batchId, teacher: formData.teacherId };
        try {
            if (editingSlotId) {
                await api.patch(`/timetables/${editingSlotId}`, payload);
                toast.success('Schedule updated');
            } else {
                await api.post('/timetables', payload);
                toast.success('Class scheduled successfully');
            }
            closeModal();
            loadData();
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to save schedule'); }
    };

    const handleDeleteSlot = async (slotId) => {
        const confirmed = await confirmToast('Are you sure you want to delete this schedule slot?', {
            confirmLabel: 'Delete Slot',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            await api.delete(`/timetables/${slotId}`);
            toast.success('Slot deleted successfully');
            loadData();
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to delete slot'); }
    };

    const closeModal = () => { setShowCreateModal(false); setEditingSlotId(null); setFormData(initialFormState); };

    const handleSlotClick = (slot, action) => {
        if (action === 'delete') {
            handleDeleteSlot(slot._id);
        } else if (action === 'edit') {
            setEditingSlotId(slot._id);
            setFormData({ batchId: slot.batch?._id || slot.batch, subject: slot.subject, teacherId: slot.teacher?._id || slot.teacher, date: todayISODate(), startTime: slot.startTime, endTime: slot.endTime });
            setShowCreateModal(true);
        } else if (action === 'join') {
            if (slot?._id) navigate(`/admin/live-class/${String(slot._id)}`);
            else toast.error('Invalid transmission ID');
        }
    };

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><LoadingSpinner centered /></div>;

    return (
        <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none">
                       Class <span className="text-gradient-primary">Schedule</span>
                    </h1>
                    <p className="text-on-surface-variant text-base md:text-lg font-body max-w-2xl leading-relaxed">
                        Manage and monitor institutional class timings, teacher assignments, and classroom schedules in real-time.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setShowBulkModal(true)} className="flex lg:mb-1 items-center gap-3 px-8 py-4 bg-surface-container-high text-on-surface-variant font-label text-[10px] font-black tracking-[0.2em] uppercase rounded-full shadow-lg hover:shadow-primary/5 hover:scale-105 transition-all group border border-outline-variant/10">
                        <Upload size={16} className="group-hover:translate-y-[-2px] transition-transform" />
                        Bulk Import
                    </button>
                    <button onClick={() => setShowCreateModal(true)} className="flex lg:mb-1 items-center gap-3 px-8 py-4 bg-primary text-on-primary font-label text-[10px] font-black tracking-[0.2em] uppercase rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all group">
                        <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                        Add Schedule
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard icon={<Clock className="text-primary" />} label="Class Duration" value="45m" subtext="Standard Slot" color="primary" />
                <StatCard icon={<Globe className="text-secondary" />} label="Active Batches" value={batches.length} subtext="Scheduled Sections" color="secondary" />
                <StatCard icon={<Shield className="text-primary" />} label="System Security" value="Verified" subtext="Secure Connection" color="primary" />
                <StatCard icon={<Activity className="text-secondary" />} label="System Status" value="Online" subtext="Operational" color="secondary" />
            </div>

            <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-20"></div>
                <TimetableCalendar slots={slots} onSlotClick={handleSlotClick} userRole={user?.role} loading={loading} />
            </div>

            <Modal isOpen={showCreateModal} onClose={closeModal} title={editingSlotId ? "Update Schedule" : "Add New Schedule"} size="md">
                <form onSubmit={handleCreateOrUpdateSlot} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <SelectField label="ASSIGN BATCH" required value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} options={batches.map(b => ({ value: b._id, label: b.name }))} placeholder="Select Batch" />
                        <SelectField label="ASSIGN TEACHER" required value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })} options={teachers.map(t => ({ value: t.id, label: t.name }))} placeholder="Select Teacher" />
                    </div>
                    <InputField label="SUBJECT NAME" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g. Mathematics, Physics" />
                    {!editingSlotId && (
                        <div className="space-y-2">
                            <InputField label="SELECT DATE" type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                            <p className="text-[10px] text-on-surface-variant/60 font-label uppercase font-bold tracking-widest px-1">
                                Reoccurrence: Every <span className="text-primary">{new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' })}</span>.
                            </p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-6">
                        <InputField label="START TIME" type="time" required value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                        <InputField label="END TIME" type="time" required value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
                            {editingSlotId ? 'SAVE CHANGES' : 'CREATE SCHEDULE'}
                        </button>
                        <button type="button" onClick={closeModal} className="flex-1 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/10 hover:text-on-surface transition-all">CANCEL</button>
                    </div>
                </form>
            </Modal>

            <BulkImportModal 
                isOpen={showBulkModal} 
                onClose={() => setShowBulkModal(false)} 
                type="timetable" 
                onSuccess={loadData} 
            />
        </div>
    );
}

const StatCard = ({ icon, label, value, subtext, color }) => (
    <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 group hover:border-primary/20 transition-all shadow-xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2`}></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/5 shadow-inner group-hover:scale-110 transition-transform">{icon}</div>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold">{label}</span>
        </div>
        <div className="text-4xl font-bold text-on-surface font-headline relative z-10">{value}</div>
        <div className="text-[10px] text-on-surface-variant/50 mt-2 uppercase font-label font-bold relative z-10">{subtext}</div>
    </div>
);

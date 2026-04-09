import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import TimetableCalendar from '../../components/shared/TimetableCalendar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, BookOpen, Compass, Shield, Zap } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

export default function StudentTimetable() {
    usePageTitle('Class Schedule', 'Student');
    const { user } = useAuth();
    const navigate = useNavigate();
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!user?.batch?._id && !user?.batch) return;
            setLoading(true);
            try {
                const batchId = user.batch._id || user.batch;
                const { data } = await api.get('/timetables/by-batch', { params: { batchId } });
                setSlots(data.data.slots || []);
            } catch (error) {
                console.error('Failed to load timetable:', error);
            } finally { setLoading(false); }
        };
        if (user) loadData();
    }, [user]);

    const todaySlots = slots.filter(slot => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return slot.day === days[new Date().getDay()];
    });

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><LoadingSpinner centered /></div>;

    return (
        <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-container-low border border-outline-variant/10 shadow-2xl p-10">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-[100px] pointer-events-none opacity-50"></div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-secondary/5 to-transparent rounded-full blur-[100px] pointer-events-none opacity-50"></div>

                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-surface-container-high border border-outline-variant/10 flex items-center justify-center shadow-lg">
                                <Calendar className="text-primary" size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tight leading-loose mb-2">
                                    Class <span className="text-gradient-primary">Schedule</span>
                                </h1>
                                <div className="flex items-center gap-2">
                                    <Compass size={14} className="text-secondary" />
                                    <span className="text-on-surface-variant/70 font-body text-sm">Schedule synchronized with your batch</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-surface-container-high border border-outline-variant/10 shadow-xl hover:border-primary/20 transition-all">
                                <Clock size={20} className="text-primary" />
                                <div>
                                    <div className="text-[10px] font-label text-on-surface-variant/60 uppercase tracking-widest font-bold">Today</div>
                                    <div className="text-xl font-bold text-on-surface font-headline leading-none">{todaySlots.length} <span className="text-xs text-on-surface-variant/50">Classes</span></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-surface-container-high border border-outline-variant/10 shadow-xl hover:border-secondary/20 transition-all">
                                <BookOpen size={20} className="text-secondary" />
                                <div>
                                    <div className="text-[10px] font-label text-on-surface-variant/60 uppercase tracking-widest font-bold">Weekly</div>
                                    <div className="text-xl font-bold text-on-surface font-headline leading-none">{slots.length} <span className="text-xs text-on-surface-variant/50">Sessions</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-secondary/5 border border-secondary/10 rounded-[2rem] flex items-center gap-4 text-secondary/80 font-body">
                    <Shield className="shrink-0" size={20} />
                    <div className="text-sm text-on-surface-variant">Your schedule is up to date for batch <span className="text-on-surface font-bold">{user?.batch?.name || user?.batch}</span>.</div>
                </div>
                <div className="p-6 bg-primary/5 border border-primary/10 rounded-[2rem] flex items-center gap-4 text-primary/80 font-body">
                    <Zap className="shrink-0" size={20} />
                    <div className="text-sm text-on-surface-variant">Click on any class in the calendar to view details or join the live session.</div>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
                <div className="p-8 lg:p-12 relative z-10">
                    <TimetableCalendar
                        slots={slots}
                        onSlotClick={(slot) => {
                            if (slot.liveClass?._id) navigate(`/student/class/${slot.liveClass._id}`);
                            else toast.info(`The session for ${slot.subject} has not started yet.`);
                        }}
                        userRole="Student"
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
}

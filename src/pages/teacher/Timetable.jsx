import { useState, useEffect } from 'react';
import api from '../../services/api';
import TimetableCalendar from '../../components/shared/TimetableCalendar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Compass } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

export default function TeacherTimetable() {
    usePageTitle('My Schedule', 'Teacher');
    const { user } = useAuth();
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/timetables/by-teacher');
                setSlots(data.data.slots || []);
            } catch (error) {
                console.error('Failed to load timetable:', error);
            } finally { setLoading(false); }
        };
        loadData();
    }, []);

    const handleSlotClick = (slot, action) => {};

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><LoadingSpinner centered /></div>;

    return (
        <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
            <header className="mb-12">
                <div className="flex items-center gap-5 mb-4">
                    <div className="w-14 h-14 rounded-[1.25rem] bg-surface-container-high border border-outline-variant/10 flex items-center justify-center shadow-lg">
                        <Calendar className="text-primary" size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none">
                            My <span className="text-gradient-primary">Schedule</span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <Compass size={14} className="text-secondary" />
                    <p className="text-on-surface-variant/70 font-body text-base">View your weekly teaching schedule and manage your sessions.</p>
                </div>
            </header>

            <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-20"></div>
                <TimetableCalendar
                    slots={slots}
                    onSlotClick={handleSlotClick}
                    userRole="Teacher"
                    loading={loading}
                />
            </div>
        </div>
    );
}

import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTheme } from '../../context/ThemeContext';
import { transformSlotsToEvents } from '../../utils/timetableUtils';
import { ChevronLeft, ChevronRight, Clock, MapPin, User as UserIcon, BookOpen, Video, Edit, Trash2, Calendar as CalendarIcon, Layout, List } from 'lucide-react';
import Modal from './Modal';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function TimetableCalendar({ slots, onSlotClick, userRole, loading }) {
    const { toggleTheme } = useTheme();
    const [view, setView] = useState(Views.MONTH); // Default to Week as usually best for timetables
    const [date, setDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);

    const events = useMemo(() => {
        return transformSlotsToEvents(slots, date);
    }, [slots, date]);

    // Enhanced Event Component with better visuals
    const CustomEvent = ({ event }) => {
        const getStatusDot = () => {
            if (event.status === 'live') {
                return <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>;
            }
            return null;
        };

        return (
            <div className="h-full w-full flex flex-col p-2 overflow-hidden group">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold tracking-wide truncate flex-1">
                        {event.resource.subject}
                    </span>
                    {getStatusDot()}
                </div>

                <div className="text-[10px] font-medium truncate mb-1 text-on-surface-variant/60">
                    {event.resource.batch?.name || 'Batch'}
                </div>

                <div className="mt-auto flex items-center gap-1 text-[10px] text-on-surface-variant/40">
                    <Clock size={10} />
                    <span>{format(event.start, 'h:mm')} - {format(event.end, 'h:mm a')}</span>
                </div>

                {event.resource.teacher?.name && (
                    <div className="text-[9px] text-on-surface-variant/40 truncate mt-0.5">
                        👤 {event.resource.teacher.name}
                    </div>
                )}
            </div>
        );
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = 'var(--surface-container-highest)';
        let borderColor = 'var(--outline-variant)';
        let textColor = 'var(--on-surface-variant)';

        switch (event.status) {
            case 'live':
                backgroundColor = 'rgba(var(--secondary-rgb), 0.15)';
                borderColor = 'var(--secondary)';
                textColor = 'var(--secondary)';
                break;
            case 'upcoming':
                backgroundColor = 'rgba(var(--primary-rgb), 0.15)';
                borderColor = 'var(--primary)';
                textColor = 'var(--primary)';
                break;
            case 'completed':
                backgroundColor = 'rgba(var(--on-surface-variant-rgb), 0.05)';
                borderColor = 'rgba(var(--on-surface-variant-rgb), 0.2)';
                textColor = 'rgba(var(--on-surface-variant-rgb), 0.5)';
                break;
            default:
                backgroundColor = 'rgba(var(--tertiary-rgb), 0.15)';
                borderColor = 'var(--tertiary)';
                textColor = 'var(--tertiary)';
        }

        return {
            style: {
                backgroundColor,
                borderLeft: `4px solid ${borderColor}`,
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderRadius: '8px',
                color: textColor,
                padding: '0',
                fontSize: '0.75rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
            }
        };
    };

    const CustomToolbar = (toolbar) => {
        const goToBack = () => toolbar.onNavigate('PREV');
        const goToNext = () => toolbar.onNavigate('NEXT');
        const goToCurrent = () => toolbar.onNavigate('TODAY');
        const handleViewChange = (newView) => toolbar.onView(newView);

        return (
            <div className="flex flex-col xl:flex-row items-center justify-between mb-8 gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="flex items-center p-1 rounded-full shadow-sm border border-outline-variant/10 bg-surface-container-high">
                        <button onClick={goToBack} className="p-2.5 rounded-full hover:bg-surface-bright/10 text-on-surface-variant transition-all hover:text-on-surface">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={goToCurrent} className="px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all text-on-surface">
                            Today
                        </button>
                        <button onClick={goToNext} className="p-2.5 rounded-full hover:bg-surface-bright/10 text-on-surface-variant transition-all hover:text-on-surface">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent min-w-[200px] text-center sm:text-left">
                        {format(toolbar.date, 'MMMM yyyy')}
                    </h2>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="flex p-1 rounded-xl border border-outline-variant/10 shadow-sm bg-surface-container-high">
                        <button onClick={() => handleViewChange(Views.MONTH)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${toolbar.view === Views.MONTH ? 'bg-primary/20 text-primary' : 'text-on-surface-variant/60 hover:text-on-surface'}`}>
                            <CalendarIcon size={16} /> Month
                        </button>
                        <button onClick={() => handleViewChange(Views.WEEK)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${toolbar.view === Views.WEEK ? 'bg-primary/20 text-primary' : 'text-on-surface-variant/60 hover:text-on-surface'}`}>
                            <Layout size={16} /> Week
                        </button>
                        <button onClick={() => handleViewChange(Views.DAY)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${toolbar.view === Views.DAY ? 'bg-primary/20 text-primary' : 'text-on-surface-variant/60 hover:text-on-surface'}`}>
                            <List size={16} /> Day
                        </button>
                    </div>

                    <div className="flex gap-2 text-xs font-semibold overflow-x-auto max-w-full pb-1 sm:pb-0">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800/50 whitespace-nowrap">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span>Live</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg border border-yellow-200 dark:border-yellow-800/50 whitespace-nowrap">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                            <span>Upcoming</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleSelectEvent = (event) => setSelectedEvent(event);

    const getStatusBadge = (status) => {
        const badges = {
            live: { bg: 'bg-secondary/10', text: 'text-secondary', label: 'LIVE NOW', icon: <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div> },
            upcoming: { bg: 'bg-primary/10', text: 'text-primary', label: 'UPCOMING', icon: <Clock size={16} /> },
            completed: { bg: 'bg-surface-container-highest', text: 'text-on-surface-variant/70', label: 'COMPLETED', icon: null },
            default: { bg: 'bg-tertiary/10', text: 'text-tertiary', label: 'SCHEDULED', icon: null }
        };
        return badges[status] || badges.default;
    };

    return (
        <div className="rounded-2xl shadow-xl border border-outline-variant/10 transition-all duration-300 overflow-hidden bg-surface-container-low">
            <div className="p-4 sm:p-6">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '700px' }}
                    defaultView={Views.MONTH}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={(newDate) => setDate(newDate)}
                    eventPropGetter={eventStyleGetter}
                    components={{ toolbar: CustomToolbar, event: CustomEvent }}
                    min={new Date(0, 0, 0, 7, 0, 0)}
                    max={new Date(0, 0, 0, 22, 0, 0)}
                    step={30}
                    timeslots={2}
                    className="enhanced-calendar"
                    onSelectEvent={handleSelectEvent}
                />
            </div>
            <style>{`
                .enhanced-calendar { font-family: 'Inter', sans-serif; }
                .enhanced-calendar .rbc-header { padding: 16px 8px; font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid var(--outline-variant) !important; background: var(--surface-container-high); color: var(--on-surface-variant); }
                .enhanced-calendar .rbc-time-header-content { border-left: none !important; }
                .enhanced-calendar .rbc-month-view, .enhanced-calendar .rbc-time-view { border: 1px solid var(--outline-variant) !important; background: var(--surface-container-low); color: var(--on-surface); }
                .enhanced-calendar .rbc-day-bg + .rbc-day-bg { border-left: 1px solid var(--outline-variant) !important; }
                .enhanced-calendar .rbc-timeslot-group { min-height: 80px; border-bottom: 1px solid var(--outline-variant) !important; }
                .enhanced-calendar .rbc-time-slot { border-top: 1px dashed var(--outline-variant) !important; }
                .enhanced-calendar .rbc-label { font-size: 0.75rem; font-weight: 600; color: var(--on-surface-variant-5); padding-right: 8px; }
                .enhanced-calendar .rbc-today { background-color: var(--primary-10) !important; }
                .enhanced-calendar .rbc-off-range-bg { background-color: var(--surface-container) !important; opacity: 0.5; }
                .enhanced-calendar .rbc-event { border-radius: 8px !important; padding: 0 !important; }
            `}</style>

            <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Class Details" size="max-w-xl">
                {selectedEvent && (
                    <div className="space-y-6">
                        <div className={`flex items-center justify-between p-4 rounded-xl ${getStatusBadge(selectedEvent.status).bg}`}>
                            <div className="flex items-center gap-2">
                                {getStatusBadge(selectedEvent.status).icon}
                                <span className={`font-bold tracking-wider text-sm ${getStatusBadge(selectedEvent.status).text}`}>
                                    {getStatusBadge(selectedEvent.status).label}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold mb-2 text-on-surface">
                                {selectedEvent.resource.subject}
                            </h3>
                            <div className="flex items-center gap-2 text-on-surface-variant/70">
                                <BookOpen size={18} />
                                <span className="font-medium">{selectedEvent.resource.batch?.name || 'Batch'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-highest/30">
                                <div className="p-2 rounded-lg bg-tertiary/10">
                                    <Clock className="text-tertiary" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1 text-on-surface-variant/50">Time</p>
                                    <p className="text-base font-semibold text-on-surface">
                                        {selectedEvent.resource.startTime} - {selectedEvent.resource.endTime}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-highest/30">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <UserIcon className="text-primary" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1 text-on-surface-variant/50">Teacher</p>
                                    <p className="text-base font-semibold text-on-surface">
                                        {selectedEvent.resource.teacher?.name || 'Unassigned'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-highest/30">
                                <div className="p-2 rounded-lg bg-secondary/10">
                                    <MapPin className="text-secondary" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1 text-on-surface-variant/50">Day</p>
                                    <p className="text-base font-semibold text-on-surface">
                                        {selectedEvent.resource.day}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant/10">
                            {userRole === 'InstitutionAdmin' || userRole === 'SuperAdmin' ? (
                                <>
                                    {selectedEvent.status === 'live' && (
                                        <button
                                            onClick={() => {
                                                onSlotClick(selectedEvent.resource, 'join');
                                                setSelectedEvent(null);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                        >
                                            <Video size={18} />
                                            Watch Live Stream
                                        </button>
                                    )}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                onSlotClick(selectedEvent.resource, 'edit');
                                                setSelectedEvent(null);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
                                        >
                                            <Edit size={16} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                onSlotClick(selectedEvent.resource, 'delete');
                                                setSelectedEvent(null);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl">
                                    {selectedEvent.status === 'live' ? (
                                        <>
                                            <Video size={18} />
                                            Join Class Now
                                        </>
                                    ) : (
                                        <>
                                            <BookOpen size={18} />
                                            View Materials
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import ClassCard from '../../components/teacher/ClassCard';
import usePageTitle from '../../hooks/usePageTitle';
import { Calendar, Clock, BookOpen, Activity, Zap, TrendingUp, Shield, ArrowUpRight } from 'lucide-react';

export default function TeacherDashboard() {
  usePageTitle('Teacher Dashboard', 'Teacher');

  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data }, { data: statsData }] = await Promise.all([
        api.get('/timetables/by-teacher'),
        api.get('/analytics/teacher')
      ]); 
      
      setStats(statsData.data);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = days[new Date().getDay()];
      
      const slots = data.data.slots || [];
      const todaySlots = slots.filter(s => s.day === todayName);

      const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayIndex = dayOrder.indexOf(todayName);
      const upcomingSlots = slots
        .filter(s => s.day !== todayName)
        .sort((a, b) => {
          const aIdx = (dayOrder.indexOf(a.day) - todayIndex + 7) % 7;
          const bIdx = (dayOrder.indexOf(b.day) - todayIndex + 7) % 7;
          return aIdx - bIdx;
        });

      setTodayClasses(todaySlots);
      setUpcomingClasses(upcomingSlots);
    } catch (e) {
      const message = e?.response?.data?.message || "We couldn't load your classes. Please refresh the page.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-[80vh] flex items-center justify-center"><LoadingSpinner centered /></div>;
  }

  const nextClass = todayClasses[0];

  return (
    <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
      {/* Page Header */}
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none mb-4">
             Teacher <span className="text-gradient-primary">Dashboard</span>
          </h1>
          <p className="text-on-surface-variant text-base md:text-lg font-body max-w-2xl leading-relaxed">
             Manage your classes and students effectively. Track your schedule, start live sessions, and monitor student engagement in real-time.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-start md:justify-end">
          <span className="px-3 py-1 rounded-full border border-outline-variant/30 text-xs font-label uppercase tracking-widest bg-surface-container-low text-on-surface-variant">
            Role: <span className="font-bold text-on-surface ml-1">Teacher</span>
          </span>
          <Link
            to="/home"
            className="text-xs font-label uppercase tracking-widest px-4 py-2 rounded-full border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary transition-colors bg-transparent"
          >
            Home
          </Link>
        </div>
      </header>

      {error && (
        <div className="p-6 bg-error/10 border border-error/20 rounded-[1.5rem] flex items-center gap-4 text-error font-body shadow-xl shadow-error/5">
             <Shield className="shrink-0" size={24} />
             <div>
                <div className="font-bold text-sm uppercase tracking-widest font-label mb-1">System Error</div>
                <div className="text-sm opacity-90">{error}</div>
             </div>
        </div>
      )}

      {/* Primary CTA: Start live session */}
      {nextClass && (
        <div className="mb-4">
          <div className="rounded-[2rem] bg-gradient-to-r from-primary to-secondary text-on-primary-container p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl shadow-primary/20">
            <div>
              <p className="text-xs font-label uppercase tracking-[0.2em] mb-2 opacity-80">Next class</p>
              <h2 className="text-xl md:text-2xl font-headline font-bold">
                Next class — <span className="underline decoration-on-primary-container/60 decoration-dotted">{nextClass.subject || 'Upcoming session'}</span>
              </h2>
              <p className="text-sm mt-1 opacity-90 font-body">
                Start your live session on time so students can join smoothly.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-on-primary-container text-primary text-sm font-headline font-bold shadow-md hover:bg-background transition-all"
            >
              Start Live Session
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group hover:bg-surface-bright/10 transition-all duration-500">
                <div className="font-label text-xs tracking-widest text-primary uppercase mb-4 flex items-center gap-2">
                    <Activity size={14} />
                    Classes Today
                </div>
                <div className="text-5xl font-bold text-on-surface mb-2 font-headline tracking-tighter">{todayClasses.length}</div>
                <div className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest font-bold">Planned sessions for today</div>
            </div>
            <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group hover:bg-surface-bright/10 transition-all duration-500">
                <div className="font-label text-xs tracking-widest text-secondary uppercase mb-4 flex items-center gap-2">
                    <TrendingUp size={14} />
                    Engagement
                </div>
                <div className="text-5xl font-bold text-on-surface mb-2 font-headline tracking-tighter">{stats?.engagementRate || 98.4}%</div>
                <div className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest font-bold">Average student participation</div>
            </div>
            <div className="bg-surface-container-highest p-8 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group hover:bg-white/5 transition-all duration-500">
                <div className="font-label text-xs tracking-widest text-on-surface-variant/70 uppercase mb-4 flex items-center gap-2">
                    <Zap size={14} />
                    System Status
                </div>
                <div className="text-3xl font-bold text-on-surface mb-2 font-headline uppercase">{stats?.status || 'Operational'}</div>
                <div className="text-secondary text-[10px] font-label uppercase tracking-widest font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    {stats?.linkStatus || 'Connection Secure'}
                </div>
            </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Today's Classes - Main Feed */}
        <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-on-surface font-headline tracking-tight flex items-center gap-3">
                    <Calendar className="text-primary" size={24} />
                    Today's Schedule
                </h2>
                <div className="text-[10px] font-label text-on-surface-variant/60 uppercase tracking-widest font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            </div>

            {todayClasses.length === 0 ? (
                <div className="bg-surface-container-low/50 glass-panel p-16 rounded-[2.5rem] border border-outline-variant/5 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-surface-container border border-outline-variant/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <Calendar className="text-on-surface-variant/40" size={32} />
                    </div>
                    <p className="font-headline text-xl text-on-surface font-bold mb-2">No classes scheduled</p>
                    <p className="font-body text-on-surface-variant/70 text-sm max-w-xs mx-auto">You have no classes scheduled for today. Take some time to prepare for your upcoming sessions.</p>
                    <div className="mt-6">
                      <Link
                        to="/teacher/timetable"
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-outline-variant/40 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:border-primary hover:text-primary transition-colors bg-transparent"
                      >
                        View Timetable
                      </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {todayClasses.map((classData) => (
                        <ClassCard key={classData._id} classData={classData} />
                    ))}
                </div>
            )}
        </div>

        {/* Side Portal: Upcoming Timeline */}
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-2 px-2">
                <h2 className="text-xl font-bold font-headline text-on-surface tracking-tight flex items-center gap-3">
                    <Clock className="text-secondary" size={20} />
                    Upcoming Classes
                </h2>
            </div>

            <div className="space-y-6 relative">
                {/* Visual Timeline Line */}
                <div className="absolute left-10 top-0 bottom-0 w-px bg-gradient-to-b from-secondary/40 via-secondary/10 to-transparent pointer-events-none"></div>

                {upcomingClasses.length > 0 ? (
                    upcomingClasses.slice(0, 5).map((slot, idx) => (
                        <div 
                            key={slot._id}
                            className="bg-surface-container glass-panel p-6 rounded-[2rem] border border-outline-variant/10 shadow-xl transition-all hover:translate-x-2 relative z-10 group"
                        >
                            <div className="flex gap-6 items-start">
                                <div className={`w-8 h-8 rounded-full flex flex-col items-center justify-center shrink-0 border border-secondary/30 transition-all group-hover:scale-110 shadow-[0_0_15px_rgba(var(--secondary-rgb),0.1)] bg-background`}>
                                    <span className="text-[10px] font-bold text-on-surface font-headline leading-none">{idx + 1}</span>
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <div className="text-on-surface font-bold text-sm mb-1 truncate font-headline tracking-wide uppercase">{slot.subject}</div>
                                    <div className="text-on-surface-variant/60 text-[10px] font-label tracking-widest uppercase mb-4 font-bold flex items-center gap-2">
                                        {slot.day} <span className="w-1 h-1 rounded-full bg-outline-variant/30"></span> {slot.startTime}
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-surface-container-high border border-outline-variant/10 text-[8px] font-label text-on-surface-variant/50 flex items-center justify-center font-bold">B</div>
                                            <span className="text-[10px] text-on-surface-variant/70 font-body">{slot.batch?.name || slot.batch}</span>
                                        </div>
                                        <ArrowUpRight size={14} className="text-secondary/40 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-surface-container glass-panel p-10 rounded-[2.5rem] border border-outline-variant/10 text-center opacity-60">
                         <p className="font-label text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-bold">No upcoming classes</p>
                    </div>
                )}

                {/* View Archive Node Button */}
                <Link
                  to="/teacher/library"
                  className="w-full py-4 rounded-[1.5rem] bg-surface-container-low border border-outline-variant/10 text-[10px] font-label uppercase tracking-widest text-on-surface-variant/70 font-bold hover:bg-surface-bright/20 hover:text-primary transition-all flex items-center justify-center gap-3"
                >
                   View Class Archives <TrendingUp size={14} />
                </Link>
            </div>

            {/* Teaching Tip / Sync Card */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-surface-variant/20 border border-outline-variant/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl transition-opacity group-hover:opacity-100 opacity-50"></div>
                <BookOpen className="text-primary mb-6" size={32} strokeWidth={1.5} />
                <h4 className="text-lg font-bold text-on-surface mb-3 font-headline tracking-tight">Teaching Tip</h4>
                <p className="text-on-surface-variant/80 text-sm font-body leading-relaxed mb-8">
                   {stats?.protocolTip || 'Use the AI summarizer during live sessions to provide students with real-time session highlights.'}
                </p>
                <div className="flex items-center gap-3">
                    <div className="h-0.5 w-8 bg-primary/30 rounded-full"></div>
                    <span className="text-[9px] font-label text-primary uppercase tracking-[0.2em] font-bold">Recommended Strategy</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

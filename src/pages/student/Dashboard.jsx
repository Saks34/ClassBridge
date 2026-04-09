import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ClassCard from '../../components/student/ClassCard';
import { useAuth } from '../../context/AuthContext';
import usePageTitle from '../../hooks/usePageTitle';
import { Calendar, BookOpen, Clock, Zap, Video, Award, TrendingUp, Shield, ArrowUpRight, Compass } from 'lucide-react';

export default function StudentDashboard() {
  usePageTitle('Student Dashboard', 'Student');
  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [watchHistory, setWatchHistory] = useState([]);
  const [personalStats, setPersonalStats] = useState(null);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const batchId = user?.batch?._id || user?.batch;
      if (!batchId) { setError('No batch assigned to your account'); setLoading(false); return; }

      const [timetableRes, watchRes, statsRes] = await Promise.all([
        api.get('/timetables/by-batch', { params: { batchId } }),
        api.get('/watch-history/me'),
        api.get('/analytics/student')
      ]);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = days[new Date().getDay()];
      const todaySlots = (timetableRes.data.data.slots || []).filter(s => s.day === todayName);

      setTodayClasses(todaySlots);
      setWatchHistory(watchRes.data || []);
      setPersonalStats(statsRes.data.data);
    } catch (e) {
      const message = e?.response?.data?.message || "We couldn't load your dashboard. Please refresh, or contact your administrator if this keeps happening.";
      setError(message);
    } finally { setLoading(false); }
  };

  const liveClasses = todayClasses.filter(c => c.status === 'Live' || c.liveClass?.status === 'Live');
  const nextClass = todayClasses[0];

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><LoadingSpinner centered /></div>;

  const studyHours = (watchHistory.reduce((acc, curr) => acc + (curr.lastPosition || 0), 0) / 3600).toFixed(1);

  return (
    <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
      {/* Page Header */}
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-[1.1] mb-2 flex items-center gap-4">
            Student <span className="text-gradient-secondary">Dashboard</span>
          </h1>
          <p className="text-on-surface-variant text-base md:text-lg font-body max-w-2xl leading-relaxed">
            Your learning hub on ClassBridge. Track your progress, see what&apos;s next, and join live classes without missing a beat.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-start md:justify-end">
          <span className="px-3 py-1 rounded-full border border-outline-variant/30 text-xs font-label uppercase tracking-widest bg-surface-container-low text-on-surface-variant">
            Role: <span className="font-bold text-on-surface ml-1">Student</span>
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
                <div className="font-bold text-sm uppercase tracking-widest font-label mb-1">System Alert</div>
                <div className="text-sm opacity-90">{error}</div>
             </div>
        </div>
      )}

      {/* Primary CTA: Next class */}
      {nextClass && (
        <div className="mb-4">
          <div className="rounded-[2rem] bg-gradient-to-r from-primary to-secondary text-on-primary-container p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl shadow-primary/20">
            <div>
              <p className="text-xs font-label uppercase tracking-[0.2em] mb-2 opacity-80">Next class</p>
              <h2 className="text-xl md:text-2xl font-headline font-bold">
                Next class at <span className="underline decoration-on-primary-container/60 decoration-dotted">{nextClass.startTime || 'upcoming'}</span>
              </h2>
              <p className="text-sm mt-1 opacity-90 font-body">
                Be ready to join on time and keep your attendance on track.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-on-primary-container text-primary text-sm font-headline font-bold shadow-md hover:bg-background transition-all"
            >
              Join
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group hover:bg-surface-bright/10 transition-all duration-500">
                <div className="font-label text-[10px] tracking-widest text-primary uppercase mb-4 flex items-center gap-2 font-bold">
                    <Calendar size={14} /> Total Classes
                </div>
                <div className="text-5xl font-bold text-on-surface mb-2 font-headline tracking-tighter">{todayClasses.length}</div>
                <div className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest font-bold">Planned sessions today</div>
           </div>
           
           <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group hover:bg-surface-bright/10 transition-all duration-500">
                <div className="font-label text-[10px] tracking-widest text-secondary uppercase mb-4 flex items-center gap-2 font-bold">
                    <Zap size={14} className={liveClasses.length > 0 ? 'animate-pulse fill-secondary' : ''} /> Live Classes
                </div>
                <div className="text-5xl font-bold text-on-surface mb-2 font-headline tracking-tighter">{liveClasses.length}</div>
                <div className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest font-bold">Classes currently ongoing</div>
           </div>

           <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group hover:bg-surface-bright/10 transition-all duration-500">
                <div className="font-label text-[10px] tracking-widest text-tertiary uppercase mb-4 flex items-center gap-2 font-bold">
                    <Award size={14} /> Study Time
                </div>
                <div className="text-5xl font-bold text-on-surface mb-2 font-headline tracking-tighter">{studyHours}h</div>
                <div className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest font-bold">Total hours learned</div>
           </div>

           <div className="bg-surface-container-highest p-8 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group hover:bg-surface-bright/5 transition-all duration-500">
                <div className="font-label text-[10px] tracking-widest text-on-surface-variant/70 uppercase mb-4 flex items-center gap-2 font-bold">
                    <Shield size={14} /> Account Security
                </div>
                <div className="text-3xl font-bold text-on-surface mb-2 font-headline uppercase">{personalStats?.linkStatus || 'Protected'}</div>
                <div className="text-secondary text-[10px] font-label uppercase tracking-widest font-bold flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full bg-secondary ${personalStats?.terminalSecure ? 'animate-pulse' : ''}`}></span>
                    Account {personalStats?.terminalSecure ? 'Secure' : 'Verifying'}
                </div>
            </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Feed: Today's Classes */}
        <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-on-surface font-headline tracking-tight flex items-center gap-3">
                    <Compass className="text-secondary" size={24} />
                    Today's Schedule
                </h2>
                <div className="text-[10px] font-label text-on-surface-variant/60 uppercase tracking-widest font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            </div>

            {todayClasses.length === 0 ? (
                <div className="bg-surface-container-low/50 glass-panel p-16 rounded-[2.5rem] border border-outline-variant/5 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-surface-container border border-outline-variant/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <BookOpen className="text-on-surface-variant/40" size={32} />
                    </div>
                    <p className="font-headline text-xl text-on-surface font-bold mb-2">No Classes Today</p>
                    <p className="font-body text-on-surface-variant/70 text-sm max-w-xs mx-auto">There are no classes scheduled for your batch today. Take some time to review your previous lessons.</p>
                    <div className="mt-6">
                      <Link
                        to="/student/library"
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-outline-variant/40 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:border-primary hover:text-primary transition-colors bg-transparent"
                      >
                        View Recordings
                      </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {todayClasses.map((classData) => (<ClassCard key={classData._id} classData={classData} />))}
                </div>
            )}
        </div>

        {/* Side Portal: Learning Stats & Tips */}
        <div className="space-y-8 lg:sticky lg:top-24 h-fit">
            <div className="bg-surface-container-low rounded-[2.5rem] border border-outline-variant/10 p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp size={40} className="text-secondary" />
                </div>
                <h3 className="text-xl font-bold font-headline text-on-surface mb-6 tracking-tight">Academic Progress</h3>
                
                <div className="space-y-8">
                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-label uppercase tracking-widest font-bold mb-1">
                            <span className="text-on-surface-variant/70">Overall Attendance</span>
                            <span className="text-secondary">{personalStats?.neuralProgress?.attendance || 88}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-variant/30 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-secondary/40 to-secondary transition-all duration-1000" style={{ width: `${personalStats?.neuralProgress?.attendance || 88}%` }}></div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-label uppercase tracking-widest font-bold mb-1">
                            <span className="text-on-surface-variant/70">Mastery Score</span>
                            <span className="text-primary">{personalStats?.neuralProgress?.mastery || 74}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-variant/30 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary/40 to-primary transition-all duration-1000" style={{ width: `${personalStats?.neuralProgress?.mastery || 74}%` }}></div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-outline-variant/10">
                         <button
                           className="w-full flex items-center justify-between text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 cursor-not-allowed bg-surface-container-low/60 rounded-full px-4 py-3"
                           type="button"
                           disabled
                           aria-disabled="true"
                         >
                            <span>Detailed Performance Analytics</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-outline-variant/20 text-on-surface-variant font-bold">
                              Coming soon
                            </span>
                         </button>
                    </div>
                </div>
            </div>

            {/* Quick Access Card */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-secondary/5 to-surface-variant/20 border border-outline-variant/10 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary/10 rounded-full blur-3xl transition-opacity group-hover:opacity-100 opacity-50"></div>
                <Video className="text-secondary mb-6" size={32} strokeWidth={1.5} />
                <h4 className="text-lg font-bold text-on-surface mb-3 font-headline tracking-tight">Recent Recordings</h4>
                <p className="text-on-surface-variant/70 text-sm font-body leading-relaxed mb-8">
                   You have <span className="text-on-surface font-bold">{watchHistory.length}</span> lesson recordings available for review.
                </p>
                <div className="flex items-center gap-3">
                    <Link
                      to="/student/library"
                      className="text-primary font-label text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-4 transition-all"
                    >
                       OPEN CLASS ARCHIVES <ArrowUpRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Tip of the Day */}
            <div className="bg-surface-container glass-panel p-8 rounded-[2rem] border border-outline-variant/10 shadow-xl">
                 <div className="flex items-center gap-3 mb-4">
                    <Zap size={14} className="text-primary" />
                    <span className="text-[9px] font-label text-on-surface-variant/60 uppercase tracking-widest font-bold">Daily Study Tip</span>
                 </div>
                  <p className="font-body text-on-surface-variant/80 text-xs italic leading-relaxed">
                    "{personalStats?.learnerProtocol || 'Regularly reviewing your recordings helps reinforce key concepts and improves learning retention.'}"
                  </p>
            </div>
        </div>
      </div>
    </div>
  );
}

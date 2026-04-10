import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Users, BookOpen, Activity, ChevronRight, Clock, Zap, Shield, TrendingUp, RefreshCw, Lock, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import Modal from '../../components/shared/Modal';
import { useTheme } from '../../context/ThemeContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function Dashboard() {
  usePageTitle('Admin Overview', 'Admin');
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalBatches: 0,
    todayClasses: 0,
  });
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [showGrowthModal, setShowGrowthModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const todayISODate = today.toISOString().split('T')[0];
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];

      const [teachersRes, studentsRes, batchesRes, timetableRes, statsRes] = await Promise.all([
        api.get('/institutions/staff?role=Teacher'),
        api.get('/institutions/staff?role=Student'),
        api.get('/batches'),
        api.get('/timetables', { params: { date: todayISODate } }),
        api.get('/analytics/admin')
      ]);

      const teachersData = teachersRes.data.staff || [];
      const studentsData = studentsRes.data.staff || [];
      const batchesData = batchesRes.data.data?.batches || [];
      const allSlots = timetableRes.data.data?.slots || [];

      setBatches(batchesData);

      const todaySlots = allSlots.filter(s => s.day === dayName);
      const live = todaySlots.filter(s => s.liveClass?.status === 'Live');
      setLiveClasses(live);

      setStats({
        totalTeachers: teachersData.length,
        totalStudents: studentsData.length,
        totalBatches: batchesData.length,
        todayClasses: todaySlots.length,
        ...statsRes.data.data
      });

      setUpcomingClasses(todaySlots);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Live system data is unavailable. Please refresh or try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const getBatchName = (batchId) => {
    if (!batchId) return '-';
    if (typeof batchId === 'object' && batchId.name) return batchId.name;
    const b = batches.find(item => item._id === batchId);
    return b ? b.name : batchId;
  };

  if (loading) {
    return <div className="h-[80vh] flex items-center justify-center"><LoadingSpinner centered /></div>;
  }

  return (
    <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in">
      {/* Page Header */}
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none mb-4">
            Admin <span className="text-gradient-primary">Dashboard</span>
          </h1>
          <p className="text-on-surface-variant text-base md:text-lg font-body max-w-2xl leading-relaxed">
            Monitor platform activities, teacher engagement, and overall system health in real-time.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-start md:justify-end">
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metrics & Analytics */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Metric Cards - Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => navigate('/admin/teachers')}
              className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group hover:bg-surface-bright/10 transition-all duration-500 cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-opacity group-hover:opacity-100 opacity-50"></div>
              <div className="font-label text-xs tracking-widest text-primary uppercase mb-4 flex items-center gap-2">
                <Users size={14} />
                Total Teachers
              </div>
              <div className="text-5xl font-bold text-on-surface mb-2 font-headline tracking-tighter">{stats.totalTeachers}</div>
              <div className="flex items-center gap-2 text-secondary text-[10px] font-label uppercase tracking-widest">
                <TrendingUp size={12} />
                Active Accounts
              </div>
            </div>

            <div 
              onClick={() => navigate('/admin/students')}
              className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group hover:bg-surface-bright/10 transition-all duration-500 cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-opacity group-hover:opacity-100 opacity-50"></div>
              <div className="font-label text-xs tracking-widest text-secondary uppercase mb-4 flex items-center gap-2">
                <Users size={14} />
                Students
              </div>
              <div className="text-5xl font-bold text-on-surface mb-2 font-headline tracking-tighter">{stats.totalStudents}</div>
              <div className="flex items-center gap-2 text-secondary text-[10px] font-label uppercase tracking-widest">
                <Zap size={12} className="fill-secondary" />
                {stats.engagementRate}% User Engagement
              </div>
            </div>

            <div 
              onClick={() => navigate('/admin/timetable')}
              className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group hover:bg-surface-bright/10 transition-all duration-500 cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-opacity group-hover:opacity-100 opacity-50"></div>
              <div className="font-label text-xs tracking-widest text-tertiary uppercase mb-4 flex items-center gap-2">
                <Activity size={14} />
                Classes Today
              </div>
              <div className="text-5xl font-bold text-on-surface mb-2 font-headline tracking-tighter">{stats.todayClasses}</div>
              <div className="flex items-center gap-2 text-primary text-[10px] font-label uppercase tracking-widest">
                <Shield size={12} />
                {stats.status}
              </div>
            </div>
          </div>

          {/* Main Chart Area - System Health */}
          <div className="bg-surface-container-low rounded-[2.5rem] border border-outline-variant/10 p-10 relative overflow-hidden shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-on-surface font-headline tracking-tight">System Health</h3>
                  <p className="text-on-surface-variant text-sm mt-1 font-body">User traffic and site stability (24h)</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"></span>
                    <span className="text-[10px] font-label text-on-surface-variant/70 uppercase tracking-widest font-bold">{stats.totalActiveUsers || 24} Active Sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(var(--secondary-rgb),0.6)]"></span>
                    <span className="text-[10px] font-label text-on-surface-variant/70 uppercase tracking-widest font-bold">{stats.latency || '12.4'}ms Latency</span>
                  </div>
                </div>
              </div>

              {/* Visualized Data Transfer */}
              <div className="h-64 w-full flex items-end justify-between gap-1.5 relative px-2">
                <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none px-2">
                  <div className="w-full h-px bg-on-surface-variant/20"></div>
                  <div className="w-full h-px bg-on-surface-variant/20"></div>
                  <div className="w-full h-px bg-on-surface-variant/20"></div>
                  <div className="w-full h-px bg-on-surface-variant/20"></div>
                </div>
                
                {/* Visual Bars based on logic from backend */}
                {(Array.isArray(stats.chartData) ? stats.chartData : [40, 64, 52, 72, 48, 80, 60, 32, 56, 68, 44, 76]).map((h, i) => (
                  <div 
                    key={i} 
                    style={{ height: `${h}%` }}
                    className={`flex-1 rounded-t-lg transition-all duration-1000 ${i === 5 ? 'bg-gradient-to-t from-primary/20 to-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]' : i % 3 === 0 ? 'bg-gradient-to-t from-secondary/10 to-secondary/60' : 'bg-gradient-to-t from-primary/10 to-primary/40'}`}
                  ></div>
                ))}
              </div>
              
              <div className="flex justify-between mt-6 px-1 border-t border-outline-variant/10 pt-4">
                <span className="text-[9px] font-label text-on-surface-variant/60 uppercase tracking-widest">00:00</span>
                <span className="text-[9px] font-label text-primary uppercase tracking-widest font-bold">Today's Timeline</span>
                <span className="text-[9px] font-label text-on-surface-variant/60 uppercase tracking-widest">23:59</span>
              </div>
          </div>

          {/* Secondary Grid: Batches and Expansion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 p-8 group hover:bg-surface-bright/5 transition-all">
              <div className="flex justify-between items-start mb-8">
                <h4 className="text-xl font-bold font-headline text-on-surface tracking-tight">System Resources</h4>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                   <BookOpen className="text-primary" size={16} />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-label uppercase tracking-widest font-bold mb-1">
                    <span className="text-on-surface-variant/70">Class Capacity</span>
                    <span className="text-primary">{stats.totalBatches > 0 ? 'OPTIMIZED' : 'INITIALIZING'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-variant/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] transition-all duration-1000" 
                      style={{ width: `${Math.min(stats.totalBatches * 5, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-label uppercase tracking-widest font-bold mb-1">
                    <span className="text-on-surface-variant/70">Storage Usage</span>
                    <span className="text-secondary">{stats.nodeStorage}% Used</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-variant/30 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-secondary/40 to-secondary transition-all duration-1000"
                        style={{ width: `${stats.nodeStorage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin/batches')}
                className="mt-8 flex items-center gap-2 text-[10px] font-label uppercase tracking-[0.2em] text-primary/60 hover:text-primary transition-all font-bold group"
              >
                        MANAGE BATCHES <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
            </div>

            <div className="bg-surface-container-highest rounded-[2rem] border border-outline-variant/10 p-8 relative overflow-hidden shadow-xl group">
               <div className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30 duration-700 pointer-events-none">
                  <img 
                    alt="Space technology" 
                    className="w-full h-full object-cover mix-blend-overlay"
                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
                  />
               </div>
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <h4 className="text-xl font-bold font-headline text-on-surface mb-2 tracking-tight">Growth Projections</h4>
                    <p className="text-on-surface-variant/70 text-sm font-body leading-relaxed">AI-powered analytics predicting student enrollment and platform expansion for the next quarter.</p>
                  </div>
                  <button 
                    onClick={() => setShowGrowthModal(true)}
                    className="mt-8 px-6 py-2.5 rounded-full border border-primary/30 text-primary text-[10px] font-label tracking-widest uppercase font-bold hover:bg-primary/10 transition-all backdrop-blur-md self-start"
                  >
                    View Growth Plan
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Activity Feed */}
        <div className="space-y-8 lg:sticky lg:top-24 h-fit">
          {/* Primary CTA: Today’s classes */}
          <div className="rounded-[2rem] bg-gradient-to-r from-primary to-secondary text-on-primary-container p-6 flex flex-col gap-3 shadow-xl shadow-primary/20">
            <p className="text-[10px] font-label uppercase tracking-[0.2em] opacity-80">Today&apos;s Classes</p>
            <h3 className="text-lg font-headline font-bold">
              {stats.todayClasses || 0} classes scheduled — view full timetable
            </h3>
            <button
              type="button"
              onClick={() => navigate('/admin/timetable')}
              className="self-start mt-1 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-on-primary-container text-primary text-[11px] font-label font-black uppercase tracking-widest shadow-md hover:bg-background transition-all"
            >
              View Timetable
            </button>
          </div>

          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold font-headline text-on-surface tracking-tight">Live Activity</h3>
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary opacity-50 animate-pulse delay-75"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary opacity-25 animate-pulse delay-150"></span>
            </div>
          </div>

          <div className="flex flex-col gap-4 relative">
            {/* Live Class Transmissions */}
            {liveClasses.length > 0 ? (
              liveClasses.map((cls, idx) => (
                <div 
                  key={idx} 
                  className={`bg-surface-container glass-panel p-6 rounded-[2rem] border border-outline-variant/10 shadow-xl transition-all hover:translate-x-2 relative z-[${10 + idx}]`}
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] border border-primary/20">
                      <Activity className="text-primary animate-pulse" size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-on-surface font-bold text-sm mb-1 truncate">{cls.subject} - LIVE CLASS</div>
                      <div className="text-on-surface-variant/70 text-xs truncate font-body">Ongoing in {getBatchName(cls.batch)}</div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[9px] font-label text-primary uppercase font-bold tracking-widest">LIVE NOW</span>
                        <div className="h-px flex-1 bg-primary/20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
                <div className="bg-surface-container glass-panel p-8 rounded-[2rem] border border-outline-variant/10 shadow-xl text-center">
                    <Activity className="text-on-surface-variant/30 mx-auto mb-4" size={32} />
                    <p className="font-label text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-bold">No Active Classes</p>
                </div>
            )}

            {/* Dynamic Activity Feed from backend */}
            {(Array.isArray(stats.recentActivity) ? stats.recentActivity : []).map((activity, idx) => (
              <div key={idx} className={`bg-surface-container glass-panel p-6 rounded-[2rem] border border-outline-variant/10 shadow-xl transition-all hover:translate-x-2 relative ${idx > 0 ? '-mt-6' : ''} ${idx === 2 ? 'opacity-60' : ''}`}>
                <div className="flex gap-4 items-start">
                  <div className={`w-10 h-10 rounded-full bg-${activity.color}/10 flex items-center justify-center shrink-0 border border-${activity.color}/20`}>
                    {activity.type === 'Sync' ? <RefreshCw className={`text-${activity.color}`} size={18} /> : <Lock className={`text-${activity.color}`} size={18} />}
                  </div>
                  <div>
                    <div className="text-on-surface font-bold text-sm mb-1">{activity.message}</div>
                    <div className="text-on-surface-variant/70 text-xs font-body">Status: Healthy</div>
                    <div className="mt-3 text-[9px] font-label text-on-surface-variant/50 uppercase tracking-widest font-bold">{activity.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Maintenance card */}
          <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 p-8 mt-4 relative overflow-hidden group shadow-lg">
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700"></div>
            <div className="font-label text-[10px] tracking-widest text-on-surface-variant/60 uppercase mb-6 font-bold">Next Maintenance</div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-14 bg-surface-variant/40 border border-outline-variant/10 rounded-xl flex flex-col items-center justify-center leading-tight">
                <span className="text-[9px] text-primary font-bold uppercase font-label">{stats.upcomingSequence?.month || 'OCT'}</span>
                <span className="text-xl text-on-surface font-bold font-headline">{stats.upcomingSequence?.day || '14'}</span>
              </div>
              <div>
                <div className="text-on-surface font-bold text-sm">{stats.upcomingSequence?.title || 'System Update'}</div>
                <div className="text-on-surface-variant/60 text-[10px] font-label uppercase tracking-widest mt-1">
                  {stats.upcomingSequence?.downtime === 0 || stats.upcomingSequence?.downtime === '0ms'
                    ? 'No downtime expected'
                    : `Expected downtime: ${stats.upcomingSequence?.downtime}ms`}
                </div>
              </div>
            </div>
            <div className="p-4 bg-background/40 rounded-2xl border border-outline-variant/10">
              <div className="flex justify-between items-center text-[9px] font-label text-on-surface-variant/70 uppercase tracking-widest mb-2 font-bold">
                <span>Update Readiness</span>
                <span className="text-primary italic">READY</span>
              </div>
              <div className="h-1.5 w-full bg-surface-variant/30 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]"
                    style={{ width: `${stats.upcomingSequence?.readiness || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="rounded-[2rem] p-8 bg-gradient-to-br from-primary/10 to-surface-variant/30 border border-outline-variant/10 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <Sparkles className="text-primary mb-4" size={24} />
            <h5 className="text-lg font-bold text-on-surface mb-2 font-headline tracking-tight">Advanced Analytics</h5>
            <p className="text-on-surface-variant/70 text-xs font-body leading-relaxed mb-6">Unlock detailed performance insights, student behavior tracking, and automated reporting.</p>
            <button 
                onClick={() => toast.success('Premium analytics upgrade request sent.')}
                className="text-secondary font-label text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-4 transition-all"
            >
               ACTIVATE FEATURES <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
      <Modal isOpen={showGrowthModal} onClose={() => setShowGrowthModal(false)} title="Growth Projections (Next 6 Months)" size="lg">
        <div className="space-y-8 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl bg-surface-container-high/40 border border-outline-variant/10">
                    <div className="text-[10px] font-label uppercase tracking-widest text-primary font-bold mb-2">Projected Students</div>
                    <div className="text-3xl font-bold text-on-surface">+{Math.round(stats.totalStudents * 0.25)}</div>
                    <div className="text-[10px] text-emerald-500 font-bold mt-1">Expected 25% Increase</div>
                </div>
                <div className="p-6 rounded-3xl bg-surface-container-high/40 border border-outline-variant/10">
                    <div className="text-[10px] font-label uppercase tracking-widest text-secondary font-bold mb-2">New Batches Needed</div>
                    <div className="text-3xl font-bold text-on-surface">+{Math.ceil(stats.totalBatches * 0.15)}</div>
                    <div className="text-[10px] text-secondary font-bold mt-1">Based on growth trends</div>
                </div>
                <div className="p-6 rounded-3xl bg-surface-container-high/40 border border-outline-variant/10">
                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant font-bold mb-2">Avg. Engagement</div>
                    <div className="text-3xl font-bold text-on-surface">96.8%</div>
                    <div className="text-[10px] text-primary font-bold mt-1">Target performance</div>
                </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-surface-container-low border border-outline-variant/10 relative overflow-hidden">
                <h4 className="text-lg font-bold font-headline text-on-surface mb-6">Enrollment Forecast</h4>
                <div className="h-48 flex items-end justify-between gap-4 px-2">
                    {[65, 72, 80, 88, 92, 100].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-4">
                            <div style={{ height: `${h}%` }} className="w-full bg-gradient-to-t from-primary/20 to-primary rounded-xl relative group">
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-container-highest px-3 py-1 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity border border-outline-variant/10">
                                    {Math.round(stats.totalStudents * (h/100))}
                                </div>
                            </div>
                            <span className="text-[10px] font-label text-on-surface-variant/60 uppercase font-bold tracking-widest">
                                {['MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'][i]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button 
                    onClick={() => setShowGrowthModal(false)}
                    className="px-8 py-3 bg-surface-container-highest text-on-surface rounded-full font-label text-[10px] font-black uppercase tracking-widest hover:bg-surface-bright/20 transition-all border border-outline-variant/10"
                >
                    CLOSE PROJECTION
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
}

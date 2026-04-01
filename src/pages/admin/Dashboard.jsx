import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Users, BookOpen, TrendingUp, Activity, Award, ChevronRight, Clock } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function Dashboard() {
  usePageTitle('Dashboard', 'Admin');
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
  const [cancelledClasses, setCancelledClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);

  // Mock data for recent activity since we don't have an endpoint yet


  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-500';
  const cardBg = isDark
    ? 'bg-gray-900/60 backdrop-blur-xl border-white/10'
    : 'bg-white/60 backdrop-blur-xl border-gray-200/50';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const todayISODate = today.toISOString().split('T')[0];
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];

      const [teachersRes, studentsRes, batchesRes, timetableRes] = await Promise.all([
        api.get('/institutions/staff?role=Teacher'),
        api.get('/institutions/staff?role=Student'),
        api.get('/batches'),
        api.get('/timetables', { params: { date: todayISODate } })
      ]);

      const teachersData = teachersRes.data.staff || [];
      const studentsData = studentsRes.data.staff || [];
      const batchesData = batchesRes.data.data?.batches || [];
      const allSlots = timetableRes.data.slots || [];

      setBatches(batchesData);

      const todaySlots = allSlots.filter(s => s.day === dayName);

      // Filter live classes (those with status 'Live')
      const live = todaySlots.filter(s => s.liveClass?.status === 'Live');
      setLiveClasses(live);

      setStats({
        totalTeachers: teachersData.length,
        totalStudents: studentsData.length,
        totalBatches: batchesData.length,
        todayClasses: todaySlots.length,
      });

      setUpcomingClasses(todaySlots);
      setCancelledClasses([]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBatchName = (batchId) => {
    if (!batchId) return '-';
    // Handle both object populate and id string
    if (typeof batchId === 'object' && batchId.name) return batchId.name;
    const b = batches.find(item => item._id === batchId);
    return b ? b.name : batchId;
  };

  const kpiData = [
    { title: 'Total Teachers', value: stats.totalTeachers, icon: Users, color: 'from-violet-500 to-purple-500' },
    { title: 'Total Students', value: stats.totalStudents, icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
    { title: 'Total Batches', value: stats.totalBatches, icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
    { title: "Today's Classes", value: stats.todayClasses, icon: Activity, color: 'from-orange-500 to-amber-500' },
  ];

  if (loading) {
    return <LoadingSpinner centered />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${textPrimary} mb-2`}>Dashboard</h1>
          <p className={textSecondary}>Monitor your institution's performance in real-time</p>
        </div>
        <button
          onClick={() => navigate('/admin/analytics')}
          className={`flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/50 hover:shadow-xl hover:scale-105 transition-all font-medium`}
        >
          <Award size={18} />
          View Analytics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className={`${cardBg} border rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white" size={24} />
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                  {kpi.change}
                </span>
              </div>
              <p className={`text-sm font-medium ${textSecondary} mb-1`}>{kpi.title}</p>
              <p className={`text-3xl font-bold ${textPrimary}`}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Classes */}
        <div className={`lg:col-span-2 ${cardBg} border rounded-2xl p-6 shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${textPrimary}`}>Upcoming Classes</h2>
            <button
              onClick={() => navigate('/admin/timetable')}
              className={`text-sm font-medium ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} flex items-center gap-1 transition-colors`}
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          {upcomingClasses.length > 0 ? (
            <div className="space-y-3">
              {upcomingClasses.slice(0, 5).map((cls, index) => {
                // Determine class status
                const classStatus = cls.status || cls.liveClass?.status || 'Scheduled';

                // Status color mapping
                let statusColor = isDark ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-green-100 text-green-700 border-green-200';
                let statusEmoji = '🟢';
                let statusText = 'Scheduled';

                if (classStatus === 'Live') {
                  statusColor = isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-700 border-red-200';
                  statusEmoji = '🔴';
                  statusText = 'LIVE';
                } else if (classStatus === 'Completed') {
                  statusColor = isDark ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-gray-100 text-gray-700 border-gray-200';
                  statusEmoji = '✅';
                  statusText = 'Completed';
                }

                return (
                  <div key={index} className={`${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-white/80 hover:bg-white border-purple-100'} border rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer group`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`font-bold ${textPrimary} text-lg`}>{cls.subject}</h3>
                          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border flex items-center gap-1.5 ${statusColor}`}>
                            <span>{statusEmoji}</span>
                            {statusText}
                          </span>
                        </div>
                        <p className={`text-sm ${textSecondary} mb-1`}>{cls.teacher?.name || 'Assigned Teacher'}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`flex items-center gap-1 ${textMuted}`}>
                            <Clock size={12} />
                            {cls.startTime} - {cls.endTime}
                          </span>
                          <span className={`flex items-center gap-1 ${textMuted}`}>
                            <BookOpen size={12} />
                            {getBatchName(cls.batch)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          console.log('Navigating to live class:', { cls, id: cls._id, type: typeof cls._id });
                          if (cls._id) {
                            navigate(`/admin/live-class/${String(cls._id)}`); // Ensure string
                          }
                        }}
                        className={`px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:shadow-xl`}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={`${textMuted} text-center py-8`}>No upcoming classes scheduled</p>
          )}
        </div>

        {/* Live Streams Monitoring */}
        <div className={`${cardBg} border rounded-2xl p-6 shadow-xl`}>
          <h2 className={`text-xl font-bold ${textPrimary} mb-6 flex items-center gap-2`}>
            <Activity size={20} className="text-red-500" />
            Live Streams
          </h2>
          {liveClasses.length > 0 ? (
            <div className="space-y-3">
              {liveClasses.map((cls, index) => (
                <div key={index} className={`${isDark ? 'bg-white/5' : 'bg-white/60'} rounded-xl p-4 border ${isDark ? 'border-white/10' : 'border-purple-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <p className={`text-sm font-bold ${textPrimary}`}>{cls.subject}</p>
                  </div>
                  <p className={`text-xs ${textSecondary} mb-1`}>{cls.teacher?.name || 'Teacher'}</p>
                  <p className={`text-xs ${textMuted}`}>{getBatchName(cls.batch)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className={`${textMuted} text-center py-8 text-sm`}>No live streams right now</p>
          )}
        </div>
      </div>

      {/* Cancelled Classes */}
      {cancelledClasses.length > 0 && (
        <div className={`${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50/80 border-red-200'} border rounded-2xl p-6 shadow-xl`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-red-400' : 'text-red-700'} mb-4 flex items-center gap-2`}>
            <Activity size={20} />
            Cancelled Classes
          </h2>
          <div className="space-y-3">
            {cancelledClasses.map((cls, index) => (
              <div key={index} className={`${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-white/60 border-red-200'} border rounded-xl p-4`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-bold ${textPrimary} text-lg mb-1`}>{cls.subject}</h3>
                    <div className="flex items-center gap-4 text-xs">
                      <span className={`flex items-center gap-1 ${textMuted}`}>
                        <Clock size={12} />
                        {cls.startTime} - {cls.endTime}
                      </span>
                      <span className={`flex items-center gap-1 ${textMuted}`}>
                        <BookOpen size={12} />
                        {getBatchName(cls.batch)}
                      </span>
                    </div>
                  </div>
                  <span className={`px-4 py-2 ${isDark ? 'bg-red-500/30 text-red-300' : 'bg-red-500 text-white'} text-sm font-bold rounded-full shadow-md`}>
                    Cancelled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

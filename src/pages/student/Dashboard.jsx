import { useEffect, useState } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ClassCard from '../../components/student/ClassCard';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import usePageTitle from '../../hooks/usePageTitle';
import { Calendar, BookOpen, Clock, Zap, Video, Award } from 'lucide-react';

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function StudentDashboard() {
  usePageTitle('Dashboard', 'Student');
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [watchHistory, setWatchHistory] = useState([]);

  useEffect(() => {
    loadTodayClasses();
    loadWatchStats();
  }, []);

  const loadTodayClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const date = todayISODate();
      const batchId = user?.batch?._id || user?.batch;

      if (!batchId) {
        setError('No batch assigned to your account');
        setLoading(false);
        return;
      }

      const { data } = await api.get('/timetables/by-batch', {
        params: { batchId, date },
      });

      const today = new Date().toISOString().split('T')[0];
      const todaySlots = (data.slots || []).filter(
        (s) => !s.date || s.date === today
      );

      setTodayClasses(todaySlots);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadWatchStats = async () => {
    try {
      const { data } = await api.get('/watch-history/me');
      setWatchHistory(data || []);
    } catch (e) {
      console.error('Failed to load watch history');
    }
  };

  const liveClasses = todayClasses.filter(c => c.status === 'Live' || c.liveClass?.status === 'Live');

  if (loading) return <LoadingSpinner centered />;

  const statsCards = [
    { icon: BookOpen, label: "Today's Classes", value: todayClasses.length, gradient: 'from-blue-500 to-cyan-500' },
    { icon: Zap, label: 'Live Now', value: liveClasses.length, gradient: 'from-rose-500 to-pink-500', pulse: liveClasses.length > 0 },
    { icon: Clock, label: 'Upcoming', value: todayClasses.filter(c => c.status === 'Scheduled').length, gradient: 'from-violet-500 to-purple-500' },
    { icon: Video, label: 'Attended', value: watchHistory.length, gradient: 'from-orange-500 to-amber-500' },
    { icon: Award, label: 'Study Hours', value: (watchHistory.reduce((acc, curr) => acc + (curr.lastPosition || 0), 0) / 3600).toFixed(1), gradient: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero */}
      <div className={`relative overflow-hidden rounded-2xl ${isDark ? 'bg-[#111118]/60' : 'bg-white/60'} backdrop-blur-xl border ${isDark ? 'border-white/5' : 'border-gray-200/50'}`}>
        <div className={`absolute top-0 right-0 w-60 h-60 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl`}></div>

        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-1">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
            Your Learning Hub
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Track classes, join live sessions, and access materials
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
            {statsCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} border ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} ${stat.pulse ? 'animate-pulse' : ''}`}>
                      <Icon className="text-white" size={16} />
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{stat.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className={`p-4 ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'} border rounded-xl text-sm`}>
          {error}
        </div>
      )}

      {/* Classes */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500`}>
            <Calendar className="text-white" size={18} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Today's Classes</h2>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{todayClasses.length} scheduled</p>
          </div>
        </div>

        {todayClasses.length === 0 ? (
          <div className={`${isDark ? 'bg-[#111118]/60 border-white/5' : 'bg-white/60 border-gray-200/50'} backdrop-blur-xl border p-12 text-center rounded-2xl`}>
            <div className={`mx-auto w-16 h-16 rounded-2xl ${isDark ? 'bg-blue-600/10' : 'bg-blue-50'} flex items-center justify-center mb-4`}>
              <BookOpen size={28} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
            </div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>No Classes Today</h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Enjoy your free time! 🎉</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {todayClasses.map((classData) => (
              <ClassCard key={classData._id} classData={classData} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, Bell, GraduationCap } from 'lucide-react';
import NotificationDropdown from '../shared/NotificationDropdown';

export default function TeacherTopBar() {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    const cardBg = isDark
        ? 'bg-gray-900/60 backdrop-blur-xl border-white/10'
        : 'bg-white/60 backdrop-blur-xl border-gray-200/50';

    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

    return (
        <header className={`h-20 ${cardBg} border-b z-40 sticky top-0 px-8 transition-all duration-200`}>
            <div className="h-full max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/teacher" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className={`p-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20`}>
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <h2 className={`text-lg font-bold ${textPrimary} leading-tight`}>
                            Teacher Portal
                        </h2>
                        <p className={`text-xs ${textMuted} font-medium`}>Welcome back, {user?.name?.split(' ')[0]}</p>
                    </div>
                </Link>

                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2.5 ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'} rounded-xl transition-all`}
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <NotificationDropdown />

                    <div className={`h-8 w-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden md:block">
                            <p className={`text-sm font-bold ${textPrimary}`}>{user?.name}</p>
                            <p className={`text-xs ${textMuted} font-medium`}>Teacher</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-0.5 shadow-lg shadow-violet-500/20">
                            <div className={`w-full h-full rounded-[10px] ${isDark ? 'bg-zinc-900' : 'bg-white'} flex items-center justify-center`}>
                                <span className={`text-sm font-bold bg-gradient-to-br from-violet-500 to-fuchsia-600 bg-clip-text text-transparent`}>
                                    {user?.name?.substring(0, 2).toUpperCase() || 'TE'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className={`p-2.5 ${isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'} rounded-xl transition-all`}
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
}

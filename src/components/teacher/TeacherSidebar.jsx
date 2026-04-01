import { NavLink } from 'react-router-dom';
import { BookOpen, Calendar, FileText, GraduationCap, Video } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function TeacherSidebar() {
    const { isDark } = useTheme();

    const menuItems = [
        { path: '/teacher/dashboard', label: 'Dashboard', icon: BookOpen, gradient: 'from-blue-500 to-cyan-500' },
        { path: '/teacher/timetable', label: 'Timetable', icon: Calendar, gradient: 'from-violet-500 to-purple-500' },
        { path: '/teacher/notes', label: 'My Notes', icon: FileText, gradient: 'from-rose-500 to-pink-500' },
        { path: '/teacher/library', label: 'Recordings', icon: Video, gradient: 'from-orange-500 to-amber-500' },
    ];

    return (
        <div className={`fixed left-0 top-0 bottom-0 w-64 ${isDark ? 'bg-[#111118]/80' : 'bg-white/70'} backdrop-blur-xl border-r ${isDark ? 'border-white/5' : 'border-gray-200/50'} flex flex-col z-20`}>
            {/* Logo */}
            <div className={`p-5 border-b ${isDark ? 'border-white/5' : 'border-gray-200/50'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 via-violet-600 to-cyan-600 flex items-center justify-center shadow-lg">
                        <GraduationCap className="text-white" size={18} />
                    </div>
                    <div>
                        <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>TeachFlow</h1>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Teacher Panel</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                <p className={`text-[10px] font-semibold uppercase tracking-wider px-3 mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Menu
                </p>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${isActive
                                    ? ''
                                    : `${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'}`
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <>
                                            <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl opacity-10`}></div>
                                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b ${item.gradient} rounded-r-full`}></div>
                                        </>
                                    )}
                                    <div className={`relative p-2 rounded-lg transition-all ${isActive
                                        ? `bg-gradient-to-br ${item.gradient} shadow-md`
                                        : `${isDark ? 'bg-white/5' : 'bg-gray-100'}`
                                        }`}>
                                        <Icon size={16} className={isActive ? 'text-white' : ''} />
                                    </div>
                                    <span className={`text-sm font-medium ${isActive ? (isDark ? 'text-white' : 'text-gray-900') : ''}`}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}

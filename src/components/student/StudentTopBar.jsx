import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, Bell, Search } from 'lucide-react';
import { useState } from 'react';
import NotificationDropdown from '../shared/NotificationDropdown';

export default function StudentTopBar() {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const [searchFocused, setSearchFocused] = useState(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <header className={`h-16 ${isDark ? 'bg-[#111118]/60' : 'bg-white/60'} backdrop-blur-xl border-b ${isDark ? 'border-white/5' : 'border-gray-200/50'} z-40 sticky top-0 px-6`}>
            <div className="h-full flex items-center justify-between gap-6">
                {/* Greeting & Search */}
                <div className="flex-1 flex items-center gap-6">
                    <div className="hidden lg:block">
                        <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
                        </h2>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Ready to learn something new?
                        </p>
                    </div>

                    {/* Search */}
                    <div className={`relative flex-1 max-w-sm transition-all ${searchFocused ? 'scale-[1.01]' : ''}`}>
                        <div className={`flex items-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100/80 border-gray-200/50'} border rounded-xl`}>
                            <Search size={16} className={`ml-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className={`w-full py-2 px-2 bg-transparent ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'} focus:outline-none text-sm`}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <NotificationDropdown />

                    <div className={`h-6 w-px mx-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>

                    {/* Profile */}
                    <div className="flex items-center gap-2">
                        <div className="text-right hidden md:block">
                            <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Student</p>
                        </div>
                        <div className="relative">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 p-0.5">
                                <div className={`w-full h-full rounded-md ${isDark ? 'bg-[#111118]' : 'bg-white'} flex items-center justify-center`}>
                                    <span className="text-xs font-bold bg-gradient-to-br from-blue-500 to-violet-500 bg-clip-text text-transparent">
                                        {user?.name?.substring(0, 2).toUpperCase() || 'ST'}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#111118]"></div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'}`}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}

import { useAuth } from '../../context/AuthContext';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import NotificationDropdown from '../shared/NotificationDropdown';

export default function TopBar() {
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    return (
        <header className="flex justify-between items-center w-full px-8 h-20 sticky top-0 bg-surface/20 backdrop-blur-md z-40 border-b border-outline-variant/10">
            <div className="flex items-center gap-6">
                
                <div className="hidden lg:flex items-center gap-6">
                    <div className="relative group">
                        <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant group-focus-within:text-primary transition-colors pointer-events-none">
                            <Search size={18} />
                        </span>
                        <input 
                            className="bg-surface-container-low border-0 border-b border-transparent focus:border-primary/30 rounded-full pl-10 pr-6 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-4 focus:ring-primary/5 w-80 transition-all outline-none" 
                            placeholder="Search neural pathways..." 
                            type="text" 
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2 md:gap-4 border-r border-outline-variant/10 pr-4 md:pr-6">
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-primary transition-all active:scale-95 group relative"
                    >
                        {isDark ? <Sun size={18} className="group-hover:rotate-45 transition-transform" /> : <Moon size={18} className="group-hover:-rotate-12 transition-transform" />}
                        <span className="absolute -bottom-10 right-0 p-2 bg-inverse-surface text-inverse-on-surface border border-outline-variant/20 rounded text-[8px] font-label uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Change Spectrum</span>
                    </button>
                    <NotificationDropdown />
                    
                </div>
            </div>
        </header>
    );
}

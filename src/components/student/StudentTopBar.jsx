import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, Bell, Search, Rocket } from 'lucide-react';
import NotificationDropdown from '../shared/NotificationDropdown';

export default function StudentTopBar() {
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    return (
        <header className="flex justify-between items-center w-full px-8 h-20 z-40 border-b border-outline-variant/20 sticky top-0" style={{ backgroundColor: 'color-mix(in srgb, var(--surface), transparent 20%)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <Rocket size={18} className="text-secondary" />
                    <h2 className="text-lg font-bold text-on-surface font-headline tracking-tight leading-tight">
                        Orbit Control
                    </h2>
                </div>
                
                <div className="hidden lg:flex items-center gap-6">
                    <div className="relative group">
                        <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant group-focus-within:text-secondary transition-colors pointer-events-none">
                            <Search size={18} />
                        </span>
                        <input 
                            className="bg-surface-container-low border-0 border-b border-transparent focus:border-secondary/30 rounded-full pl-10 pr-6 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-4 focus:ring-secondary/5 w-80 transition-all outline-none font-body" 
                            placeholder="Explore knowledge nodes..." 
                            type="text" 
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2 md:gap-4 border-r border-outline-variant/10 pr-4 md:pr-6">
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-secondary transition-all active:scale-95 group relative"
                    >
                        {isDark ? <Sun size={18} className="group-hover:rotate-45 transition-transform" /> : <Moon size={18} className="group-hover:-rotate-12 transition-transform" />}
                        <span className="absolute -bottom-10 right-0 p-2 bg-inverse-surface text-inverse-on-surface border border-outline-variant/20 rounded text-[8px] font-label uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Spectral Mode</span>
                    </button>
                    <NotificationDropdown />
                    
                </div>

                <div className="hidden sm:flex items-center gap-3 pl-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(98,250,227,0.4)] animate-pulse"></div>
                    <span className="text-[10px] font-label font-black text-on-surface uppercase tracking-widest">Signal Stable</span>
                </div>
            </div>
        </header>
    );
}

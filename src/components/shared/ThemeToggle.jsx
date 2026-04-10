import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = "" }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`relative w-20 h-10 rounded-full p-1 transition-all duration-500 ease-in-out flex items-center shadow-lg border-2 ${
                isDark 
                    ? 'bg-slate-900 border-slate-700 shadow-blue-900/20' 
                    : 'bg-blue-100 border-blue-200 shadow-blue-500/10'
            } ${className}`}
            aria-label="Toggle theme"
        >
            {/* Background elements */}
            <div className={`absolute inset-0 rounded-full overflow-hidden pointer-events-none`}>
                {/* Stars for dark mode */}
                <div className={`absolute inset-0 transition-opacity duration-700 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute top-2 left-4 w-0.5 h-0.5 bg-white rounded-full animate-pulse"></div>
                    <div className="absolute top-6 left-6 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-700"></div>
                    <div className="absolute top-3 left-10 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-500"></div>
                </div>
                {/* Clouds for light mode */}
                <div className={`absolute inset-0 transition-opacity duration-700 ${!isDark ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute top-5 left-10 w-6 h-2 bg-white/60 rounded-full blur-[2px]"></div>
                    <div className="absolute top-3 left-4 w-4 h-1.5 bg-white/40 rounded-full blur-[1px]"></div>
                </div>
            </div>

            {/* The Knob */}
            <div
                className={`flex items-center justify-center w-8 h-8 rounded-full shadow-md z-10 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform ${
                    isDark 
                        ? 'translate-x-10 bg-slate-800 rotate-[360deg]' 
                        : 'translate-x-0 bg-amber-400 rotate-0'
                }`}
            >
                {isDark ? (
                    <Moon size={16} className="text-yellow-200 animate-cb-float" />
                ) : (
                    <Sun size={18} className="text-amber-900 animate-cb-spin-slow" />
                )}
            </div>
        </button>
    );
}

import { useTheme } from '../../context/ThemeContext';

export default function StatusBadge({ status }) {
    const { isDark } = useTheme();

    const getStatusStyles = () => {
        switch (status) {
            case 'Live':
                return 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
            case 'Scheduled':
                return 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(83,221,252,0.1)]';
            case 'Completed':
                return 'bg-secondary/10 text-secondary border-secondary/20';
            case 'Cancelled':
                return 'bg-surface-variant/20 text-slate-500 border-outline-variant/10';
            default:
                return 'bg-surface-variant/20 text-slate-400 border-outline-variant/10';
        }
    };

    return (
        <span className={`px-3 py-1.5 rounded-lg text-[8px] font-label font-black uppercase tracking-[0.2em] border flex items-center gap-2 ${getStatusStyles()}`}>
            {status === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>}
            {status}
        </span>
    );
}

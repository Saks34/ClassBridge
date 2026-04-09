import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { Clock, BookOpen, ArrowRight, Users } from 'lucide-react';

export default function ClassCard({ classData }) {
    const navigate = useNavigate();
    const { _id, subject, batch, startTime, endTime } = classData;

    const status = classData.status || classData.liveClass?.status || 'Scheduled';

    const handleEnterClass = () => {
        if (_id && status !== 'Cancelled') {
            navigate(`/teacher/class/${_id}`);
        }
    };

    const getAccentColor = () => {
        switch (status) {
            case 'Live':      return { from: 'var(--error)', to: 'var(--error-dim)', glow: 'color-mix(in srgb, var(--error), transparent 85%)' };
            case 'Completed': return { from: 'var(--secondary)', to: 'var(--secondary-dim)', glow: 'rgba(98,250,227,0.1)' };
            case 'Cancelled': return { from: '#475569', to: '#64748b', glow: 'transparent' };
            default:          return { from: 'var(--primary)', to: 'var(--primary-dim)', glow: 'rgba(83,221,252,0.1)' };
        }
    };

    const accent = getAccentColor();

    return (
        <div
            className="group relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{
                background: 'color-mix(in srgb, var(--surface-container-low), transparent 20%)',
                border: '1px solid color-mix(in srgb, var(--outline-variant), transparent 70%)',
                boxShadow: `0 4px 24px color-mix(in srgb, var(--surface-container-highest), transparent 50%)`,
            }}
        >
            {/* Accent top bar */}
            <div
                className="h-1.5 w-full flex-shrink-0 transition-all duration-500 group-hover:h-2"
                style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }}
            />

            {/* Glow overlay on hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                style={{ background: `radial-gradient(ellipse at top, ${accent.glow}, transparent 70%)` }}
            />

            <div className="relative flex flex-col flex-1 p-6 gap-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Icon */}
                        <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
                            style={{
                                background: `linear-gradient(135deg, ${accent.from}22, ${accent.to}11)`,
                                border: `1px solid ${accent.from}33`,
                            }}
                        >
                            <BookOpen size={20} style={{ color: accent.from }} />
                        </div>
                        {/* Title */}
                        <div className="min-w-0">
                            <h3
                                className="text-base font-bold leading-snug truncate"
                                style={{ color: 'var(--on-surface)' }}
                            >
                                {subject}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Users size={10} style={{ color: 'var(--on-surface-variant)' }} />
                                <span
                                    className="text-[11px] font-medium uppercase tracking-wider truncate"
                                    style={{ color: 'var(--on-surface-variant)' }}
                                >
                                    {batch?.name || batch || 'No Batch'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <StatusBadge status={status} />
                </div>

                {/* Time row */}
                <div
                    className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                    style={{
                        background: 'color-mix(in srgb, var(--surface-container-high), transparent 40%)',
                        border: '1px solid color-mix(in srgb, var(--outline-variant), transparent 80%)',
                    }}
                >
                    <Clock size={14} style={{ color: accent.from, flexShrink: 0 }} />
                    <span
                        className="text-sm font-semibold tracking-tight"
                        style={{ color: 'var(--on-surface)' }}
                    >
                        {startTime} — {endTime}
                    </span>
                    <span
                        className="ml-auto text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: 'var(--on-surface-variant)' }}
                    >
                        60 min
                    </span>
                </div>

                {/* CTA Button */}
                <button
                    onClick={handleEnterClass}
                    disabled={status === 'Cancelled' || !_id}
                    className="mt-auto w-full py-3 px-5 rounded-2xl text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all duration-200 group/btn active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={
                        status === 'Cancelled' || !_id
                            ? { background: 'var(--surface-container-highest)', color: 'var(--on-surface-variant)' }
                            : {
                                background: `linear-gradient(135deg, ${accent.from}22, ${accent.to}11)`,
                                border: `1px solid ${accent.from}40`,
                                color: accent.from,
                                boxShadow: `0 0 20px ${accent.glow}`,
                              }
                    }
                >
                    {status === 'Cancelled' ? (
                        'Class Cancelled'
                    ) : (
                        <>
                            <span>
                                {status === 'Live' ? 'Enter Live Class' : status === 'Completed' ? 'View Details' : 'Open Class'}
                            </span>
                            <ArrowRight
                                size={13}
                                className="transition-transform duration-200 group-hover/btn:translate-x-1"
                            />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

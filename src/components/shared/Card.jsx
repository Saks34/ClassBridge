export default function Card({ title, value, subtitle, className = '' }) {
    return (
        <div className={`p-6 rounded-2xl bg-surface-container border border-outline-variant/10 shadow-sm transition-all hover:shadow-md ${className}`}>
            <h3 className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-[0.2em] font-headline">
                {title}
            </h3>
            <p className="text-4xl font-black text-on-surface mt-3 tracking-tighter">
                {value}
            </p>
            {subtitle && (
                <p className="text-[11px] font-medium text-primary mt-2 flex items-center gap-1.5 uppercase font-label tracking-widest">
                    {subtitle}
                </p>
            )}
        </div>
    );
}

export default function AnalyticsCard({ title, value, icon, subtitle, trend }) {
    return (
        <div className="p-6 rounded-2xl border border-outline-variant/10 bg-surface-container shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-on-surface-variant font-medium">{title}</p>
                    <p className="text-3xl font-bold text-on-surface mt-2 font-headline">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-on-surface-variant opacity-70 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <p className={`text-xs mt-2 font-bold ${trend > 0 ? 'text-green-500' : 'text-error'} flex items-center gap-1`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner bg-primary/10 text-primary">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}

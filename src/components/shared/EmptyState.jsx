import { PackageOpen } from 'lucide-react';

export default function EmptyState({ message, subMessage, action, actionLabel, icon: Icon = PackageOpen }) {
    return (
        <div className="p-12 text-center rounded-2xl border border-outline-variant/10 bg-surface-container/50 backdrop-blur-xl">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-inner bg-surface-container-high border border-outline-variant/10">
                <Icon size={40} className="text-on-surface-variant/40" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-on-surface">
                {message || 'No items found'}
            </h3>
            {subMessage && (
                <p className="text-on-surface-variant/70 max-w-md mx-auto">
                    {subMessage}
                </p>
            )}
            {action && actionLabel && (
                <button
                    onClick={action}
                    className="mt-6 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-medium shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

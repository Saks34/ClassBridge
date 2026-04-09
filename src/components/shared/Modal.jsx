import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-6xl',
    };

    const modalBg = 'bg-surface backdrop-blur-2xl border border-outline-variant/20 shadow-2xl';
    const textPrimary = 'text-on-surface';
    const borderColor = 'border-outline-variant/20';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
        >
            <div
                className={`${modalBg} rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${sizeClasses[size] || size} w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`flex items-center justify-between px-8 py-6 border-b ${borderColor}`}>
                    <h3 className={`text-xl font-bold ${textPrimary}`}>{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high rounded-xl p-2 transition-all"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className={`p-8 overflow-y-auto max-h-[calc(90vh-140px)] ${textPrimary}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}


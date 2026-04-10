import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import ThemeToggle from '../../components/shared/ThemeToggle';

export default function NotFound() {
    usePageTitle('Page Not Found');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <ThemeToggle className="fixed top-6 right-6 z-50" />
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="max-w-2xl w-full text-center relative z-10">
                <div className="font-headline font-black text-[150px] leading-none mb-4 tracking-tighter mix-blend-overlay opacity-80 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    404
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tight mb-6">
                    Page Not Found
                </h1>
                
                <p className="text-on-surface-variant text-lg font-body max-w-md mx-auto mb-10 leading-relaxed">
                    The requested page doesn't exist or you don't have permission to access it. Please return to your dashboard.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-8 py-4 bg-surface-container-high text-on-surface-variant font-label text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-surface-bright/20 hover:text-on-surface transition-all flex items-center justify-center gap-3 border border-outline-variant/10 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary font-label text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                    >
                        <Home size={16} className="group-hover:-translate-y-1 transition-transform" />
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

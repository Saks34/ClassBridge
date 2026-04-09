import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/home';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-body">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.1),transparent_50%)] pointer-events-none"></div>
                    
                    <div className="max-w-2xl w-full glass-panel border border-outline-variant/10 rounded-[3rem] p-12 lg:p-16 shadow-2xl relative z-10 overflow-hidden text-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                        
                        <div className="mb-10 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-3xl bg-error/10 border border-error/20 flex items-center justify-center mb-8 shadow-inner animate-pulse" aria-hidden="true">
                                <span className="material-symbols-outlined text-error text-5xl">warning</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-on-surface tracking-tighter leading-tight mb-4">
                                System <span className="text-gradient-primary">Error</span>
                            </h1>
                            <p className="text-on-surface-variant text-lg font-body max-w-sm">
                                An unexpected error has occurred while loading this page.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="mb-10 p-6 rounded-2xl bg-surface-container-high/50 border border-outline-variant/10 text-left overflow-hidden">
                                <p className="text-[10px] font-label uppercase tracking-widest text-primary/70 font-bold mb-3">Error Details</p>
                                <p className="text-sm font-mono text-on-surface leading-normal opacity-80 mb-0 break-words">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={this.handleReset}
                                className="w-full sm:w-auto px-10 py-4 bg-gradient-primary text-on-primary font-label text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                            >
                                <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">dashboard</span>
                                Return to Dashboard
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full sm:w-auto px-10 py-4 bg-surface-container-high text-on-surface-variant font-label text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-surface-bright/10 hover:text-on-surface transition-all flex items-center justify-center gap-3 border border-outline-variant/10 group"
                            >
                                <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">refresh</span>
                                Reload Page
                            </button>
                        </div>

                        <div className="mt-12 pt-8 border-t border-outline-variant/5 text-on-surface-variant/40 flex justify-center items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></div>
                             <p className="text-[10px] font-label uppercase tracking-widest font-bold">System recovery active</p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Sparkles, 
  ListChecks, 
  BookOpen, 
  ArrowRight, 
  Activity, 
  Clock,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClassSummary({ liveClassId, isTeacher = false }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const chapterItems = summary?.chapters?.length
        ? summary.chapters.map((chapter) => chapter?.content || chapter?.title || '').filter(Boolean)
        : (summary?.chapterSummaries || []);

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/live-classes/${liveClassId}/summary`);
            if (data.status === 'success' || data.data) {
                setSummary(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch class summary:', error);
        } finally {
            setLoading(false);
        }
    }, [liveClassId]);

    useEffect(() => {
        if (liveClassId) {
            fetchSummary();
        }
    }, [liveClassId, fetchSummary]);

    const handleRetry = async () => {
        try {
            setRetrying(true);
            const { data } = await api.post(`/live-classes/${liveClassId}/summary/retry`);
            if (data.status === 'success') {
                toast.success('AI summary generation re-triggered');
                setSummary({ status: 'pending' });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to retry summary');
        } finally {
            setRetrying(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-surface-container rounded-2xl border border-outline-variant/10 p-8 space-y-6 shadow-xl">
                <div className="h-8 w-1/3 bg-surface-container-high rounded-full"></div>
                <div className="space-y-3">
                    <div className="h-4 w-full bg-surface-container-high rounded-full"></div>
                    <div className="h-4 w-5/6 bg-surface-container-high rounded-full"></div>
                </div>
            </div>
        );
    }

    if (!summary || summary.status === 'pending' || summary.status === 'processing') {
        return (
            <div className="bg-surface-container rounded-[2rem] border border-outline-variant/10 p-12 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-30"></div>
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-6 shadow-inner">
                    <Activity className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3 font-headline uppercase tracking-widest">Creating Summary...</h3>
                <p className="text-sm text-on-surface-variant/70 max-w-md mx-auto font-body leading-relaxed">
                    Our AI is reading through the class discussion to create a summary.
                    This usually takes 2 to 5 minutes after the class ends.
                </p>
                <div className="mt-8 flex justify-center gap-6">
                    <button 
                        onClick={fetchSummary}
                        className="px-6 py-3 text-[10px] font-black text-on-surface uppercase tracking-widest border border-outline-variant/20 rounded-full hover:bg-surface-bright/10 transition-all"
                    >
                        Refresh
                    </button>
                    {isTeacher && (
                        <button 
                            disabled={retrying}
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-6 py-3 text-[10px] font-black text-primary border border-primary/20 rounded-full hover:bg-primary/10 transition-all uppercase tracking-widest shadow-lg shadow-primary/5"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                            Create Summary Now
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (summary.status === 'failed') {
        return (
            <div className="bg-surface-container rounded-2xl border border-error/20 p-12 text-center text-error shadow-xl">
                <div className="w-16 h-16 bg-error/10 flex items-center justify-center rounded-full mx-auto mb-6">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-headline uppercase tracking-widest mb-2">Could not create summary</h3>
                <p className="text-sm text-on-surface-variant font-body opacity-70 mb-8 max-w-md mx-auto">There was an error while generating the class summary.</p>
                {isTeacher && (
                    <button 
                        disabled={retrying}
                        onClick={handleRetry}
                        className="flex items-center gap-2 mx-auto px-8 py-3 bg-error text-on-error rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-error/20 hover:scale-105 transition-all"
                    >
                        <RefreshCcw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
                        TRY AGAIN
                    </button>
                )}
            </div>
        );
    }

    return (
         <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between gap-6 p-6 rounded-[2rem] bg-surface-container border border-outline-variant/10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-50 rounded-full"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary-variant shadow-lg shadow-primary/20">
                        <Sparkles className="w-8 h-8 text-on-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-on-surface font-headline tracking-tighter uppercase leading-none mb-1">Class Summary</h2>
                        <p className="text-[10px] font-black text-primary tracking-[0.3em] uppercase leading-none opacity-80">Created by AI Assistant</p>
                    </div>
                </div>
                {summary.generatedAt && (
                  <div className="hidden sm:flex flex-col items-end text-[10px] text-on-surface-variant font-black uppercase tracking-widest opacity-40">
                      <span>Generated</span>
                      <span>{new Date(summary.generatedAt).toLocaleDateString()}</span>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-surface-container rounded-[2rem] border border-outline-variant/10 overflow-hidden shadow-xl hover:shadow-2xl transition-all h-full flex flex-col">
                    <div className="bg-surface-container-high px-8 py-5 border-b border-outline-variant/10 flex items-center gap-4">
                        <ListChecks className="w-5 h-5 text-primary" />
                        <h3 className="text-xs font-black text-on-surface uppercase tracking-[0.2em] font-headline">Key Points</h3>
                    </div>
                    <div className="p-8 space-y-6 flex-1 bg-surface-container-low/30">
                        {summary.keyTakeaways?.map((item, idx) => (
                            <div key={idx} className="flex gap-5 group/item">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black shadow-inner group-hover/item:scale-110 transition-transform">
                                    {idx + 1}
                                </div>
                                <p className="text-[15px] font-body text-on-surface/80 leading-relaxed group-hover/item:text-on-surface transition-colors">
                                    {item}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-surface-container rounded-[2rem] border border-outline-variant/10 overflow-hidden shadow-xl hover:shadow-2xl transition-all h-full flex flex-col">
                    <div className="bg-surface-container-high px-8 py-5 border-b border-outline-variant/10 flex items-center gap-4">
                        <BookOpen className="w-5 h-5 text-secondary" />
                        <h3 className="text-xs font-black text-on-surface uppercase tracking-[0.2em] font-headline">Topic Summaries</h3>
                    </div>
                    <div className="p-8 space-y-8 flex-1 bg-surface-container-low/30 relative">
                        {chapterItems?.map((item, idx) => (
                            <div key={idx} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-[-2rem] before:w-px before:bg-outline-variant/20 last:before:hidden group/seg">
                                <div className="absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full border border-outline-variant/30 bg-surface-container-high group-hover/seg:bg-secondary group-hover/seg:border-secondary transition-all shadow-sm"></div>
                                <p className="text-[15px] font-body text-on-surface/80 leading-relaxed group-hover/seg:text-on-surface transition-colors">
                                    {item}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                 <div className="lg:col-span-2 bg-surface-container rounded-[2rem] border border-outline-variant/10 overflow-hidden shadow-xl">
                    <div className="bg-surface-container-high px-8 py-5 border-b border-outline-variant/10 flex items-center gap-4">
                        <ArrowRight className="w-5 h-5 text-primary" />
                        <h3 className="text-xs font-black text-on-surface uppercase tracking-[0.2em] font-headline">Next Steps</h3>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-low/30">
                        {summary.actionItems?.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-surface-container border border-outline-variant/10 hover:border-primary/30 transition-all group/action shadow-sm hover:shadow-md">
                                <div className="mt-1.5 w-3 h-3 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] group-hover:scale-125 transition-transform flex-shrink-0"></div>
                                <p className="text-[14px] font-body text-on-surface/80 italic leading-relaxed">"{item}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

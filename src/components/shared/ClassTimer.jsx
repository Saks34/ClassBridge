import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function ClassTimer({ startTime, endTime, status }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isCountingDown, setIsCountingDown] = useState(false);

    useEffect(() => {
        if (!startTime || status === 'Completed' || status === 'Cancelled') {
            setTimeLeft(status || '');
            return;
        }

        const timer = setInterval(() => {
            const now = new Date();
            const start = new Date(startTime);
            const end = new Date(endTime);

            if (now < start) {
                // Not started yet - countdown to start
                setIsCountingDown(true);
                const diff = start - now;
                setTimeLeft(formatDuration(diff));
            } else if (now >= start && now <= end) {
                // Ongoing - time remaining
                setIsCountingDown(false);
                const diff = end - now;
                setTimeLeft(formatDuration(diff));
            } else {
                // Overdue or Ended
                setIsCountingDown(false);
                setTimeLeft('Ended');
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, endTime, status]);

    const formatDuration = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const parts = [];
        if (hours > 0) parts.push(String(hours).padStart(2, '0'));
        parts.push(String(minutes).padStart(2, '0'));
        parts.push(String(seconds).padStart(2, '0'));

        return parts.join(':');
    };

    if (status === 'Completed') return null;

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm shadow-sm transition-all duration-300 ${
            isCountingDown 
            ? 'bg-primary/5 border-primary/20 text-primary animate-pulse' 
            : 'bg-surface-container-high border-outline-variant/10 text-on-surface'
        }`}>
            <Clock className={`w-4 h-4 ${isCountingDown ? 'animate-spin-slow' : ''}`} />
            <div className="flex flex-col leading-none">
                <span className="text-[8px] uppercase tracking-widest opacity-50 font-bold mb-0.5">
                    {isCountingDown ? 'Starts In' : 'Time Left'}
                </span>
                <span className="font-bold tracking-wider">{timeLeft}</span>
            </div>
        </div>
    );
}

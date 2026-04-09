import { useState, useEffect, useRef } from 'react';
import { HelpCircle, Clock, CheckCircle2, PlayCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SUPPORT_TEAM_ROLES = ['SuperAdmin', 'InstitutionAdmin', 'AcademicAdmin', 'Moderator'];
const ACTIVE_TICKET_STATUSES = ['open', 'triaged', 'assigned', 'in-progress', 'waiting-for-user', 'reopened'];

export default function SupportDropdown({ onViewAll }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [openCount, setOpenCount] = useState(0);
    const dropdownRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const isSupportTeam = SUPPORT_TEAM_ROLES.includes(user?.role);
    const dropdownPanelStyle = {
        backgroundColor: 'color-mix(in srgb, var(--surface-container-high), transparent 15%)',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
    };

    useEffect(() => {
        if (user) {
            loadTickets();
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const endpoint = isSupportTeam ? '/support/all' : '/support/my-tickets';
            const { data } = await api.get(endpoint, isSupportTeam ? { params: { limit: 5, page: 1 } } : undefined);
            const loadedTickets = data.data?.tickets || [];
            
            const unresolvedCount = loadedTickets.filter(t => ACTIVE_TICKET_STATUSES.includes(t.status)).length;
            
            setTickets(loadedTickets.slice(0, 5)); // Show only latest 5
            setOpenCount(unresolvedCount);
        } catch (error) {
            console.error('Failed to load tickets for dropdown:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTicketClick = () => {
        setIsOpen(false);
        if (onViewAll) {
            onViewAll();
        } else {
            const basePath = user?.role === 'Student' ? 'student' : user?.role === 'Teacher' ? 'teacher' : 'admin';
            navigate(`/${basePath}/support`);
        }
    };

    const getIcon = (status) => {
        switch (status) {
            case 'open': return <AlertCircle className="text-secondary" size={16} />;
            case 'triaged':
            case 'assigned':
            case 'in-progress': return <PlayCircle className="text-primary" size={16} />;
            case 'resolved': return <CheckCircle2 className="text-emerald-400" size={16} />;
            default: return <HelpCircle className="text-on-surface-variant" size={16} />;
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'open': return 'text-secondary bg-secondary/10';
            case 'triaged':
            case 'assigned':
            case 'in-progress': return 'text-primary bg-primary/10';
            case 'resolved': return 'text-emerald-400 bg-emerald-400/10';
            default: return 'text-on-surface-variant bg-surface-container';
        }
    };

    const formatTime = (ts) => {
        const date = new Date(ts);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`relative flex w-full min-w-[190px] items-center gap-3 rounded-[1.75rem] border px-4 py-3 text-left transition-all ${
                    isOpen || openCount > 0
                        ? 'border-secondary/20 bg-secondary/10 text-secondary shadow-[0_12px_30px_rgba(244,114,182,0.10)]'
                        : 'border-transparent bg-surface-container-high text-on-surface hover:bg-surface-bright'
                }`}
            >
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                    isOpen || openCount > 0
                        ? 'bg-secondary/15 text-secondary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                    <HelpCircle size={16} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-on-surface">
                        Ticket Hub
                    </p>
                    <p className="text-xs text-on-surface-variant/70">
                        Quick access
                    </p>
                </div>
                {openCount > 0 && (
                    <span className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full border-2 border-surface bg-secondary animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-3 w-80 rounded-2xl overflow-hidden z-[100] transform origin-top-right transition-all border border-outline-variant/20 backdrop-blur-2xl"
                    style={dropdownPanelStyle}
                >
                    <div className="p-4 border-b border-outline-variant/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-on-surface">Recent Support Tickets</h3>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 flex justify-center opacity-50">
                                <div className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="p-8 text-center opacity-50">
                                <HelpCircle className="w-8 h-8 mx-auto mb-2 text-on-surface-variant" />
                                <p className="text-xs">No active tickets</p>
                            </div>
                        ) : (
                            tickets.map((t) => (
                                 <div
                                    key={t._id}
                                    onClick={handleTicketClick}
                                    className={`p-4 border-b border-outline-variant/5 last:border-0 cursor-pointer flex gap-3 transition-colors relative group hover:bg-surface-bright/10`}
                                >
                                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getStatusColor(t.status)}`}>
                                        {getIcon(t.status)}
                                    </div>
                                     <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-xs font-bold truncate text-on-surface">
                                                {t.subject}
                                            </p>
                                            <span className="text-[10px] text-on-surface-variant/40 whitespace-nowrap flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatTime(t.createdAt)}
                                            </span>
                                        </div>
                                        <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm inline-block mb-1 ${getStatusColor(t.status)}`}>
                                            {t.status}
                                        </span>
                                        <p className="text-[11px] leading-relaxed line-clamp-1 text-on-surface-variant/70">
                                            {t.description}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                     <div className="p-3 border-t border-outline-variant/5 bg-surface-container-highest/20 text-center">
                        <button 
                            onClick={handleTicketClick}
                            className="text-[10px] font-bold text-on-surface-variant/50 hover:text-secondary uppercase tracking-widest w-full py-1"
                        >
                            View All Support Tickets
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

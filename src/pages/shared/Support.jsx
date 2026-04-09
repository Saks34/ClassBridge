import { useEffect, useState } from 'react';
import { AlertCircle, BookOpen, ChevronDown, ChevronRight, Clock, HelpCircle, List, Mail, MessageSquare, Phone, Search, UserPlus, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import SupportDropdown from '../../components/shared/SupportDropdown';

const SUPPORT_TEAM_ROLES = ['SuperAdmin', 'InstitutionAdmin', 'AcademicAdmin', 'Moderator'];
const STATUS_OPTIONS = ['open', 'triaged', 'assigned', 'in-progress', 'waiting-for-user', 'resolved', 'closed', 'reopened'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];
const CATEGORY_OPTIONS = ['general', 'technical', 'billing', 'report'];
const USER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
];
// TODO: replace SUPPORT_CONFIG with live API call to /api/system/status
const SUPPORT_CONFIG = {
  systemStatus: 'Operational',
  emailSLA: '24 hours',
  phoneHours: 'Mon-Fri, 9am-6pm',
};

const formatLabel = (value) => String(value || '').replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const staffRoleSet = new Set(SUPPORT_TEAM_ROLES.map((role) => role.toLowerCase()));
const statusGroups = {
  open: ['open', 'triaged', 'assigned', 'reopened', 'waiting-for-user'],
  'in-progress': ['triaged', 'assigned', 'in-progress', 'waiting-for-user'],
  resolved: ['resolved', 'closed'],
};

function getStatusColor(status) {
  switch (status) {
    case 'open':
    case 'reopened': return 'text-secondary bg-secondary/10 border-secondary/20';
    case 'triaged':
    case 'assigned':
    case 'waiting-for-user': return 'text-tertiary bg-tertiary/10 border-tertiary/20';
    case 'in-progress': return 'text-primary bg-primary/10 border-primary/20';
    case 'resolved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'closed': return 'text-on-surface-variant bg-surface-variant/30 border-outline-variant/10';
    default: return 'text-on-surface bg-surface-variant/20 border-outline-variant/10';
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'low': return 'text-slate-300 bg-slate-500/10 border-slate-500/20';
    case 'medium': return 'text-primary bg-primary/10 border-primary/20';
    case 'high': return 'text-orange-300 bg-orange-500/10 border-orange-500/20';
    case 'urgent': return 'text-red-300 bg-red-500/10 border-red-500/20';
    default: return 'text-on-surface bg-surface-variant/20 border-outline-variant/10';
  }
}

function getHistoryLabel(entry) {
  switch (entry?.action) {
    case 'ticket_created': return 'Ticket created';
    case 'status_changed': return `Status changed from ${formatLabel(entry.fromValue)} to ${formatLabel(entry.toValue)}`;
    case 'priority_changed': return `Priority changed from ${formatLabel(entry.fromValue)} to ${formatLabel(entry.toValue)}`;
    case 'assignment_changed': return `Assignment updated to ${entry.toValue || 'unassigned'}`;
    case 'reply_added': return entry.toValue === 'internal' ? 'Internal note added' : 'Reply added';
    default: return formatLabel(entry?.action || 'updated');
  }
}

function getStepperIndex(status) {
  if (status === 'resolved' || status === 'closed') return 3;
  if (['in-progress', 'assigned', 'waiting-for-user'].includes(status)) return 2;
  if (status === 'triaged') return 1;
  return 0;
}

function isUserMessage(message) {
  return !staffRoleSet.has(String(message?.senderRole || '').toLowerCase());
}

export default function Support() {
  usePageTitle('Help & Support');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSupportTeam = SUPPORT_TEAM_ROLES.includes(user?.role);
  const canUseInternalNotes = isSupportTeam;
  const [ticketData, setTicketData] = useState({ subject: '', category: 'general', priority: 'medium', description: '' });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showFullTable, setShowFullTable] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [userTab, setUserTab] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', page: 1, limit: 8 });
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [detailForm, setDetailForm] = useState({ status: 'open', priority: 'medium', assignedTo: '', resolutionNote: '' });
  const [staffOptions, setStaffOptions] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const faqs = [
    { q: 'How do I join a live class?', a: "Navigate to your Schedule, identify an ongoing class, and click the 'Join Live' button. Ensure your microphone/camera are allowed." },
    { q: 'Where can I find recorded sessions?', a: 'All recorded sessions are automatically stored in the Videos or Library section within 24 hours.' },
    { q: 'How do I reset my password?', a: 'Go to Settings > Change Password, or ask your administrator to trigger a reset link.' },
  ];

  useEffect(() => { loadTickets(); }, [user?.role]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isSupportTeam) loadTickets({ page: 1, search: searchInput });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, isSupportTeam]);
  useEffect(() => { if (isSupportTeam) loadTickets(); }, [filters.status, filters.category, filters.priority, filters.page, filters.limit, isSupportTeam]);
  useEffect(() => {
    if (!showFullTable) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => { if (event.key === 'Escape') setShowFullTable(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFullTable]);
  useEffect(() => { if (showFullTable && isSupportTeam) loadStaffOptions(); }, [showFullTable, isSupportTeam]);

  async function loadTickets(overrides = {}) {
    setLoading(true);
    try {
      if (isSupportTeam) {
        const next = { ...filters, ...overrides };
        const { data } = await api.get('/support/all', { params: { status: next.status || undefined, category: next.category || undefined, priority: next.priority || undefined, search: overrides.search !== undefined ? overrides.search : searchInput, page: next.page, limit: next.limit } });
        const response = data.data || {};
        setTickets(response.tickets || []);
        setMeta({ total: response.total || 0, page: response.page || 1, totalPages: response.totalPages || 1 });
        if (Object.keys(overrides).length) setFilters((current) => ({ ...current, ...overrides }));
      } else {
        const { data } = await api.get('/support/my-tickets');
        const ownTickets = data.data?.tickets || [];
        setTickets(ownTickets);
        setMeta({ total: ownTickets.length, page: 1, totalPages: 1 });
      }
    } catch (error) {
      console.error('Failed to load tickets', error);
      toast.error('Failed to load ticket history');
    } finally {
      setLoading(false);
    }
  }

  async function loadStaffOptions() {
    setStaffLoading(true);
    try {
      const { data } = await api.get('/support/staff-options');
      setStaffOptions(data.data?.staff || []);
    } catch (error) {
      console.error('Failed to load staff options', error);
    } finally {
      setStaffLoading(false);
    }
  }
  async function loadTicketDetail(ticketId) {
    setSelectedTicketId(ticketId);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/support/${ticketId}`);
      const ticket = data.data?.ticket;
      setSelectedTicket(ticket || null);
      setDetailForm({ status: ticket?.status || 'open', priority: ticket?.priority || 'medium', assignedTo: ticket?.assignedTo?._id || ticket?.assignedTo || '', resolutionNote: ticket?.resolutionNote || '' });
      setReplyBody('');
      setReplyInternal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load ticket details');
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshSelected(ticketId = selectedTicketId) {
    await loadTickets();
    if (ticketId) await loadTicketDetail(ticketId);
  }

  async function handleTicketSubmit(event) {
    event.preventDefault();
    try {
      await api.post('/support', ticketData);
      toast.success("Support ticket submitted successfully. We'll get back to you shortly!");
      setTicketData({ subject: '', category: 'general', priority: 'medium', description: '' });
      setUserTab('all');
      loadTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit ticket');
    }
  }

  async function handleTicketUpdate(reopenOnly = false) {
    if (!selectedTicketId) return;
    if (!reopenOnly && detailForm.status === 'resolved' && !detailForm.resolutionNote.trim()) {
      toast.error('Please add a resolution note before resolving the ticket');
      return;
    }
    try {
      await api.patch(`/support/${selectedTicketId}`, reopenOnly ? { status: 'reopened' } : { status: detailForm.status, priority: detailForm.priority, assignedTo: detailForm.assignedTo || null, resolutionNote: detailForm.resolutionNote });
      toast.success(reopenOnly ? 'Ticket reopened' : 'Ticket updated successfully');
      refreshSelected(selectedTicketId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update ticket');
    }
  }

  async function handleReplySubmit() {
    if (!selectedTicketId || !replyBody.trim()) return;
    setSendingReply(true);
    try {
      await api.post(`/support/${selectedTicketId}/reply`, { body: replyBody, isInternal: canUseInternalNotes && replyInternal });
      toast.success(canUseInternalNotes && replyInternal ? 'Internal note added' : 'Reply sent');
      setReplyBody('');
      setReplyInternal(false);
      refreshSelected(selectedTicketId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  }

  const visibleTickets = isSupportTeam ? tickets : tickets.filter((ticket) => {
    if (userTab === 'all') return true;
    return (statusGroups[userTab] || []).includes(ticket.status);
  });

  const duplicateMatches = tickets
    .filter((ticket) => !['resolved', 'closed'].includes(ticket.status))
    .filter((ticket) => {
      const keyword = `${ticketData.subject} ${ticketData.description}`.trim().toLowerCase();
      if (keyword.length < 4) return false;
      const haystack = `${ticket.subject} ${ticket.description}`.toLowerCase();
      return keyword.split(/\s+/).filter(Boolean).some((term) => term.length > 2 && haystack.includes(term));
    })
    .slice(0, 3);

  const ticketSummary = {
    total: isSupportTeam ? meta.total : tickets.length,
    open: tickets.filter((ticket) => !['resolved', 'closed'].includes(ticket.status)).length,
    resolved: tickets.filter((ticket) => ['resolved', 'closed'].includes(ticket.status)).length,
  };

  const stepperIndex = getStepperIndex(selectedTicket?.status);

  return (
    <div className="max-w-screen-2xl mx-auto space-y-12 animate-fade-in pb-12">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
          <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none">Help & <span className="text-gradient-primary">Support</span></h1>
          <div className="w-full md:w-auto"><SupportDropdown onViewAll={() => setShowFullTable(true)} /></div>
        </div>
        <p className="text-on-surface-variant text-base md:text-lg font-body max-w-2xl leading-relaxed">{isSupportTeam ? 'Manage support requests, assignments, priorities, and replies from one console.' : 'Submit a ticket, check for similar open issues first, and continue the conversation in one place.'}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/10 shadow-lg group hover:border-primary/20 transition-all"><div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary"><Mail size={24} /></div><h3 className="text-lg font-bold font-headline text-on-surface mb-2 tracking-tight">Email Support</h3><p className="text-sm font-body text-on-surface-variant/70 mb-4">Replies typically within {SUPPORT_CONFIG.emailSLA}.</p><a href="mailto:support@classbridge.edu" className="text-[10px] font-label uppercase tracking-widest text-primary font-bold hover:underline">support@classbridge.edu</a></div>
          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/10 shadow-lg group hover:border-secondary/20 transition-all"><div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4 text-secondary"><Phone size={24} /></div><h3 className="text-lg font-bold font-headline text-on-surface mb-2 tracking-tight">Phone Support</h3><p className="text-sm font-body text-on-surface-variant/70 mb-4">Available {SUPPORT_CONFIG.phoneHours}.</p><a href="tel:+1800BRIDGE" className="text-[10px] font-label uppercase tracking-widest text-secondary font-bold hover:underline">+1-800-BRIDGE</a></div>
          <div className="bg-gradient-to-br from-surface-container-highest to-background p-8 rounded-[2rem] border border-outline-variant/5 shadow-xl relative overflow-hidden"><div className="absolute -top-4 -right-4 w-24 h-24 bg-tertiary/10 rounded-full blur-xl"></div><Clock className="text-tertiary mb-3 opacity-80" size={20} /><h4 className="text-md font-bold font-headline text-on-surface mb-2">System Status</h4><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)] animate-pulse"></div><span className="text-xs font-label uppercase text-on-surface-variant tracking-widest font-bold">{SUPPORT_CONFIG.systemStatus}</span></div></div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {!isSupportTeam && (
            <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10"></div>
              <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center border border-outline-variant/10"><MessageSquare size={18} className="text-primary" /></div><h2 className="text-2xl font-bold font-headline text-on-surface tracking-tight">Submit a Ticket</h2></div>
              <form onSubmit={handleTicketSubmit} className="space-y-6">
                <div className="rounded-[1.75rem] border border-primary/10 bg-primary/5 p-5"><div className="flex items-center gap-2 text-sm font-bold text-on-surface"><Search size={16} className="text-primary" />Check existing tickets</div><p className="mt-2 text-sm text-on-surface-variant/70">We search your open tickets while you type so you can avoid submitting duplicates.</p><div className="mt-4 space-y-3">{duplicateMatches.length === 0 ? <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-high/40 px-4 py-3 text-sm text-on-surface-variant/70">No similar open tickets found yet.</div> : duplicateMatches.map((ticket) => <button key={ticket._id} type="button" onClick={() => { setShowFullTable(true); loadTicketDetail(ticket._id); }} className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-high/45 px-4 py-3 text-left transition-colors hover:border-primary/20 hover:bg-surface-container-high"><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getStatusColor(ticket.status)}`}>{formatLabel(ticket.status)}</span><span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getPriorityColor(ticket.priority)}`}>{formatLabel(ticket.priority)}</span></div><p className="mt-2 text-sm font-bold text-on-surface">{ticket.subject}</p><p className="mt-1 line-clamp-2 text-sm text-on-surface-variant/70">{ticket.description}</p></button>)}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="space-y-2"><label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Category</label><select value={ticketData.category} onChange={(event) => setTicketData({ ...ticketData, category: event.target.value })} className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface outline-none font-body text-sm appearance-none cursor-pointer">{CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{formatLabel(category)}</option>)}</select></div><div className="space-y-2"><label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Priority</label><select value={ticketData.priority} onChange={(event) => setTicketData({ ...ticketData, priority: event.target.value })} className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface outline-none font-body text-sm appearance-none cursor-pointer">{PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{formatLabel(priority)}</option>)}</select></div><div className="space-y-2"><label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Subject</label><input type="text" required value={ticketData.subject} onChange={(event) => setTicketData({ ...ticketData, subject: event.target.value })} className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 outline-none font-body text-sm" placeholder="Brief summary of your request" /></div></div>
                <div className="space-y-2"><label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Description</label><textarea required value={ticketData.description} onChange={(event) => setTicketData({ ...ticketData, description: event.target.value })} className="w-full px-5 py-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface placeholder:text-on-surface-variant/40 outline-none font-body text-sm min-h-[150px] resize-y" placeholder="Please provide details about the help you need..." /></div>
                <div className="flex justify-end pt-2"><button type="submit" disabled={loading} className="px-8 py-4 bg-primary text-on-primary rounded-xl font-label text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-primary/20 hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50">Submit Request<Zap size={14} /></button></div>
              </form>
            </div>
          )}
          <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-lg">
            <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center border border-outline-variant/10"><HelpCircle size={18} className="text-secondary" /></div><h2 className="text-xl font-bold font-headline text-on-surface tracking-tight">Frequently Asked Questions</h2></div>
            <div className="space-y-4">{faqs.map((faq, index) => <div key={faq.q} onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} className={`p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${expandedFaq === index ? 'bg-surface-container-high border-primary/20 shadow-md' : 'bg-surface-container-high/40 border-outline-variant/5 group hover:bg-surface-container-high'}`}><h5 className="font-bold text-on-surface text-md font-headline tracking-tight flex items-center justify-between select-none">{faq.q}<ChevronRight size={18} className={`text-on-surface-variant transition-transform duration-300 ${expandedFaq === index ? 'rotate-90 text-primary' : ''}`} /></h5><div className={`grid transition-all duration-300 ease-in-out ${expandedFaq === index ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}><p className="text-on-surface-variant/80 font-body text-sm leading-relaxed overflow-hidden">{faq.a}</p></div></div>)}</div>
            <button onClick={() => navigate('/docs')} className="mt-8 w-full py-4 bg-surface-container-highest text-on-surface rounded-xl font-label text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-bright/20 transition-all border border-outline-variant/10 flex gap-2 justify-center group"><BookOpen size={14} className="text-primary group-hover:scale-110 transition-transform" /> View Complete Documentation</button>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-[120] transition-all duration-300 ${showFullTable ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div onClick={() => setShowFullTable(false)} className={`absolute inset-0 bg-[#020817]/70 backdrop-blur-sm transition-opacity duration-300 ${showFullTable ? 'opacity-100' : 'opacity-0'}`} />
        <aside className={`absolute right-0 top-0 h-full w-full max-w-[1180px] transform border-l border-outline-variant/10 bg-[#081228]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-transform duration-300 ${showFullTable ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex h-full flex-col">
            <div className="border-b border-outline-variant/10 px-6 py-5 md:px-8">
              <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-secondary"><List size={12} />Ticket Console</div><h2 className="text-2xl font-bold font-headline tracking-tight text-on-surface">{isSupportTeam ? 'Support Operations Console' : 'My Support Tickets'}</h2><p className="mt-1 text-sm text-on-surface-variant/70">Select any ticket to view the full conversation, workflow controls, and audit log.</p></div><button type="button" onClick={() => setShowFullTable(false)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant/10 bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-bright hover:text-on-surface"><X size={18} /></button></div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-outline-variant/10 bg-surface-container-high/50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">Total</p><p className="mt-2 text-2xl font-bold text-on-surface">{ticketSummary.total}</p></div><div className="rounded-2xl border border-secondary/15 bg-secondary/10 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary/80">Active</p><p className="mt-2 text-2xl font-bold text-secondary">{ticketSummary.open}</p></div><div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300/80">Resolved</p><p className="mt-2 text-2xl font-bold text-emerald-300">{ticketSummary.resolved}</p></div></div>
              {isSupportTeam ? <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-4"><select value={filters.status} onChange={(event) => loadTickets({ status: event.target.value, page: 1 })} className="rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none"><option value="">All statuses</option>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select><select value={filters.category} onChange={(event) => loadTickets({ category: event.target.value, page: 1 })} className="rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none"><option value="">All categories</option>{CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{formatLabel(category)}</option>)}</select><select value={filters.priority} onChange={(event) => loadTickets({ priority: event.target.value, page: 1 })} className="rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none"><option value="">All priorities</option>{PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{formatLabel(priority)}</option>)}</select><div className="relative"><Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/45" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search subject or description" className="w-full rounded-xl border border-outline-variant/10 bg-surface-container-high pl-11 pr-4 py-3 text-sm text-on-surface outline-none" /></div></div> : <div className="mt-6 flex flex-wrap gap-2">{USER_TABS.map((tab) => <button key={tab.key} type="button" onClick={() => setUserTab(tab.key)} className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${userTab === tab.key ? 'border-primary/20 bg-primary/10 text-primary' : 'border-outline-variant/10 bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}>{tab.label}</button>)}</div>}
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="grid h-full grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)]">
                <div className="border-b border-outline-variant/10 xl:border-b-0 xl:border-r overflow-y-auto px-6 py-6 md:px-8">
                  {loading ? <div className="flex h-full min-h-[320px] items-center justify-center"><div className="h-10 w-10 rounded-full border-4 border-primary/25 border-t-primary animate-spin"></div></div> : visibleTickets.length === 0 ? <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-outline-variant/15 bg-surface-container-high/20 px-8 text-center"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-container-high text-on-surface-variant/70"><AlertCircle size={28} /></div><h3 className="text-xl font-bold font-headline text-on-surface">No tickets found</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant/70">Adjust filters or create a new request to start a conversation with support.</p></div> : <div className="space-y-4">{visibleTickets.map((ticket) => <button key={ticket._id} type="button" onClick={() => loadTicketDetail(ticket._id)} className={`w-full rounded-[1.75rem] border p-5 text-left shadow-lg transition-colors ${selectedTicketId === ticket._id ? 'border-primary/25 bg-surface-container-high/70' : 'border-outline-variant/10 bg-surface-container-high/35 hover:border-primary/20 hover:bg-surface-container-high/50'}`}><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getStatusColor(ticket.status)}`}>{formatLabel(ticket.status)}</span><span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getPriorityColor(ticket.priority)}`}>{formatLabel(ticket.priority)}</span></div><h3 className="mt-4 text-lg font-bold font-headline tracking-tight text-on-surface">{ticket.subject}</h3><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-on-surface-variant/55"><span>{formatLabel(ticket.category)}</span><span>{new Date(ticket.createdAt).toLocaleDateString()}</span>{isSupportTeam && ticket.user?.name && <span>{ticket.user.name}</span>}{isSupportTeam && ticket.institution?.name && <span className="text-primary/70">{ticket.institution.name}</span>}{ticket.assignedTo?.name && <span className="text-tertiary/80">Assigned: {ticket.assignedTo.name}</span>}</div><p className="mt-4 text-sm leading-relaxed text-on-surface-variant/78 line-clamp-2">{ticket.description}</p></button>)}{isSupportTeam && <div className="flex items-center justify-between gap-3 pt-2"><button type="button" disabled={meta.page <= 1} onClick={() => loadTickets({ page: filters.page - 1 })} className="rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface disabled:opacity-40">Previous</button><div className="flex flex-wrap items-center justify-center gap-2">{Array.from({ length: meta.totalPages }, (_, index) => index + 1).slice(0, 6).map((pageNumber) => <button key={pageNumber} type="button" onClick={() => loadTickets({ page: pageNumber })} className={`h-9 min-w-9 rounded-xl border px-3 text-[10px] font-black uppercase tracking-[0.16em] ${meta.page === pageNumber ? 'border-primary/20 bg-primary/10 text-primary' : 'border-outline-variant/10 bg-surface-container-high text-on-surface-variant'}`}>{pageNumber}</button>)}</div><button type="button" disabled={meta.page >= meta.totalPages} onClick={() => loadTickets({ page: filters.page + 1 })} className="rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface disabled:opacity-40">Next</button></div>}</div>}
                </div>
                <div className="overflow-y-auto px-6 py-6 md:px-8">
                  {!selectedTicketId ? <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-outline-variant/15 bg-surface-container-high/20 px-8 text-center"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-container-high text-on-surface-variant/70"><MessageSquare size={28} /></div><h3 className="text-xl font-bold font-headline text-on-surface">Choose a ticket</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant/70">Select any ticket from the list to view the full conversation and workflow details.</p></div> : detailLoading ? <div className="flex h-full min-h-[320px] items-center justify-center"><div className="h-10 w-10 rounded-full border-4 border-primary/25 border-t-primary animate-spin"></div></div> : selectedTicket ? <div className="space-y-6">
                    <div className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-high/35 p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getStatusColor(selectedTicket.status)}`}>{formatLabel(selectedTicket.status)}</span><span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getPriorityColor(selectedTicket.priority)}`}>{formatLabel(selectedTicket.priority)}</span></div><h3 className="mt-4 text-2xl font-bold font-headline tracking-tight text-on-surface">{selectedTicket.subject}</h3><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-on-surface-variant/55"><span>{formatLabel(selectedTicket.category)}</span><span>Opened {new Date(selectedTicket.createdAt).toLocaleString()}</span>{selectedTicket.user?.name && <span>{selectedTicket.user.name}</span>}{selectedTicket.assignedTo?.name && <span className="text-tertiary/80">Assigned to {selectedTicket.assignedTo.name}</span>}</div>{selectedTicket.resolvedBy?.name && selectedTicket.resolvedAt && <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Resolved by {selectedTicket.resolvedBy.name} on {new Date(selectedTicket.resolvedAt).toLocaleString()}</div>}</div>{!isSupportTeam && ['resolved', 'closed'].includes(selectedTicket.status) && <button type="button" onClick={() => handleTicketUpdate(true)} className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary hover:text-on-primary">Reopen Ticket</button>}</div><div className="mt-6 grid grid-cols-4 gap-3">{['Open', 'Triaged', 'In Progress', 'Resolved'].map((step, index) => <div key={step} className="space-y-2"><div className={`h-2 rounded-full ${stepperIndex >= index ? 'bg-primary' : 'bg-surface-container-highest'}`}></div><p className={`text-[10px] font-black uppercase tracking-[0.16em] ${stepperIndex >= index ? 'text-primary' : 'text-on-surface-variant/45'}`}>{step}</p></div>)}</div></div>
                    {isSupportTeam && <div className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-high/30 p-6"><div className="flex items-center gap-3 mb-5"><UserPlus size={16} className="text-tertiary" /><h4 className="text-lg font-bold font-headline text-on-surface">Workflow Controls</h4></div><div className="grid grid-cols-1 gap-4 lg:grid-cols-3"><div className="space-y-2"><label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Status</label><select value={detailForm.status} onChange={(event) => setDetailForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none">{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select></div><div className="space-y-2"><label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Priority</label><select value={detailForm.priority} onChange={(event) => setDetailForm((current) => ({ ...current, priority: event.target.value }))} className="w-full rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none">{PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{formatLabel(priority)}</option>)}</select></div><div className="space-y-2"><label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Assign to</label><select value={detailForm.assignedTo} onChange={(event) => setDetailForm((current) => ({ ...current, assignedTo: event.target.value }))} className="w-full rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none"><option value="">Unassigned</option>{staffOptions.map((staff) => <option key={staff._id || staff.id} value={staff._id || staff.id}>{staff.name} ({staff.role})</option>)}</select>{staffLoading && <p className="text-xs text-on-surface-variant/60">Loading staff options...</p>}</div></div><div className="mt-4 space-y-2"><label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Resolution note</label><textarea value={detailForm.resolutionNote} onChange={(event) => setDetailForm((current) => ({ ...current, resolutionNote: event.target.value }))} placeholder="Required before resolving the ticket" className="w-full min-h-[110px] rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none resize-y" /></div><div className="mt-5 flex justify-end"><button type="button" onClick={() => handleTicketUpdate(false)} className="rounded-xl border border-primary/20 bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-on-primary transition-transform hover:-translate-y-0.5">Save Ticket Updates</button></div></div>}
                    <div className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-high/25 p-6"><div className="flex items-center gap-3 mb-6"><MessageSquare size={16} className="text-primary" /><h4 className="text-lg font-bold font-headline text-on-surface">Conversation</h4></div><div className="space-y-4">{(selectedTicket.messages || []).map((message) => <div key={message._id} className={`flex ${isUserMessage(message) ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-[1.5rem] border px-5 py-4 ${isUserMessage(message) ? 'border-primary/20 bg-primary/10 text-on-surface' : 'border-outline-variant/10 bg-surface-container-high text-on-surface'}`}><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-on-surface-variant/70">{message.sender?.name || formatLabel(message.senderRole || 'support')}</span>{message.isInternal && <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-red-300">Internal</span>}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p><p className="mt-3 text-[11px] text-on-surface-variant/55">{new Date(message.createdAt).toLocaleString()}</p></div></div>)}</div><div className="mt-6 rounded-[1.75rem] border border-outline-variant/10 bg-surface-container-high/45 p-5"><textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder={canUseInternalNotes ? 'Reply to the ticket or add an internal note...' : 'Reply to the ticket...'} className="w-full min-h-[130px] rounded-xl border border-outline-variant/10 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none resize-y" />{canUseInternalNotes && <label className="mt-4 flex items-center gap-3 text-sm text-on-surface-variant/75"><input type="checkbox" checked={replyInternal} onChange={(event) => setReplyInternal(event.target.checked)} className="h-4 w-4 rounded border-outline-variant/20 bg-surface-container-high" />Internal note (hidden from the ticket owner)</label>}<div className="mt-4 flex justify-end"><button type="button" onClick={handleReplySubmit} disabled={sendingReply || !replyBody.trim()} className="rounded-xl border border-secondary/20 bg-secondary px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#081228] transition-transform hover:-translate-y-0.5 disabled:opacity-50">Send Reply</button></div></div></div>
                    <div className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-high/20 p-6"><button type="button" onClick={() => setActivityOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 text-left"><div><h4 className="text-lg font-bold font-headline text-on-surface">Activity log</h4><p className="mt-1 text-sm text-on-surface-variant/65">Audit trail for status, priority, assignment, and replies.</p></div><ChevronDown size={18} className={`text-on-surface-variant transition-transform ${activityOpen ? 'rotate-180' : ''}`} /></button>{activityOpen && <div className="mt-5 space-y-4">{(selectedTicket.history || []).length === 0 ? <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-high/40 px-4 py-3 text-sm text-on-surface-variant/70">No activity recorded yet.</div> : (selectedTicket.history || []).map((entry) => <div key={entry._id} className="rounded-2xl border border-outline-variant/10 bg-surface-container-high/35 px-4 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-on-surface">{getHistoryLabel(entry)}</p><span className="text-[11px] text-on-surface-variant/55">{new Date(entry.timestamp).toLocaleString()}</span></div><p className="mt-2 text-sm text-on-surface-variant/70">{entry.changedBy?.name || 'System'}</p></div>)}</div>}</div>
                  </div> : null}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

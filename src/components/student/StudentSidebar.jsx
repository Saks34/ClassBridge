import { NavLink, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Home, 
  Calendar, 
  FileText, 
  Video, 
  GraduationCap, 
  LogOut, 
  Settings, 
  HelpCircle,
  Activity,
  Zap,
  Box,
  Compass,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentSidebar({ isCollapsed, onToggle }) {
    const { logout, user } = useAuth();

    const menuItems = [
        { to: '/student/dashboard', label: 'Home', meta: 'DASHBOARD', icon: Compass },
        { to: '/student/timetable', label: 'Schedule', meta: 'TIMETABLE', icon: Calendar },
        { to: '/student/notes', label: 'Notes', meta: 'STUDY MATERIAL', icon: Box },
        { to: '/student/assignments', label: 'Homework', meta: 'ASSIGNMENTS', icon: FileText },
        { to: '/student/library', label: 'Videos', meta: 'RECORDED CLASSES', icon: Video },
    ];

    const handleSettingsClick = (e) => {
        e.preventDefault();
        toast.info('User Settings: Profile and preferences are loading. Check back later.');
    };

    const bottomItems = [
        { id: 'settings', path: '/student/settings', icon: Settings, label: 'Settings' },
        { id: 'support', path: '/student/support', icon: HelpCircle, label: 'Support' },
    ];

    return (
        <aside className={`fixed left-0 top-0 bottom-0 transition-all duration-500 bg-surface-container-low/60 backdrop-blur-3xl border-r border-outline-variant/20 flex flex-col z-50 shadow-xl ${isCollapsed ? 'w-20' : 'w-64'}`}>
            {/* Collapse Toggle */}
            <button 
                onClick={onToggle}
                className="absolute -right-3 top-20 bg-secondary text-on-secondary rounded-full p-1 shadow-lg border border-outline-variant/10 hover:scale-110 transition-all z-[60]"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Bridge Logo Section */}
            <div className={`p-8 pb-6 text-left transition-all duration-500 ${isCollapsed ? 'opacity-0 scale-0 h-0 p-0 overflow-hidden' : 'opacity-100 scale-100'}`}>
                <div className="text-xl font-black text-secondary tracking-tighter mb-1 select-none">STUDENT</div>
                <div className="text-2xl font-extrabold font-headline text-on-surface tracking-tight leading-none">ClassBridge</div>
                <div className="font-label tracking-[0.2em] uppercase text-[10px] text-on-surface-variant/60 mt-2">Student Dashboard</div>
            </div>

            {isCollapsed && (
                <div className="flex flex-col items-center py-8">
                     <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center font-black text-on-secondary shadow-lg shadow-secondary/20">CB</div>
                </div>
            )}

            {/* Main Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative ${isActive
                                    ? 'bg-secondary/10 text-secondary border-r-2 border-secondary'
                                    : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-secondary/80'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={18} className={`${isActive ? 'text-secondary' : 'group-hover:text-secondary'} transition-colors shrink-0`} />
                                    {!isCollapsed && (
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-label tracking-widest uppercase text-[10px] font-bold truncate">
                                                {item.label}
                                            </span>
                                            {isActive && (
                                                <span className="text-[8px] opacity-50 tracking-[0.2em] font-label -mt-0.5">{item.meta}</span>
                                            )}
                                        </div>
                                    )}
                                    {isActive && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-secondary rounded-l-full shadow-[0_0_8px_rgba(98,250,227,1)]"></div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="px-4 pb-8 space-y-6">
                {/* Batch Info for Student */}
                {user?.batch && (
                    <div className="mx-2 p-4 rounded-2xl bg-surface-container-low/30 border border-outline-variant/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full -mr-8 -mt-8 blur-xl"></div>
                        <div className="flex items-center gap-3">
                            <Box size={14} className="text-secondary" />
                            <div>
                                <div className="text-[8px] font-label uppercase tracking-widest text-on-surface-variant/60 font-bold">My Batch</div>
                                <div className="text-[10px] font-bold text-on-surface truncate max-w-[120px]">{user.batch.name || user.batch}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    {bottomItems.map((item) => (
                        item.path ? (
                            <NavLink 
                                key={item.id}
                                title={isCollapsed ? item.label : ''}
                                to={item.path}
                                className={({ isActive }) => `flex items-center gap-4 px-4 py-2 transition-colors group ${isActive ? 'text-secondary bg-secondary/5 rounded-xl border border-secondary/10' : 'text-on-surface-variant/60 hover:text-secondary'}`}
                            >
                                <item.icon size={16} className="group-hover:rotate-12 transition-transform shrink-0" />
                                {!isCollapsed && <span className="font-label text-[10px] uppercase tracking-widest font-bold">{item.label}</span>}
                            </NavLink>
                        ) : (
                            <button 
                                key={item.id}
                                title={isCollapsed ? item.label : ''}
                                onClick={item.onClick}
                                className="w-full flex items-center gap-4 px-4 py-2 text-on-surface-variant/60 hover:text-secondary transition-colors group"
                            >
                                <item.icon size={16} className="group-hover:rotate-12 transition-transform shrink-0" />
                                {!isCollapsed && <span className="font-label text-[10px] uppercase tracking-widest font-bold">{item.label}</span>}
                            </button>
                        )
                    ))}
                    <button 
                        onClick={logout}
                        title={isCollapsed ? 'Logout' : ''}
                        className="w-full flex items-center gap-4 px-4 py-2 text-error/60 hover:text-error transition-colors group"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform shrink-0" />
                        {!isCollapsed && <span className="font-label text-[10px] uppercase tracking-widest font-bold">Logout</span>}
                    </button>
                </div>

                {/* User Module */}
                <div className="pt-6 border-t border-outline-variant/20">
                    <div className="flex items-center gap-3 p-2 rounded-2xl bg-surface-container-low/50 border border-outline-variant/10 group hover:border-secondary/20 transition-all cursor-pointer">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant/20 group-hover:scale-105 transition-transform shrink-0">
                            <img 
                                alt={user?.name} 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=060e20&color=62fae3`}
                                className="w-full h-full object-cover" 
                            />
                        </div>
                        {!isCollapsed && (
                            <div className="overflow-hidden">
                                <div className="text-sm font-bold text-on-surface truncate capitalize">{user?.name?.split(' ')[0] || 'Student'}</div>
                                <div className="text-[9px] text-secondary font-label tracking-tighter uppercase font-bold">Online Student</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
}

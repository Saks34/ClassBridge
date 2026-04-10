import { NavLink, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Bell, 
  Shield, 
  BarChart3,
  Terminal,
  Settings,
  HelpCircle,
  LogOut,
  Zap,
  Activity,
  Boxes,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import icon from '../../assets/icon.png';

export default function Sidebar({ isCollapsed, onToggle }) {
    const { logout, user } = useAuth();
    
    // Command level is based on role for flavor
    const commandLevel = user?.role === 'SuperAdmin' ? 'LEVEL 10' : 'LEVEL 07';

    const menuItems = [
        { id: 'dashboard', path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', meta: 'OVERVIEW' },
        { id: 'teachers', path: '/admin/teachers', icon: Users, label: 'Teachers', meta: 'STAFF' },
        { id: 'moderators', path: '/admin/moderators', icon: Shield, label: 'Staff', meta: 'MODERATION' },
        { id: 'students', path: '/admin/students', icon: GraduationCap, label: 'Students', meta: 'ADMISSIONS' },
        { id: 'batches', path: '/admin/batches', icon: Boxes, label: 'Batches', meta: 'CLASSES' },
        { id: 'timetable', path: '/admin/timetable', icon: Calendar, label: 'Schedule', meta: 'TIMETABLE' },
        { id: 'notifications', path: '/admin/notifications', icon: Bell, label: 'Messages', meta: 'ALERTS' },
        { id: 'analytics', path: '/admin/analytics', icon: BarChart3, label: 'Reports', meta: 'ANALYTICS' },
    ];

    const handleSettingsClick = (e) => {
        e.preventDefault();
        toast.info('Settings are managed by your institution administrator.');
    };

    const bottomItems = [
        { id: 'settings', path: '/admin/settings', icon: Settings, label: 'Settings' },
        { id: 'support', path: '/admin/support', icon: HelpCircle, label: 'Support' },
    ];

    return (
        <aside className={`fixed left-0 top-0 bottom-0 transition-all duration-500 bg-surface-container/60 backdrop-blur-3xl border-r border-outline-variant/10 flex flex-col z-50 shadow-xl ${isCollapsed ? 'w-20' : 'w-72'}`}>
            {/* Ambient Sidebar Glows - Enhanced Visibility */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[80px] animate-pulse"></div>
                <div className="absolute top-1/2 -right-20 w-64 h-64 bg-secondary/15 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-tertiary/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>

            {/* Collapse Toggle */}
            <button 
                onClick={onToggle}
                className="absolute -right-3 top-20 bg-primary text-on-primary rounded-full p-1 shadow-lg border border-outline-variant/10 hover:scale-110 transition-all z-[60]"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Content container to ensure it stays above glows */}
            <div className="relative z-10 flex flex-col h-full overflow-hidden">

            {/* Bridge Logo Section */}
            <div className={`p-8 pb-4 transition-all duration-500 ${isCollapsed ? 'opacity-0 scale-0 h-0 p-0 overflow-hidden' : 'opacity-100 scale-100 flex flex-col items-center'}`}>
                <img src={logo} alt="ClassBridge Logo" className="object-contain mb-4 dark:brightness-0 dark:invert transition-all" style={{width: '100px', height: '100px'}}/>
                <div className="text-2xl font-extrabold font-headline text-on-surface tracking-tight leading-none whitespace-nowrap">Admin Panel</div>
                <div className="font-label tracking-[0.2em] uppercase text-[10px] text-on-surface-variant/60 mt-2 whitespace-nowrap">Administrator Portal</div>
            </div>

            {isCollapsed && (
                <div className="flex flex-col items-center py-8">
                     <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5 overflow-hidden group hover:scale-110 transition-transform duration-300">
                        <img src={icon} alt="CB" className="w-8 h-8 object-contain" />
                     </div>
                </div>
            )}

            {/* Main Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            className={({ isActive }) =>
                                `group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative ${isActive
                                    ? 'bg-primary/10 text-primary border-r-2 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                                    : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-primary'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={18} className={`${isActive ? 'text-primary' : 'group-hover:text-primary'} transition-colors shrink-0`} />
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
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-primary rounded-l-full shadow-[0_0_8px_rgba(83,221,252,1)]"></div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom Actions & User Profile */}
            <div className="px-4 pb-8 space-y-6">
                <div className="space-y-1">
                    {bottomItems.map((item) => (
                        item.path ? (
                            <NavLink 
                                key={item.id}
                                to={item.path}
                                className={({ isActive }) => `flex items-center gap-4 px-4 py-2 transition-colors group ${isActive ? 'text-primary bg-primary/5 rounded-xl border border-primary/10' : 'text-on-surface-variant/60 hover:text-primary'}`}
                            >
                                <item.icon size={16} className="group-hover:rotate-12 transition-transform shrink-0" />
                                {!isCollapsed && <span className="font-label text-[10px] uppercase tracking-widest font-bold">{item.label}</span>}
                            </NavLink>
                        ) : (
                            <button 
                                key={item.id}
                                title={isCollapsed ? item.label : ''}
                                onClick={item.onClick}
                                className="w-full flex items-center gap-4 px-4 py-2 text-on-surface-variant/60 hover:text-primary transition-colors group"
                            >
                                <item.icon size={16} className="group-hover:rotate-12 transition-transform shrink-0" />
                                {!isCollapsed && <span className="font-label text-[10px] uppercase tracking-widest font-bold">{item.label}</span>}
                            </button>
                        )
                    ))}
                    <button 
                        onClick={logout}
                        className="w-full flex items-center gap-4 px-4 py-2 text-error/60 hover:text-error transition-colors group"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform shrink-0" />
                        {!isCollapsed && <span className="font-label text-[10px] uppercase tracking-widest font-bold">Logout</span>}
                    </button>
                </div>

                {/* User Module */}
                <div className="pt-6 border-t border-outline-variant/20">
                    <div className="flex items-center gap-3 p-2 rounded-2xl glass-panel border border-outline-variant/10 group hover:border-primary/20 transition-all cursor-pointer">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant/20 group-hover:scale-105 transition-transform">
                            <img 
                                alt={user?.name} 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=060e20&color=53ddfc`}
                                className="w-full h-full object-cover" 
                            />
                        </div>
                        {!isCollapsed && (
                            <div className="overflow-hidden">
                                <div className="text-sm font-bold text-on-surface truncate capitalize">{user?.name?.split(' ')[0]}</div>
                                <div className="text-[9px] text-primary font-label tracking-tighter uppercase font-bold">Administrator</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </aside>
    );
}

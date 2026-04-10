import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
    User, 
    Mail, 
    Shield, 
    Key, 
    Palette, 
    Bell, 
    ArrowRight,
    CheckCircle2,
    Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import usePageTitle from '../../hooks/usePageTitle';
import ThemeToggle from '../../components/shared/ThemeToggle';

export default function Settings() {
    usePageTitle('Terminal Configuration', 'Settings');
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('profile');

    const sections = [
        { id: 'profile', label: 'Persona Profile', icon: User },
        { id: 'security', label: 'Access Protocol', icon: Shield },
        { id: 'appearance', label: 'Visual Interface', icon: Palette },
        { id: 'notifications', label: 'Signal Alerts', icon: Bell },
    ];

    const handlePasswordChange = () => {
        navigate('/change-password');
    };

    return (
        <div className="max-w-screen-xl mx-auto space-y-12 animate-fade-in">
            <header className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface tracking-tight leading-none">
                    Terminal <span className="text-gradient-primary">Configuration</span>
                </h1>
                <p className="text-on-surface-variant text-lg font-body max-w-2xl leading-relaxed">
                    Managing nodal preferences and security protocols for the <span className="text-on-surface font-bold">{user?.role} Node</span>.
                </p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="lg:w-1/4 space-y-2">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-label text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                                activeSection === section.id
                                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 border-primary'
                                    : 'bg-surface-container-low border-outline-variant/10 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                            }`}
                        >
                            <section.icon size={16} />
                            {section.label}
                        </button>
                    ))}
                </aside>

                {/* Content Area */}
                <main className="flex-1">
                    <div className="bg-surface-container-low/40 glass-panel border border-outline-variant/10 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl min-h-[500px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-20"></div>
                        
                        {activeSection === 'profile' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="flex items-center gap-8 mb-8">
                                    <div className="w-24 h-24 rounded-3xl bg-surface-container-high flex items-center justify-center text-primary text-4xl font-headline font-black border border-outline-variant/10 shadow-2xl relative group">
                                        <div className="absolute inset-0 bg-primary opacity-[0.05] rounded-3xl"></div>
                                        {user?.name?.[0]?.toUpperCase()}
                                        <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                            <Palette size={14} />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold font-headline text-on-surface tracking-tight leading-none mb-2">{user?.name}</h3>
                                        <p className="text-on-surface-variant font-body">Node ID: <span className="font-mono text-xs opacity-50">{user?._id || user?.id}</span></p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-outline-variant/10">
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Persona Identifier</label>
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface">
                                            <User size={16} className="text-primary" />
                                            <span className="font-body font-medium">{user?.name}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Transmission Link</label>
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface">
                                            <Mail size={16} className="text-primary" />
                                            <span className="font-body font-medium">{user?.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8">
                                     <button 
                                        onClick={() => toast.error('Profile reconfiguration is restricted by central administration.')}
                                        className="px-8 py-3 bg-surface-container-high text-on-surface-variant/60 rounded-full font-label text-[10px] font-black uppercase tracking-widest hover:text-on-surface transition-colors border border-outline-variant/10"
                                    >
                                        Request Identity Change
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div className="space-y-12 animate-fade-in">
                                <div className="flex items-start gap-6 p-8 rounded-3xl bg-secondary/5 border border-secondary/10">
                                    <Lock className="text-secondary shrink-0" size={32} />
                                    <div className="space-y-2">
                                        <h4 className="font-headline font-bold text-on-surface">Encryption Protocol</h4>
                                        <p className="text-sm text-on-surface-variant leading-relaxed font-body">
                                            Your terminal access is secured via AES-256 equivalent encryption. Maintain your access keys frequently to ensure signal integrity.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-6 rounded-2xl bg-surface-container-high border border-outline-variant/10 group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                <Key size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Access Key</h5>
                                                <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest font-bold opacity-50">Last changed: 3 cycles ago</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handlePasswordChange}
                                            className="px-6 py-2 bg-primary text-on-primary rounded-full font-label text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                                        >
                                            Update Key
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-6 rounded-2xl bg-surface-container-high/50 border border-outline-variant/10 opacity-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                                <Shield size={18} />
                                            </div>
                                            <div>
                                                <h5 className="font-headline font-bold text-on-surface">Multi-Factor Link</h5>
                                                <p className="text-[10px] text-on-surface-variant/50 font-label uppercase tracking-widest font-bold">Biometric verification required</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-label font-black text-on-surface-variant/40 border border-outline-variant/10 px-4 py-2 rounded-full">LOCKED</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'appearance' && (
                            <div className="space-y-12 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h4 className="font-headline font-bold text-on-surface mb-6">Luminance Balance</h4>
                                        <div className="flex flex-col items-start gap-4 p-6 rounded-3xl bg-surface-container-high/50 border border-outline-variant/10">
                                            <div className="flex items-center justify-between w-full">
                                                <div>
                                                    <p className="font-label text-[10px] font-black uppercase tracking-widest text-on-surface">Toggle Interface Spectrum</p>
                                                    <p className="text-xs text-on-surface-variant/60 font-body mt-1">Switch between Daylight and Deep Space modes</p>
                                                </div>
                                                <ThemeToggle />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="font-headline font-bold text-on-surface mb-4">Neural Interface Depth</h4>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Glassmorphism Alpha', value: '85%' },
                                                { label: 'Tonal Layering Level', value: '4.2' },
                                                { label: 'Motion Intensity', value: 'Optimal' },
                                            ].map((opt, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-high/40 border border-outline-variant/10">
                                                    <span className="text-[10px] font-label text-on-surface-variant/60 uppercase font-bold tracking-widest">{opt.label}</span>
                                                    <span className="text-xs font-mono text-primary font-bold">{opt.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'notifications' && (
                            <div className="space-y-8 animate-fade-in text-center py-12">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Bell className="text-primary animate-bounce" size={40} />
                                </div>
                                <h4 className="text-2xl font-bold font-headline text-on-surface">Signal Alerts Synchronized</h4>
                                <p className="text-on-surface-variant max-w-sm mx-auto font-body">
                                    Your terminal is currently receiving all critical telemetry streams. Preference adjustment is handled by regional node controllers.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-secondary font-label text-[10px] font-black uppercase tracking-[0.2em] pt-4">
                                    <CheckCircle2 size={14} />
                                    Active Signal Integrity
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

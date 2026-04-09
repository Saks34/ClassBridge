import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';


export default function LandingPage() {
    const { isDark, toggleTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'FEATURES', href: '#features' },
        { label: 'TEACHERS', href: '#footer' },
        { label: 'LIVE CLASSES', href: '#features' },
        { label: 'SUPPORT', href: '#footer' },
    ];

    const handleNewsletter = (e) => {
        e.preventDefault();
        if (!email) return;
        toast.success('Your email has been added to our mailing list!', {
            icon: '🌍',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
        setEmail('');
    };

    const handleViewDemo = () => {
        toast.info('Starting platform demonstration...', { icon: '🔭' });
    };

    return (
        <div className="bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary min-h-screen">
            {/* TopAppBar */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-surface/90 backdrop-blur-xl shadow-lg border-b border-outline-variant/10' : 'bg-transparent'}`}>
                <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl font-black tracking-tighter text-primary">polyline</span>
                        <span className="font-headline tracking-tight text-lg font-bold text-primary">ClassBridge</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                className="text-on-surface-variant hover:text-primary transition-colors font-label text-xs tracking-widest uppercase"
                                href={link.href}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="hidden md:inline-flex w-9 h-9 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all active:scale-95"
                            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <Link 
                            to="/login"
                            className="border border-outline-variant/40 text-on-surface px-6 py-2 rounded-full font-headline font-bold text-sm hover:border-primary hover:text-primary transition-all active:scale-95 bg-transparent"
                        >
                            LOGIN
                        </Link>
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden material-symbols-outlined text-on-surface-variant hover:bg-primary/10 hover:text-primary p-2 rounded-full transition-all cursor-pointer"
                            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        >
                            {mobileMenuOpen ? 'close' : 'menu'}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden glass-panel border-x-0 border-t border-outline-variant/10 px-8 py-6 space-y-4 animate-fade-in">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                className="block text-on-surface-variant hover:text-primary transition-colors font-label text-sm tracking-widest"
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </a>
                        ))}
                        <Link 
                            to="/login"
                            className="block w-full text-center bg-gradient-primary text-on-primary-container py-3 rounded-full font-headline font-bold"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            LOGIN
                        </Link>
                    </div>
                )}
            </nav>

            <main className="relative pt-24 overflow-hidden">
                {/* Ambient Background Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary opacity-[0.1] blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-tertiary opacity-[0.05] blur-[100px] rounded-full pointer-events-none"></div>

                {/* Hero Section */}
                <section className="relative max-w-7xl mx-auto px-8 py-20 lg:py-32 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 border border-outline-variant/10">
                        <span className="font-label text-[10px] tracking-[0.2em] text-secondary uppercase">Built for real classrooms</span>
                    </div>
                    <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-8 leading-[0.9]">
                        Bridge the Gap in <br />
                        <span className="text-gradient-primary">Education</span>
                    </h1>
                    <p className="max-w-2xl text-on-surface-variant text-lg md:text-xl mb-12 font-body leading-relaxed">
                        Run your school&apos;s live classes, timetable, and resources — all in one place. Keep teachers, students, and schedules in sync without juggling multiple tools.
                    </p>

                    {/* Floating Hero Card */}
                    <div className="relative w-full max-w-4xl">
                        <div className="relative rounded-3xl border border-outline-variant/15 bg-surface-container-high/90 backdrop-blur-xl shadow-lg px-6 py-6 md:px-10 md:py-7">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-10">
                                <div className="text-left max-w-xl">
                                    <p className="font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant mb-2">
                                        Daily operations
                                    </p>
                                    <h3 className="font-headline text-2xl md:text-3xl font-bold mb-2 text-on-surface">
                                        Simple to run every day
                                    </h3>
                                    <p className="text-on-surface-variant font-body text-sm md:text-base">
                                        Plan lessons, share links and recordings, and keep every class on the right timetable.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto justify-end">
                                    <Link 
                                        to="/institution/signup"
                                        className="btn-premium w-full sm:w-auto text-sm md:text-base text-center"
                                    >
                                        Register Now
                                    </Link>
                                    <button 
                                        onClick={handleViewDemo}
                                        className="btn-glass w-full sm:w-auto text-sm md:text-base"
                                    >
                                        View Demo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Bento Grid */}
                <section id="features" className="max-w-7xl mx-auto px-8 py-24">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Live Classes (Large Card) */}
                        <div className="md:col-span-8 group relative overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 transition-all duration-500">
                            <img
                                alt="Live Classroom"
                                className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-700"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCfXBA0x8YW1m-RAM3l1aCM_cLh7C4rPbNeDK7hcwk7B1sQ6XZ_vI8d3eCz_Qvr5nHWvkieSzO8EEbhdZ34YIbBeW4u4GRVQhAfQwqlmFHyxAevExNK0ChsJS0hzzjda0uCUkvU86zSpzTn8bknzJ-6gRtxOBQGwJFyHVoco5URcA7l9_NiCaQOK-i7ZWT28EZ7j1lFIp5p4HrAI7GIyL7hXvbHGs_EI2sc-oCgiIg1dP_LYJE4IVfuUDz0DA0py9MMumAYCNkI_g"
                            />
                            <div className="relative p-10 h-full flex flex-col justify-end min-h-[400px]">
                                <div className="mb-4 text-left inline-block rounded-2xl bg-surface/80 backdrop-blur-sm px-6 py-5 border border-outline-variant/20">
                                    <span className="material-symbols-outlined text-primary text-4xl mb-3 block">sensors</span>
                                    <h3 className="font-headline text-3xl font-extrabold mb-3 text-on-surface">Live Classes</h3>
                                    <p className="text-on-surface-variant max-w-md leading-relaxed">
                                        Run live, interactive lessons with stable video, chat, and whiteboards in the same place.
                                    </p>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <span className="font-label text-[10px] bg-primary text-on-primary bg-opacity-20 px-3 py-1 rounded-full uppercase tracking-wider">HD VIDEO</span>
                                    <span className="font-label text-[10px] bg-primary text-on-primary bg-opacity-20 px-3 py-1 rounded-full uppercase tracking-wider">INTERACTIVE</span>
                                </div>
                            </div>
                        </div>

                        {/* Materials (Small Card) */}
                        <div className="md:col-span-4 glass-panel p-8 rounded-xl flex flex-col justify-between border border-outline-variant/10 group hover:bg-surface-container-high transition-colors">
                            <div className="text-left">
                                <div className="w-12 h-12 rounded-lg bg-secondary text-secondary bg-opacity-10 flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined">folder_zip</span>
                                </div>
                                <h3 className="font-headline text-2xl font-bold mb-4 text-on-surface">Study Materials</h3>
                                <p className="text-on-surface-variant font-body text-sm leading-relaxed">Access our library of detailed study notes, case studies, and course materials.</p>
                            </div>
                            <div className="mt-8 pt-8 border-t border-outline-variant/10">
                                <Link 
                                    to="/login"
                                    className="flex items-center justify-between text-secondary group-hover:translate-x-1 transition-transform cursor-pointer"
                                >
                                    <span className="font-label text-xs font-bold tracking-widest uppercase">Browse Materials</span>
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                            </div>
                        </div>

                        {/* Real-time Chat (Asymmetric Middle) */}
                        <div className="md:col-span-5 bg-surface-container-highest p-10 rounded-xl border border-outline-variant/10 relative overflow-hidden text-left">
                            <div className="absolute -right-10 -bottom-10 opacity-10">
                                <span className="material-symbols-outlined text-[160px] text-on-surface">chat_bubble_outline</span>
                            </div>
                            <h3 className="font-headline text-2xl font-bold mb-4 text-on-surface">Real-time Chat</h3>
                            <p className="text-on-surface-variant font-body mb-8">Instant communication with peers and mentors. Threaded discussions and code snippets supported natively.</p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 glass-panel rounded-lg border border-outline-variant/5">
                                    <div className="w-8 h-8 rounded-full bg-tertiary-dim"></div>
                                    <div className="h-2 w-24 bg-outline-variant/20 rounded"></div>
                                </div>
                                <div className="flex items-center gap-3 p-3 glass-panel rounded-lg border border-outline-variant/5 ml-8">
                                    <div className="w-8 h-8 rounded-full bg-primary-dim"></div>
                                    <div className="h-2 w-32 bg-outline-variant/20 rounded"></div>
                                </div>
                            </div>
                        </div>

                        {/* Progress/Stats (The Bridge) */}
                        <div className="md:col-span-7 bg-surface-container-lowest p-10 rounded-xl border border-outline-variant/20 flex flex-col justify-center">
                            <div className="mb-8">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="font-label text-xs text-on-surface-variant tracking-[0.2em] uppercase">Global Engagement</span>
                                    <span className="text-primary font-headline font-bold text-2xl">94%</span>
                                </div>
                                <div className="h-1 w-full bg-surface-variant/20 rounded-full overflow-hidden">
                                    <div className="h-full w-[94%] bg-gradient-to-r from-primary to-secondary transition-all duration-1000"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-left">
                                <div>
                                    <p className="font-label text-[10px] text-on-surface-variant mb-1 uppercase tracking-tighter">Students</p>
                                    <p className="font-headline font-bold text-lg text-on-surface">1.2k</p>
                                </div>
                                <div>
                                    <p className="font-label text-[10px] text-on-surface-variant mb-1 uppercase tracking-tighter">Classes</p>
                                    <p className="font-headline font-bold text-lg text-on-surface">45k</p>
                                </div>
                                <div>
                                    <p className="font-label text-[10px] text-on-surface-variant mb-1 uppercase tracking-tighter">Delay</p>
                                    <p className="font-headline font-bold text-lg text-secondary">12ms</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="max-w-5xl mx-auto px-8 py-24 text-center">
                    <div className="py-16 px-8 rounded-2xl glass-panel border border-outline-variant/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                            <span className="material-symbols-outlined text-8xl text-primary">auto_awesome</span>
                        </div>
                        <h2 className="font-headline text-4xl font-extrabold mb-6 tracking-tight text-on-surface">Ready to start learning?</h2>
                        <p className="text-on-surface-variant mb-10 max-w-xl mx-auto font-body">
                            Registration is open for the Winter Batch. Set up live classes, share recordings, and manage your school&apos;s timetable from one workspace.
                        </p>
                        <Link 
                            to="/institution/signup"
                            className="bg-gradient-primary text-on-primary-container font-headline font-bold py-4 px-12 rounded-full shadow-xl hover:scale-105 transition-all inline-block"
                        >
                            Register Now
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer id="footer" className="w-full border-t border-outline-variant/10 bg-surface">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-12 py-16 max-w-7xl mx-auto text-left">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">polyline</span>
                            <span className="text-xl font-bold text-primary">ClassBridge</span>
                        </div>
                        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                            Building digital pathways between knowledge and ambition. The digital classroom for the modern age.
                        </p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="font-label text-xs font-bold text-on-surface uppercase tracking-widest">Navigation</h4>
                        <a className="font-body text-sm text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all cursor-pointer" href="#features">Curriculum</a>
                        <a className="font-body text-sm text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all cursor-pointer" href="#footer">Teachers</a>
                        <a className="font-body text-sm text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all cursor-pointer" href="#features">Live Classes</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="font-label text-xs font-bold text-on-surface uppercase tracking-widest">Connect</h4>
                        <a className="font-body text-sm text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all cursor-pointer" href="https://twitter.com/classbridge" target="_blank" rel="noreferrer">Twitter</a>
                        <a className="font-body text-sm text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all cursor-pointer" href="https://discord.gg/classbridge" target="_blank" rel="noreferrer">Discord</a>
                        <a className="font-body text-sm text-on-surface-variant hover:text-primary hover:translate-x-1 transition-all cursor-pointer" href="https://github.com/classbridge" target="_blank" rel="noreferrer">GitHub</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 className="font-label text-xs font-bold text-on-surface uppercase tracking-widest">Newsletter</h4>
                        <form onSubmit={handleNewsletter} className="relative">
                            <label className="sr-only" htmlFor="landing-newsletter-email">Email address</label>
                            <input
                                id="landing-newsletter-email"
                                className="w-full bg-surface-container-high border-none rounded-lg text-sm p-3 focus:ring-1 focus:ring-primary/50 placeholder:text-on-surface-variant/50 outline-none pr-12"
                                placeholder="Email address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-2 text-primary hover:scale-110 transition-transform"
                                aria-label="Send email to subscribe to newsletter"
                            >
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </form>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-12 pb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="font-body text-sm text-on-surface-variant">© 2024 ClassBridge. Your digital classroom.</span>
                    <div className="flex gap-6">
                        <button onClick={() => toast.info('Privacy Policy documentation is available in the institution dashboard.')} className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors">Privacy</button>
                        <button onClick={() => toast.info('Terms of Service are managed by your school.')} className="font-body text-xs text-on-surface-variant hover:text-primary transition-colors">Terms</button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

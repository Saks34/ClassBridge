import { useState } from 'react';
import { Book, Play, Users, Video, Settings, Shield, ChevronRight, FileText, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';

export default function Documentation() {
    usePageTitle('Platform Documentation');
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('intro');

    const menu = [
        { id: 'intro', icon: Book, label: 'Introduction' },
        { id: 'getting-started', icon: Play, label: 'Getting Started' },
        { id: 'users', icon: Users, label: 'User Management' },
        { id: 'live', icon: Video, label: 'Live Classes' },
        { id: 'security', icon: Shield, label: 'Security & Privacy' },
        { id: 'settings', icon: Settings, label: 'Advanced Settings' },
    ];

    const content = {
        'intro': {
            title: 'Welcome to ClassBridge',
            body: `ClassBridge is a next-generation educational management environment designed to seamlessly unify live interactive instruction, video-on-demand (VOD) archiving, and intelligent resource deployment into a single, high-performance platform.

This documentation serves as your comprehensive guide to mastering the ClassBridge ecosystem. Whether you are an institution administrator provisioning new departments, a teacher launching a live virtual classroom, or a student accessing archived lectures, this guide will provide step-by-step clarity.`
        },
        'getting-started': {
            title: 'Getting Started',
            body: `To begin your journey with ClassBridge, you must first authenticate using your institutional credentials.

1. Navigate to the login portal.
2. Enter your secure ClassBridge ID and password.
3. Upon successful authentication, you will be redirected to your role-specific dashboard.

If this is your first time logging in, we recommend navigating to your **Settings** panel to configure your timezone and notification preferences to ensure you never miss critical broadcast updates.`
        },
        'users': {
            title: 'User Management',
            body: `Administrators have full telemetry and logistical control over all users within their deployment sphere.

- **Teachers**: Can be assigned to specific batches and granted broadcast permissions.
- **Students**: Automatically grouped via Batch assignments to ensure they only receive content relevant to their curriculum.
- **Moderators**: Trusted users who can assist in monitoring live chats and enforcing digital conduct during live classes.

To add new users, navigate to the respective Admin dashboard section and utilize the automated CSV import tool or add them manually via the creation form.`
        },
        'live': {
            title: 'Live Classes Ecosystem',
            body: `The heart of the ClassBridge platform is its ultra-low latency Live Broadcasting ecosystem.

Teachers can initiate sessions with a single click. Our system automatically:
- Provisions a securely encrypted video room.
- Sends push notifications to all enrolled students.
- Begins cloud recording (if enabled by institution policies).

During the class, utilize the **Whiteboard**, **Screen Share**, and **Real-time Chat** features to maintain high engagement.`
        },
        'security': {
            title: 'Security & Privacy Architecture',
            body: `ClassBridge enforces strict end-to-end security measures.

- All live video streams are encrypted in transit using industry-standard WebRTC protocols.
- User data, including grades and attendance, are isolated using logical tenant partitions.
- We strictly adhere to global educational privacy standards (including FERPA/GDPR compliance frameworks).`
        },
        'settings': {
            title: 'Advanced Settings',
            body: `Customization is key to ensuring ClassBridge fits your organizational flow. 

Within the Settings module, Administrators can:
- Define global UI themes and branding (Dark/Light modes).
- Configure strict IP access lists.
- Adjust automated VOD retention policies.
- Audit overarching system access logs.`
        }
    };

    return (
        <div className="min-h-screen bg-background text-on-surface flex flex-col font-body">
            {/* Top Header */}
            <header className="h-20 border-b border-outline-variant/10 bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-primary/20 hover:text-primary transition-all text-on-surface-variant group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <FileText size={16} className="text-primary" />
                        </div>
                        <h1 className="text-xl font-bold font-headline tracking-tight">ClassBridge Documentation</h1>
                    </div>
                </div>

                <div className="relative group hidden md:block">
                    <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant group-focus-within:text-primary transition-colors pointer-events-none">
                        <Search size={16} />
                    </span>
                    <input 
                        className="bg-surface-container-high border-0 border-b border-transparent focus:border-primary/30 rounded-full pl-10 pr-6 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-4 focus:ring-primary/5 w-64 lg:w-96 transition-all outline-none" 
                        placeholder="Search manuals..." 
                        type="text" 
                    />
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Background effects */}
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Sidebar Navigation */}
                <aside className="w-full md:w-80 border-r border-outline-variant/10 bg-surface-container-lowest/50 overflow-y-auto">
                    <div className="p-6">
                        <p className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant/50 mb-6 px-4">
                            Documentation Modules
                        </p>
                        <nav className="space-y-2">
                            {menu.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-body text-sm ${activeSection === item.id ? 'bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 scale-[1.02]' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
                                >
                                    <item.icon size={18} className={activeSection === item.id ? 'text-on-primary' : 'opacity-70'} />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {activeSection === item.id && <ChevronRight size={16} />}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content Viewer */}
                <main className="flex-1 overflow-y-auto p-8 md:p-16 relative z-10 scroll-smooth">
                    <div className="max-w-4xl mx-auto animate-fade-in" key={activeSection}>
                        <div className="inline-block px-3 py-1 bg-primary/10 text-primary font-label text-[10px] font-bold uppercase tracking-widest rounded-full mb-6 border border-primary/20">
                            Version 2.0
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-on-surface mb-8">
                            {content[activeSection].title}
                        </h2>
                        
                        <div className="prose prose-invert max-w-none">
                            {content[activeSection].body.split('\n\n').map((paragraph, idx) => {
                                if (paragraph.startsWith('- ')) {
                                    return (
                                        <ul key={idx} className="list-disc pl-6 space-y-3 my-6 text-on-surface-variant leading-relaxed text-lg">
                                            {paragraph.split('\n').map((listItem, lIdx) => {
                                                const cleanItem = listItem.replace(/^- /, '');
                                                return <li key={lIdx} dangerouslySetInnerHTML={{ __html: cleanItem.replace(/\*\*(.*?)\*\*/g, '<strong class="text-on-surface font-bold">$1</strong>') }} />
                                            })}
                                        </ul>
                                    );
                                }
                                if (/^\d+\. /.test(paragraph)) {
                                    return (
                                        <ol key={idx} className="list-decimal pl-6 space-y-3 my-6 text-on-surface-variant leading-relaxed text-lg">
                                            {paragraph.split('\n').map((listItem, lIdx) => {
                                                const cleanItem = listItem.replace(/^\d+\. /, '');
                                                return <li key={lIdx} dangerouslySetInnerHTML={{ __html: cleanItem.replace(/\*\*(.*?)\*\*/g, '<strong class="text-on-surface font-bold">$1</strong>') }} />
                                            })}
                                        </ol>
                                    );
                                }
                                return (
                                    <p key={idx} className="text-on-surface-variant text-lg leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-on-surface font-bold">$1</strong>') }} />
                                );
                            })}
                        </div>

                        <div className="mt-16 pt-8 border-t border-outline-variant/10 flex justify-between items-center text-sm text-on-surface-variant font-label">
                            <p>Was this page helpful?</p>
                            <div className="flex gap-4">
                                <button className="hover:text-primary transition-colors">Yes</button>
                                <button className="hover:text-error transition-colors">No</button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

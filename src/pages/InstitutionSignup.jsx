import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Info, ArrowRight, Building2, User, School, BookOpen, Briefcase, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import logo from '../assets/logo.png';
import icon from '../assets/icon.png';
import ThemeToggle from '../components/shared/ThemeToggle';

export default function InstitutionSignup() {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const [instName, setInstName] = useState('');
  const [instType, setInstType] = useState('school');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!instName || !adminName || !adminEmail || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.post('/institutions/register', {
        name: instName,
        type: instType,
        admin: {
          name: adminName,
          email: adminEmail,
          password: password
        }
      });
      toast.success('Institution created successfully! Please login.');
      navigate('/login', { state: { message: 'Account activated. Please login to begin.' } });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to create institution';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const institutionTypes = [
    { value: 'school', label: 'Academic School', icon: School, desc: 'K-12 Educational Institutions' },
    { value: 'coaching', label: 'Coaching Center', icon: BookOpen, desc: 'Specialized Training Centers' },
    { value: 'college', label: 'University/College', icon: Briefcase, desc: 'Higher Education & Research' },
  ];

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary/30 min-h-screen overflow-x-hidden">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/40 backdrop-blur-xl border-b border-outline-variant/10 shadow-lg">
        <div className="flex justify-between items-center px-8  max-w-screen-2xl mx-auto font-headline tracking-tight">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ClassBridge" className=" object-contain dark:brightness-0 dark:invert transition-all" style={{width: '150px', height: '100px'}}/>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-8">
              <Link className="text-on-surface-variant hover:text-primary transition-colors" to="/">Return to Base</Link>
              <Link to="/login" className="text-on-surface-variant hover:text-primary transition-colors">Existing Node?</Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="flex flex-col lg:flex-row min-h-screen pt-16">
        {/* Left Side: Educational Benefits */}
        <section className="hidden lg:flex lg:w-2/5 p-16 flex-col justify-center gap-12 bg-surface-container-low relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 w-64 h-64 bg-primary/20 blur-3xl rounded-full"></div>
             <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 blur-3xl rounded-full"></div>
          </div>
          
          <div className="relative z-10 space-y-8">
            <span className="font-label text-primary tracking-[0.4em] text-xs uppercase font-bold">Account Setup</span>
            <h1 className="text-4xl md:text-5xl font-black font-headline text-on-surface mb-4 leading-none tracking-tighter">
              Get Started with <span className="text-gradient-primary">ClassBridge</span>.
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
              Deploy a high-fidelity learning ecosystem designed for the next era of pedagogy. Rapid, secure, and decentralized.
            </p>

            <div className="space-y-6 pt-8">
              {[
                { title: 'Global Compliance', desc: 'FERPA, GDPR, and COPPA compliant infrastructure.' },
                { title: 'Rapid Deployment', desc: 'Sync your entire SIS in under 24 hours with our API Bridge.' },
                { title: 'Neural Expansion', desc: 'Access advanced predictive analytics and AI node management.' }
              ].map((benefit, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CheckCircle2 className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{benefit.title}</h4>
                    <p className="text-on-surface-variant text-sm font-body">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 p-6 glass-panel rounded-2xl border border-outline-variant/10">
            <p className="text-xs text-on-surface-variant italic font-body">
              "The most advanced digital education bridge ever built. Our institution migrated 5,000 nodes in a single weekend."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/10"></div>
              <div>
                <p className="text-[10px] font-bold text-on-surface uppercase tracking-widest font-label leading-none">Prof. Elena Vance</p>
                <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest leading-none">Director of Digital Strategy</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Registration Form */}
        <section className="w-full lg:w-3/5 flex items-center justify-center p-6 md:p-16 relative bg-surface">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(83,221,252,0.03),transparent_70%)] pointer-events-none"></div>
          
          <div className="w-full max-w-2xl relative z-10">
            {/* Steps Header */}
            <div className="flex items-center gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex items-center gap-2 group flex-shrink-0">
                <span className="w-8 h-8 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-xs">01</span>
                <span className="font-label text-[10px] tracking-widest uppercase font-bold text-on-surface">Institution Profile</span>
              </div>
              <div className="h-px w-8 bg-outline-variant/20 flex-shrink-0"></div>
              <div className="flex items-center gap-2 group opacity-40 flex-shrink-0">
                <span className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant font-bold flex items-center justify-center text-xs">02</span>
                <span className="font-label text-[10px] tracking-widest uppercase font-bold text-on-surface">Admin Credentials</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Institution Details Section */}
              <div className="space-y-8">
                <div className="text-left">
                  <h2 className="font-headline text-3xl font-bold text-on-surface mb-2 tracking-tight flex items-center gap-3">
                    <Building2 className="text-primary" />
                    Institution Details
                  </h2>
                  <p className="text-on-surface-variant font-body text-sm">Define the core parameters of your academic node.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Institution Name */}
                  <div className="space-y-1 group">
                    <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 group-focus-within:text-primary transition-colors font-bold">Institution Name</label>
                    <div className="relative">
                      <input
                        value={instName}
                        onChange={(e) => setInstName(e.target.value)}
                        className="w-full py-3 px-0 border-0 border-b-2 border-outline-variant/30 bg-transparent text-on-surface placeholder:text-outline-variant/50 font-body focus:outline-none focus:border-primary transition-all"
                        placeholder="e.g., Nova Academica"
                        required
                      />
                    </div>
                  </div>

                  {/* Institution Type */}
                  <div className="space-y-1 group">
                    <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 font-bold">Node Category</label>
                    <div className="flex gap-2">
                        {institutionTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setInstType(type.value)}
                            title={type.desc}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all flex-1 gap-1 ${
                              instType === type.value 
                                ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(83,221,252,0.1)]' 
                                : 'bg-surface-container-high border-outline-variant/10 hover:border-outline-variant/30 grayscale hover:grayscale-0'
                            }`}
                          >
                             <type.icon size={18} className={instType === type.value ? 'text-primary' : 'text-on-surface-variant'} />
                             <span className={`text-[9px] font-bold uppercase tracking-tighter ${instType === type.value ? 'text-primary' : 'text-on-surface-variant'}`}>{type.value}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Section */}
              <div className="space-y-8 pt-8 border-t border-outline-variant/10">
                <div className="text-left">
                  <h2 className="font-headline text-3xl font-bold text-on-surface mb-2 tracking-tight flex items-center gap-3">
                    <User className="text-secondary" />
                    Admin Command
                  </h2>
                  <p className="text-on-surface-variant font-body text-sm">Primary contact for managing your account and school settings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1 group">
                    <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 group-focus-within:text-primary transition-colors font-bold">Admin Persona</label>
                    <input
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full py-3 px-0 border-0 border-b-2 border-outline-variant/30 bg-transparent text-on-surface placeholder:text-outline-variant/50 font-body focus:outline-none focus:border-primary transition-all"
                      placeholder="John Sheridan"
                      required
                    />
                  </div>
                  <div className="space-y-1 group">
                    <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 group-focus-within:text-primary transition-colors font-bold">Communication Protocol</label>
                    <input
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full py-3 px-0 border-0 border-b-2 border-outline-variant/30 bg-transparent text-on-surface placeholder:text-outline-variant/50 font-body focus:outline-none focus:border-primary transition-all"
                      placeholder="admin@nova.edu"
                      type="email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1 group max-w-md">
                  <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 group-focus-within:text-primary transition-colors font-bold">Access Encryption Key</label>
                  <div className="relative">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full py-3 px-0 border-0 border-b-2 border-outline-variant/30 bg-transparent text-on-surface placeholder:text-outline-variant/50 font-body focus:outline-none focus:border-primary transition-all pr-12"
                      placeholder="••••••••••••"
                      type={showPassword ? 'text' : 'password'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-outline-variant/30 group-focus-within:text-primary transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Error and Actions */}
              <div className="space-y-6 pt-4">
                {error && (
                  <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 animate-fade-in text-left">
                    <Info size={18} className="text-error flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <button
                    disabled={loading}
                    className="w-full sm:w-auto flex-1 py-5 px-10 bg-gradient-primary text-on-primary-container font-headline font-extrabold text-lg rounded-full shadow-[0_10px_30px_rgba(83,221,252,0.2)] hover:shadow-[0_15px_40px_rgba(83,221,252,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                    type="submit"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Initiate Node Alpha
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                  
                </div>
              </div>
            </form>

            <div className="mt-16 pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left" style={{display:"flex",flexDirection:"row",justifyContent:"space-between",width:"75vw"}}>
               <div>
                  <p className="text-on-surface-variant text-xs font-body">Existing node in the network?</p>
                  <Link to="/login" className="font-label text-secondary hover:text-primary transition-colors uppercase tracking-widest text-[10px] font-bold">Return to Terminal</Link>
               </div>
               <div >
                  <p className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest max-w-[200px] leading-relaxed text-center sm:text-left">
                    By initiating, you agree to the <span onClick={() => toast.info('Terms of Orbit protocol is managed by global administration.')} className="text-secondary cursor-pointer hover:text-primary transition-colors">Terms of Orbit</span> and <span onClick={() => toast.info('Security Protocol documentation is encrypted for your protection.')} className="text-secondary cursor-pointer hover:text-primary transition-colors">Security Protocol</span>.
                  </p>
               </div>
               <div className="flex gap-4 opacity-30 select-none hidden md:flex">
                  <div className="w-12 h-0.5 bg-outline-variant"></div>
                  <div className="w-12 h-0.5 bg-outline-variant"></div>
                  <div className="w-12 h-0.5 bg-outline-variant"></div>
               </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

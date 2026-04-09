import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Info, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });

      if (data.mustChangePassword) {
        localStorage.setItem('accessToken', data.accessToken);
        navigate('/change-password');
        return;
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      login(data.user);
      toast.success('Login successful!');

      const role = data.user.role;
      if (['SuperAdmin', 'InstitutionAdmin', 'AcademicAdmin', 'Moderator'].includes(role)) {
        navigate('/admin/dashboard');
      } else if (role === 'Teacher') {
        navigate('/teacher/dashboard');
      } else if (role === 'Student') {
        navigate('/student/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSupportClick = () => {
    toast.info('Support: support@classbridge.edu');
  };

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary/30 min-h-screen overflow-x-hidden">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/40 backdrop-blur-xl border-b border-outline-variant/10 shadow-lg">
        <div className="flex justify-between items-center px-8 py-4 max-w-screen-2xl mx-auto font-headline tracking-tight">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ClassBridge</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-on-surface-variant hover:text-primary transition-colors" to="/">Home</Link>
            <button 
              onClick={handleSupportClick}
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              Support
            </button>
            <Link 
              to="/institution/signup"
              className="border border-outline-variant/40 text-on-surface px-6 py-2 rounded-full font-bold scale-95 active:scale-90 duration-200 transition-all hover:border-primary hover:text-primary bg-transparent"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex flex-col md:flex-row min-h-screen pt-16">
        {/* Left Side: Immersive Visual */}
        <section className="hidden md:flex w-1/2 relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              alt="ClassBridge Platform" 
              className="w-full h-full object-cover grayscale opacity-30 mix-blend-overlay"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8UcZzdk3k7Sv3MDIfkVQy540B_fMMQjLH0aqd1Y2DNj3GqcYZF2ZKy0l_iTxWUT0A-wFz33cOukG9kYlScXkBUbaHrz7FauapjT4TlnWrWCsQCul52fEwqhEbmMdLWKrUucxl1t0g03jC54amyJrWeDd3k49PkmGDbQbzoxI8Uv5Q5_lgAlC_j8mRiKkKTi9ADWG_WTJcxtSkLhW1aved7peBDK8U0Q0j3ZLg-_Ca3zSXdUuGkuSzQhGTmSgXjXp1Sfd6bZ0zm-k"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface text-left"></div>
          </div>
          <div className="relative z-10 p-12 max-w-xl text-left">
            <div className="mb-2 text-primary font-black tracking-[0.3em] uppercase text-xs">Login Portal</div>
            <h1 className="text-5xl font-black font-headline text-white mb-6 leading-none tracking-tighter">
              Welcome <br />
              <span className="text-primary">Back</span>
            </h1>
            <p className="text-white/60 font-body text-lg leading-relaxed">
              Log in to access your classes, study materials, and connect with your teachers.
            </p>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="glass-panel w-full max-w-md p-8 md:p-12 rounded-[2rem] shadow-2xl relative z-10">
            <div className="mb-10 text-center md:text-left">
              <h2 className="font-headline text-4xl font-bold text-on-surface mb-2 tracking-tight">Login</h2>
              <p className="text-on-surface-variant font-body">Sign in to your account to continue.</p>
            </div>

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3 animate-fade-in">
                <Info size={18} className="text-primary flex-shrink-0" />
                <p className="text-sm text-primary">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Email Field */}
              <div className="space-y-1 group text-left">
                <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 group-focus-within:text-primary transition-colors">Email Address</label>
                <div className="relative">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-3 px-0 border-0 border-b-2 border-outline-variant/30 bg-transparent text-on-surface placeholder:text-outline-variant/50 font-body focus:outline-none focus:border-primary transition-all pr-10"
                    placeholder="name@email.com"
                    required
                    type="email"
                  />
                  <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-outline-variant/30 group-focus-within:text-primary transition-all text-lg">alternate_email</span>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 group text-left">
                <div className="flex justify-between items-end">
                  <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 group-focus-within:text-primary transition-colors">Password</label>
                </div>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-3 px-0 border-0 border-b-2 border-outline-variant/30 bg-transparent text-on-surface placeholder:text-outline-variant/50 font-body focus:outline-none focus:border-primary transition-all pr-10"
                    placeholder="••••••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-outline-variant/30 group-focus-within:text-primary transition-all"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <div className="mt-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-3">
                  <Info size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-on-surface-variant">
                    Password resets are managed by your institution. Contact your school admin or IT department.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 animate-fade-in">
                  <Info size={18} className="text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              {/* Action */}
              <div className="pt-4">
                <button
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-primary text-on-primary-container font-headline font-extrabold text-lg rounded-full shadow-[0_10px_30px_rgba(83,221,252,0.2)] hover:shadow-[0_15px_40px_rgba(83,221,252,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                  type="submit"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Login to Dashboard
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-10 pt-8 border-t border-outline-variant/10 text-center">
              <p className="text-on-surface-variant text-sm font-body">
                Not registered? 
                <Link to="/institution/signup" className="font-label text-secondary hover:text-primary transition-colors uppercase tracking-widest text-xs ml-2 font-bold focus:outline-none">Sign Up Now</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

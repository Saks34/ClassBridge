import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function ChangePassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { theme, toggleTheme, isDark } = useTheme();
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/change-password', { newPassword });
            const { user, accessToken, refreshToken } = data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            login(user);
            toast.success('Password changed successfully!');

            // Route by role
            const role = user?.role;
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
            const msg = err.response?.data?.message || 'Failed to change password';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300 bg-surface">
            {/* Theme Toggle Overlay */}
            <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.05),transparent_70%)] pointer-events-none"></div>

            <button
                onClick={toggleTheme}
                className="fixed top-6 right-6 p-3 rounded-full shadow-lg hover:shadow-primary/20 transition-all duration-300 group bg-surface-container-high border border-outline-variant/10"
                aria-label="Toggle theme"
            >
                {isDark ? (
                    <Sun className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
                ) : (
                    <Moon className="w-5 h-5 text-secondary group-hover:rotate-12 transition-transform" />
                )}
            </button>

            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-lg mb-6 transform hover:scale-110 transition-transform">
                        <ShieldCheck className="w-8 h-8 text-on-primary-container" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 text-on-surface font-headline tracking-tight">
                        Secure Your Account
                    </h1>
                    <p className="text-on-surface-variant font-body">
                        Please set a new secure password to continue
                    </p>
                </div>

                {/* Main Card */}
                <div className="rounded-[2.5rem] shadow-2xl p-8 md:p-10 backdrop-blur-sm bg-surface-container-low/40 border border-outline-variant/10 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-20"></div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password */}
                        <div>
                            <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 font-bold block mb-2">
                                New Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/30 group-focus-within:text-primary transition-colors" />
                                <input
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-8 pr-12 py-3 bg-transparent border-0 border-b-2 border-outline-variant/30 text-on-surface placeholder:text-outline-variant/50 font-body focus:outline-none focus:border-primary transition-all"
                                />
                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-primary transition-colors"
                                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}>
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="font-label text-[10px] uppercase tracking-widest text-primary/70 font-bold block mb-2">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/30 group-focus-within:text-primary transition-colors" />
                                <input
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-8 pr-12 py-3 bg-transparent border-0 border-b-2 border-outline-variant/30 text-on-surface placeholder:text-outline-variant/50 font-body focus:outline-none focus:border-primary transition-all"
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-primary transition-colors"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 animate-fade-in">
                                <div className="w-1 h-5 bg-error rounded-full shrink-0"></div>
                                <p className="text-sm text-error font-body">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 px-6 rounded-full bg-gradient-primary text-on-primary-container font-headline font-extrabold text-lg shadow-[0_10px_30px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_15px_40px_rgba(var(--primary-rgb),0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Update Security Protocol
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center mt-8 text-[10px] font-label uppercase tracking-[0.3em] font-bold text-on-surface-variant/40">
                    Signal Encryption v4.2.0 • Active Node
                </p>
            </div>
        </div>
    );
}

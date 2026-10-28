import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import PasswordStrength from '../components/ui/PasswordStrength';
import API from '../api';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (!form.confirm) e.confirm = 'Please confirm your password';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    if (!terms) e.terms = 'You must accept the terms';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await API.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      navigate('/login');
    } catch (error) {
      setErrors({
        email: error.response?.data?.message || 'Signup failed',
      });
    }

    setLoading(false);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left branding panel — identical to Login */}
      <div className="hidden lg:flex flex-1 bg-text items-center justify-center p-12">
        <div className="max-w-[380px]">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IX</span>
            </div>
            <span className="text-[18px] font-bold text-white tracking-[-0.5px]">GitHired</span>
          </div>
          <h2 className="text-[32px] font-extrabold text-white tracking-[-1px] leading-[1.15] mb-4">
            Start practicing smarter, get hired faster.
          </h2>
          <p className="text-[15px] text-white/50 leading-[1.7]">
            Create your account and get instant access to AI-powered mock
            interviews, feedback, and company-specific question banks.
          </p>
          <div className="mt-12 space-y-4">
            {[
              { label: '50,000+ professionals trust GitHired', icon: '✓' },
              { label: 'AI-powered feedback in seconds', icon: '✓' },
              { label: '50+ company interview libraries', icon: '✓' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-[14px] text-white/70">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px]"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IX</span>
            </div>
            <span className="text-[18px] font-bold text-text tracking-[-0.5px]">GitHired</span>
          </div>

          <h1 className="text-[28px] font-extrabold text-text tracking-[-0.8px] mb-2">
            Create your account
          </h1>
          <p className="text-[15px] text-text-secondary mb-8">
            Start practicing smarter, get hired faster.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-[13px] font-semibold text-text mb-1.5">
                Full name
              </label>
              <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-bg-card transition-colors ${
                  errors.name ? 'border-red-400' : 'border-border focus-within:border-accent/40'
                }`}
              >
                <User className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={set('name')}
                  autoComplete="name"
                  className="flex-1 bg-transparent outline-none text-[14px] text-text placeholder:text-text-secondary/50"
                />
              </div>
              {errors.name && (
                <p className="text-[12px] text-red-500 mt-1.5 font-medium">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold text-text mb-1.5">
                Email address
              </label>
              <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-bg-card transition-colors ${
                  errors.email ? 'border-red-400' : 'border-border focus-within:border-accent/40'
                }`}
              >
                <Mail className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  className="flex-1 bg-transparent outline-none text-[14px] text-text placeholder:text-text-secondary/50"
                />
              </div>
              {errors.email && (
                <p className="text-[12px] text-red-500 mt-1.5 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-semibold text-text mb-1.5">
                Password
              </label>
              <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-bg-card transition-colors ${
                  errors.password ? 'border-red-400' : 'border-border focus-within:border-accent/40'
                }`}
              >
                <Lock className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  className="flex-1 bg-transparent outline-none text-[14px] text-text placeholder:text-text-secondary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-text-secondary hover:text-text transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && (
                <p className="text-[12px] text-red-500 mt-1.5 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-[13px] font-semibold text-text mb-1.5">
                Confirm password
              </label>
              <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-bg-card transition-colors ${
                  errors.confirm ? 'border-red-400' : 'border-border focus-within:border-accent/40'
                }`}
              >
                <Lock className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  autoComplete="new-password"
                  className="flex-1 bg-transparent outline-none text-[14px] text-text placeholder:text-text-secondary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-text-secondary hover:text-text transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm && (
                <p className="text-[12px] text-red-500 mt-1.5 font-medium">{errors.confirm}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-accent"
              />
              <span className="text-[13px] text-text-secondary leading-[1.5]">
                I agree to the{' '}
                <a href="#" className="text-accent font-semibold hover:text-accent-dark transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-accent font-semibold hover:text-accent-dark transition-colors">
                  Privacy Policy
                </a>
              </span>
            </div>
            {errors.terms && (
              <p className="text-[12px] text-red-500 -mt-2 font-medium">{errors.terms}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold text-[15px] py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[14px] text-text-secondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-semibold hover:text-accent-dark transition-colors">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
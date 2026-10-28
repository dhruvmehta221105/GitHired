import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Companies', href: '#companies' },
    { label: 'Pricing', href: '#pricing' },
    
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IX</span>
          </div>
          <span className="text-[18px] font-bold text-text tracking-[-0.5px]">
            GitHired
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[14px] font-medium text-text-secondary hover:text-text transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-bg-secondary transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-text">{user.name?.split(' ')[0] || 'User'}</span>
                <ChevronDown className="w-4 h-4 text-text-secondary" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-bg-card rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-border py-2 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-secondary hover:text-text transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      to="/interviews"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-secondary hover:text-text transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/view-feedback"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-secondary hover:text-text transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Feedback workspace
                      </Link>
                    )}
                    <div className="h-px bg-border mx-3 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[14px] font-medium text-text-secondary hover:text-text transition-colors duration-200 px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-[14px] font-semibold text-white bg-accent hover:bg-accent-dark px-5 py-2.5 rounded-xl transition-all duration-200"
              >
                Start Free
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-xl hover:bg-bg-secondary transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[72px] bg-white z-40">
          <div className="p-6 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-[16px] font-medium text-text py-3 px-4 rounded-xl hover:bg-bg-secondary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="h-px bg-border my-4" />
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="text-[16px] font-medium text-text py-3 px-4 rounded-xl hover:bg-bg-secondary transition-colors"
                >
                  Profile
                </Link>
                <Link
                  to="/interviews"
                  onClick={() => setMobileOpen(false)}
                  className="text-[16px] font-medium text-text py-3 px-4 rounded-xl hover:bg-bg-secondary transition-colors"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/view-feedback"
                    onClick={() => setMobileOpen(false)}
                    className="text-[16px] font-medium text-text py-3 px-4 rounded-xl hover:bg-bg-secondary transition-colors"
                  >
                    Feedback workspace
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="text-[16px] font-medium text-red-600 py-3 px-4 rounded-xl hover:bg-red-50 transition-colors text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-center text-[15px] font-medium text-text py-3 px-4 rounded-xl border border-border hover:bg-bg-secondary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="text-center text-[15px] font-semibold text-white bg-accent py-3 px-4 rounded-xl hover:bg-accent-dark transition-colors"
                >
                  Start Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
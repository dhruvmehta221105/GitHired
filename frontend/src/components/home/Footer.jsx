import { useState } from 'react';
import { Link } from 'react-router-dom';

const footerLinks = {
  Product: [
    { label: 'AI Interviews', href: '#features' },
    { label: 'HR Sessions', href: '#features' },
    { label: 'Resume Review', href: '#features' },
    { label: 'Analytics', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
  ],
  Resources: [
    { label: 'Interview Guide', href: '#' },
    { label: 'Resume Tips', href: '#' },
    { label: 'Company Prep', href: '#companies' },
    { label: 'Blog', href: '#' },
    { label: 'Help Center', href: '#' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Press', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <footer className="bg-bg-card border-t border-border">
      <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-14">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IX</span>
              </div>
              <span className="text-[18px] font-bold text-text tracking-[-0.5px]">GitHired</span>
            </Link>
            <p className="text-[13px] text-text-secondary leading-[1.7] mb-5 max-w-[260px]">
              The all-in-one interview preparation platform for ambitious professionals.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-[280px]">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-[13px] bg-bg border border-border rounded-xl focus:outline-none focus:border-accent/40 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-accent text-white text-[13px] font-semibold rounded-xl hover:bg-accent-dark transition-colors flex-shrink-0"
              >
                {submitted ? '✓' : 'Subscribe'}
              </button>
            </form>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[13px] font-bold text-text mb-4 tracking-[-0.2px]">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-text-secondary hover:text-text transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-border gap-4">
          <span className="text-[12px] text-text-secondary">
            © {new Date().getFullYear()} GitHired. All rights reserved.
          </span>
          <div className="flex items-center gap-5">
            {['X', 'Li', 'Gh', 'Yt'].map((icon) => (
              <a
                key={icon}
                href="#"
                className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center text-[11px] font-bold text-text-secondary hover:text-text hover:bg-bg-secondary transition-all duration-200"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

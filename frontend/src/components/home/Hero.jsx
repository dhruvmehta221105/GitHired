import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, FileText, Calendar, BarChart3, Clock, Star, CheckCircle2 } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[560px]">
      <div className="bg-bg-card rounded-2xl border border-border shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-[11px] text-text-secondary font-medium">GitHired Dashboard</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-bg rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-medium text-text-secondary">Score</span>
            </div>
            <div className="text-[22px] font-bold text-text leading-none">87<span className="text-[13px] text-text-secondary font-medium">/100</span></div>
            <div className="text-[10px] text-accent font-semibold mt-1">↑ 12% this week</div>
          </div>
          <div className="bg-bg rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-medium text-text-secondary">Resume</span>
            </div>
            <div className="text-[22px] font-bold text-text leading-none">92<span className="text-[13px] text-text-secondary font-medium">%</span></div>
            <div className="text-[10px] text-accent font-semibold mt-1">ATS Optimized</div>
          </div>
          <div className="bg-bg rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-medium text-text-secondary">Sessions</span>
            </div>
            <div className="text-[22px] font-bold text-text leading-none">24</div>
            <div className="text-[10px] text-text-secondary font-medium mt-1">This month</div>
          </div>
        </div>

        <div className="bg-bg rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-semibold text-text">Performance Trend</span>
            <span className="text-[10px] text-text-secondary">Last 7 sessions</span>
          </div>
          <div className="flex items-end gap-2 h-[64px]">
            {[45, 58, 52, 68, 72, 78, 87].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-md transition-all duration-500"
                  style={{
                    height: `${h * 0.7}px`,
                    backgroundColor: i === 6 ? 'var(--color-accent)' : 'var(--color-border)',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} className="text-[9px] text-text-secondary font-medium flex-1 text-center">{d}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-text block mb-2">Upcoming</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-accent" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-text">Google SDE</div>
                <div className="text-[10px] text-text-secondary">Tomorrow, 2:00 PM</div>
              </div>
            </div>
          </div>
          <div className="bg-bg rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-text block mb-2">Recent</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-text">Amazon PM</div>
                <div className="text-[10px] text-text-secondary">Score: 85/100</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative pt-[120px] pb-20 lg:pb-28 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 max-w-[560px]">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/8 border border-accent/15 mb-6"
            >
              <Star className="w-3.5 h-3.5 text-accent" />
              <span className="text-[13px] font-semibold text-accent">Trusted by 50,000+ professionals</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-[44px] sm:text-[52px] lg:text-[64px] font-extrabold text-text leading-[1.05] tracking-[-2px] mb-5"
            >
              Ace Every Interview{' '}
              <span className="text-accent">with Confidence.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-[17px] lg:text-[18px] text-text-secondary leading-[1.7] mb-8 max-w-[480px]"
            >
              Practice with AI interviewers and real HR experts. Get actionable feedback,
              company-specific preparation, and ATS-optimized resume reviews — all in one platform.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_4px_16px_rgba(31,94,59,0.3)]"
              >
                Start Practicing Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 bg-bg-card border border-border hover:border-text/20 text-text font-semibold text-[15px] px-7 py-3.5 rounded-xl transition-all duration-200"
              >
                See How It Works
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="flex items-center gap-4 mt-8"
            >
              <div className="flex -space-x-2">
                {['A', 'S', 'R', 'M'].map((letter, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white bg-accent/10 flex items-center justify-center text-[11px] font-bold text-accent"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[12px] text-text-secondary">4.9 from 2,400+ reviews</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-1 w-full flex justify-center lg:justify-end"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
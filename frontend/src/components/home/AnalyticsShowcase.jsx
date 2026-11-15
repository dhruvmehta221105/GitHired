import { motion } from 'framer-motion';
import { TrendingUp, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

function SkillRadar() {
  const skills = [
    { name: 'Communication', value: 88, max: 100 },
    { name: 'Technical', value: 75, max: 100 },
    { name: 'Problem Solving', value: 82, max: 100 },
    { name: 'System Design', value: 65, max: 100 },
    { name: 'Behavioral', value: 91, max: 100 },
    { name: 'Leadership', value: 70, max: 100 },
  ];

  return (
    <div className="bg-bg-card rounded-2xl border border-border/60 p-6">
      <h4 className="text-[14px] font-bold text-text mb-5">Skill Breakdown</h4>
      <div className="space-y-3.5">
        {skills.map((skill) => (
          <div key={skill.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium text-text-secondary">{skill.name}</span>
              <span className="text-[12px] font-bold text-text">{skill.value}%</span>
            </div>
            <div className="h-2 bg-bg rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${skill.value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full bg-accent rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HiringReadiness() {
  return (
    <div className="bg-bg-card rounded-2xl border border-border/60 p-6">
      <h4 className="text-[14px] font-bold text-text mb-5">Hiring Readiness</h4>
      <div className="flex items-center justify-center mb-5">
        <div className="relative w-[120px] h-[120px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-bg)" strokeWidth="8" />
            <motion.circle
              cx="60" cy="60" r="52" fill="none"
              stroke="var(--color-accent)" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
              whileInView={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - 0.78) }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-extrabold text-text leading-none">78%</span>
            <span className="text-[10px] text-text-secondary font-medium mt-0.5">Ready</span>
          </div>
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2.5 text-[12px]">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-text-secondary">Communication skills — Strong</span>
        </div>
        <div className="flex items-center gap-2.5 text-[12px]">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-text-secondary">Behavioral prep — Complete</span>
        </div>
        <div className="flex items-center gap-2.5 text-[12px]">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-text-secondary">System design — Needs work</span>
        </div>
        <div className="flex items-center gap-2.5 text-[12px]">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-text-secondary">Data structures — Practice more</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsShowcase() {
  return (
    <section className="py-16 lg:py-24 bg-bg-alt">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-[13px] font-semibold text-accent uppercase tracking-[2px] mb-4">
            Analytics
          </span>
          <h2 className="text-[36px] sm:text-[42px] lg:text-[48px] font-extrabold text-text tracking-[-1.5px] leading-[1.1] mb-5">
            Know exactly where you stand.
          </h2>
          <p className="text-[17px] text-text-secondary max-w-[500px] mx-auto leading-[1.7]">
            Track every dimension of your interview performance
            with comprehensive, actionable analytics.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-bg-card rounded-3xl border border-border/60 shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-6 lg:p-8"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Sessions', value: '47', change: '+8 this month', icon: TrendingUp },
              { label: 'Avg. Score', value: '82', change: '+12 pts improvement', icon: Target },
              { label: 'Weak Areas', value: '3', change: 'Down from 7', icon: AlertTriangle },
              { label: 'Interview Ready', value: '78%', change: 'On track', icon: CheckCircle2 },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-bg rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-accent" />
                    <span className="text-[11px] font-semibold text-text-secondary">{stat.label}</span>
                  </div>
                  <div className="text-[24px] font-extrabold text-text leading-none mb-1">{stat.value}</div>
                  <div className="text-[11px] text-accent font-medium">{stat.change}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SkillRadar />
            <HiringReadiness />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import { Bot, Users, FileSearch, Building2, MessageSquareText, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI Mock Interviews',
    description: 'Practice with intelligent AI interviewers that adapt to your skill level and provide real-time feedback on your responses.',
    tag: 'Most Popular',
  },
  {
    icon: Users,
    title: 'HR Expert Sessions',
    description: 'Book one-on-one sessions with experienced HR professionals who conduct realistic behavioral and technical interviews.',
    tag: null,
  },
  {
    icon: FileSearch,
    title: 'Resume ATS Review',
    description: 'Get your resume scored against real ATS systems. Receive actionable suggestions to improve keyword matching and formatting.',
    tag: null,
  },
  {
    icon: Building2,
    title: 'Company-Specific Prep',
    description: 'Access curated question banks from Google, Amazon, Microsoft, and 50+ top companies with role-specific practice sessions.',
    tag: 'New',
  },
  {
    icon: MessageSquareText,
    title: 'Detailed Feedback',
    description: 'Receive comprehensive analysis on communication, technical accuracy, problem-solving approach, and body language.',
    tag: null,
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Track your progress with detailed charts, skill radars, weakness identification, and hiring readiness scores.',
    tag: null,
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-bg-secondary">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[13px] font-semibold text-accent uppercase tracking-[2px] mb-4">
            Features
          </span>
          <h2 className="text-[36px] sm:text-[42px] lg:text-[48px] font-extrabold text-text tracking-[-1.5px] leading-[1.1] mb-5">
            Everything you need to<br className="hidden sm:block" /> land your dream job.
          </h2>
          <p className="text-[17px] text-text-secondary max-w-[520px] mx-auto leading-[1.7]">
            From AI-powered practice sessions to expert resume reviews,
            GitHired covers every step of your preparation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="group bg-bg-card rounded-2xl p-7 border border-border/60 hover:border-accent/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-accent/8 flex items-center justify-center group-hover:bg-accent/12 transition-colors duration-300">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  {feature.tag && (
                    <span className="text-[11px] font-semibold text-accent bg-accent/8 px-2.5 py-1 rounded-full">
                      {feature.tag}
                    </span>
                  )}
                </div>
                <h3 className="text-[17px] font-bold text-text mb-2.5 tracking-[-0.3px]">
                  {feature.title}
                </h3>
                <p className="text-[14px] text-text-secondary leading-[1.7]">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

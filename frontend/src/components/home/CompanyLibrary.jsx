import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Code2, FileText, MessageCircle, Target } from 'lucide-react';

const preparationPaths = [
  {
    icon: MessageCircle,
    title: 'Behavioral confidence',
    description: 'Build clear, structured stories for leadership and culture-fit questions.',
    detail: 'STAR answer practice',
  },
  {
    icon: Code2,
    title: 'Technical readiness',
    description: 'Sharpen problem-solving with role-specific technical interview rounds.',
    detail: 'Coding and system design',
  },
  {
    icon: FileText,
    title: 'Resume strength',
    description: 'Make your experience easier for recruiters and ATS systems to find.',
    detail: 'ATS score and suggestions',
  },
  {
    icon: Target,
    title: 'Personal game plan',
    description: 'Turn feedback into a focused weekly plan that targets your weak areas.',
    detail: 'Progress tracking',
  },
];

export default function CompanyLibrary() {
  return (
    <section id="companies" className="py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[13px] font-semibold text-accent uppercase tracking-[2px] mb-4">
            Company Library
          </span>
          <h2 className="text-[36px] sm:text-[42px] lg:text-[48px] font-extrabold text-text tracking-[-1.5px] leading-[1.1] mb-5">
            Practice for your dream company.
          </h2>
          <p className="text-[17px] text-text-secondary max-w-[500px] mx-auto leading-[1.7]">
            Access curated interview questions and preparation materials
            from the world's top technology companies.
          </p>
        </motion.div>

        <motion.img
          src="/files/10-company-prep.svg"
          alt="Company-specific interview preparation library"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full mb-10 rounded-2xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
        />

        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <span className="inline-block text-[12px] font-semibold text-accent uppercase tracking-[1.5px] mb-2">
              Prepare beyond the company list
            </span>
            <h3 className="text-[24px] sm:text-[28px] font-extrabold text-text tracking-[-0.8px]">
              Build the skills every interview tests.
            </h3>
          </div>
          <BookOpen className="hidden sm:block w-8 h-8 text-accent flex-shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {preparationPaths.map((path, i) => {
            const Icon = path.icon;
            return (
            <motion.div
              key={path.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group bg-bg-card rounded-2xl border border-border/60 p-5 hover:border-accent/20 hover:shadow-[0_8px_28px_rgba(0,0,0,0.05)] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-[15px] font-bold text-text mb-2">{path.title}</h3>
              <p className="text-[13px] text-text-secondary leading-[1.6] mb-4">
                {path.description}
              </p>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-accent">
                <span>{path.detail}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

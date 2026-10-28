import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'SDE at Google',
    initials: 'PS',
    rating: 5,
    text: 'GitHired completely transformed my interview preparation. The AI mock interviews felt incredibly realistic, and the feedback helped me identify blind spots I never knew I had. Landed my dream role at Google within 3 months.',
  },
  {
    name: 'Rahul Verma',
    role: 'PM at Amazon',
    initials: 'RV',
    rating: 5,
    text: 'The company-specific prep was a game changer. Practicing Amazon\'s leadership principle questions with real HR experts gave me the confidence I needed. The analytics dashboard helped me track my improvement week over week.',
  },
  {
    name: 'Ananya Gupta',
    role: 'Data Scientist at Microsoft',
    initials: 'AG',
    rating: 5,
    text: 'I was skeptical about AI interviews at first, but the depth of feedback surprised me. The resume ATS review alone was worth the subscription — it helped me get 3x more callbacks from applications.',
  },
  {
    name: 'Vikram Patel',
    role: 'Designer at Adobe',
    initials: 'VP',
    rating: 5,
    text: 'As a designer, I needed help with behavioral interviews. GitHired\'s HR expert sessions were incredible — structured, realistic, and the detailed scorecards helped me improve systematically.',
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 lg:py-32 bg-bg-secondary">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[13px] font-semibold text-accent uppercase tracking-[2px] mb-4">
            Testimonials
          </span>
          <h2 className="text-[36px] sm:text-[42px] lg:text-[48px] font-extrabold text-text tracking-[-1.5px] leading-[1.1] mb-5">
            Loved by professionals worldwide.
          </h2>
          <p className="text-[17px] text-text-secondary max-w-[480px] mx-auto leading-[1.7]">
            See how GitHired has helped thousands of candidates
            land roles at top companies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="bg-bg-card rounded-2xl border border-border/60 p-7 hover:shadow-[0_8px_28px_rgba(0,0,0,0.04)] transition-all duration-300"
            >
              <Quote className="w-8 h-8 text-accent/20 mb-4" />
              <p className="text-[15px] text-text-secondary leading-[1.8] mb-6">
                {t.text}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-[13px] font-bold text-accent">{t.initials}</span>
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-text">{t.name}</div>
                    <div className="text-[12px] text-text-secondary">{t.role}</div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

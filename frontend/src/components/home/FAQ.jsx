import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: 'How does the AI interview work?',
    a: 'Our AI interviewer uses advanced language models to simulate real interview conversations. It adapts questions based on your responses, evaluates your answers in real-time, and provides detailed scoring across communication, technical accuracy, and problem-solving dimensions.',
  },
  {
    q: 'Can I practice for specific companies?',
    a: 'Yes. We offer curated question banks and interview simulations for 50+ companies including Google, Amazon, Microsoft, Meta, Adobe, and more. Each simulation mirrors the company\'s actual interview format, question style, and evaluation criteria.',
  },
  {
    q: 'What does the ATS resume review include?',
    a: 'Our ATS review scans your resume against the same systems top companies use. You\'ll receive a compatibility score, keyword optimization suggestions, formatting fixes, and specific recommendations to improve your callback rate.',
  },
  {
    q: 'How are HR expert sessions conducted?',
    a: 'HR expert sessions are one-on-one video calls with experienced recruiters and hiring managers from top companies. They conduct realistic interviews and provide detailed feedback on your performance, body language, and areas for improvement.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Absolutely. All paid plans can be cancelled at any time with no questions asked. You\'ll continue to have access to your plan\'s features until the end of your current billing period. No long-term contracts or hidden fees.',
  },
  {
    q: 'Is my interview data private and secure?',
    a: 'Yes. We take privacy seriously. All interview recordings and data are encrypted and stored securely. We never share your personal information or interview data with third parties. You can delete your data at any time.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-16 lg:py-24 bg-bg-secondary">
      <div className="max-w-[720px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-[13px] font-semibold text-accent uppercase tracking-[2px] mb-4">
            FAQ
          </span>
          <h2 className="text-[36px] sm:text-[42px] font-extrabold text-text tracking-[-1.5px] leading-[1.1] mb-5">
            Common questions, answered.
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`bg-bg-card rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen ? 'border-accent/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)]' : 'border-border/60'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="flex items-center justify-between w-full text-left px-6 py-5 group"
                >
                  <span className={`text-[15px] font-semibold pr-4 transition-colors duration-200 ${isOpen ? 'text-text' : 'text-text group-hover:text-text'}`}>
                    {faq.q}
                  </span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isOpen ? 'bg-accent text-white' : 'bg-bg text-text-secondary'
                  }`}>
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <div className="px-6 pb-5">
                        <p className="text-[14px] text-text-secondary leading-[1.8]">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

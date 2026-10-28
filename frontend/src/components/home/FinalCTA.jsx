import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-text rounded-3xl px-8 py-16 sm:px-16 sm:py-20 text-center"
        >
          <h2 className="text-[32px] sm:text-[40px] lg:text-[48px] font-extrabold text-white tracking-[-1.5px] leading-[1.1] mb-5">
            Ready to ace your next interview?
          </h2>
          <p className="text-[17px] text-white/60 max-w-[460px] mx-auto leading-[1.7] mb-8">
            Join 50,000+ professionals who are landing offers at
            their dream companies with GitHired.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold text-[15px] px-8 py-4 rounded-xl transition-all duration-200"
            >
              Start Practicing Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-[15px] px-8 py-4 rounded-xl transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

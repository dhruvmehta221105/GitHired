import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Free',
    price: '0',
    period: 'forever',
    description: 'Get started with basic interview practice.',
    features: [
      '3 AI mock interviews/month',
      'Basic feedback reports',
      '5 company question banks',
      'Resume upload',
      'Community access',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '500',
    period: '/month',
    description: 'For serious candidates preparing for top companies.',
    features: [
      'Unlimited AI interviews',
      'Detailed AI analysis & scoring',
      'All 50+ company question banks',
      'ATS resume review',
      'Performance analytics',
      'HR expert sessions (2/month)',
      'Company-specific prep paths',
      'Priority support',
    ],
    cta: 'Get Started',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '3000',
    period: '/year',
    description: 'Maximum preparation for high-stakes interviews.',
    features: [
      'Everything in Pro',
      'Unlimited HR expert sessions',
      'Personal interview coach',
      'Custom preparation plans',
      'Video interview analysis',
      'Salary negotiation prep',
      'Executive interview training',
      'Dedicated account manager',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 lg:py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-[13px] font-semibold text-accent uppercase tracking-[2px] mb-4">
            Pricing
          </span>
          <h2 className="text-[36px] sm:text-[42px] lg:text-[48px] font-extrabold text-text tracking-[-1.5px] leading-[1.1] mb-5">
            Simple, transparent pricing.
          </h2>
          <p className="text-[17px] text-text-secondary max-w-[460px] mx-auto leading-[1.7]">
            Choose the plan that fits your preparation needs.
            Upgrade or cancel anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[960px] mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className={`rounded-2xl p-7 border transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-text border-text shadow-[0_12px_40px_rgba(0,0,0,0.12)] relative'
                  : 'bg-bg-card border-border/60 hover:border-border hover:shadow-[0_8px_28px_rgba(0,0,0,0.04)]'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[11px] font-bold text-text bg-accent px-3 py-1 rounded-full text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-[16px] font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-text'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-[40px] font-extrabold tracking-[-1px] ${plan.highlighted ? 'text-white' : 'text-text'}`}>
                    ₹{plan.price}
                  </span>
                  <span className={`text-[14px] font-medium ${plan.highlighted ? 'text-white/60' : 'text-text-secondary'}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-[13px] leading-relaxed ${plan.highlighted ? 'text-white/60' : 'text-text-secondary'}`}>
                  {plan.description}
                </p>
              </div>

              <Link
                to="/signup"
                className={`block w-full text-center py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 mb-6 ${
                  plan.highlighted
                    ? 'bg-accent text-white hover:bg-accent-dark'
                    : 'bg-bg border border-border text-text hover:bg-bg-secondary'
                }`}
              >
                {plan.cta}
              </Link>

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-accent' : 'text-accent'}`} />
                    <span className={`text-[13px] leading-snug ${plan.highlighted ? 'text-white/80' : 'text-text-secondary'}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

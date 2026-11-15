import { motion } from 'framer-motion';

const companies = [
  { name: 'Google', logo: 'G' },
  { name: 'Microsoft', logo: 'M' },
  { name: 'Amazon', logo: 'A' },
  { name: 'Adobe', logo: 'Ad' },
  { name: 'Atlassian', logo: 'At' },
  { name: 'Uber', logo: 'U' },
  { name: 'Stripe', logo: 'S' },
  { name: 'Meta', logo: 'Me' },
];

export default function TrustedBy() {
  const marqueeCompanies = [...companies, ...companies];

  return (
    <section id="trusted-by" className="relative overflow-hidden border-y border-border/60 bg-bg-card py-14 lg:py-20">
      <div className="absolute left-1/2 top-0 h-48 w-[680px] -translate-x-1/2 rounded-full bg-accent/8 blur-3xl" />
      <div className="relative mx-auto max-w-[1200px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-10 max-w-4xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-2 text-[11px] font-bold uppercase tracking-[2px] text-accent">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            Built for ambitious careers
          </div>
          <h2 className="text-[36px] font-extrabold leading-tight tracking-[-1.2px] text-text sm:text-[52px]">
            Join the professionals preparing for their next big move.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-7 text-text-secondary">
            The smartest candidates use GitHired to sharpen their edge before they walk into the room.
          </p>
        </motion.div>

        <div className="relative -mx-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
            className="flex w-max items-center gap-5 px-4"
          >
            {marqueeCompanies.map((company, index) => (
              <div
                key={`${company.name}-${index}`}
                className="flex min-w-[190px] items-center gap-3 rounded-2xl border border-border bg-bg px-6 py-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:bg-white hover:shadow-md"
                aria-hidden={index >= companies.length}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <span className="text-[15px] font-extrabold text-accent">{company.logo}</span>
                </div>
                <span className="text-[15px] font-bold tracking-[-0.3px] text-text">{company.name}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-10 grid max-w-4xl grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-bg px-4 py-7 text-center"
        >
          <div>
            <div className="text-[30px] font-extrabold tracking-[-1px] text-text">50K+</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary">Professionals</div>
          </div>
          <div>
            <div className="text-[30px] font-extrabold tracking-[-1px] text-text">92%</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary">Confidence boost</div>
          </div>
          <div>
            <div className="text-[30px] font-extrabold tracking-[-1px] text-text">4.9/5</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[1px] text-text-secondary">User rating</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

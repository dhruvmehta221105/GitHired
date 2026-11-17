import MarketingLayout from '../components/common/MarketingLayout';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';

export default function HowItWorksPage() {
  return (
    <MarketingLayout>
      <div className="pt-[72px]">
        <HowItWorks />
        <Testimonials />
      </div>
    </MarketingLayout>
  );
}

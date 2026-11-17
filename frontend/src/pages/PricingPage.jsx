import MarketingLayout from '../components/common/MarketingLayout';
import Pricing from '../components/home/Pricing';
import FAQ from '../components/home/FAQ';

export default function PricingPage() {
  return (
    <MarketingLayout>
      <div className="pt-[72px]">
        <Pricing />
        <FAQ />
      </div>
    </MarketingLayout>
  );
}

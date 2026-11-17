import MarketingLayout from '../components/common/MarketingLayout';
import Features from '../components/home/Features';
import AnalyticsShowcase from '../components/home/AnalyticsShowcase';

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <div className="pt-[72px]">
        <Features />
        <AnalyticsShowcase />
      </div>
    </MarketingLayout>
  );
}

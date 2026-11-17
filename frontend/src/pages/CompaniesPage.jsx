import MarketingLayout from '../components/common/MarketingLayout';
import TrustedBy from '../components/home/TrustedBy';
import CompanyLibrary from '../components/home/CompanyLibrary';
import Testimonials from '../components/home/Testimonials';

export default function CompaniesPage() {
  return (
    <MarketingLayout>
      <div className="pt-[72px]">
        <TrustedBy />
        <CompanyLibrary />
        <Testimonials />
      </div>
    </MarketingLayout>
  );
}

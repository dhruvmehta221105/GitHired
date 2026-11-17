import Navbar from './Navbar';
import Footer from '../home/Footer';

export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

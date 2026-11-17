import Navbar from '../components/common/Navbar';
import Hero from '../components/home/Hero';
import TrustedBy from '../components/home/TrustedBy';
import FinalCTA from '../components/home/FinalCTA';
import Footer from '../components/home/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <Hero />
      <TrustedBy />
      <FinalCTA />
      <Footer />
    </div>
  );
}
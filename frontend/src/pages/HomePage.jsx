import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroCarousel from '@components/home/HeroCarousel';
import Marquee from '@components/home/Marquee';
import CategoryGrid from '@components/home/CategoryGrid';
import SolutionsSection from '@components/home/SolutionsSection';
import CalculatorSection from '@components/home/CalculatorSection';
import DynamicSections from '@components/home/DynamicSections';
import FeaturedProducts from '@components/home/FeaturedProducts';
import WhyMaxvolt from '@components/home/WhyMaxvolt';
import QuotationForm from '@components/home/QuotationForm';
import ServiceArea from '@components/home/ServiceArea';
import AboutSection from '@components/home/AboutSection';
import ContactSection from '@components/home/ContactSection';

export default function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace(/^#/, '');
    // Defer so section components have mounted
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <>
      <HeroCarousel />
      <Marquee />
      <CategoryGrid />
      <SolutionsSection />
      <CalculatorSection />
      <DynamicSections />
      <FeaturedProducts />
      <WhyMaxvolt />
      <QuotationForm />
      <ServiceArea />
      <AboutSection />
      <ContactSection />
    </>
  );
}
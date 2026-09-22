// ============================================================
// MAXVOLT — Root layout
// ============================================================

import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BackToTop from '@components/ui/BackToTop';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col watermark">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
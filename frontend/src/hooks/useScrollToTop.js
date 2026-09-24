import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace(/^#/, '');
      // Defer so the target section has time to render
      const t = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    return undefined;
  }, [pathname, hash]);
}
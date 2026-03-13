import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * GA4 Measurement ID — in .env oder hier eintragen.
 * Beispiel: G-XXXXXXXXXX
 */
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? '';

/**
 * Loads Google Analytics 4 only when user has given consent.
 * Tracks page views on route changes.
 */
export function useAnalytics() {
  const { pathname } = useLocation();

  // Load GA4 script once if consent is given
  useEffect(() => {
    if (!GA_ID) return;

    const consent = localStorage.getItem('kore-cookie-consent');
    if (consent !== 'analytics') return;

    // Check if already loaded
    if (document.querySelector(`script[src*="gtag"]`)) return;

    // Load gtag.js
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    const inlineScript = document.createElement('script');
    inlineScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}', {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });
    `;
    document.head.appendChild(inlineScript);
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!GA_ID) return;

    const consent = localStorage.getItem('kore-cookie-consent');
    if (consent !== 'analytics') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as unknown as Record<string, unknown>)['gtag'];
    if (typeof gtag === 'function') {
      (gtag as (...args: unknown[]) => void)('event', 'page_view', {
        page_path: pathname,
        page_title: document.title,
      });
    }
  }, [pathname]);
}

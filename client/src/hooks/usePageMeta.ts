import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageMeta {
  title: string;
  description: string;
}

const BASE_URL = 'https://kore-retail.de';

/**
 * Sets document title, meta description, OG tags, Twitter tags
 * and canonical URL for SEO — per page.
 */
export function usePageMeta({ title, description }: PageMeta) {
  const { pathname } = useLocation();

  useEffect(() => {
    const canonicalUrl = `${BASE_URL}${pathname === '/' ? '' : pathname}`;

    // Document title
    document.title = title;

    // Meta description
    setMeta('name', 'description', description);

    // Canonical
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', canonicalUrl);
    }

    // Open Graph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);

    // Twitter
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
  }, [title, description, pathname]);
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  const el = document.querySelector(`meta[${attr}="${key}"]`);
  if (el) {
    el.setAttribute('content', content);
  }
}

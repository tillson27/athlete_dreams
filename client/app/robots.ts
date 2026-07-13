import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private or in-progress surfaces that shouldn't be indexed.
      disallow: ['/dashboard', '/register', '/athletes/*/manage'],
    },
    sitemap: 'https://athletearc.ca/sitemap.xml',
  };
}

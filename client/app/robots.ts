import type { MetadataRoute } from 'next';

// Emit at build time so robots.txt ships in the static export (`output: 'export'`).
export const dynamic = 'force-static';

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

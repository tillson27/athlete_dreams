import type { MetadataRoute } from 'next';
import { mockAthletes } from '@/lib/mockAthletes';

// Emit at build time so the sitemap ships in the static export (`output: 'export'`).
export const dynamic = 'force-static';

const BASE_URL = 'https://athletearc.ca';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/athletes`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/community`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/for-athletes`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/how-it-works`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/mission`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/support`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/sign-up`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/sign-in`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const athleteRoutes: MetadataRoute.Sitemap = mockAthletes.map((athlete) => ({
    url: `${BASE_URL}/athletes/${athlete.athleteSlug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...athleteRoutes];
}

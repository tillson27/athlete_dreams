import type { Metadata } from 'next';
import { unsplashPhoto } from '@/lib/unsplash';
import { nameFromSlug } from '@/lib/slugify';
import { ManageProfile } from './ManageProfile';

const FALLBACK_COVER = unsplashPhoto('1594882645126-14020914d58d', 1400);

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ athleteSlug: string }>;
}): Promise<Metadata> {
  const { athleteSlug } = await params;
  return { title: `Manage — ${nameFromSlug(athleteSlug)}` };
}

export default async function ManageProfilePage({
  params,
}: {
  params: Promise<{ athleteSlug: string }>;
}) {
  const { athleteSlug } = await params;

  return (
    <ManageProfile
      athleteSlug={athleteSlug}
      fallbackAthleteName={nameFromSlug(athleteSlug)}
      fallbackCoverPhoto={FALLBACK_COVER}
    />
  );
}

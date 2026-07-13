'use client';

import Link from 'next/link';
import { useSession } from '@/lib/session';
import { Icon } from '@/components/ui/Icon';

export function OwnerManageLink({
  athleteSlug,
  ownerUserId,
}: {
  athleteSlug: string;
  ownerUserId: string;
}) {
  const { session, ready } = useSession();
  if (!ready || session?.userId !== ownerUserId) return null;

  return (
    <Link
      href={`/athletes/${athleteSlug}/manage`}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button border border-outline px-8 py-4 text-sm font-bold text-secondary transition-colors hover:bg-surface-container-low active:scale-95"
    >
      <Icon name="edit" className="h-4 w-4" />
      Athlete view
    </Link>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { DATA_SOURCE } from '@/lib/dataSource';
import { fetchMyProfile } from '@/lib/api';
import { useSession } from '@/lib/session';
import { slugifyName } from '@/lib/slugify';
import { athleteManageHref } from '@/lib/profileUrl';
import { Icon } from '@/components/ui/Icon';

// Edit-entry button shown only to the signed-in owner of this profile.
export function OwnerManageLink({ athleteSlug }: { athleteSlug: string }) {
  const { session, ready } = useSession();
  const [ownedSlug, setOwnedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (DATA_SOURCE !== 'api' || !ready || !session) return;
    let active = true;
    fetchMyProfile()
      .then((profile) => {
        if (active) setOwnedSlug(profile.athleteSlug);
      })
      .catch(() => {
        if (active) setOwnedSlug(null);
      });
    return () => {
      active = false;
    };
  }, [ready, session]);

  const isOwner =
    DATA_SOURCE === 'api'
      ? ownedSlug === athleteSlug
      : session && slugifyName(session.name) === athleteSlug;
  if (!ready || !session || !isOwner) return null;

  return (
    <a
      href={athleteManageHref(athleteSlug)}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button border border-outline px-8 py-4 text-sm font-bold text-secondary transition-colors hover:bg-surface-container-low active:scale-95"
    >
      <Icon name="edit" className="h-4 w-4" />
      Athlete view
    </a>
  );
}

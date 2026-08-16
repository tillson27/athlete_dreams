import { PlatformRole } from 'fad-common';

const roleOptions = Object.values(PlatformRole);

export function RoleBadges({ roles }: { roles: PlatformRole[] }) {
  const sortedRoles = roleOptions.filter((role) => roles.includes(role));
  if (sortedRoles.length === 0) {
    return <span className="text-on-surface-variant">None</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {sortedRoles.map((role) => (
        <span
          key={role}
          className={`rounded-pill px-2 py-1 text-xs font-bold ${roleBadgeClass(role)}`}
        >
          {role}
        </span>
      ))}
    </div>
  );
}

function roleBadgeClass(role: PlatformRole): string {
  switch (role) {
    case PlatformRole.Admin:
      return 'bg-error/10 text-error';
    case PlatformRole.Athlete:
      return 'bg-focus/10 text-focus';
    case PlatformRole.Supporter:
      return 'bg-success/10 text-success';
    case PlatformRole.Brand:
      return 'bg-primary-soft text-on-surface';
  }
}

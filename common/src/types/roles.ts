export const TeamRole = {
  Owner: 'OWNER',
  Manager: 'MANAGER',
  Member: 'MEMBER',
  Viewer: 'VIEWER',
} as const;

export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];

export const PlatformRole = {
  Athlete: 'ATHLETE',
  Supporter: 'SUPPORTER',
  Brand: 'BRAND',
  Admin: 'ADMIN',
} as const;

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

export const SportCategory = {
  Running: 'RUNNING',
  Triathlon: 'TRIATHLON',
  Cycling: 'CYCLING',
  Swimming: 'SWIMMING',
  Climbing: 'CLIMBING',
  Skiing: 'SKIING',
  Snowboarding: 'SNOWBOARDING',
  Hockey: 'HOCKEY',
  Soccer: 'SOCCER',
  Basketball: 'BASKETBALL',
  TrackAndField: 'TRACK_AND_FIELD',
  CrossCountrySkiing: 'CROSS_COUNTRY_SKIING',
  Other: 'OTHER',
} as const;

export type SportCategory = (typeof SportCategory)[keyof typeof SportCategory];

export const CampaignStatus = {
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  Funded: 'FUNDED',
  Completed: 'COMPLETED',
  Archived: 'ARCHIVED',
} as const;

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const CampaignType = {
  Event: 'EVENT',
  Season: 'SEASON',
  Gear: 'GEAR',
  Travel: 'TRAVEL',
  Training: 'TRAINING',
  General: 'GENERAL',
} as const;

export type CampaignType = (typeof CampaignType)[keyof typeof CampaignType];

export const DonationStatus = {
  Pending: 'PENDING',
  Succeeded: 'SUCCEEDED',
  Refunded: 'REFUNDED',
  Failed: 'FAILED',
} as const;

export type DonationStatus = (typeof DonationStatus)[keyof typeof DonationStatus];

export const InvitationStatus = {
  Pending: 'PENDING',
  Accepted: 'ACCEPTED',
  Revoked: 'REVOKED',
  Declined: 'DECLINED',
  Expired: 'EXPIRED',
} as const;

export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const SponsorshipStatus = {
  Inquiry: 'INQUIRY',
  Negotiating: 'NEGOTIATING',
  Active: 'ACTIVE',
  Ended: 'ENDED',
  Declined: 'DECLINED',
} as const;

export type SponsorshipStatus = (typeof SponsorshipStatus)[keyof typeof SponsorshipStatus];

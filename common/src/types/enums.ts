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

export const AthleteProfileStatus = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Archived: 'ARCHIVED',
} as const;

export type AthleteProfileStatus =
  (typeof AthleteProfileStatus)[keyof typeof AthleteProfileStatus];

export const AthleteLevel = {
  Elite: 'ELITE',
  Competitive: 'COMPETITIVE',
  Everyday: 'EVERYDAY',
} as const;

export type AthleteLevel = (typeof AthleteLevel)[keyof typeof AthleteLevel];

export const AthleteResultKind = {
  Highlight: 'HIGHLIGHT',
  Race: 'RACE',
  Milestone: 'MILESTONE',
} as const;

export type AthleteResultKind = (typeof AthleteResultKind)[keyof typeof AthleteResultKind];

export const VerificationStatus = {
  Unverified: 'UNVERIFIED',
  Pending: 'PENDING',
  Verified: 'VERIFIED',
  Rejected: 'REJECTED',
} as const;

export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const AthleteMediaKind = {
  Image: 'IMAGE',
  Video: 'VIDEO',
} as const;

export type AthleteMediaKind = (typeof AthleteMediaKind)[keyof typeof AthleteMediaKind];

export const AthleteMediaRole = {
  Hero: 'HERO',
  Profile: 'PROFILE',
  Gallery: 'GALLERY',
  Result: 'RESULT',
  StoryChapter: 'STORY_CHAPTER',
  Training: 'TRAINING',
  FeaturedVideo: 'FEATURED_VIDEO',
} as const;

export type AthleteMediaRole = (typeof AthleteMediaRole)[keyof typeof AthleteMediaRole];

export const AthleteStoryChapterIcon = {
  Medal: 'MEDAL',
  Heart: 'HEART',
  History: 'HISTORY',
  Trophy: 'TROPHY',
  Flag: 'FLAG',
  Timer: 'TIMER',
  Book: 'BOOK',
  Groups: 'GROUPS',
} as const;

export type AthleteStoryChapterIcon =
  (typeof AthleteStoryChapterIcon)[keyof typeof AthleteStoryChapterIcon];

export const AthleteStoryChapterTone = {
  Primary: 'PRIMARY',
  Secondary: 'SECONDARY',
  Tertiary: 'TERTIARY',
} as const;

export type AthleteStoryChapterTone =
  (typeof AthleteStoryChapterTone)[keyof typeof AthleteStoryChapterTone];

export const CommunityFeedKind = {
  Result: 'RESULT',
  Roadmap: 'ROADMAP',
  Training: 'TRAINING',
  Profile: 'PROFILE',
} as const;

export type CommunityFeedKind = (typeof CommunityFeedKind)[keyof typeof CommunityFeedKind];

export const CommunityFeedCategory = {
  Race: 'RACE',
  Training: 'TRAINING',
  Milestone: 'MILESTONE',
  Roadmap: 'ROADMAP',
} as const;

export type CommunityFeedCategory =
  (typeof CommunityFeedCategory)[keyof typeof CommunityFeedCategory];

export const CommunityFeedTargetType = {
  AthleteResult: 'ATHLETE_RESULT',
  AthleteEvent: 'ATHLETE_EVENT',
  AthleteTrainingSnapshot: 'ATHLETE_TRAINING_SNAPSHOT',
  AthleteProfileMilestone: 'ATHLETE_PROFILE_MILESTONE',
} as const;

export type CommunityFeedTargetType =
  (typeof CommunityFeedTargetType)[keyof typeof CommunityFeedTargetType];

export const ReactionKind = {
  Cheer: 'CHEER',
} as const;

export type ReactionKind = (typeof ReactionKind)[keyof typeof ReactionKind];

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

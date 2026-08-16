import { injectable } from 'tsyringe';
import type {
  AdminAnalyticsResponse,
  AdminAllowlistEntry,
  AdminAllowlistResponse,
  AdminAddAllowlistEntryRequest,
  AdminAthleteItem,
  AdminAthleteListQuery,
  AdminAthleteListResponse,
  AdminCampaignItem,
  AdminCampaignListQuery,
  AdminCampaignListResponse,
  AdminDonationItem,
  AdminDonationListQuery,
  AdminDonationListResponse,
  AdminUserDetail,
  AdminUserListQuery,
  AdminUserListResponse,
  AdminUserSummary,
} from 'fad-common';
import {
  AdminRepository,
  type AdminCampaignRow,
  type AdminDonationRow,
  type AdminUserRow,
} from '../../repositories/AdminRepository';
import { SignupAllowlistRepository } from '../../repositories/SignupAllowlistRepository';
import {
  normalizeAllowlistEntry,
  SignupAllowlistService,
} from '../../services/infrastructure/SignupAllowlistService';
import { decodeKeysetCursor, encodeKeysetCursor } from '../../shared/keysetCursor';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors';
import { Prisma } from '@prisma/client';

const DEFAULT_ADMIN_PAGE_LIMIT = 20;
const ANALYTICS_WINDOW_DAYS = 30;

@injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly signupAllowlistRepository: SignupAllowlistRepository,
    private readonly signupAllowlistService: SignupAllowlistService
  ) {}

  async listUsers(query: AdminUserListQuery): Promise<AdminUserListResponse> {
    const limit = query.limit ?? DEFAULT_ADMIN_PAGE_LIMIT;
    const { users, hasMore } = await this.adminRepository.listUsers({
      search: query.search,
      role: query.role,
      limit,
      cursor: query.cursor ? decodeKeysetCursor(query.cursor) : undefined,
    });
    return {
      items: users.map(toAdminUserSummary),
      nextCursor: hasMore ? encodeKeysetCursor(users[users.length - 1]) : null,
    };
  }

  async getUserDetail(userId: string): Promise<AdminUserDetail> {
    const user = await this.adminRepository.findUserDetail(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return toAdminUserDetail(user);
  }

  async listAthletes(query: AdminAthleteListQuery): Promise<AdminAthleteListResponse> {
    const limit = query.limit ?? DEFAULT_ADMIN_PAGE_LIMIT;
    const { athletes, hasMore } = await this.adminRepository.listAthletes({
      published: query.published,
      sport: query.sport,
      limit,
      cursor: query.cursor ? decodeKeysetCursor(query.cursor) : undefined,
    });
    return {
      items: athletes.map(toAdminAthleteItem),
      nextCursor: hasMore ? encodeKeysetCursor(athletes[athletes.length - 1]) : null,
    };
  }

  async publishAthlete(athleteId: string, publish: boolean): Promise<void> {
    const updated = await this.adminRepository.setAthletePublished(athleteId, publish);
    if (!updated) {
      throw new NotFoundError('Athlete');
    }
  }

  async listCampaigns(query: AdminCampaignListQuery): Promise<AdminCampaignListResponse> {
    const limit = query.limit ?? DEFAULT_ADMIN_PAGE_LIMIT;
    const { campaigns, hasMore } = await this.adminRepository.listCampaigns({
      status: query.status,
      athleteId: query.athleteId,
      limit,
      cursor: query.cursor ? decodeKeysetCursor(query.cursor) : undefined,
    });
    return {
      items: campaigns.map(toAdminCampaignItem),
      nextCursor: hasMore ? encodeKeysetCursor(campaigns[campaigns.length - 1]) : null,
    };
  }

  async updateCampaignStatus(
    campaignId: string,
    campaignStatus: AdminCampaignItem['campaignStatus']
  ): Promise<void> {
    const updated = await this.adminRepository.updateCampaignStatus(campaignId, campaignStatus);
    if (!updated) {
      throw new NotFoundError('Campaign');
    }
  }

  async listDonations(query: AdminDonationListQuery): Promise<AdminDonationListResponse> {
    const limit = query.limit ?? DEFAULT_ADMIN_PAGE_LIMIT;
    const { donations, hasMore } = await this.adminRepository.listDonations({
      status: query.status,
      athleteId: query.athleteId,
      limit,
      cursor: query.cursor ? decodeKeysetCursor(query.cursor) : undefined,
    });
    return {
      items: donations.map(toAdminDonationItem),
      nextCursor: hasMore ? encodeKeysetCursor(donations[donations.length - 1]) : null,
    };
  }

  async updateUserRoles(userId: string, roles: AdminUserDetail['roles']): Promise<AdminUserDetail> {
    const user = await this.adminRepository.findUserDetail(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    await this.adminRepository.replaceUserRoles(userId, roles);
    return this.getUserDetail(userId);
  }

  async deleteUser(userId: string): Promise<void> {
    const deleted = await this.adminRepository.softDeleteUser(userId, new Date());
    if (!deleted) {
      throw new NotFoundError('User');
    }
  }

  async getAnalytics(): Promise<AdminAnalyticsResponse> {
    const since = daysAgo(ANALYTICS_WINDOW_DAYS);
    const [counts, rows] = await Promise.all([
      this.adminRepository.getAnalyticsCounts(since),
      this.adminRepository.getAnalyticsRows(since),
    ]);
    return {
      ...counts,
      userSignupsByDay: rows.userSignupsByDay.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        count: Number(row.count),
      })),
      donationsByDay: rows.donationsByDay.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        count: Number(row.count),
        amountCents: Number(row.amountCents ?? 0),
      })),
    };
  }

  async getAllowlistEntries(): Promise<AdminAllowlistResponse> {
    const dbEntries = await this.signupAllowlistRepository.findAll();
    const envEntries = this.signupAllowlistService.getEnvEntries();
    return {
      entries: [
        ...dbEntries.map(toAdminDbAllowlistEntry),
        ...envEntries.map((entry, index) => ({
          id: `env-${index}`,
          entry,
          source: 'env' as const,
          createdAt: null,
        })),
      ],
      isEnforced: dbEntries.length > 0 || envEntries.length > 0,
    };
  }

  async addAllowlistEntry(
    input: AdminAddAllowlistEntryRequest
  ): Promise<AdminAllowlistEntry> {
    const entry = normalizeAllowlistEntry(input.entry);
    if (!isValidAllowlistEntry(entry)) {
      throw new BadRequestError('Allowlist entry must be an email or @domain');
    }
    try {
      return toAdminDbAllowlistEntry(await this.signupAllowlistRepository.create(entry));
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictError('Allowlist entry already exists');
      }
      throw error;
    }
  }

  async deleteAllowlistEntry(entryId: string): Promise<void> {
    if (!isUuid(entryId)) {
      throw new NotFoundError('Allowlist entry');
    }
    try {
      await this.signupAllowlistRepository.deleteById(entryId);
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundError('Allowlist entry');
      }
      throw error;
    }
  }
}

function toAdminAthleteItem(athlete: AdminAthleteItemSource): AdminAthleteItem {
  return {
    athleteId: athlete.id,
    userId: athlete.userId,
    athleteSlug: athlete.athleteSlug,
    fullName: athlete.fullName,
    primarySport: athlete.primarySport,
    publishedAt: athlete.publishedAt?.toISOString() ?? null,
    createdAt: athlete.createdAt.toISOString(),
    stripeChargesEnabledAt: athlete.stripeChargesEnabledAt?.toISOString() ?? null,
  };
}

function toAdminCampaignItem(campaign: AdminCampaignRow): AdminCampaignItem {
  return {
    campaignId: campaign.id,
    campaignSlug: campaign.campaignSlug,
    campaignTitle: campaign.campaignTitle,
    campaignType: campaign.campaignType,
    campaignStatus: campaign.campaignStatus,
    targetAmountCents: campaign.targetAmountCents,
    raisedAmountCents: campaign.raisedAmountCents,
    athleteId: campaign.athleteId,
    athleteSlug: campaign.athlete.athleteSlug,
    athleteFullName: campaign.athlete.fullName,
    createdAt: campaign.createdAt.toISOString(),
  };
}

function toAdminDonationItem(donation: AdminDonationRow): AdminDonationItem {
  return {
    donationId: donation.id,
    campaignId: donation.campaignId,
    campaignTitle: donation.campaign.campaignTitle,
    athleteFullName: donation.campaign.athlete.fullName,
    supporterDisplayName: donation.isAnonymous ? 'Anonymous' : donation.supporterDisplayName,
    supporterEmail: donation.isAnonymous ? null : donation.supporterEmail,
    donationAmountCents: donation.donationAmountCents,
    donationStatus: donation.donationStatus,
    isAnonymous: donation.isAnonymous,
    createdAt: donation.createdAt.toISOString(),
  };
}

function toAdminDbAllowlistEntry(entry: {
  id: string;
  entry: string;
  createdAt: Date;
}): AdminAllowlistEntry {
  return {
    id: entry.id,
    entry: entry.entry,
    source: 'db',
    createdAt: entry.createdAt.toISOString(),
  };
}

function toAdminUserSummary(user: AdminUserRow): AdminUserSummary {
  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    roles: user.platformRoleAssignments.map((assignment) => assignment.role),
    hasAthleteProfile: user.athleteProfile !== null,
  };
}

function toAdminUserDetail(user: AdminUserRow): AdminUserDetail {
  return {
    ...toAdminUserSummary(user),
    updatedAt: user.updatedAt.toISOString(),
    athleteSlug: user.athleteProfile?.athleteSlug ?? null,
    publishedAt: user.athleteProfile?.publishedAt?.toISOString() ?? null,
  };
}

function daysAgo(days: number): Date {
  const now = new Date();
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

type AdminAthleteItemSource = {
  id: string;
  userId: string;
  athleteSlug: string;
  fullName: string;
  primarySport: AdminAthleteItem['primarySport'];
  publishedAt: Date | null;
  createdAt: Date;
  stripeChargesEnabledAt: Date | null;
};

function isValidAllowlistEntry(entry: string): boolean {
  return /^@[a-z0-9.-]+\.[a-z]{2,}$/.test(entry) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

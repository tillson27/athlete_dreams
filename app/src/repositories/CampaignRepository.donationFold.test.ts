import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@prisma/client';
import { CampaignRepository } from './CampaignRepository';
import type { PrismaService } from '../services/infrastructure/PrismaService';

type CampaignProjection = {
  raisedAmountCents: number;
  targetAmountCents: number;
  campaignStatus: string;
};

function makeTx(afterIncrement: CampaignProjection) {
  const update = vi.fn();
  update.mockResolvedValueOnce(afterIncrement); // increment update returns the selected projection
  update.mockResolvedValue({}); // any subsequent FUNDED-flip update
  const tx = { campaign: { update } } as unknown as Prisma.TransactionClient;
  return { tx, update };
}

const repo = new CampaignRepository({} as unknown as PrismaService);

describe('CampaignRepository.applyDonationEvent', () => {
  it('flips FUNDED when the target is met and the campaign is ACTIVE', async () => {
    const { tx, update } = makeTx({
      raisedAmountCents: 10000,
      targetAmountCents: 10000,
      campaignStatus: 'ACTIVE',
    });
    await repo.applyDonationEvent(tx, 'c1', 5000, 1);
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls[0][0]).toMatchObject({
      where: { id: 'c1' },
      data: { raisedAmountCents: { increment: 5000 }, supporterCount: { increment: 1 } },
    });
    expect(update.mock.calls[1][0]).toEqual({
      where: { id: 'c1' },
      data: { campaignStatus: 'FUNDED' },
    });
  });

  it('does not flip when still below target', async () => {
    const { tx, update } = makeTx({
      raisedAmountCents: 9000,
      targetAmountCents: 10000,
      campaignStatus: 'ACTIVE',
    });
    await repo.applyDonationEvent(tx, 'c1', 1000, 1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('does not re-flip an already-FUNDED campaign (overfunding accepted)', async () => {
    const { tx, update } = makeTx({
      raisedAmountCents: 15000,
      targetAmountCents: 10000,
      campaignStatus: 'FUNDED',
    });
    await repo.applyDonationEvent(tx, 'c1', 5000, 1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('reopens a FUNDED campaign when a refund drops it below target', async () => {
    const { tx, update } = makeTx({
      raisedAmountCents: 9000,
      targetAmountCents: 10000,
      campaignStatus: 'FUNDED',
    });
    await repo.applyDonationEvent(tx, 'c1', -1000, -1);
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls[0][0]).toMatchObject({
      data: { raisedAmountCents: { increment: -1000 }, supporterCount: { increment: -1 } },
    });
    expect(update.mock.calls[1][0]).toEqual({
      where: { id: 'c1' },
      data: { campaignStatus: 'ACTIVE' },
    });
  });
});

describe('CampaignRepository public active campaign filters', () => {
  it('applies the open ACTIVE predicate to the public feed', async () => {
    const findMany = vi.fn(async (_args: unknown) => []);
    const repoWithPrisma = new CampaignRepository({
      campaign: { findMany },
    } as unknown as PrismaService);

    await repoWithPrisma.listActiveFeed({ limit: 10 });

    const feedArgs = findMany.mock.calls[0]?.[0] as { where: unknown };
    expect(feedArgs.where).toMatchObject({
      campaignStatus: 'ACTIVE',
      deletedAt: null,
      AND: [{ OR: [{ closesAt: null }, { closesAt: { gt: expect.any(Date) } }] }],
    });
  });

  it('applies the open ACTIVE predicate to athlete lists and slug reads', async () => {
    const findMany = vi.fn(async (_args: unknown) => []);
    const findFirst = vi.fn(async (_args: unknown) => null);
    const repoWithPrisma = new CampaignRepository({
      campaign: { findMany, findFirst },
    } as unknown as PrismaService);

    await repoWithPrisma.listActiveForAthlete('athlete-1', 10);
    await repoWithPrisma.findActiveBySlug('race-fund');

    const athleteListArgs = findMany.mock.calls[0]?.[0] as { where: unknown };
    const slugArgs = findFirst.mock.calls[0]?.[0] as { where: unknown };
    expect(athleteListArgs.where).toMatchObject({
      athleteId: 'athlete-1',
      campaignStatus: 'ACTIVE',
      OR: [{ closesAt: null }, { closesAt: { gt: expect.any(Date) } }],
    });
    expect(slugArgs.where).toMatchObject({
      campaignSlug: 'race-fund',
      campaignStatus: 'ACTIVE',
      OR: [{ closesAt: null }, { closesAt: { gt: expect.any(Date) } }],
    });
  });
});

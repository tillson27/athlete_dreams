import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { PayoutEventRepository, type RecordPayoutEventInput } from './PayoutEventRepository';
import type { PrismaService } from '../services/infrastructure/PrismaService';

function makeRepo(create: ReturnType<typeof vi.fn>): PayoutEventRepository {
  const prisma = { payoutEvent: { create } } as unknown as PrismaService;
  return new PayoutEventRepository(prisma);
}

const input: RecordPayoutEventInput = {
  athleteId: 'a1',
  stripeAccountId: 'acct_1',
  stripePayoutId: 'po_1',
  payoutStatus: 'PAID',
  amountCents: 1000,
  currency: 'cad',
  arrivalDate: null,
  idempotencyKey: 'evt_1',
  occurredAt: new Date('2026-07-20T00:00:00.000Z'),
  rawPayload: {},
};

describe('PayoutEventRepository.recordIfNew', () => {
  it('returns true when the payout event is newly inserted', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'pe_1' });
    expect(await makeRepo(create).recordIfNew(input)).toBe(true);
  });

  it('returns false on a duplicate event id (P2002)', async () => {
    const create = vi.fn().mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '5.22.0' })
    );
    expect(await makeRepo(create).recordIfNew(input)).toBe(false);
  });

  it('rethrows non-unique-violation errors', async () => {
    const create = vi.fn().mockRejectedValue(new Error('connection reset'));
    await expect(makeRepo(create).recordIfNew(input)).rejects.toThrow('connection reset');
  });
});

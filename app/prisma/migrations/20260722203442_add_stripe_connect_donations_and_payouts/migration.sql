/*
  Warnings:

  - A unique constraint covering the columns `[stripeAccountId]` on the table `athlete_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `donations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DonationEventType" AS ENUM ('DONATION_SUCCEEDED', 'DONATION_FAILED', 'DONATION_REFUNDED', 'DISPUTE_OPENED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'PAID', 'FAILED', 'CANCELED');

-- AlterTable
ALTER TABLE "athlete_profiles" ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeChargesEnabledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "stripePaymentIntentId" TEXT;

-- CreateTable
CREATE TABLE "donation_events" (
    "id" UUID NOT NULL,
    "donationId" UUID,
    "campaignId" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "donationEventType" "DonationEventType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "stripeObjectId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_events" (
    "id" UUID NOT NULL,
    "athleteId" UUID NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "stripePayoutId" TEXT NOT NULL,
    "payoutStatus" "PayoutStatus" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "arrivalDate" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "eventId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donation_events_idempotencyKey_key" ON "donation_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "donation_events_campaignId_idx" ON "donation_events"("campaignId");

-- CreateIndex
CREATE INDEX "donation_events_donationId_idx" ON "donation_events"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "payout_events_idempotencyKey_key" ON "payout_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payout_events_athleteId_idx" ON "payout_events"("athleteId");

-- CreateIndex
CREATE INDEX "payout_events_stripePayoutId_idx" ON "payout_events"("stripePayoutId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "webhook_events"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_profiles_stripeAccountId_key" ON "athlete_profiles"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "donations_stripePaymentIntentId_key" ON "donations"("stripePaymentIntentId");

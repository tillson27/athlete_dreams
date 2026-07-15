# ARC — Incorporation & Financial Notes

> **Not legal or accounting advice.** This is a founder's checklist to bring to a
> Canadian corporate lawyer and an accountant — not a substitute for them.
> Captured from a working session; treat as a starting point.

**Context:** ARC (brand for AthleteArc, domain `athletearc.ca`) is a Canada-based,
three-pillar athlete platform: (1) donation-based crowdfunding, (2) corporate
sponsorships, (3) managed ambassador programs. Preparing to incorporate and launch.

---

## 1. Incorporation decision

- **Federal (CBCA) vs. provincial.** Federal = national name protection + credibility,
  but still requires extra-provincial registration where you operate. Provincial is
  simpler for single-province operation. For a national platform, **federal is the
  common startup choice.**
- **Director residency.** CBCA requires 25% Canadian-resident directors (fine if that's
  you). BC / Alberta / Ontario have dropped residency requirements — matters if a
  non-Canadian co-founder joins later.
- **Name.** NUANS search required. Short names like "ARC" collide easily — have
  alternates (e.g., "AthleteArc Inc."). Many founders incorporate as a **numbered
  company** and register the brand as a trade name.
- **Incorporation ≠ brand protection.** Trademark is separate: **file with CIPO early**
  (18+ month process).
- **Cost.** DIY federal ≈ $200. Lawyer-done (share structure, minute book, resolutions)
  ≈ $1,500–3,000 — usually worth it given items in §2.

## 2. Structure for the future, not just today

- **Share classes.** Common shares for founders + authorize future classes (investors
  will want preferred). Restructuring later is expensive.
- **CCPC status** (Canadian-controlled private corporation) unlocks: small business
  deduction (~9% federal on first $500K active income), lifetime capital gains
  exemption on a future sale, enhanced SR&ED credits. Don't break it with foreign control.
- **Founder housekeeping:**
  - Multiple founders → **shareholders' agreement** with vesting + departure terms.
  - **IP assignment** — the ARC codebase currently belongs to Nathaniel *personally*;
    formally assign it into the corporation (possible Section 85 rollover if it has value).

## 3. Money flow — donation side (STRATEGIC)

**Model decided: non-custodial.** Funds flow backer → payment platform → athlete.
ARC never holds or controls the funds.

- **Donation/reward-based, not investment.** No financial return to backers → generally
  avoids securities law. The moment anyone gets a *return* (revenue share, equity), it
  becomes a securities matter (CSA). **Keep the product firmly donation-side.**
- **Non-custodial avoids MSB status.** Holding/transmitting others' money triggers
  FINTRAC money-services-business registration + AML/KYC program. Not touching funds
  keeps ARC a *technology platform*, not a money transmitter.
- **Architecture that keeps it genuinely non-custodial (Stripe Connect):**
  - Use **Express or Standard** connected accounts (athlete is effectively merchant).
  - Use **direct charges** to the athlete's connected account — money is never ARC's.
  - **Avoid** routing funds through an ARC platform balance / delayed payouts / custom
    liability models — these can re-trigger the MSB analysis.
  - Have a lawyer confirm the exact flow against the FINTRAC definition.
- **KYC is offloaded** to the processor (Stripe verifies each athlete before payout).
- **Not the merchant of record** → chargeback liability, PCI scope, and fund-flow
  compliance sit with Stripe + the athlete's account, not ARC.

## 4. Is Stripe's fee taxable income to ARC?

- **Processing fee (~2.9% + 30¢) charged by Stripe → NOT ARC's income.** It's Stripe's
  revenue, taxed to Stripe. You're never taxed on money you don't receive.
- **Two different fees — don't conflate:**

  | Fee | Charged by | Kept by | ARC income? |
  |---|---|---|---|
  | Processing fee (~2.9% + 30¢) | Stripe | Stripe | **No** |
  | Platform / application fee (optional, added on top) | ARC | ARC | **Yes** |

- **Current decision:** ARC takes **no** application fee — 100% of the remainder after
  Stripe's cut flows to the athlete. Therefore:
  - The donation flow generates **no revenue** for ARC and is **tax-neutral by design.**
  - No GST/HST question on a transaction fee (there isn't one that's ARC's).
- **Implication:** ARC's taxable revenue must come from the **other pillars** —
  corporate sponsorships, managed ambassador programs, possibly future subscriptions.
  Those are where corporate tax (T2) and the **$30K GST/HST registration threshold**
  actually apply.
- **Open decision:** Is crowdfunding free forever (pure growth engine), or will a small
  optional platform fee / tip appear later? That decides whether you ever need the
  application-fee + GST/HST machinery. Cheaper to decide now than retrofit.

## 5. Responsibilities that REMAIN even when non-custodial

- **CRA digital-platform reporting (OECD rules).** Applies to platforms that *facilitate*
  payments to "sellers" — can include non-custodial matching. May require collecting +
  annually reporting athlete info (name, TIN, amounts) to CRA. **Independent of holding
  funds.** Confirm with accountant whether athletes are "sellers"; if yes, collect that
  data at onboarding (affects the data model).
- **Tax character of the money — disclose in writing:**
  - Money athletes receive is **taxable income to them** (funding, not a gift).
  - **Not charitable donations** — ARC is not a registered charity → **no tax receipts**
    to backers. State clearly at point of donation.
- **Consumer-protection / transparency liability.** ARC publicly promises "every dollar
  itemized and backed by receipts." Terms must: (a) disclaim that ARC guarantees how
  athletes spend funds, (b) reserve the right to remove bad actors, (c) define
  refund/dispute stance (likely: disputes go through Stripe chargeback between backer and
  athlete). The **receipts feature is the key legal protection** — keep it.
- **Processor rulebook.** Stripe Connect platform agreement + prohibited-business rules —
  ARC must monitor athletes for fraud/prohibited activity or Stripe can terminate the
  whole platform. A *monitoring* duty even without holding funds.

## 6. Immediately post-incorporation (CRA + ops)

- **CRA accounts:** business number, corporate tax (T2), **GST/HST** (mandatory > $30K
  revenue; register earlier to claim input tax credits), payroll account when first paying
  anyone.
- **Corporate bank account** — stop running anything personal from day one.
- **Bookkeeping + fiscal year-end** chosen with accountant.
- **Insurance:** D&O for directors; cyber/E&O once holding user data at scale.
- **CASL** compliance for marketing email (consent + unsubscribe) — separate from PIPEDA,
  aggressive penalties.

## 7. Loop back to the product

- **Terms / Privacy pages** currently say "between you and ARC" — once the entity exists,
  name it ("AthleteArc Inc., a Canadian corporation"). (Ask Claude to update
  `client/app/(marketing)/terms/page.tsx` and `privacy/page.tsx`.)
- **Own everything in the corporation, not personally:** domain, hosting, Stripe, and the
  `hello@athletearc.ca` mailbox.
- **Crowdfunding disclosures** (not-a-charity / not-tax-deductible / athlete income is
  taxable / ARC doesn't control spending) should be drafted into the backing flow + terms,
  clearly marked "when backing opens," well ahead of building payments.

## Priority order (if incorporating this week)

1. Federal incorporation with a clean share structure.
2. IP assignment of the codebase into the corp.
3. CRA / GST accounts + corporate bank account.
4. Trademark filing (CIPO).
5. Lawyer review of Terms + the non-custodial Stripe flow **before** backing launches.

*Items 1–2 protect you personally; item 5 protects the business model.*

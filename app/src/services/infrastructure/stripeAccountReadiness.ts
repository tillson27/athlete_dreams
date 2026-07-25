import type Stripe from 'stripe';

export interface StripeAccountReadiness {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  ready: boolean;
}

export function getStripeAccountReadiness(account: Stripe.Account): StripeAccountReadiness {
  const chargesEnabled =
    account.charges_enabled === true && account.capabilities?.card_payments === 'active';
  const payoutsEnabled = account.payouts_enabled === true;
  return {
    chargesEnabled,
    payoutsEnabled,
    ready: chargesEnabled && payoutsEnabled,
  };
}

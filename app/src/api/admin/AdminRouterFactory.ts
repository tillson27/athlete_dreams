import { Router } from 'express';
import { injectable } from 'tsyringe';
import { AuthenticationMiddleware } from '../../middleware/AuthenticationMiddleware';
import { AdminAuthorizationMiddleware } from '../../middleware/AdminAuthorizationMiddleware';
import { BaseRouterFactory } from '../../shared/BaseRouterFactory';
import { AdminController } from './AdminController';

@injectable()
export class AdminRouterFactory extends BaseRouterFactory {
  readonly basePath = '/v1/admin';

  constructor(
    private readonly adminController: AdminController,
    private readonly authMiddleware: AuthenticationMiddleware,
    private readonly adminAuthMiddleware: AdminAuthorizationMiddleware
  ) {
    super();
  }

  build(): Router {
    const router = Router();
    router.use(this.authMiddleware.required, this.adminAuthMiddleware.required);
    router.get('/users', this.wrap(this.adminController.listUsers));
    router.get('/users/:userId', this.wrap(this.adminController.getUserDetail));
    router.patch('/users/:userId/roles', this.wrap(this.adminController.updateUserRoles));
    router.get('/users/:userId/stripe', this.wrap(this.adminController.getUserStripeStatus));
    router.get('/users/:userId/donations', this.wrap(this.adminController.listUserDonations));
    router.post(
      '/users/:userId/resend-verification',
      this.wrap(this.adminController.resendUserVerification)
    );
    router.post(
      '/users/:userId/mark-verified',
      this.wrap(this.adminController.markUserEmailVerified)
    );
    router.post(
      '/users/:userId/send-password-reset',
      this.wrap(this.adminController.sendUserPasswordReset)
    );
    router.post('/users/:userId/allowlist', this.wrap(this.adminController.addUserToAllowlist));
    router.delete('/users/:userId', this.wrap(this.adminController.deleteUser));
    router.get('/analytics', this.wrap(this.adminController.getAnalytics));
    router.get('/athletes', this.wrap(this.adminController.listAthletes));
    router.post('/athletes/:athleteId/publish', this.wrap(this.adminController.publishAthlete));
    router.get('/campaigns', this.wrap(this.adminController.listCampaigns));
    router.patch(
      '/campaigns/:campaignId/status',
      this.wrap(this.adminController.updateCampaignStatus)
    );
    router.get('/donations', this.wrap(this.adminController.listDonations));
    router.get('/allowlist', this.wrap(this.adminController.getAllowlist));
    router.post('/allowlist', this.wrap(this.adminController.addAllowlistEntry));
    router.delete('/allowlist/:entryId', this.wrap(this.adminController.deleteAllowlistEntry));
    return router;
  }
}

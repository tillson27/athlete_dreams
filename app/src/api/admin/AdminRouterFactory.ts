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

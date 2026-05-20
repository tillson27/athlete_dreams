import { z } from 'zod';
import { idSchema, isoDateTimeSchema } from './shared';
import { TeamRole } from '../types/roles';
import { InvitationStatus } from '../types/enums';

const teamRoleSchema = z.nativeEnum(TeamRole);
const invitationStatusSchema = z.nativeEnum(InvitationStatus);

export const teamSchema = z.object({
  teamId: idSchema,
  name: z.string().min(1).max(120),
  isPersonal: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Team = z.infer<typeof teamSchema>;

export const teamMembershipSchema = z.object({
  teamMembershipId: idSchema,
  teamId: idSchema,
  userId: idSchema,
  teamRole: teamRoleSchema,
  joinedAt: isoDateTimeSchema,
  leftAt: isoDateTimeSchema.nullable(),
});

export type TeamMembership = z.infer<typeof teamMembershipSchema>;

export const createTeamRequestSchema = z
  .object({
    name: z.string().min(1).max(120),
  })
  .strict();

export type CreateTeamRequest = z.infer<typeof createTeamRequestSchema>;

export const inviteTeamMemberRequestSchema = z
  .object({
    inviteeEmail: z.string().email(),
    invitedTeamRole: teamRoleSchema,
  })
  .strict();

export type InviteTeamMemberRequest = z.infer<typeof inviteTeamMemberRequestSchema>;

export const teamInvitationSchema = z.object({
  teamInvitationId: idSchema,
  teamId: idSchema,
  inviteeEmail: z.string().email(),
  invitedTeamRole: teamRoleSchema,
  invitationStatus: invitationStatusSchema,
  invitationExpiresAt: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
});

export type TeamInvitation = z.infer<typeof teamInvitationSchema>;

import type { MockAthlete } from './mockAthletes';
import type { RichAthleteProfile } from './athleteProfiles';

// The athlete profile view-model shape shared by the data-source hook and the
// pure API loaders (kept in its own module to avoid a hook↔loader import cycle).
export type ProfileView = { athlete: MockAthlete; profile: RichAthleteProfile };

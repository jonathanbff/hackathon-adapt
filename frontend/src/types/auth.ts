export enum ONBOARDING_STATUS {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS", 
  COMPLETED = "COMPLETED",
}

export interface UserMetadata {
  onboardingStatus?: ONBOARDING_STATUS;
  isAdmin?: boolean;
}

declare global {
  interface CustomJwtSessionClaims {
    metadata?: UserMetadata;
  }
} 
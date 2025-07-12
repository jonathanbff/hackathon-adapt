export interface UserProfile {
  learningArea: string;
  goals: string[];
  currentLevel: string;
  studyTime: string;
  learningStyle: string; // VARK
  multipleIntelligences: string[];
}

export interface OnboardingStepProps {
  profile: UserProfile;
  onUpdateProfile: (field: keyof UserProfile, value: string | string[]) => void;
  onNext: () => void;
  onPrev: () => void;
  canProceed: boolean;
}

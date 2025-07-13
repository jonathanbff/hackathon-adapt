type Course = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  rating: number;
  students: number;
  duration: string;
  level: string;
  category: string;
  tags: string[];
  startedAt?: string;
  progress?: number;
};

type GenerateCourseFormSchema = {
  title: string;
  description: string;
  goals: string[];
  duration: "1-week" | "1-month" | "3-months" | "6-months";
  difficulty: "beginner" | "intermediate" | "advanced";
  format: string[];
  structure: {
    modules: number;
    lessonsPerModule: number;
    assessments: boolean;
    projects: boolean;
  };
  materials?: {
    documents?: string[];
    videos?: string[];
    audios?: string[];
    images?: string[];
    roadmap?: string;
  };
  aiPreferences: {
    tone: "professional" | "friendly" | "energetic";
    interactivity: "high" | "medium" | "low";
    examples: string;
    pacing: string;
  };
  userProfileContext: {
    learningArea: "technology" | "business" | "science" | "arts" | "languages" | "health" | "education" | "others";
    learningStyle: "visual" | "auditory" | "kinesthetic" | "reading";
    currentLevel: "beginner" | "intermediate" | "advanced";
    multipleIntelligences: string[];
    timeAvailable: string;
    preferredSchedule: string;
  };
  sources: File[];
};

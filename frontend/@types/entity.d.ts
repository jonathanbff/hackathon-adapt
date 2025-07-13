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
  goals: string;
  duration: string;
  sources: File[];
};

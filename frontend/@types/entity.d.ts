type Course = {
  id: number;
  title: string;
  description: string;
  instructor: string;
  rating: number;
  students: number;
  duration: string;
  level: string;
  category: string;
  tags: string[];
  image: string;
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

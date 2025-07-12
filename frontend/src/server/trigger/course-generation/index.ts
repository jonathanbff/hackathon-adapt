// Course Generation Trigger Tasks
export { mainCourseGenerationTask } from "./main-course-generation-task";
export { generateCourseStructureTask } from "./01-generate-course-structure";
export { generateModuleContentTask } from "./02-generate-module-content";
export { generateLessonContentTask } from "./03-generate-lesson-content";
export { generateQuizAssessmentsTask } from "./04-generate-quiz-assessments";
export { finalizeAndSaveCourseTask } from "./05-finalize-and-save-course";

// Types
export type { CourseGenerationTaskInput, CourseGenerationTaskOutput } from "./main-course-generation-task";
export type { CourseStructureTaskInput, CourseStructureTaskOutput } from "./01-generate-course-structure";
export type { ModuleContentTaskInput, ModuleContentTaskOutput } from "./02-generate-module-content";
export type { LessonContentTaskInput, LessonContentTaskOutput } from "./03-generate-lesson-content";
export type { QuizAssessmentTaskInput, QuizAssessmentTaskOutput } from "./04-generate-quiz-assessments";
export type { FinalizeCourseTaskInput, FinalizeCourseTaskOutput } from "./05-finalize-and-save-course";

// Utility function to trigger course generation
export async function triggerCourseGeneration(userId: string, generationRequest: any) {
  const { mainCourseGenerationTask } = await import("./main-course-generation-task");
  
  return await mainCourseGenerationTask.trigger({
    userId,
    generationRequest,
  });
} 
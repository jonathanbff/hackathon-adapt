DROP TABLE "generation_events" CASCADE;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "generation_run_id" varchar(255);--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "run_id";--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "generation_progress";--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "total_modules";--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "generated_modules";--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "total_lessons";--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "generated_lessons";--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "is_streaming_enabled";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "generation_status";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "content_progress";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "is_available";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "generated_at";--> statement-breakpoint
ALTER TABLE "modules" DROP COLUMN "generation_status";--> statement-breakpoint
ALTER TABLE "modules" DROP COLUMN "progress_percentage";--> statement-breakpoint
ALTER TABLE "modules" DROP COLUMN "total_lessons";--> statement-breakpoint
ALTER TABLE "modules" DROP COLUMN "is_available";
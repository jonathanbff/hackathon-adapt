CREATE TABLE "generation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"module_id" uuid,
	"lesson_id" uuid,
	"event_type" varchar(50) NOT NULL,
	"event_data" json,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"_clerk" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "generation_status" varchar(50) DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "difficulty" varchar(50);--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "run_id" varchar(255);--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "generation_progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "total_modules" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "generated_modules" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "total_lessons" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "generated_lessons" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "is_streaming_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "is_content_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "has_quiz" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "has_examples" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "generation_status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "content_progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "is_available" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "is_content_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "generated_lessons_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "generation_status" varchar(50) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "progress_percentage" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "total_lessons" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "is_available" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "generation_events" ADD CONSTRAINT "generation_events_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_events" ADD CONSTRAINT "generation_events_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_events" ADD CONSTRAINT "generation_events_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
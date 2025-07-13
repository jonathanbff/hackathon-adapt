CREATE TABLE "examples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"example_type" varchar(50) NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"youtube_video_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"transcription" text,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_item_id" uuid NOT NULL,
	"content" text NOT NULL,
	"note_type" varchar(50) DEFAULT 'general' NOT NULL,
	"timestamp_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"watch_time_seconds" integer DEFAULT 0 NOT NULL,
	"last_position_seconds" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "videos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "content" CASCADE;--> statement-breakpoint
DROP TABLE "videos" CASCADE;--> statement-breakpoint
ALTER TABLE "video_timestamps" DROP CONSTRAINT "video_timestamps_video_id_videos_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_conversations" DROP CONSTRAINT "chat_conversations_video_id_videos_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "learning_area" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "learning_style" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_level" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "multiple_intelligences" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "time_available" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_schedule" varchar(255);--> statement-breakpoint
ALTER TABLE "examples" ADD CONSTRAINT "examples_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_videos" ADD CONSTRAINT "lesson_videos_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_videos" ADD CONSTRAINT "lesson_videos_youtube_video_id_youtube_videos_id_fk" FOREIGN KEY ("youtube_video_id") REFERENCES "public"."youtube_videos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_video_id_lesson_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."lesson_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_timestamps" ADD CONSTRAINT "video_timestamps_video_id_lesson_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."lesson_videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_video_id_lesson_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."lesson_videos"("id") ON DELETE cascade ON UPDATE no action;
CREATE TABLE "ai_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"specialty" varchar(255) NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_agents_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE "course_generation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"goals" json NOT NULL,
	"duration" varchar(50) NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"format" json NOT NULL,
	"structure" json NOT NULL,
	"materials" json,
	"ai_preferences" json NOT NULL,
	"user_profile_context" json NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"generation_progress" integer DEFAULT 0 NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"is_generating" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"step_number" integer NOT NULL,
	"step_name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"agent_id" varchar(100),
	"input" json,
	"output" json,
	"error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youtube_id" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"channel_title" varchar(255),
	"duration" varchar(50),
	"views" integer,
	"published_at" timestamp with time zone,
	"thumbnail_url" varchar(500),
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "youtube_videos_youtube_id_unique" UNIQUE("youtube_id")
);
--> statement-breakpoint
ALTER TABLE "course_generation_requests" ADD CONSTRAINT "course_generation_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_generation_requests" ADD CONSTRAINT "course_generation_requests_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_steps" ADD CONSTRAINT "generation_steps_request_id_course_generation_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."course_generation_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_steps" ADD CONSTRAINT "generation_steps_agent_id_ai_agents_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("agent_id") ON DELETE no action ON UPDATE no action;
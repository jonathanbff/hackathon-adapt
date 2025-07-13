ALTER TABLE "users" RENAME COLUMN "password_hash" TO "clerk_id";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image_url" varchar(1000);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
CREATE TABLE "content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"_clerk" varchar(255) NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"_clerk" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"pathname" varchar(500) NOT NULL,
	"content_type" varchar(255),
	"size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"_clerk" varchar(255) NOT NULL,
	"_asset" uuid NOT NULL,
	"alt" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"_clerk" varchar(255) NOT NULL,
	"_asset" uuid NOT NULL,
	"filename" varchar(500) NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"processing_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdf_page_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"_pdf_assets" varchar(255) NOT NULL,
	"_image_asset" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets_images" ADD CONSTRAINT "assets_images__asset_assets_id_fk" FOREIGN KEY ("_asset") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents__asset_assets_id_fk" FOREIGN KEY ("_asset") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_page_images" ADD CONSTRAINT "pdf_page_images__image_asset_assets_images_id_fk" FOREIGN KEY ("_image_asset") REFERENCES "public"."assets_images"("id") ON DELETE cascade ON UPDATE no action;
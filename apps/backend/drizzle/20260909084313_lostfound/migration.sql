CREATE TYPE "lost_found_status_enum" AS ENUM('lost', 'found');--> statement-breakpoint
CREATE TABLE "lostfound_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_id" uuid NOT NULL,
	"text" varchar NOT NULL,
	"created_at" timestamp(6) DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lostfound_img" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar NOT NULL,
	"location" varchar NOT NULL,
	"created_at" timestamp(6) DEFAULT now() NOT NULL,
	"parent_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lostfound_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"status" "lost_found_status_enum" DEFAULT 'lost'::"lost_found_status_enum" NOT NULL,
	"object_name" varchar NOT NULL,
	"last_seen_place" varchar NOT NULL,
	"body" varchar NOT NULL,
	"created_at" timestamp(6) DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lostfound_comment" ADD CONSTRAINT "lostfound_comment_parent_id_lostfound_report_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "lostfound_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "lostfound_comment" ADD CONSTRAINT "lostfound_comment_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "lostfound_img" ADD CONSTRAINT "lostfound_img_parent_id_lostfound_report_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "lostfound_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "lostfound_report" ADD CONSTRAINT "lostfound_report_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
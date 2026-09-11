ALTER TABLE "lostfound_report" ADD COLUMN "is_concluded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lostfound_report" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "lostfound_report" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "lost_found_status_enum";--> statement-breakpoint
CREATE TYPE "lost_found_status_enum" AS ENUM('lost', 'pickup');--> statement-breakpoint
ALTER TABLE "lostfound_report" ALTER COLUMN "status" SET DATA TYPE "lost_found_status_enum" USING "status"::"lost_found_status_enum";--> statement-breakpoint
ALTER TABLE "lostfound_report" ALTER COLUMN "status" SET DEFAULT 'lost'::"lost_found_status_enum";

ALTER TABLE "lostfound_report" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
UPDATE "lostfound_report" SET "status" = 'concluded' WHERE "status" = 'found';--> statement-breakpoint
ALTER TABLE "lostfound_report" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "lost_found_status_enum";--> statement-breakpoint
CREATE TYPE "lost_found_status_enum" AS ENUM('lost', 'pickup', 'concluded');--> statement-breakpoint
ALTER TABLE "lostfound_report" ALTER COLUMN "status" SET DATA TYPE "lost_found_status_enum" USING "status"::"lost_found_status_enum";--> statement-breakpoint
ALTER TABLE "lostfound_report" ALTER COLUMN "status" SET DEFAULT 'lost'::"lost_found_status_enum";

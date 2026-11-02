ALTER TABLE "stay_outing" ADD COLUMN "outing_date" date;--> statement-breakpoint
ALTER TABLE "stay_outing" ALTER COLUMN "from" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stay_outing" ALTER COLUMN "to" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stay_outing" ADD CONSTRAINT "CK_stay_outing_from_to_pair" CHECK (("from" IS NULL) = ("to" IS NULL));--> statement-breakpoint
ALTER TABLE "stay_outing" ADD CONSTRAINT "CK_stay_outing_all_day_date" CHECK (("from" IS NULL) = ("outing_date" IS NOT NULL));
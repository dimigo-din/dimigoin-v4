ALTER INDEX "IDX_wakeup_video_week" RENAME TO "IDX_wakeup_video_month";--> statement-breakpoint
ALTER INDEX "IDX_wakeup_week_gender" RENAME TO "IDX_wakeup_month_gender";--> statement-breakpoint
ALTER TABLE "wakeup_song_application" RENAME COLUMN "week" TO "month";

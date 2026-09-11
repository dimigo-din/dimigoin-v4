import { boolean, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { LostfoundStatusValues } from "$mapper/types";
import { user } from "./user.schema";

export const lostfoundStatusEnum = pgEnum("lost_found_status_enum", LostfoundStatusValues);

export const lostfoundReport = pgTable("lostfound_report", {
  id: uuid().primaryKey().defaultRandom(),
  status: lostfoundStatusEnum().default(LostfoundStatusValues[0]).notNull(),
  isConcluded: boolean("is_concluded").default(false).notNull(),
  objectName: varchar("object_name").notNull(),
  lastSeenPlace: varchar("last_seen_place").notNull(),
  body: varchar().notNull(),
  createdAt: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onUpdate: "cascade", onDelete: "cascade" }),
});

export const lostfoundImg = pgTable("lostfound_img", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().notNull(),
  location: varchar().notNull(),
  createdAt: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
  parentId: uuid("parent_id")
    .notNull()
    .references(() => lostfoundReport.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
});

export const lostfoundComment = pgTable("lostfound_comment", {
  id: uuid().primaryKey().defaultRandom(),
  parentId: uuid("parent_id")
    .notNull()
    .references(() => lostfoundReport.id, { onUpdate: "cascade", onDelete: "cascade" }),
  text: varchar().notNull(),
  createdAt: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onUpdate: "cascade", onDelete: "cascade" }),
});

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`)
    .$onUpdate(() => sql`(datetime('now'))`),
});

export const screenshotSections = sqliteTable("screenshot_sections", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  presetKey: text("preset_key").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`)
    .$onUpdate(() => sql`(datetime('now'))`),
});

export const screenshots = sqliteTable("screenshots", {
  id: text("id").primaryKey(),
  sectionId: text("section_id")
    .notNull()
    .references(() => screenshotSections.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  originalFilename: text("original_filename").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  sectionId: text("section_id")
    .notNull()
    .references(() => screenshotSections.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  canvasState: text("canvas_state", { mode: "json" }).$type<
    import("@/lib/canvas/types").CanvasState
  >(),
  thumbnailUrl: text("thumbnail_url"),
  aiMessages: text("ai_messages", { mode: "json" }).$type<unknown[]>(),
  isSelected: integer("is_selected", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`)
    .$onUpdate(() => sql`(datetime('now'))`),
});

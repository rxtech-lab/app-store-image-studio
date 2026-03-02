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
  customWidth: integer("custom_width"),
  customHeight: integer("custom_height"),
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

export const iconProjects = sqliteTable("icon_projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  size: integer("size").notNull().default(1024),
  canvasState: text("canvas_state", { mode: "json" }).$type<
    import("@/lib/canvas/types").CanvasState
  >(),
  thumbnailUrl: text("thumbnail_url"),
  aiMessages: text("ai_messages", { mode: "json" }).$type<unknown[]>(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`)
    .$onUpdate(() => sql`(datetime('now'))`),
});

export const imageProjects = sqliteTable("image_projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  width: integer("width").notNull().default(1024),
  height: integer("height").notNull().default(1024),
  canvasState: text("canvas_state", { mode: "json" }).$type<
    import("@/lib/canvas/types").CanvasState
  >(),
  thumbnailUrl: text("thumbnail_url"),
  aiMessages: text("ai_messages", { mode: "json" }).$type<unknown[]>(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`)
    .$onUpdate(() => sql`(datetime('now'))`),
});

export const generatedImages = sqliteTable("generated_images", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => imageProjects.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  canvasState: text("canvas_state", { mode: "json" }).$type<
    import("@/lib/canvas/types").CanvasState
  >(),
  aiMessages: text("ai_messages", { mode: "json" }).$type<unknown[]>(),
  prompt: text("prompt"),
  order: integer("order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`)
    .$onUpdate(() => sql`(datetime('now'))`),
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

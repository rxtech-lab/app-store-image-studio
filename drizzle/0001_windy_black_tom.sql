CREATE TABLE `generated_images` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`image_url` text NOT NULL,
	`thumbnail_url` text,
	`canvas_state` text,
	`ai_messages` text,
	`prompt` text,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `image_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `icon_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`size` integer DEFAULT 1024 NOT NULL,
	`canvas_state` text,
	`thumbnail_url` text,
	`ai_messages` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `image_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`width` integer DEFAULT 1024 NOT NULL,
	`height` integer DEFAULT 1024 NOT NULL,
	`thumbnail_url` text,
	`ai_messages` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `screenshot_sections` ADD `custom_width` integer;--> statement-breakpoint
ALTER TABLE `screenshot_sections` ADD `custom_height` integer;--> statement-breakpoint
ALTER TABLE `templates` ADD `ai_messages` text;
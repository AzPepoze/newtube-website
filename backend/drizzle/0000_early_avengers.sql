CREATE TABLE `Categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Categories_slug_unique` ON `Categories` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `Categories_name_unique` ON `Categories` (`name`);--> statement-breakpoint
CREATE TABLE `Reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`theme_id` text NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`body` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`theme_id`) REFERENCES `Themes`(`theme_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "reviews_rating_range" CHECK("Reviews"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE INDEX `idx_reviews_theme` ON `Reviews` (`theme_id`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `idx_reviews_user` ON `Reviews` (`user_id`,"created_at" desc);--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_theme_user_unique` ON `Reviews` (`theme_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `Sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user` ON `Sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `Tags` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Tags_slug_unique` ON `Tags` (`slug`);--> statement-breakpoint
CREATE TABLE `ThemeCategories` (
	`theme_id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`theme_id`) REFERENCES `Themes`(`theme_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `Categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_theme_categories_category` ON `ThemeCategories` (`category_id`);--> statement-breakpoint
CREATE TABLE `ThemeReports` (
	`id` text PRIMARY KEY NOT NULL,
	`theme_id` text NOT NULL,
	`reporter_id` text NOT NULL,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'open' NOT NULL,
	`resolved_by` text,
	`resolved_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`theme_id`) REFERENCES `Themes`(`theme_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reporter_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resolved_by`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "theme_reports_status" CHECK("ThemeReports"."status" IN ('open', 'resolved', 'dismissed'))
);
--> statement-breakpoint
CREATE INDEX `idx_theme_reports_reporter` ON `ThemeReports` (`reporter_id`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `idx_theme_reports_moderation` ON `ThemeReports` (`status`,"created_at" desc);--> statement-breakpoint
CREATE TABLE `ThemeTags` (
	`theme_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`theme_id`, `tag_id`),
	FOREIGN KEY (`theme_id`) REFERENCES `Themes`(`theme_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `Tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_theme_tags_tag` ON `ThemeTags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `ThemeVersions` (
	`id` text PRIMARY KEY NOT NULL,
	`theme_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`theme_name` text NOT NULL,
	`description` text,
	`images` text,
	`cover_image` text,
	`settings` text NOT NULL,
	`is_public` integer NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`category` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`theme_id`) REFERENCES `Themes`(`theme_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_theme_versions_theme` ON `ThemeVersions` (`theme_id`,"version_number" desc);--> statement-breakpoint
CREATE UNIQUE INDEX `theme_versions_theme_version_unique` ON `ThemeVersions` (`theme_id`,`version_number`);--> statement-breakpoint
CREATE TABLE `Themes` (
	`theme_id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`theme_name` text NOT NULL,
	`description` text,
	`images` text DEFAULT '[]',
	`cover_image` text,
	`settings` text DEFAULT '{}' NOT NULL,
	`is_public` integer DEFAULT true,
	`downloads` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`owner_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_themes_owner` ON `Themes` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_themes_public` ON `Themes` (`is_public`);--> statement-breakpoint
CREATE TABLE `Uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`url` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_uploads_user` ON `Uploads` (`user_id`);--> statement-breakpoint
CREATE TABLE `Users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Users_email_unique` ON `Users` (`email`);
--> statement-breakpoint
INSERT OR IGNORE INTO `Categories` (`id`, `slug`, `name`) VALUES
	('category-gaming', 'gaming', 'Gaming'),
	('category-entertainment', 'entertainment', 'Entertainment'),
	('category-music', 'music', 'Music'),
	('category-productivity', 'productivity', 'Productivity'),
	('category-education', 'education', 'Education'),
	('category-technology', 'technology', 'Technology'),
	('category-news', 'news', 'News'),
	('category-lifestyle', 'lifestyle', 'Lifestyle');
--> statement-breakpoint
INSERT OR IGNORE INTO `Tags` (`id`, `slug`, `name`) VALUES
	('tag-dark-mode', 'dark-mode', 'Dark Mode'),
	('tag-minimal', 'minimal', 'Minimal'),
	('tag-colorful', 'colorful', 'Colorful'),
	('tag-retro', 'retro', 'Retro'),
	('tag-anime', 'anime', 'Anime'),
	('tag-gaming', 'gaming', 'Gaming'),
	('tag-music', 'music', 'Music'),
	('tag-focus', 'focus', 'Focus'),
	('tag-accessibility', 'accessibility', 'Accessibility'),
	('tag-high-contrast', 'high-contrast', 'High Contrast'),
	('tag-oled', 'oled', 'OLED'),
	('tag-pastel', 'pastel', 'Pastel');

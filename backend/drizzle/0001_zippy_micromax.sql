DROP TABLE `Categories`;--> statement-breakpoint
DROP TABLE `ThemeCategories`;--> statement-breakpoint
ALTER TABLE `Tags` ADD `group_name` text DEFAULT 'General' NOT NULL;--> statement-breakpoint
ALTER TABLE `ThemeVersions` DROP COLUMN `category`;
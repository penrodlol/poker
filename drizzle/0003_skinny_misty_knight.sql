CREATE TABLE `achievement` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`logo_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `achievement_name_unique` ON `achievement` (`name`);--> statement-breakpoint
CREATE TABLE `player_achievement` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`player_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_achievement_player_id_guild_id_achievement_id_idx` ON `player_achievement` (`player_id`,`guild_id`,`achievement_id`);
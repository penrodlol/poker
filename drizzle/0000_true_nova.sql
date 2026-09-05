CREATE TABLE `game` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`current_round` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`current_turn_player_id` text,
	`current_play_id` text,
	FOREIGN KEY (`current_turn_player_id`) REFERENCES `game_player`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`current_play_id`) REFERENCES `play`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_channel_id_idx` ON `game` (`channel_id`);--> statement-breakpoint
CREATE TABLE `game_card` (
	`id` text PRIMARY KEY NOT NULL,
	`rank` text NOT NULL,
	`suit` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`game_id` text NOT NULL,
	`game_player_id` text,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_player_id`) REFERENCES `game_player`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `game_card_game_id_game_player_id_idx` ON `game_card` (`game_id`,`game_player_id`);--> statement-breakpoint
CREATE TABLE `game_player` (
	`id` text PRIMARY KEY NOT NULL,
	`seat` integer NOT NULL,
	`is_locked_out` integer DEFAULT false NOT NULL,
	`placement` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`game_id` text NOT NULL,
	`player_id` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_player_game_id_player_id_idx` ON `game_player` (`game_id`,`player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `game_player_game_id_seat_idx` ON `game_player` (`game_id`,`seat`);--> statement-breakpoint
CREATE TABLE `play` (
	`id` text PRIMARY KEY NOT NULL,
	`round` integer NOT NULL,
	`type` text,
	`is_pass` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`game_id` text NOT NULL,
	`game_player_id` text NOT NULL,
	`beats_play_id` text,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_player_id`) REFERENCES `game_player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`beats_play_id`) REFERENCES `play`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `play_game_id_round_created_at_idx` ON `play` (`game_id`,`round`,`created_at`);--> statement-breakpoint
CREATE TABLE `play_card` (
	`id` text PRIMARY KEY NOT NULL,
	`play_id` text NOT NULL,
	`game_card_id` text NOT NULL,
	FOREIGN KEY (`play_id`) REFERENCES `play`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_card_id`) REFERENCES `game_card`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `play_card_game_card_id_unique` ON `play_card` (`game_card_id`);--> statement-breakpoint
CREATE TABLE `player` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`username` text NOT NULL,
	`avatar_url` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_discord_id_unique` ON `player` (`discord_id`);
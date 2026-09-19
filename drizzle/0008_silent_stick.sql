CREATE TABLE `rank` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`logo_url` text NOT NULL,
	`order` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rank_name_unique` ON `rank` (`name`);--> statement-breakpoint
ALTER TABLE `player_leaderboard` ADD `rank_id` text REFERENCES rank(id);--> statement-breakpoint
INSERT INTO `rank` (`id`, `name`, `description`, `logo_url`, `order`) VALUES
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Rising Challenger', 'Win 10 Games', 'rising_challenger', 10),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Battle Tested', 'Win 20 Games', 'battle_tested', 20),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Seasoned Player', 'Win 30 Games', 'seasoned_player', 30),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Veteran', 'Win 40 Games', 'veteran', 40),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Master of the Game', 'Win 50 Games', 'master_of_the_game', 50),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Elite Player', 'Win 60 Games', 'elite_player', 60),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Grandmaster', 'Win 70 Games', 'grandmaster', 70),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Legend', 'Win 80 Games', 'legend', 80),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Immortal', 'Win 90 Games', 'immortal', 90),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Champion of Champions', 'Win 100 Games', 'champion_of_champions', 100);--> statement-breakpoint
UPDATE `player_leaderboard`
SET `rank_id` = (
	SELECT `rank`.`id`
	FROM `rank`
	WHERE `rank`.`order` <= `player_leaderboard`.`games_won`
	ORDER BY `rank`.`order` DESC
	LIMIT 1
);--> statement-breakpoint
CREATE TRIGGER `grant_win_rank_on_insert` AFTER INSERT ON `player_leaderboard`
FOR EACH ROW
BEGIN
	UPDATE `player_leaderboard`
	SET `rank_id` = (
		SELECT `rank`.`id`
		FROM `rank`
		WHERE `rank`.`order` <= NEW.`games_won`
		ORDER BY `rank`.`order` DESC
		LIMIT 1
	)
	WHERE `id` = NEW.`id`;
END;--> statement-breakpoint
CREATE TRIGGER `grant_win_rank_on_update` AFTER UPDATE OF `games_won` ON `player_leaderboard`
FOR EACH ROW
WHEN NEW.`games_won` != OLD.`games_won`
BEGIN
	UPDATE `player_leaderboard`
	SET `rank_id` = (
		SELECT `rank`.`id`
		FROM `rank`
		WHERE `rank`.`order` <= NEW.`games_won`
		ORDER BY `rank`.`order` DESC
		LIMIT 1
	)
	WHERE `id` = NEW.`id`;
END;
DROP TRIGGER `grant_win_rank_on_insert`;--> statement-breakpoint
DROP TRIGGER `grant_win_rank_on_update`;--> statement-breakpoint
ALTER TABLE `rank` RENAME COLUMN "order" TO "value";--> statement-breakpoint
CREATE TRIGGER `grant_win_rank_on_insert` AFTER INSERT ON `player_leaderboard`
FOR EACH ROW
BEGIN
	UPDATE `player_leaderboard`
	SET `rank_id` = (
		SELECT `rank`.`id`
		FROM `rank`
		WHERE `rank`.`value` <= NEW.`games_won`
		ORDER BY `rank`.`value` DESC
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
		WHERE `rank`.`value` <= NEW.`games_won`
		ORDER BY `rank`.`value` DESC
		LIMIT 1
	)
	WHERE `id` = NEW.`id`;
END;
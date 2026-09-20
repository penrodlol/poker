UPDATE `rank` SET `value` = `value` - 5;--> statement-breakpoint
UPDATE `player_leaderboard`
SET `rank_id` = (
	SELECT `rank`.`id`
	FROM `rank`
	WHERE `rank`.`value` <= `player_leaderboard`.`games_won`
	ORDER BY `rank`.`value` DESC
	LIMIT 1
);

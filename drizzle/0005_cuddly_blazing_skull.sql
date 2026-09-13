-- Custom SQL migration file, put your code below! --
INSERT INTO `achievement` (`id`, `name`, `description`, `logo`) VALUES
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Rising Challenger', '10 Wins', 'rising_challenger'),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Battle Tested', '20 Wins', 'battle_tested'),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Seasoned Player', '30 Wins', 'seasoned_player'),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Veteran', '40 Wins', 'veteran'),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Master of the Game', '50 Wins', 'master_of_the_game'),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Elite Player', '60 Wins', 'elite_player'),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Grandmaster', '70 Wins', 'grandmaster'),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Legend', '80 Wins', 'legend'),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Immortal', '90 Wins', 'immortal'),
	(lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))), 'Champion of Champions', '100 Wins', 'champion_of_champions');
--> statement-breakpoint
CREATE TRIGGER `grant_win_achievements_on_insert` AFTER INSERT ON `player_leaderboard`
FOR EACH ROW
BEGIN
	INSERT OR IGNORE INTO `player_achievement` (`id`, `guild_id`, `player_id`, `achievement_id`)
	SELECT
		lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))),
		NEW.`guild_id`,
		NEW.`player_id`,
		`achievement`.`id`
	FROM `achievement`
	WHERE (CASE `achievement`.`name`
		WHEN 'Rising Challenger' THEN 10
		WHEN 'Battle Tested' THEN 20
		WHEN 'Seasoned Player' THEN 30
		WHEN 'Veteran' THEN 40
		WHEN 'Master of the Game' THEN 50
		WHEN 'Elite Player' THEN 60
		WHEN 'Grandmaster' THEN 70
		WHEN 'Legend' THEN 80
		WHEN 'Immortal' THEN 90
		WHEN 'Champion of Champions' THEN 100
	END) <= NEW.`games_won`;
END;
--> statement-breakpoint
CREATE TRIGGER `grant_win_achievements_on_update` AFTER UPDATE OF `games_won` ON `player_leaderboard`
FOR EACH ROW
WHEN NEW.`games_won` > OLD.`games_won`
BEGIN
	INSERT OR IGNORE INTO `player_achievement` (`id`, `guild_id`, `player_id`, `achievement_id`)
	SELECT
		lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))),
		NEW.`guild_id`,
		NEW.`player_id`,
		`achievement`.`id`
	FROM `achievement`
	WHERE (CASE `achievement`.`name`
		WHEN 'Rising Challenger' THEN 10
		WHEN 'Battle Tested' THEN 20
		WHEN 'Seasoned Player' THEN 30
		WHEN 'Veteran' THEN 40
		WHEN 'Master of the Game' THEN 50
		WHEN 'Elite Player' THEN 60
		WHEN 'Grandmaster' THEN 70
		WHEN 'Legend' THEN 80
		WHEN 'Immortal' THEN 90
		WHEN 'Champion of Champions' THEN 100
	END) <= NEW.`games_won`;
END;
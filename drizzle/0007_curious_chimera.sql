CREATE TABLE `appUpdates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(40) NOT NULL,
	`titleEn` varchar(180) NOT NULL,
	`titleAr` varchar(180) NOT NULL,
	`bodyEn` text NOT NULL,
	`bodyAr` text NOT NULL,
	`link` varchar(240),
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appUpdates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `app_updates_published_idx` ON `appUpdates` (`publishedAt`);
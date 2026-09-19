CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`nameEn` varchar(120) NOT NULL,
	`nameAr` varchar(120) NOT NULL,
	`icon` varchar(40) NOT NULL DEFAULT 'bird',
	`accent` varchar(40) NOT NULL DEFAULT 'mint',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `communityPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`category` enum('care','nutrition','health','breeding','general','other') NOT NULL DEFAULT 'general',
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`status` enum('published','hidden','locked') NOT NULL DEFAULT 'published',
	`likesCount` int NOT NULL DEFAULT 0,
	`commentsCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communityPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorites_user_listing_unique` UNIQUE(`userId`,`listingId`)
);
--> statement-breakpoint
CREATE TABLE `listingImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`storagePath` text NOT NULL,
	`altText` varchar(180),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isCover` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listingImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`categoryId` int NOT NULL,
	`titleEn` varchar(180) NOT NULL,
	`titleAr` varchar(180),
	`descriptionEn` text NOT NULL,
	`descriptionAr` text,
	`price` decimal(10,2) NOT NULL DEFAULT '0',
	`currency` varchar(8) NOT NULL DEFAULT 'EGP',
	`negotiable` boolean NOT NULL DEFAULT false,
	`exchangeAvailable` boolean NOT NULL DEFAULT false,
	`location` varchar(120) NOT NULL DEFAULT 'Hurghada',
	`status` enum('draft','pending_review','published','reserved','sold','exchanged','archived') NOT NULL DEFAULT 'pending_review',
	`moderationStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`views` int NOT NULL DEFAULT 0,
	`favoritesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `area` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `communityPosts` ADD CONSTRAINT `communityPosts_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listingImages` ADD CONSTRAINT `listingImages_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_sellerId_users_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `categories_active_idx` ON `categories` (`isActive`);--> statement-breakpoint
CREATE INDEX `community_feed_idx` ON `communityPosts` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `favorites_user_idx` ON `favorites` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `listing_images_listing_idx` ON `listingImages` (`listingId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `listings_browse_idx` ON `listings` (`status`,`moderationStatus`,`categoryId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `listings_seller_idx` ON `listings` (`sellerId`,`status`);--> statement-breakpoint
CREATE INDEX `listings_location_idx` ON `listings` (`location`);
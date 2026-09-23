CREATE TABLE `communityReputation` (
  `userId` int NOT NULL,
  `points` int NOT NULL DEFAULT 0,
  `helpfulAnswers` int NOT NULL DEFAULT 0,
  `commentsCount` int NOT NULL DEFAULT 0,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `communityReputation_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `communityCommentHelpfulVotes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `commentId` int NOT NULL,
  `voterId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `communityCommentHelpfulVotes_id` PRIMARY KEY(`id`),
  CONSTRAINT `community_comment_helpful_unique` UNIQUE(`commentId`,`voterId`)
);
--> statement-breakpoint
ALTER TABLE `communityReputation` ADD CONSTRAINT `communityReputation_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `communityCommentHelpfulVotes` ADD CONSTRAINT `communityCommentHelpfulVotes_commentId_communityComments_id_fk` FOREIGN KEY (`commentId`) REFERENCES `communityComments`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `communityCommentHelpfulVotes` ADD CONSTRAINT `communityCommentHelpfulVotes_voterId_users_id_fk` FOREIGN KEY (`voterId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `community_comment_helpful_comment_idx` ON `communityCommentHelpfulVotes` (`commentId`);

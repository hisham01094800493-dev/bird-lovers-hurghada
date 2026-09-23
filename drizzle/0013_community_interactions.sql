CREATE TABLE `communityPostLikes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `communityPostLikes_id` PRIMARY KEY(`id`),
  CONSTRAINT `community_post_user_like_unique` UNIQUE(`postId`,`userId`),
  CONSTRAINT `communityPostLikes_postId_communityPosts_id_fk` FOREIGN KEY (`postId`) REFERENCES `communityPosts`(`id`) ON DELETE CASCADE,
  CONSTRAINT `communityPostLikes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
CREATE INDEX `community_post_likes_post_idx` ON `communityPostLikes` (`postId`);
CREATE TABLE `communityComments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `postId` int NOT NULL,
  `authorId` int NOT NULL,
  `body` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `communityComments_id` PRIMARY KEY(`id`),
  CONSTRAINT `communityComments_postId_communityPosts_id_fk` FOREIGN KEY (`postId`) REFERENCES `communityPosts`(`id`) ON DELETE CASCADE,
  CONSTRAINT `communityComments_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
CREATE INDEX `community_comments_post_idx` ON `communityComments` (`postId`,`createdAt`);

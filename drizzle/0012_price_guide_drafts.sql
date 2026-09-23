CREATE TABLE `priceGuideDrafts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `sourceSummary` text NOT NULL,
  `sourceUrl` text NOT NULL,
  `collectedOn` varchar(10) NOT NULL,
  `payload` text NOT NULL,
  `reviewedBy` int NULL,
  `reviewedAt` timestamp NULL,
  `rejectionReason` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `price_guide_drafts_status_idx` (`status`,`createdAt`),
  CONSTRAINT `priceGuideDrafts_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users` (`id`)
);

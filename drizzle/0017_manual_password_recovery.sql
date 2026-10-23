CREATE TABLE `passwordRecoveryRequests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(320) NOT NULL,
  `contact` varchar(180) NOT NULL,
  `message` varchar(1000) DEFAULT NULL,
  `status` enum('pending','reviewing','link_issued','completed','rejected') NOT NULL DEFAULT 'pending',
  `adminNote` varchar(1000) DEFAULT NULL,
  `reviewedBy` int DEFAULT NULL,
  `reviewedAt` timestamp NULL DEFAULT NULL,
  `resetLinkCreatedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `password_recovery_email_idx` (`email`),
  KEY `password_recovery_status_idx` (`status`),
  CONSTRAINT `passwordRecoveryRequests_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

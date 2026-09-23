ALTER TABLE `users` ADD `accountStatus` enum('active','suspended','banned') NOT NULL DEFAULT 'active';
--> statement-breakpoint
ALTER TABLE `users` ADD `suspendedUntil` timestamp NULL;

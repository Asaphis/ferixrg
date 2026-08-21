CREATE TABLE `accountSecurityEvents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `eventType` varchar(96) NOT NULL,
  `deliveryState` enum('not_requested','not_configured','sent','failed') NOT NULL DEFAULT 'not_requested',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `accountSecurityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accountSecurityEvents` ADD CONSTRAINT `accountSecurityEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `account_security_events_user_created_index` ON `accountSecurityEvents` (`userId`,`createdAt`);

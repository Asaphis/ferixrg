CREATE TABLE `accountEmailChanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newEmail` varchar(320) NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accountEmailChanges_id` PRIMARY KEY(`id`),
	CONSTRAINT `accountEmailChanges_tokenHash_unique` UNIQUE(`tokenHash`),
	CONSTRAINT `account_email_changes_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `accountEmailChanges` ADD CONSTRAINT `accountEmailChanges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
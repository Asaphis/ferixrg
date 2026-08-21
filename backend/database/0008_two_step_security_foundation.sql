CREATE TABLE `twoStepAuthenticators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`encryptedSecret` text NOT NULL,
	`keyVersion` varchar(64) NOT NULL,
	`enabledAt` timestamp,
	`lastVerifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twoStepAuthenticators_id` PRIMARY KEY(`id`),
	CONSTRAINT `two_step_authenticators_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `twoStepRecoveryCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authenticatorId` int NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `twoStepRecoveryCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `two_step_recovery_codes_hash_unique` UNIQUE(`codeHash`)
);
--> statement-breakpoint
CREATE TABLE `twoStepLoginChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `twoStepLoginChallenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `twoStepLoginChallenges_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `twoStepAuthenticators` ADD CONSTRAINT `twoStepAuthenticators_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `twoStepRecoveryCodes` ADD CONSTRAINT `twoStepRecoveryCodes_authenticatorId_twoStepAuthenticators_id_fk` FOREIGN KEY (`authenticatorId`) REFERENCES `twoStepAuthenticators`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `twoStepLoginChallenges` ADD CONSTRAINT `twoStepLoginChallenges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `two_step_recovery_codes_authenticator_index` ON `twoStepRecoveryCodes` (`authenticatorId`);--> statement-breakpoint
CREATE INDEX `two_step_login_challenges_user_expiry_index` ON `twoStepLoginChallenges` (`userId`,`expiresAt`);

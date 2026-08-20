CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultPreview` enum('desktop','tablet','mobile') NOT NULL DEFAULT 'mobile',
	`analysisReadyNotifications` int NOT NULL DEFAULT 1,
	`draftReviewNotifications` int NOT NULL DEFAULT 1,
	`publishingReadinessNotifications` int NOT NULL DEFAULT 1,
	`releaseNotes` int NOT NULL DEFAULT 1,
	`productResearch` int NOT NULL DEFAULT 0,
	`reduceMotion` int NOT NULL DEFAULT 0,
	`increaseContrast` int NOT NULL DEFAULT 0,
	`visibleKeyboardFocus` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `userPreferences` ADD CONSTRAINT `userPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `userPreferences` ADD `twoStepVerification` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userPreferences` ADD `securityAlerts` int DEFAULT 1 NOT NULL;
CREATE TABLE `draftAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`draftId` int NOT NULL,
	`draftVersionId` int,
	`kind` enum('reference','screenshot','theme_export','preview','manual_upload') NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `draftAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `draftAssets` ADD CONSTRAINT `draftAssets_draftId_drafts_id_fk` FOREIGN KEY (`draftId`) REFERENCES `drafts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `draftAssets` ADD CONSTRAINT `draftAssets_draftVersionId_draftVersions_id_fk` FOREIGN KEY (`draftVersionId`) REFERENCES `draftVersions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `draftAssets` ADD CONSTRAINT `draftAssets_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `draft_assets_draft_index` ON `draftAssets` (`draftId`);--> statement-breakpoint
CREATE INDEX `draft_assets_version_index` ON `draftAssets` (`draftVersionId`);
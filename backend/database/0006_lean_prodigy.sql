CREATE TABLE `developerHandoffs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`toolRunId` int,
	`issueId` int,
	`title` varchar(255) NOT NULL,
	`affectedLocation` varchar(1024) NOT NULL,
	`currentBehavior` text NOT NULL,
	`expectedBehavior` text NOT NULL,
	`recommendedImplementation` text NOT NULL,
	`priority` enum('critical','high','medium','low') NOT NULL,
	`acceptanceCriteria` json NOT NULL,
	`evidenceIds` json,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `developerHandoffs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issueRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`storeId` int,
	`toolRunId` int,
	`draftId` int,
	`title` varchar(255) NOT NULL,
	`severity` enum('critical','high','medium','low','info') NOT NULL,
	`status` enum('open','in_progress','resolved','ignored') NOT NULL DEFAULT 'open',
	`location` varchar(1024),
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `issueRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `developerHandoffs` ADD CONSTRAINT `developerHandoffs_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `developerHandoffs` ADD CONSTRAINT `developerHandoffs_toolRunId_toolRuns_id_fk` FOREIGN KEY (`toolRunId`) REFERENCES `toolRuns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `developerHandoffs` ADD CONSTRAINT `developerHandoffs_issueId_issueRecords_id_fk` FOREIGN KEY (`issueId`) REFERENCES `issueRecords`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `developerHandoffs` ADD CONSTRAINT `developerHandoffs_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issueRecords` ADD CONSTRAINT `issueRecords_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issueRecords` ADD CONSTRAINT `issueRecords_storeId_stores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issueRecords` ADD CONSTRAINT `issueRecords_toolRunId_toolRuns_id_fk` FOREIGN KEY (`toolRunId`) REFERENCES `toolRuns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `issueRecords` ADD CONSTRAINT `issueRecords_draftId_drafts_id_fk` FOREIGN KEY (`draftId`) REFERENCES `drafts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `developer_handoffs_workspace_index` ON `developerHandoffs` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `developer_handoffs_tool_run_index` ON `developerHandoffs` (`toolRunId`);--> statement-breakpoint
CREATE INDEX `issue_records_workspace_status_index` ON `issueRecords` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `issue_records_tool_run_index` ON `issueRecords` (`toolRunId`);
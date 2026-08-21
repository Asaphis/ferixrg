CREATE TABLE `legalDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentKey` enum('terms','privacy') NOT NULL,
	`version` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`effectiveAt` timestamp NOT NULL,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legalDocuments_id` PRIMARY KEY(`id`),
	CONSTRAINT `legal_documents_key_version_unique` UNIQUE(`documentKey`,`version`)
);
--> statement-breakpoint
CREATE TABLE `resourceAcknowledgements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resourceKey` varchar(128) NOT NULL,
	`acknowledgedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resourceAcknowledgements_id` PRIMARY KEY(`id`),
	CONSTRAINT `resource_acknowledgements_user_resource_unique` UNIQUE(`userId`,`resourceKey`)
);
--> statement-breakpoint
CREATE TABLE `workspaceRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int,
	`submittedByUserId` int NOT NULL,
	`type` enum('platform_request','support','problem','feedback','feature_request') NOT NULL,
	`status` enum('submitted','triaged','in_progress','resolved','closed') NOT NULL DEFAULT 'submitted',
	`subject` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`context` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaceRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `resourceAcknowledgements` ADD CONSTRAINT `resourceAcknowledgements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaceRequests` ADD CONSTRAINT `workspaceRequests_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaceRequests` ADD CONSTRAINT `workspaceRequests_submittedByUserId_users_id_fk` FOREIGN KEY (`submittedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `legal_documents_key_published_index` ON `legalDocuments` (`documentKey`,`publishedAt`);--> statement-breakpoint
CREATE INDEX `workspace_requests_workspace_type_index` ON `workspaceRequests` (`workspaceId`,`type`);--> statement-breakpoint
CREATE INDEX `workspace_requests_submitter_index` ON `workspaceRequests` (`submittedByUserId`);
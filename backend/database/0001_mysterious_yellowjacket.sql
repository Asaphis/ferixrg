CREATE TABLE `accountTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`purpose` enum('email_verification','password_reset','session') NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accountTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `accountTokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `activityEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`actorUserId` int,
	`eventType` varchar(128) NOT NULL,
	`entityType` varchar(128) NOT NULL,
	`entityId` varchar(128),
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `authIdentities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('email','google','manus') NOT NULL,
	`providerAccountId` varchar(320) NOT NULL,
	`passwordHash` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `authIdentities_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_identities_provider_account_unique` UNIQUE(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `draftVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`draftId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`createdByUserId` int,
	`createdByType` enum('user','ai','system') NOT NULL DEFAULT 'user',
	`label` varchar(160) NOT NULL,
	`note` text,
	`designState` text NOT NULL,
	`previewStorageKey` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `draftVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `draft_versions_draft_number_unique` UNIQUE(`draftId`,`versionNumber`)
);
--> statement-breakpoint
CREATE TABLE `drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`storeId` int,
	`title` varchar(160) NOT NULL,
	`source` enum('manual','tool','ai','import') NOT NULL DEFAULT 'manual',
	`status` enum('draft','review','validated','published','archived') NOT NULL DEFAULT 'draft',
	`createdByUserId` int NOT NULL,
	`currentVersionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidenceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toolRunId` int NOT NULL,
	`kind` enum('page_capture','screenshot','metric','store_data','validation','provider_summary') NOT NULL,
	`title` varchar(255) NOT NULL,
	`sourceUrl` varchar(2048),
	`storageKey` varchar(512),
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidenceItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `releaseActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`storeId` int,
	`draftVersionId` int,
	`requestedByUserId` int NOT NULL,
	`actionType` enum('export','publish','rollback') NOT NULL,
	`status` enum('pending','approved','processing','published','exported','reverted','failed','cancelled') NOT NULL DEFAULT 'pending',
	`providerReference` varchar(512),
	`errorMessage` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `releaseActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`toolRunId` int,
	`title` varchar(255) NOT NULL,
	`format` enum('web','pdf','csv','json','zip') NOT NULL,
	`storageKey` varchar(512),
	`summary` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storeConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`provider` enum('shopify','woocommerce','magento','custom') NOT NULL,
	`credentialReference` varchar(512),
	`scopes` json,
	`status` enum('pending','connected','expired','revoked','failed') NOT NULL DEFAULT 'pending',
	`lastCheckedAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeConnections_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_connections_store_provider_unique` UNIQUE(`storeId`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `storeSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`sourceType` enum('url_scan','store_api','screenshot','theme_export','manual_upload') NOT NULL,
	`sourceUrl` varchar(2048),
	`storageKey` varchar(512),
	`summary` text,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storeSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`platform` enum('shopify','woocommerce','magento','custom','public_url') NOT NULL,
	`url` varchar(2048) NOT NULL,
	`status` enum('draft','connected','attention','disconnected') NOT NULL DEFAULT 'draft',
	`healthScore` int,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`provider` varchar(128),
	`providerCustomerReference` varchar(512),
	`providerSubscriptionReference` varchar(512),
	`plan` enum('free','starter','growth','enterprise') NOT NULL DEFAULT 'free',
	`status` enum('trialing','active','past_due','cancelled','expired') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_workspace_unique` UNIQUE(`workspaceId`)
);
--> statement-breakpoint
CREATE TABLE `toolRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`storeId` int,
	`draftId` int,
	`toolId` varchar(160) NOT NULL,
	`status` enum('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`sourceType` enum('public_url','connected_store','saved_draft','upload','manual') NOT NULL,
	`requestedByUserId` int NOT NULL,
	`inputSummary` json,
	`resultSummary` json,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `toolRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usageLedger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int,
	`category` enum('tool_run','ai','storage','export','publish') NOT NULL,
	`quantity` int NOT NULL,
	`unit` varchar(64) NOT NULL,
	`provider` varchar(128),
	`referenceType` varchar(128),
	`referenceId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usageLedger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `validationRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`draftVersionId` int NOT NULL,
	`status` enum('queued','running','passed','failed') NOT NULL DEFAULT 'queued',
	`summary` json,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `validationRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaceInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`invitedByUserId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('admin','editor','viewer','billing') NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`status` enum('pending','accepted','cancelled','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `workspaceInvitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaceInvitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `workspaceMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','editor','viewer','billing') NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaceMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_members_workspace_user_unique` UNIQUE(`workspaceId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`ownerUserId` int NOT NULL,
	`plan` enum('free','starter','growth','enterprise') NOT NULL DEFAULT 'free',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `accountStatus` enum('active','pending_verification','suspended') DEFAULT 'pending_verification' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `accountTokens` ADD CONSTRAINT `accountTokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activityEvents` ADD CONSTRAINT `activityEvents_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activityEvents` ADD CONSTRAINT `activityEvents_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `authIdentities` ADD CONSTRAINT `authIdentities_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `draftVersions` ADD CONSTRAINT `draftVersions_draftId_drafts_id_fk` FOREIGN KEY (`draftId`) REFERENCES `drafts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `draftVersions` ADD CONSTRAINT `draftVersions_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drafts` ADD CONSTRAINT `drafts_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drafts` ADD CONSTRAINT `drafts_storeId_stores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drafts` ADD CONSTRAINT `drafts_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceItems` ADD CONSTRAINT `evidenceItems_toolRunId_toolRuns_id_fk` FOREIGN KEY (`toolRunId`) REFERENCES `toolRuns`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `releaseActions` ADD CONSTRAINT `releaseActions_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `releaseActions` ADD CONSTRAINT `releaseActions_storeId_stores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `releaseActions` ADD CONSTRAINT `releaseActions_draftVersionId_draftVersions_id_fk` FOREIGN KEY (`draftVersionId`) REFERENCES `draftVersions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `releaseActions` ADD CONSTRAINT `releaseActions_requestedByUserId_users_id_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_toolRunId_toolRuns_id_fk` FOREIGN KEY (`toolRunId`) REFERENCES `toolRuns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `storeConnections` ADD CONSTRAINT `storeConnections_storeId_stores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `storeSnapshots` ADD CONSTRAINT `storeSnapshots_storeId_stores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stores` ADD CONSTRAINT `stores_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stores` ADD CONSTRAINT `stores_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `toolRuns` ADD CONSTRAINT `toolRuns_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `toolRuns` ADD CONSTRAINT `toolRuns_storeId_stores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `toolRuns` ADD CONSTRAINT `toolRuns_draftId_drafts_id_fk` FOREIGN KEY (`draftId`) REFERENCES `drafts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `toolRuns` ADD CONSTRAINT `toolRuns_requestedByUserId_users_id_fk` FOREIGN KEY (`requestedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usageLedger` ADD CONSTRAINT `usageLedger_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usageLedger` ADD CONSTRAINT `usageLedger_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `validationRuns` ADD CONSTRAINT `validationRuns_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `validationRuns` ADD CONSTRAINT `validationRuns_draftVersionId_draftVersions_id_fk` FOREIGN KEY (`draftVersionId`) REFERENCES `draftVersions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaceInvitations` ADD CONSTRAINT `workspaceInvitations_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaceInvitations` ADD CONSTRAINT `workspaceInvitations_invitedByUserId_users_id_fk` FOREIGN KEY (`invitedByUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaceMembers` ADD CONSTRAINT `workspaceMembers_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaceMembers` ADD CONSTRAINT `workspaceMembers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_tokens_user_purpose_index` ON `accountTokens` (`userId`,`purpose`);--> statement-breakpoint
CREATE INDEX `activity_events_workspace_created_index` ON `activityEvents` (`workspaceId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `auth_identities_user_index` ON `authIdentities` (`userId`);--> statement-breakpoint
CREATE INDEX `drafts_workspace_index` ON `drafts` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `drafts_store_index` ON `drafts` (`storeId`);--> statement-breakpoint
CREATE INDEX `evidence_items_tool_run_index` ON `evidenceItems` (`toolRunId`);--> statement-breakpoint
CREATE INDEX `release_actions_workspace_index` ON `releaseActions` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `reports_workspace_index` ON `reports` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `store_snapshots_store_captured_index` ON `storeSnapshots` (`storeId`,`capturedAt`);--> statement-breakpoint
CREATE INDEX `stores_workspace_index` ON `stores` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `tool_runs_workspace_created_index` ON `toolRuns` (`workspaceId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tool_runs_status_index` ON `toolRuns` (`status`);--> statement-breakpoint
CREATE INDEX `usage_ledger_workspace_created_index` ON `usageLedger` (`workspaceId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `validation_runs_workspace_index` ON `validationRuns` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `workspace_invitations_workspace_status_index` ON `workspaceInvitations` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `workspace_members_user_index` ON `workspaceMembers` (`userId`);--> statement-breakpoint
CREATE INDEX `workspaces_owner_index` ON `workspaces` (`ownerUserId`);
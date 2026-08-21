CREATE TABLE "accountEmailChanges" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"newEmail" varchar(320) NOT NULL,
	"tokenHash" varchar(128) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accountEmailChanges_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "accountSecurityEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"eventType" varchar(96) NOT NULL,
	"deliveryState" text DEFAULT 'not_requested' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accountTokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"purpose" text NOT NULL,
	"tokenHash" varchar(128) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accountTokens_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "activityEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"actorUserId" integer,
	"eventType" varchar(128) NOT NULL,
	"entityType" varchar(128) NOT NULL,
	"entityId" varchar(128),
	"details" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authIdentities" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" varchar(320) NOT NULL,
	"passwordHash" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connectionSecrets" (
	"id" serial PRIMARY KEY NOT NULL,
	"connectionId" integer NOT NULL,
	"encryptedCredential" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "developerHandoffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"toolRunId" integer,
	"issueId" integer,
	"title" varchar(255) NOT NULL,
	"affectedLocation" varchar(1024) NOT NULL,
	"currentBehavior" text NOT NULL,
	"expectedBehavior" text NOT NULL,
	"recommendedImplementation" text NOT NULL,
	"priority" text NOT NULL,
	"acceptanceCriteria" jsonb NOT NULL,
	"evidenceIds" jsonb,
	"createdByUserId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draftAssets" (
	"id" serial PRIMARY KEY NOT NULL,
	"draftId" integer NOT NULL,
	"draftVersionId" integer,
	"kind" text NOT NULL,
	"storageKey" varchar(512) NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"mimeType" varchar(120) NOT NULL,
	"createdByUserId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draftVersions" (
	"id" serial PRIMARY KEY NOT NULL,
	"draftId" integer NOT NULL,
	"versionNumber" integer NOT NULL,
	"createdByUserId" integer,
	"createdByType" text DEFAULT 'user' NOT NULL,
	"label" varchar(160) NOT NULL,
	"note" text,
	"designState" text NOT NULL,
	"previewStorageKey" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"storeId" integer,
	"title" varchar(160) NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"createdByUserId" integer NOT NULL,
	"currentVersionId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editorDrafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"storeId" varchar(128) NOT NULL,
	"pageId" varchar(256) NOT NULL,
	"title" varchar(160) NOT NULL,
	"label" varchar(160) NOT NULL,
	"score" integer NOT NULL,
	"scoreDelta" integer NOT NULL,
	"tone" varchar(32) NOT NULL,
	"note" text NOT NULL,
	"designState" text NOT NULL,
	"isCurrent" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidenceItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"toolRunId" integer NOT NULL,
	"kind" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"sourceUrl" varchar(2048),
	"storageKey" varchar(512),
	"details" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issueRecords" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"storeId" integer,
	"toolRunId" integer,
	"draftId" integer,
	"title" varchar(255) NOT NULL,
	"severity" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"location" varchar(1024),
	"details" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legalDocuments" (
	"id" serial PRIMARY KEY NOT NULL,
	"documentKey" text NOT NULL,
	"version" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"effectiveAt" timestamp NOT NULL,
	"publishedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "releaseActions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"storeId" integer,
	"draftVersionId" integer,
	"requestedByUserId" integer NOT NULL,
	"actionType" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"providerReference" varchar(512),
	"errorMessage" text,
	"requestedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"toolRunId" integer,
	"title" varchar(255) NOT NULL,
	"format" text NOT NULL,
	"storageKey" varchar(512),
	"summary" text,
	"createdByUserId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resourceAcknowledgements" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"resourceKey" varchar(128) NOT NULL,
	"acknowledgedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storeConnections" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"provider" text NOT NULL,
	"credentialReference" varchar(512),
	"authorizationState" varchar(128),
	"authorizationStateExpiresAt" timestamp,
	"scopes" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"lastCheckedAt" timestamp,
	"lastError" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storeSnapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"sourceType" text NOT NULL,
	"sourceUrl" varchar(2048),
	"storageKey" varchar(512),
	"summary" text,
	"capturedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"platform" text NOT NULL,
	"url" varchar(2048) NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"healthScore" integer,
	"createdByUserId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"provider" varchar(128),
	"providerCustomerReference" varchar(512),
	"providerSubscriptionReference" varchar(512),
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"currentPeriodStart" timestamp,
	"currentPeriodEnd" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "toolRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"storeId" integer,
	"draftId" integer,
	"toolId" varchar(160) NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"sourceType" text NOT NULL,
	"requestedByUserId" integer NOT NULL,
	"inputSummary" jsonb,
	"resultSummary" jsonb,
	"errorMessage" text,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "twoStepAuthenticators" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"encryptedSecret" text NOT NULL,
	"keyVersion" varchar(64) NOT NULL,
	"enabledAt" timestamp,
	"lastVerifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "twoStepLoginChallenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tokenHash" varchar(128) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"consumedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "twoStepLoginChallenges_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "twoStepRecoveryCodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"authenticatorId" integer NOT NULL,
	"codeHash" varchar(128) NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usageLedger" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"userId" integer,
	"category" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(64) NOT NULL,
	"provider" varchar(128),
	"referenceType" varchar(128),
	"referenceId" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userPreferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"defaultPreview" text DEFAULT 'mobile' NOT NULL,
	"analysisReadyNotifications" integer DEFAULT 1 NOT NULL,
	"draftReviewNotifications" integer DEFAULT 1 NOT NULL,
	"publishingReadinessNotifications" integer DEFAULT 1 NOT NULL,
	"releaseNotes" integer DEFAULT 1 NOT NULL,
	"productResearch" integer DEFAULT 0 NOT NULL,
	"reduceMotion" integer DEFAULT 0 NOT NULL,
	"increaseContrast" integer DEFAULT 0 NOT NULL,
	"visibleKeyboardFocus" integer DEFAULT 1 NOT NULL,
	"twoStepVerification" integer DEFAULT 0 NOT NULL,
	"securityAlerts" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" text DEFAULT 'user' NOT NULL,
	"accountStatus" text DEFAULT 'pending_verification' NOT NULL,
	"emailVerifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "validationRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"draftVersionId" integer NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"summary" jsonb,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaceInvitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"invitedByUserId" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" text NOT NULL,
	"tokenHash" varchar(128) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"acceptedAt" timestamp,
	CONSTRAINT "workspaceInvitations_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "workspaceMembers" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"userId" integer NOT NULL,
	"role" text NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaceRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer,
	"submittedByUserId" integer NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"context" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"ownerUserId" integer NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accountEmailChanges" ADD CONSTRAINT "accountEmailChanges_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountSecurityEvents" ADD CONSTRAINT "accountSecurityEvents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountTokens" ADD CONSTRAINT "accountTokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activityEvents" ADD CONSTRAINT "activityEvents_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activityEvents" ADD CONSTRAINT "activityEvents_actorUserId_users_id_fk" FOREIGN KEY ("actorUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authIdentities" ADD CONSTRAINT "authIdentities_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connectionSecrets" ADD CONSTRAINT "connectionSecrets_connectionId_storeConnections_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."storeConnections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developerHandoffs" ADD CONSTRAINT "developerHandoffs_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developerHandoffs" ADD CONSTRAINT "developerHandoffs_toolRunId_toolRuns_id_fk" FOREIGN KEY ("toolRunId") REFERENCES "public"."toolRuns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developerHandoffs" ADD CONSTRAINT "developerHandoffs_issueId_issueRecords_id_fk" FOREIGN KEY ("issueId") REFERENCES "public"."issueRecords"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developerHandoffs" ADD CONSTRAINT "developerHandoffs_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draftAssets" ADD CONSTRAINT "draftAssets_draftId_drafts_id_fk" FOREIGN KEY ("draftId") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draftAssets" ADD CONSTRAINT "draftAssets_draftVersionId_draftVersions_id_fk" FOREIGN KEY ("draftVersionId") REFERENCES "public"."draftVersions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draftAssets" ADD CONSTRAINT "draftAssets_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draftVersions" ADD CONSTRAINT "draftVersions_draftId_drafts_id_fk" FOREIGN KEY ("draftId") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draftVersions" ADD CONSTRAINT "draftVersions_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorDrafts" ADD CONSTRAINT "editorDrafts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidenceItems" ADD CONSTRAINT "evidenceItems_toolRunId_toolRuns_id_fk" FOREIGN KEY ("toolRunId") REFERENCES "public"."toolRuns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issueRecords" ADD CONSTRAINT "issueRecords_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issueRecords" ADD CONSTRAINT "issueRecords_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issueRecords" ADD CONSTRAINT "issueRecords_toolRunId_toolRuns_id_fk" FOREIGN KEY ("toolRunId") REFERENCES "public"."toolRuns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issueRecords" ADD CONSTRAINT "issueRecords_draftId_drafts_id_fk" FOREIGN KEY ("draftId") REFERENCES "public"."drafts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releaseActions" ADD CONSTRAINT "releaseActions_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releaseActions" ADD CONSTRAINT "releaseActions_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releaseActions" ADD CONSTRAINT "releaseActions_draftVersionId_draftVersions_id_fk" FOREIGN KEY ("draftVersionId") REFERENCES "public"."draftVersions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releaseActions" ADD CONSTRAINT "releaseActions_requestedByUserId_users_id_fk" FOREIGN KEY ("requestedByUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_toolRunId_toolRuns_id_fk" FOREIGN KEY ("toolRunId") REFERENCES "public"."toolRuns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resourceAcknowledgements" ADD CONSTRAINT "resourceAcknowledgements_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storeConnections" ADD CONSTRAINT "storeConnections_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storeSnapshots" ADD CONSTRAINT "storeSnapshots_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toolRuns" ADD CONSTRAINT "toolRuns_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toolRuns" ADD CONSTRAINT "toolRuns_storeId_stores_id_fk" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toolRuns" ADD CONSTRAINT "toolRuns_draftId_drafts_id_fk" FOREIGN KEY ("draftId") REFERENCES "public"."drafts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toolRuns" ADD CONSTRAINT "toolRuns_requestedByUserId_users_id_fk" FOREIGN KEY ("requestedByUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twoStepAuthenticators" ADD CONSTRAINT "twoStepAuthenticators_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twoStepLoginChallenges" ADD CONSTRAINT "twoStepLoginChallenges_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "twoStepRecoveryCodes" ADD CONSTRAINT "twoStepRecoveryCodes_authenticatorId_twoStepAuthenticators_id_fk" FOREIGN KEY ("authenticatorId") REFERENCES "public"."twoStepAuthenticators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usageLedger" ADD CONSTRAINT "usageLedger_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usageLedger" ADD CONSTRAINT "usageLedger_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userPreferences" ADD CONSTRAINT "userPreferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validationRuns" ADD CONSTRAINT "validationRuns_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validationRuns" ADD CONSTRAINT "validationRuns_draftVersionId_draftVersions_id_fk" FOREIGN KEY ("draftVersionId") REFERENCES "public"."draftVersions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaceInvitations" ADD CONSTRAINT "workspaceInvitations_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaceInvitations" ADD CONSTRAINT "workspaceInvitations_invitedByUserId_users_id_fk" FOREIGN KEY ("invitedByUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaceMembers" ADD CONSTRAINT "workspaceMembers_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaceMembers" ADD CONSTRAINT "workspaceMembers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaceRequests" ADD CONSTRAINT "workspaceRequests_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaceRequests" ADD CONSTRAINT "workspaceRequests_submittedByUserId_users_id_fk" FOREIGN KEY ("submittedByUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerUserId_users_id_fk" FOREIGN KEY ("ownerUserId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_email_changes_user_unique" ON "accountEmailChanges" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "account_security_events_user_created_index" ON "accountSecurityEvents" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "account_tokens_user_purpose_index" ON "accountTokens" USING btree ("userId","purpose");--> statement-breakpoint
CREATE INDEX "activity_events_workspace_created_index" ON "activityEvents" USING btree ("workspaceId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_provider_account_unique" ON "authIdentities" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE INDEX "auth_identities_user_index" ON "authIdentities" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "connection_secrets_connection_unique" ON "connectionSecrets" USING btree ("connectionId");--> statement-breakpoint
CREATE INDEX "developer_handoffs_workspace_index" ON "developerHandoffs" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "developer_handoffs_tool_run_index" ON "developerHandoffs" USING btree ("toolRunId");--> statement-breakpoint
CREATE INDEX "draft_assets_draft_index" ON "draftAssets" USING btree ("draftId");--> statement-breakpoint
CREATE INDEX "draft_assets_version_index" ON "draftAssets" USING btree ("draftVersionId");--> statement-breakpoint
CREATE UNIQUE INDEX "draft_versions_draft_number_unique" ON "draftVersions" USING btree ("draftId","versionNumber");--> statement-breakpoint
CREATE INDEX "drafts_workspace_index" ON "drafts" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "drafts_store_index" ON "drafts" USING btree ("storeId");--> statement-breakpoint
CREATE INDEX "evidence_items_tool_run_index" ON "evidenceItems" USING btree ("toolRunId");--> statement-breakpoint
CREATE INDEX "issue_records_workspace_status_index" ON "issueRecords" USING btree ("workspaceId","status");--> statement-breakpoint
CREATE INDEX "issue_records_tool_run_index" ON "issueRecords" USING btree ("toolRunId");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_documents_key_version_unique" ON "legalDocuments" USING btree ("documentKey","version");--> statement-breakpoint
CREATE INDEX "legal_documents_key_published_index" ON "legalDocuments" USING btree ("documentKey","publishedAt");--> statement-breakpoint
CREATE INDEX "release_actions_workspace_index" ON "releaseActions" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "reports_workspace_index" ON "reports" USING btree ("workspaceId");--> statement-breakpoint
CREATE UNIQUE INDEX "resource_acknowledgements_user_resource_unique" ON "resourceAcknowledgements" USING btree ("userId","resourceKey");--> statement-breakpoint
CREATE UNIQUE INDEX "store_connections_store_provider_unique" ON "storeConnections" USING btree ("storeId","provider");--> statement-breakpoint
CREATE INDEX "store_snapshots_store_captured_index" ON "storeSnapshots" USING btree ("storeId","capturedAt");--> statement-breakpoint
CREATE INDEX "stores_workspace_index" ON "stores" USING btree ("workspaceId");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_workspace_unique" ON "subscriptions" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "tool_runs_workspace_created_index" ON "toolRuns" USING btree ("workspaceId","createdAt");--> statement-breakpoint
CREATE INDEX "tool_runs_status_index" ON "toolRuns" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "two_step_authenticators_user_unique" ON "twoStepAuthenticators" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "two_step_login_challenges_user_expiry_index" ON "twoStepLoginChallenges" USING btree ("userId","expiresAt");--> statement-breakpoint
CREATE INDEX "two_step_recovery_codes_authenticator_index" ON "twoStepRecoveryCodes" USING btree ("authenticatorId");--> statement-breakpoint
CREATE UNIQUE INDEX "two_step_recovery_codes_hash_unique" ON "twoStepRecoveryCodes" USING btree ("codeHash");--> statement-breakpoint
CREATE INDEX "usage_ledger_workspace_created_index" ON "usageLedger" USING btree ("workspaceId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "user_preferences_user_unique" ON "userPreferences" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "validation_runs_workspace_index" ON "validationRuns" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "workspace_invitations_workspace_status_index" ON "workspaceInvitations" USING btree ("workspaceId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_workspace_user_unique" ON "workspaceMembers" USING btree ("workspaceId","userId");--> statement-breakpoint
CREATE INDEX "workspace_members_user_index" ON "workspaceMembers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "workspace_requests_workspace_type_index" ON "workspaceRequests" USING btree ("workspaceId","type");--> statement-breakpoint
CREATE INDEX "workspace_requests_submitter_index" ON "workspaceRequests" USING btree ("submittedByUserId");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_unique" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "workspaces_owner_index" ON "workspaces" USING btree ("ownerUserId");
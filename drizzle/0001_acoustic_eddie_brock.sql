CREATE TABLE `backgroundJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobType` varchar(100) NOT NULL,
	`workflowExecutionId` int,
	`status` enum('queued','processing','completed','failed','retrying') NOT NULL DEFAULT 'queued',
	`payload` json NOT NULL,
	`result` json,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`scheduledFor` timestamp,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `backgroundJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookId` int,
	`eventType` varchar(255) NOT NULL,
	`source` varchar(100) NOT NULL,
	`payload` json NOT NULL,
	`metadata` json,
	`status` enum('received','processing','processed','failed') NOT NULL DEFAULT 'received',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(100) NOT NULL,
	`config` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`type` varchar(50) NOT NULL,
	`relatedEventId` int,
	`relatedWorkflowExecutionId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricType` varchar(100) NOT NULL,
	`value` bigint NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`endpoint` varchar(500) NOT NULL,
	`secret` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhooks_endpoint_unique` UNIQUE(`endpoint`)
);
--> statement-breakpoint
CREATE TABLE `workflowExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`eventId` int,
	`status` enum('pending','running','success','failed','cancelled') NOT NULL DEFAULT 'pending',
	`executionData` json,
	`result` json,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflowExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`triggerType` varchar(100) NOT NULL,
	`triggerConfig` json NOT NULL,
	`actions` json NOT NULL,
	`conditions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `backgroundJobs_jobType_idx` ON `backgroundJobs` (`jobType`);--> statement-breakpoint
CREATE INDEX `backgroundJobs_status_idx` ON `backgroundJobs` (`status`);--> statement-breakpoint
CREATE INDEX `backgroundJobs_scheduledFor_idx` ON `backgroundJobs` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `backgroundJobs_workflowExecutionId_idx` ON `backgroundJobs` (`workflowExecutionId`);--> statement-breakpoint
CREATE INDEX `events_webhookId_idx` ON `events` (`webhookId`);--> statement-breakpoint
CREATE INDEX `events_eventType_idx` ON `events` (`eventType`);--> statement-breakpoint
CREATE INDEX `events_source_idx` ON `events` (`source`);--> statement-breakpoint
CREATE INDEX `events_status_idx` ON `events` (`status`);--> statement-breakpoint
CREATE INDEX `events_createdAt_idx` ON `events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `integrations_userId_idx` ON `integrations` (`userId`);--> statement-breakpoint
CREATE INDEX `integrations_type_idx` ON `integrations` (`type`);--> statement-breakpoint
CREATE INDEX `notifications_userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_isRead_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `notifications_createdAt_idx` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `systemMetrics_metricType_idx` ON `systemMetrics` (`metricType`);--> statement-breakpoint
CREATE INDEX `systemMetrics_createdAt_idx` ON `systemMetrics` (`createdAt`);--> statement-breakpoint
CREATE INDEX `webhooks_userId_idx` ON `webhooks` (`userId`);--> statement-breakpoint
CREATE INDEX `workflowExecutions_workflowId_idx` ON `workflowExecutions` (`workflowId`);--> statement-breakpoint
CREATE INDEX `workflowExecutions_eventId_idx` ON `workflowExecutions` (`eventId`);--> statement-breakpoint
CREATE INDEX `workflowExecutions_status_idx` ON `workflowExecutions` (`status`);--> statement-breakpoint
CREATE INDEX `workflowExecutions_createdAt_idx` ON `workflowExecutions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `workflows_userId_idx` ON `workflows` (`userId`);--> statement-breakpoint
CREATE INDEX `workflows_isActive_idx` ON `workflows` (`isActive`);
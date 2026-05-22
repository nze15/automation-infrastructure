import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, bigint, index, foreignKey } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Webhooks table: stores webhook endpoint configurations
 */
export const webhooks = mysqlTable(
  "webhooks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    endpoint: varchar("endpoint", { length: 500 }).notNull().unique(),
    secret: varchar("secret", { length: 255 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("webhooks_userId_idx").on(table.userId),
  })
);

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

/**
 * Events table: stores all incoming events from webhooks and internal sources
 */
export const events = mysqlTable(
  "events",
  {
    id: int("id").autoincrement().primaryKey(),
    webhookId: int("webhookId"),
    eventType: varchar("eventType", { length: 255 }).notNull(),
    source: varchar("source", { length: 100 }).notNull(), // 'webhook', 'internal', 'blockchain', 'payment'
    payload: json("payload").notNull(),
    metadata: json("metadata"),
    status: mysqlEnum("status", ["received", "processing", "processed", "failed"]).default("received").notNull(),
    errorMessage: text("errorMessage"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    processedAt: timestamp("processedAt"),
  },
  (table) => ({
    webhookIdIdx: index("events_webhookId_idx").on(table.webhookId),
    eventTypeIdx: index("events_eventType_idx").on(table.eventType),
    sourceIdx: index("events_source_idx").on(table.source),
    statusIdx: index("events_status_idx").on(table.status),
    createdAtIdx: index("events_createdAt_idx").on(table.createdAt),
  })
);

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Workflows table: stores workflow definitions and configurations
 */
export const workflows = mysqlTable(
  "workflows",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    isActive: boolean("isActive").default(true).notNull(),
    triggerType: varchar("triggerType", { length: 100 }).notNull(), // 'webhook', 'event', 'schedule', 'manual'
    triggerConfig: json("triggerConfig").notNull(), // stores trigger-specific configuration
    actions: json("actions").notNull(), // array of action definitions
    conditions: json("conditions"), // optional conditional logic
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("workflows_userId_idx").on(table.userId),
    isActiveIdx: index("workflows_isActive_idx").on(table.isActive),
  })
);

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Workflow executions table: tracks each execution of a workflow
 */
export const workflowExecutions = mysqlTable(
  "workflowExecutions",
  {
    id: int("id").autoincrement().primaryKey(),
    workflowId: int("workflowId").notNull(),
    eventId: int("eventId"),
    status: mysqlEnum("status", ["pending", "running", "success", "failed", "cancelled"]).default("pending").notNull(),
    executionData: json("executionData"), // stores intermediate execution state
    result: json("result"), // final result of execution
    errorMessage: text("errorMessage"),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    workflowIdIdx: index("workflowExecutions_workflowId_idx").on(table.workflowId),
    eventIdIdx: index("workflowExecutions_eventId_idx").on(table.eventId),
    statusIdx: index("workflowExecutions_status_idx").on(table.status),
    createdAtIdx: index("workflowExecutions_createdAt_idx").on(table.createdAt),
  })
);

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;

/**
 * Background jobs table: stores job queue entries for async processing
 */
export const backgroundJobs = mysqlTable(
  "backgroundJobs",
  {
    id: int("id").autoincrement().primaryKey(),
    jobType: varchar("jobType", { length: 100 }).notNull(), // 'email', 'notification', 'ai_task', 'api_call', etc.
    workflowExecutionId: int("workflowExecutionId"),
    status: mysqlEnum("status", ["queued", "processing", "completed", "failed", "retrying"]).default("queued").notNull(),
    payload: json("payload").notNull(),
    result: json("result"),
    errorMessage: text("errorMessage"),
    retryCount: int("retryCount").default(0).notNull(),
    maxRetries: int("maxRetries").default(3).notNull(),
    scheduledFor: timestamp("scheduledFor"),
    processedAt: timestamp("processedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    jobTypeIdx: index("backgroundJobs_jobType_idx").on(table.jobType),
    statusIdx: index("backgroundJobs_status_idx").on(table.status),
    scheduledForIdx: index("backgroundJobs_scheduledFor_idx").on(table.scheduledFor),
    workflowExecutionIdIdx: index("backgroundJobs_workflowExecutionId_idx").on(table.workflowExecutionId),
  })
);

export type BackgroundJob = typeof backgroundJobs.$inferSelect;
export type InsertBackgroundJob = typeof backgroundJobs.$inferInsert;

/**
 * Notifications table: stores notifications sent to admins
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 'info', 'warning', 'error', 'success'
    relatedEventId: int("relatedEventId"),
    relatedWorkflowExecutionId: int("relatedWorkflowExecutionId"),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("notifications_userId_idx").on(table.userId),
    isReadIdx: index("notifications_isRead_idx").on(table.isRead),
    createdAtIdx: index("notifications_createdAt_idx").on(table.createdAt),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Integrations table: stores third-party API integrations
 */
export const integrations = mysqlTable(
  "integrations",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(), // 'email', 'slack', 'stripe', 'blockchain', etc.
    config: json("config").notNull(), // stores API keys, endpoints, etc.
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("integrations_userId_idx").on(table.userId),
    typeIdx: index("integrations_type_idx").on(table.type),
  })
);

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;

/**
 * System metrics table: stores aggregated metrics for monitoring
 */
export const systemMetrics = mysqlTable(
  "systemMetrics",
  {
    id: int("id").autoincrement().primaryKey(),
    metricType: varchar("metricType", { length: 100 }).notNull(), // 'queue_depth', 'event_throughput', 'workflow_success_rate', etc.
    value: bigint("value", { mode: "number" }).notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    metricTypeIdx: index("systemMetrics_metricType_idx").on(table.metricType),
    createdAtIdx: index("systemMetrics_createdAt_idx").on(table.createdAt),
  })
);

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = typeof systemMetrics.$inferInsert;
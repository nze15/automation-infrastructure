import { eq, desc, and, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  webhooks, 
  events, 
  workflows, 
  workflowExecutions, 
  backgroundJobs, 
  notifications, 
  integrations, 
  systemMetrics,
  InsertWebhook,
  InsertEvent,
  InsertWorkflow,
  InsertWorkflowExecution,
  InsertBackgroundJob,
  InsertNotification,
  InsertIntegration,
  InsertSystemMetric
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// WEBHOOK QUERIES
// ============================================================================

export async function createWebhook(data: InsertWebhook) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(webhooks).values(data);
  return { insertId: (result as any)[0]?.insertId || 0 };
}

export async function getWebhooksByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(webhooks).where(eq(webhooks.userId, userId));
}

export async function getWebhookById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);
  return result[0];
}

export async function updateWebhook(id: number, data: Partial<InsertWebhook>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(webhooks).set(data).where(eq(webhooks.id, id));
}

export async function deleteWebhook(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(webhooks).where(eq(webhooks.id, id));
}

// ============================================================================
// EVENT QUERIES
// ============================================================================

export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(events).values(data);
  return { insertId: (result as any)[0]?.insertId || 0 };
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result[0];
}

export async function getRecentEvents(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(events)
    .orderBy(desc(events.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getEventsByType(eventType: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(events)
    .where(eq(events.eventType, eventType))
    .orderBy(desc(events.createdAt))
    .limit(limit);
}

export async function getEventsByStatus(status: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(events)
    .where(eq(events.status, status as any))
    .orderBy(desc(events.createdAt))
    .limit(limit);
}

export async function updateEventStatus(id: number, status: string, errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status: status as any, processedAt: new Date() };
  if (errorMessage) updateData.errorMessage = errorMessage;
  
  return await db.update(events).set(updateData).where(eq(events.id, id));
}

// ============================================================================
// WORKFLOW QUERIES
// ============================================================================

export async function createWorkflow(data: InsertWorkflow) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(workflows).values(data);
  return { insertId: (result as any)[0]?.insertId || 0 };
}

export async function getWorkflowsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(workflows).where(eq(workflows.userId, userId));
}

export async function getWorkflowById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
  return result[0];
}

export async function updateWorkflow(id: number, data: Partial<InsertWorkflow>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(workflows).set(data).where(eq(workflows.id, id));
}

export async function deleteWorkflow(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(workflows).where(eq(workflows.id, id));
}

export async function getActiveWorkflows() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(workflows).where(eq(workflows.isActive, true));
}

// ============================================================================
// WORKFLOW EXECUTION QUERIES
// ============================================================================

export async function createWorkflowExecution(data: InsertWorkflowExecution) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(workflowExecutions).values(data);
  return { insertId: (result as any)[0]?.insertId || 0 };
}

export async function getWorkflowExecutionById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(workflowExecutions).where(eq(workflowExecutions.id, id)).limit(1);
  return result[0];
}

export async function getWorkflowExecutionsByWorkflowId(workflowId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(workflowExecutions)
    .where(eq(workflowExecutions.workflowId, workflowId))
    .orderBy(desc(workflowExecutions.createdAt))
    .limit(limit);
}

export async function updateWorkflowExecution(id: number, data: Partial<InsertWorkflowExecution>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(workflowExecutions).set(data).where(eq(workflowExecutions.id, id));
}

export async function getWorkflowExecutionsByStatus(status: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(workflowExecutions)
    .where(eq(workflowExecutions.status, status as any))
    .orderBy(desc(workflowExecutions.createdAt))
    .limit(limit);
}

// ============================================================================
// BACKGROUND JOB QUERIES
// ============================================================================

export async function createBackgroundJob(data: InsertBackgroundJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(backgroundJobs).values(data);
  return { insertId: (result as any)[0]?.insertId || 0 };
}

export async function getBackgroundJobById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(backgroundJobs).where(eq(backgroundJobs.id, id)).limit(1);
  return result[0];
}

export async function getQueuedJobs(limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(backgroundJobs)
    .where(eq(backgroundJobs.status, 'queued'))
    .orderBy(backgroundJobs.scheduledFor ? backgroundJobs.scheduledFor : backgroundJobs.createdAt)
    .limit(limit);
}

export async function updateBackgroundJob(id: number, data: Partial<InsertBackgroundJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(backgroundJobs).set(data).where(eq(backgroundJobs.id, id));
}

export async function getJobsByType(jobType: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(backgroundJobs)
    .where(eq(backgroundJobs.jobType, jobType))
    .orderBy(desc(backgroundJobs.createdAt))
    .limit(limit);
}

export async function getJobsByStatus(status: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(backgroundJobs)
    .where(eq(backgroundJobs.status, status as any))
    .orderBy(desc(backgroundJobs.createdAt))
    .limit(limit);
}

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(data);
  return { insertId: (result as any)[0]?.insertId || 0 };
}

export async function getNotificationsByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(notifications).where(eq(notifications.id, id));
}

// ============================================================================
// INTEGRATION QUERIES
// ============================================================================

export async function createIntegration(data: InsertIntegration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(integrations).values(data);
  return { insertId: (result as any)[0]?.insertId || 0 };
}

export async function getIntegrationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(integrations).where(eq(integrations.userId, userId));
}

export async function getIntegrationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(integrations).where(eq(integrations.id, id)).limit(1);
  return result[0];
}

export async function updateIntegration(id: number, data: Partial<InsertIntegration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(integrations).set(data).where(eq(integrations.id, id));
}

export async function deleteIntegration(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(integrations).where(eq(integrations.id, id));
}

export async function getIntegrationsByType(type: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(integrations).where(eq(integrations.type, type));
}

// ============================================================================
// SYSTEM METRICS QUERIES
// ============================================================================

export async function recordMetric(data: InsertSystemMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(systemMetrics).values(data);
  return { insertId: (result as any)[0]?.insertId || 0 };
}

export async function getMetricsByType(metricType: string, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(systemMetrics)
    .where(eq(systemMetrics.metricType, metricType))
    .orderBy(desc(systemMetrics.createdAt))
    .limit(limit);
}

export async function getRecentMetrics(limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(systemMetrics)
    .orderBy(desc(systemMetrics.createdAt))
    .limit(limit);
}

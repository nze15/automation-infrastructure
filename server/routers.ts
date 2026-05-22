import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { createInternalEvent } from "./webhookService";
import { workflowEngine } from "./workflowEngine";
import { jobQueue } from "./jobQueue";
import { eventBus, EVENTS } from "./eventBus";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Webhooks
  webhooks: router({
    list: protectedProcedure.query(({ ctx }) => db.getWebhooksByUserId(ctx.user.id!)),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const secret = Math.random().toString(36).substring(2, 15);
        const endpoint = `/webhooks/${Math.random().toString(36).substring(2, 15)}`;
        const result = await db.createWebhook({
          userId: ctx.user.id!,
          name: input.name,
          description: input.description,
          endpoint,
          secret,
          isActive: true,
        });
        return { id: result.insertId, endpoint, secret };
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => await db.getWebhookById(input.id)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.boolean().optional(),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => await db.updateWebhook(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => await db.deleteWebhook(input.id)),
  }),

  // Workflows
  workflows: router({
    list: protectedProcedure.query(({ ctx }) => db.getWorkflowsByUserId(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        triggerType: z.enum(['webhook', 'event', 'schedule', 'manual']),
        triggerConfig: z.record(z.string(), z.any()),
        actions: z.array(z.record(z.string(), z.any())),
        conditions: z.array(z.record(z.string(), z.any())).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createWorkflow({
          userId: ctx.user.id!,
          name: input.name,
          description: input.description,
          triggerType: input.triggerType,
          triggerConfig: input.triggerConfig,
          actions: input.actions,
          conditions: input.conditions,
          isActive: true,
        });
        return { id: result.insertId };
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => await db.getWorkflowById(input.id)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        isActive: z.boolean().optional(),
        actions: z.array(z.record(z.string(), z.any())).optional(),
      }))
      .mutation(async ({ input }) => await db.updateWorkflow(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => await db.deleteWorkflow(input.id)),
    getExecutions: protectedProcedure
      .input(z.object({ workflowId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => await db.getWorkflowExecutionsByWorkflowId(input.workflowId, input.limit)),
  }),

  // Events
  events: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => await db.getRecentEvents(input.limit, input.offset)),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => await db.getEventById(input.id)),
    getByType: protectedProcedure
      .input(z.object({ eventType: z.string(), limit: z.number().default(50) }))
      .query(async ({ input }) => await db.getEventsByType(input.eventType, input.limit)),
    getByStatus: protectedProcedure
      .input(z.object({ status: z.string(), limit: z.number().default(50) }))
      .query(async ({ input }) => await db.getEventsByStatus(input.status, input.limit)),
    createInternal: protectedProcedure
      .input(z.object({
        eventType: z.string(),
        payload: z.record(z.string(), z.any()),
        metadata: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input }) => await createInternalEvent(input.eventType, input.payload, input.metadata)),
  }),

  // Notifications
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => await db.getNotificationsByUserId(ctx.user.id!, input.limit)),
    getUnread: protectedProcedure
      .query(async ({ ctx }) => await db.getUnreadNotifications(ctx.user.id!)),
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => await db.markNotificationAsRead(input.id)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => await db.deleteNotification(input.id)),
  }),

  // System & Metrics
  systemMetrics: router({
    getQueueStats: protectedProcedure.query(async () => await jobQueue.getQueueStats()),
    getMetrics: protectedProcedure
      .input(z.object({ metricType: z.string().optional(), limit: z.number().default(100) }))
      .query(async ({ input }) => {
        if (input.metricType) {
          return await db.getMetricsByType(input.metricType, input.limit);
        }
        return await db.getRecentMetrics(input.limit);
      }),
    getEventBusStats: protectedProcedure.query(() => ({
      eventTypes: eventBus.getEventTypes(),
      listenerCounts: Object.fromEntries(
        eventBus.getEventTypes().map(type => [type, eventBus.getListenerCount(type)])
      ),
    })),
  }),
});

export type AppRouter = typeof appRouter;

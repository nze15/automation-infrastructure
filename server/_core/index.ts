import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { processWebhook, createInternalEvent, createBlockchainEvent, createPaymentEvent } from "../webhookService";
import { workflowEngine } from "../workflowEngine";
import { jobQueue } from "../jobQueue";
import { eventBus, EVENTS } from "../eventBus";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Webhook ingestion endpoints
  app.post('/api/webhooks/:webhookId', async (req, res) => {
    try {
      const { webhookId } = req.params;
      const signature = req.headers['x-webhook-signature'] as string;
      const payload = req.body;

      if (!webhookId || !signature) {
        return res.status(400).json({ error: 'Missing webhookId or signature' });
      }

      const result = await processWebhook(parseInt(webhookId), payload, signature);
      if (result.success) {
        res.json({ success: true, eventId: result.eventId });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('[Webhook] Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Event ingestion endpoints
  app.post('/api/events/internal', async (req, res) => {
    try {
      const { eventType, payload, metadata } = req.body;
      const result = await createInternalEvent(eventType, payload, metadata);
      if (result.success) {
        res.json({ success: true, eventId: result.eventId });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('[Events] Error creating internal event:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/events/blockchain', async (req, res) => {
    try {
      const { eventType, payload, metadata } = req.body;
      const result = await createBlockchainEvent(eventType, payload, metadata);
      if (result.success) {
        res.json({ success: true, eventId: result.eventId });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('[Events] Error creating blockchain event:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/events/payment', async (req, res) => {
    try {
      const { eventType, payload, metadata } = req.body;
      const result = await createPaymentEvent(eventType, payload, metadata);
      if (result.success) {
        res.json({ success: true, eventId: result.eventId });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('[Events] Error creating payment event:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Event listener for workflow triggering
  eventBus.subscribe(EVENTS.EVENT_CREATED, async (event: any) => {
    try {
      const db = await import('../db');
      const workflows = await db.getActiveWorkflows();
      for (const workflow of workflows) {
        if (workflow.triggerType === 'event' && (workflow.triggerConfig as any).eventType === event.eventType) {
          await workflowEngine.executeWorkflow(workflow.id, event.eventId, event.payload);
        }
      }
    } catch (error) {
      console.error('[EventListener] Error triggering workflows:', error);
    }
  });

  // Start job queue processor
  jobQueue.startProcessing(5000);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log('[Automation Infrastructure] Webhook ingestion engine initialized');
    console.log('[Automation Infrastructure] Event bus and job queue started');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');
    jobQueue.stopProcessing();
    server.close(() => {
      console.log('[Server] Server closed');
      process.exit(0);
    });
  });
}

startServer().catch(console.error);

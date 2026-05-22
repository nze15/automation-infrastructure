/**
 * Webhook Service
 * 
 * Handles webhook ingestion, validation, and event creation
 */

import crypto from 'crypto';
import { createEvent, getWebhookById, updateEventStatus } from './db';
import { eventBus, EVENTS, WebhookReceivedEvent, EventCreatedEvent } from './eventBus';

/**
 * Verify webhook signature using HMAC-SHA256
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Check length first to avoid timing attacks with different length buffers
  if (Buffer.byteLength(signature) !== Buffer.byteLength(expectedSignature)) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Process an incoming webhook
 */
export async function processWebhook(
  webhookId: number,
  payload: any,
  signature: string
): Promise<{ success: boolean; eventId?: number; error?: string }> {
  try {
    // Get webhook configuration
    const webhook = await getWebhookById(webhookId);
    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    if (!webhook.isActive) {
      return { success: false, error: 'Webhook is inactive' };
    }

    // Verify signature
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    try {
      if (!verifyWebhookSignature(payloadString, signature, webhook.secret)) {
        return { success: false, error: 'Invalid signature' };
      }
    } catch (error) {
      return { success: false, error: 'Signature verification failed' };
    }

    // Parse payload if it's a string
    const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;

    // Extract event type from payload
    const eventType = parsedPayload.eventType || parsedPayload.type || 'unknown';

    // Create event in database
    const result = await createEvent({
      webhookId,
      eventType,
      source: 'webhook',
      payload: parsedPayload,
      metadata: {
        webhookName: webhook.name,
        receivedAt: new Date().toISOString(),
      },
      status: 'received',
    });

    const eventId = result.insertId;

    // Emit webhook received event
    await eventBus.emit<WebhookReceivedEvent>(EVENTS.WEBHOOK_RECEIVED, {
      webhookId,
      eventType,
      payload: parsedPayload,
      timestamp: new Date(),
    });

    // Emit event created event
    await eventBus.emit<EventCreatedEvent>(EVENTS.EVENT_CREATED, {
      eventId,
      eventType,
      source: 'webhook',
      payload: parsedPayload,
      timestamp: new Date(),
    });

    return { success: true, eventId };
  } catch (error) {
    console.error('[WebhookService] Error processing webhook:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create an internal event (not from webhook)
 */
export async function createInternalEvent(
  eventType: string,
  payload: any,
  metadata?: any
): Promise<{ success: boolean; eventId?: number; error?: string }> {
  try {
    const result = await createEvent({
      eventType,
      source: 'internal',
      payload,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
      status: 'received',
    });

    const eventId = result.insertId;

    // Emit event created event
    await eventBus.emit<EventCreatedEvent>(EVENTS.EVENT_CREATED, {
      eventId,
      eventType,
      source: 'internal',
      payload,
      timestamp: new Date(),
    });

    return { success: true, eventId };
  } catch (error) {
    console.error('[WebhookService] Error creating internal event:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a blockchain event
 */
export async function createBlockchainEvent(
  eventType: string,
  payload: any,
  metadata?: any
): Promise<{ success: boolean; eventId?: number; error?: string }> {
  try {
    const result = await createEvent({
      eventType,
      source: 'blockchain',
      payload,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
      status: 'received',
    });

    const eventId = result.insertId;

    // Emit event created event
    await eventBus.emit<EventCreatedEvent>(EVENTS.EVENT_CREATED, {
      eventId,
      eventType,
      source: 'blockchain',
      payload,
      timestamp: new Date(),
    });

    return { success: true, eventId };
  } catch (error) {
    console.error('[WebhookService] Error creating blockchain event:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a payment event
 */
export async function createPaymentEvent(
  eventType: string,
  payload: any,
  metadata?: any
): Promise<{ success: boolean; eventId?: number; error?: string }> {
  try {
    const result = await createEvent({
      eventType,
      source: 'payment',
      payload,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
      status: 'received',
    });

    const eventId = result.insertId;

    // Emit event created event
    await eventBus.emit<EventCreatedEvent>(EVENTS.EVENT_CREATED, {
      eventId,
      eventType,
      source: 'payment',
      payload,
      timestamp: new Date(),
    });

    return { success: true, eventId };
  } catch (error) {
    console.error('[WebhookService] Error creating payment event:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

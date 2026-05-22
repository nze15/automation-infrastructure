/**
 * Event Bus Service
 * 
 * Provides a simple in-memory pub/sub event bus for real-time communication
 * between services. In production, this could be replaced with Redis Pub/Sub
 * or other message brokers.
 */

type EventListener<T = any> = (data: T) => void | Promise<void>;

interface EventSubscription {
  eventType: string;
  listener: EventListener;
}

class EventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private eventHistory: Array<{ eventType: string; data: any; timestamp: Date }> = [];
  private maxHistorySize = 1000;

  /**
   * Subscribe to an event type
   */
  subscribe<T = any>(eventType: string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  /**
   * Subscribe to an event type, but only fire once
   */
  once<T = any>(eventType: string, listener: EventListener<T>): () => void {
    const wrappedListener = async (data: T) => {
      await listener(data);
      unsubscribe();
    };

    const unsubscribe = this.subscribe(eventType, wrappedListener);
    return unsubscribe;
  }

  /**
   * Publish an event to all subscribers
   */
  async emit<T = any>(eventType: string, data: T): Promise<void> {
    // Add to history
    this.eventHistory.push({ eventType, data, timestamp: new Date() });
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    const listeners = this.listeners.get(eventType);
    if (!listeners) return;

    // Fire all listeners (in parallel)
    const promises = Array.from(listeners).map(listener => {
      try {
        return Promise.resolve(listener(data));
      } catch (error) {
        console.error(`[EventBus] Error in listener for ${eventType}:`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get listener count for an event type
   */
  getListenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.size ?? 0;
  }

  /**
   * Get all event types with listeners
   */
  getEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get recent events from history
   */
  getHistory(eventType?: string, limit: number = 50): Array<{ eventType: string; data: any; timestamp: Date }> {
    let history = this.eventHistory;
    if (eventType) {
      history = history.filter(e => e.eventType === eventType);
    }
    return history.slice(-limit);
  }

  /**
   * Clear all listeners and history
   */
  clear(): void {
    this.listeners.clear();
    this.eventHistory = [];
  }
}

// Export singleton instance
export const eventBus = new EventBus();

// ============================================================================
// STANDARD EVENT TYPES
// ============================================================================

export const EVENTS = {
  // Webhook events
  WEBHOOK_RECEIVED: 'webhook:received',
  WEBHOOK_PROCESSED: 'webhook:processed',
  WEBHOOK_FAILED: 'webhook:failed',

  // Event events
  EVENT_CREATED: 'event:created',
  EVENT_PROCESSED: 'event:processed',
  EVENT_FAILED: 'event:failed',

  // Workflow events
  WORKFLOW_CREATED: 'workflow:created',
  WORKFLOW_UPDATED: 'workflow:updated',
  WORKFLOW_DELETED: 'workflow:deleted',
  WORKFLOW_EXECUTION_STARTED: 'workflow:execution:started',
  WORKFLOW_EXECUTION_COMPLETED: 'workflow:execution:completed',
  WORKFLOW_EXECUTION_FAILED: 'workflow:execution:failed',

  // Job events
  JOB_QUEUED: 'job:queued',
  JOB_STARTED: 'job:started',
  JOB_COMPLETED: 'job:completed',
  JOB_FAILED: 'job:failed',
  JOB_RETRYING: 'job:retrying',

  // Notification events
  NOTIFICATION_CREATED: 'notification:created',
  NOTIFICATION_SENT: 'notification:sent',

  // AI task events
  AI_TASK_STARTED: 'ai_task:started',
  AI_TASK_COMPLETED: 'ai_task:completed',
  AI_TASK_FAILED: 'ai_task:failed',

  // System events
  SYSTEM_HEALTH_CHECK: 'system:health:check',
  SYSTEM_METRICS_UPDATED: 'system:metrics:updated',
};

// ============================================================================
// EVENT PAYLOAD TYPES
// ============================================================================

export interface WebhookReceivedEvent {
  webhookId: number;
  eventType: string;
  payload: any;
  timestamp: Date;
}

export interface EventCreatedEvent {
  eventId: number;
  eventType: string;
  source: string;
  payload: any;
  timestamp: Date;
}

export interface WorkflowExecutionEvent {
  executionId: number;
  workflowId: number;
  eventId?: number;
  status: string;
  result?: any;
  error?: string;
  timestamp: Date;
}

export interface BackgroundJobEvent {
  jobId: number;
  jobType: string;
  status: string;
  result?: any;
  error?: string;
  timestamp: Date;
}

export interface NotificationEvent {
  notificationId: number;
  userId: number;
  title: string;
  content: string;
  type: string;
  timestamp: Date;
}

export interface SystemMetricsEvent {
  queueDepth: number;
  eventThroughput: number;
  workflowSuccessRate: number;
  activeWorkflows: number;
  timestamp: Date;
}

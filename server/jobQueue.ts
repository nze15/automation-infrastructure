/**
 * Background Job Queue Service
 * 
 * Manages job queuing, processing, retries, and scheduling
 * In production, this could be replaced with BullMQ or similar
 */

import { createBackgroundJob, updateBackgroundJob, getQueuedJobs } from './db';
import { eventBus, EVENTS, BackgroundJobEvent } from './eventBus';

export type JobType = 'email' | 'notification' | 'ai_task' | 'api_call' | 'webhook' | 'data_sync';

export interface JobPayload {
  [key: string]: any;
}

export interface JobResult {
  [key: string]: any;
}

class JobQueue {
  private processingJobs: Set<number> = new Set();
  private processingInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Queue a new job
   */
  async enqueueJob(
    jobType: JobType,
    payload: JobPayload,
    options?: {
      workflowExecutionId?: number;
      maxRetries?: number;
      scheduledFor?: Date;
    }
  ): Promise<number> {
    const result = await createBackgroundJob({
      jobType,
      payload,
      workflowExecutionId: options?.workflowExecutionId,
      maxRetries: options?.maxRetries ?? 3,
      scheduledFor: options?.scheduledFor,
      status: 'queued',
    });

    const jobId = result.insertId;

    // Emit job queued event
    await eventBus.emit<BackgroundJobEvent>(EVENTS.JOB_QUEUED, {
      jobId,
      jobType,
      status: 'queued',
      timestamp: new Date(),
    });

    return jobId;
  }

  /**
   * Start processing jobs from the queue
   */
  startProcessing(intervalMs: number = 5000): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('[JobQueue] Starting job processor');

    this.processingInterval = setInterval(() => {
      this.processNextBatch();
    }, intervalMs);
  }

  /**
   * Stop processing jobs
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isRunning = false;
    console.log('[JobQueue] Job processor stopped');
  }

  /**
   * Process the next batch of queued jobs
   */
  private async processNextBatch(): Promise<void> {
    try {
      const jobs = await getQueuedJobs(10);

      for (const job of jobs) {
        // Skip if already processing
        if (this.processingJobs.has(job.id)) continue;

        // Skip if not ready to process yet
        if (job.scheduledFor && new Date() < job.scheduledFor) continue;

        this.processingJobs.add(job.id);

        // Process in background (don't await)
        this.processJob(job).finally(() => {
          this.processingJobs.delete(job.id);
        });
      }
    } catch (error) {
      console.error('[JobQueue] Error processing batch:', error);
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: any): Promise<void> {
    try {
      // Update status to processing
      await updateBackgroundJob(job.id, { status: 'processing' });

      // Emit job started event
      await eventBus.emit<BackgroundJobEvent>(EVENTS.JOB_STARTED, {
        jobId: job.id,
        jobType: job.jobType,
        status: 'processing',
        timestamp: new Date(),
      });

      // Execute job based on type
      let result: JobResult;
      try {
        result = await this.executeJob(job.jobType, job.payload);
      } catch (error) {
        throw error;
      }

      // Update job with success
      await updateBackgroundJob(job.id, {
        status: 'completed',
        result,
        processedAt: new Date(),
      });

      // Emit job completed event
      await eventBus.emit<BackgroundJobEvent>(EVENTS.JOB_COMPLETED, {
        jobId: job.id,
        jobType: job.jobType,
        status: 'completed',
        result,
        timestamp: new Date(),
      });
    } catch (error) {
      await this.handleJobError(job, error);
    }
  }

  /**
   * Handle job error and retry logic
   */
  private async handleJobError(job: any, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const newRetryCount = (job.retryCount ?? 0) + 1;

    if (newRetryCount < job.maxRetries) {
      // Retry the job
      const backoffMs = Math.pow(2, newRetryCount) * 1000; // Exponential backoff
      const nextScheduledFor = new Date(Date.now() + backoffMs);

      await updateBackgroundJob(job.id, {
        status: 'retrying',
        retryCount: newRetryCount,
        scheduledFor: nextScheduledFor,
        errorMessage,
      });

      // Emit job retrying event
      await eventBus.emit<BackgroundJobEvent>(EVENTS.JOB_RETRYING, {
        jobId: job.id,
        jobType: job.jobType,
        status: 'retrying',
        error: errorMessage,
        timestamp: new Date(),
      });
    } else {
      // Max retries exceeded, mark as failed
      await updateBackgroundJob(job.id, {
        status: 'failed',
        errorMessage,
        processedAt: new Date(),
      });

      // Emit job failed event
      await eventBus.emit<BackgroundJobEvent>(EVENTS.JOB_FAILED, {
        jobId: job.id,
        jobType: job.jobType,
        status: 'failed',
        error: errorMessage,
        timestamp: new Date(),
      });

      console.error(`[JobQueue] Job ${job.id} failed after ${newRetryCount} retries:`, errorMessage);
    }
  }

  /**
   * Execute a job based on its type
   */
  private async executeJob(jobType: JobType, payload: JobPayload): Promise<JobResult> {
    switch (jobType) {
      case 'email':
        return await this.executeEmailJob(payload);
      case 'notification':
        return await this.executeNotificationJob(payload);
      case 'ai_task':
        return await this.executeAITask(payload);
      case 'api_call':
        return await this.executeAPICall(payload);
      case 'webhook':
        return await this.executeWebhookCall(payload);
      case 'data_sync':
        return await this.executeDataSync(payload);
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
  }

  /**
   * Execute email job
   */
  private async executeEmailJob(payload: JobPayload): Promise<JobResult> {
    // TODO: Implement email sending
    console.log('[JobQueue] Executing email job:', payload);
    return { sent: true };
  }

  /**
   * Execute notification job
   */
  private async executeNotificationJob(payload: JobPayload): Promise<JobResult> {
    // TODO: Implement notification sending
    console.log('[JobQueue] Executing notification job:', payload);
    return { notified: true };
  }

  /**
   * Execute AI task
   */
  private async executeAITask(payload: JobPayload): Promise<JobResult> {
    // TODO: Implement AI task execution
    console.log('[JobQueue] Executing AI task:', payload);
    return { result: 'AI task completed' };
  }

  /**
   * Execute API call
   */
  private async executeAPICall(payload: JobPayload): Promise<JobResult> {
    // TODO: Implement API call execution
    console.log('[JobQueue] Executing API call:', payload);
    return { statusCode: 200 };
  }

  /**
   * Execute webhook call
   */
  private async executeWebhookCall(payload: JobPayload): Promise<JobResult> {
    // TODO: Implement webhook call execution
    console.log('[JobQueue] Executing webhook call:', payload);
    return { statusCode: 200 };
  }

  /**
   * Execute data sync
   */
  private async executeDataSync(payload: JobPayload): Promise<JobResult> {
    // TODO: Implement data sync execution
    console.log('[JobQueue] Executing data sync:', payload);
    return { synced: true };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    queuedCount: number;
    processingCount: number;
  }> {
    const queuedJobs = await getQueuedJobs(1000);
    return {
      queuedCount: queuedJobs.length,
      processingCount: this.processingJobs.size,
    };
  }
}

// Export singleton instance
export const jobQueue = new JobQueue();

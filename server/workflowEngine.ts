/**
 * Workflow Execution Engine
 * 
 * Executes workflow definitions: trigger → process → action
 * Handles workflow state management and execution history
 */

import { 
  createWorkflowExecution, 
  updateWorkflowExecution, 
  getWorkflowById,
  getActiveWorkflows,
  createBackgroundJob,
  createNotification,
} from './db';
import { eventBus, EVENTS, WorkflowExecutionEvent } from './eventBus';
import { jobQueue } from './jobQueue';

export interface WorkflowTrigger {
  type: 'webhook' | 'event' | 'schedule' | 'manual';
  config: any;
}

export interface WorkflowAction {
  id: string;
  type: 'email' | 'notification' | 'api_call' | 'ai_task' | 'webhook' | 'data_update';
  config: any;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
  value: any;
}

class WorkflowEngine {
  /**
   * Execute a workflow based on an event
   */
  async executeWorkflow(
    workflowId: number,
    eventId: number,
    eventPayload: any
  ): Promise<{ executionId: number; success: boolean; error?: string }> {
    try {
      // Get workflow definition
      const workflow = await getWorkflowById(workflowId);
      if (!workflow) {
        return { executionId: 0, success: false, error: 'Workflow not found' };
      }

      if (!workflow.isActive) {
        return { executionId: 0, success: false, error: 'Workflow is inactive' };
      }

      // Create execution record
      const result = await createWorkflowExecution({
        workflowId,
        eventId,
        status: 'running',
        startedAt: new Date(),
      });

      const executionId = result.insertId;

      // Emit execution started event
      await eventBus.emit<WorkflowExecutionEvent>(EVENTS.WORKFLOW_EXECUTION_STARTED, {
        executionId,
        workflowId,
        eventId,
        status: 'running',
        timestamp: new Date(),
      });

      // Execute workflow in background
      this.executeWorkflowAsync(executionId, workflow, eventPayload).catch(error => {
        console.error('[WorkflowEngine] Error executing workflow:', error);
      });

      return { executionId, success: true };
    } catch (error) {
      console.error('[WorkflowEngine] Error starting workflow execution:', error);
      return {
        executionId: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute workflow asynchronously
   */
  private async executeWorkflowAsync(
    executionId: number,
    workflow: any,
    eventPayload: any
  ): Promise<void> {
    try {
      let executionData: any = {
        startedAt: new Date(),
        eventPayload,
      };

      // Check conditions
      if (workflow.conditions && workflow.conditions.length > 0) {
        const conditionsMet = this.evaluateConditions(workflow.conditions, eventPayload);
        if (!conditionsMet) {
          await updateWorkflowExecution(executionId, {
            status: 'success',
            result: { skipped: true, reason: 'Conditions not met' },
            completedAt: new Date(),
          });

          await eventBus.emit<WorkflowExecutionEvent>(EVENTS.WORKFLOW_EXECUTION_COMPLETED, {
            executionId,
            workflowId: workflow.id,
            status: 'success',
            result: { skipped: true },
            timestamp: new Date(),
          });

          return;
        }
      }

      // Execute actions in sequence
      const actions = workflow.actions || [];
      const actionResults: any[] = [];

      for (const action of actions) {
        try {
          const actionResult = await this.executeAction(action, eventPayload, executionData);
          actionResults.push({
            actionId: action.id,
            status: 'success',
            result: actionResult,
          });
          executionData[action.id] = actionResult;
        } catch (error) {
          actionResults.push({
            actionId: action.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Continue executing remaining actions
        }
      }

      // Update execution with results
      await updateWorkflowExecution(executionId, {
        status: 'success',
        result: {
          actions: actionResults,
          completedAt: new Date(),
        },
        completedAt: new Date(),
      });

      // Emit execution completed event
      await eventBus.emit<WorkflowExecutionEvent>(EVENTS.WORKFLOW_EXECUTION_COMPLETED, {
        executionId,
        workflowId: workflow.id,
        status: 'success',
        result: { actions: actionResults },
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update execution with error
      await updateWorkflowExecution(executionId, {
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      });

      // Emit execution failed event
      await eventBus.emit<WorkflowExecutionEvent>(EVENTS.WORKFLOW_EXECUTION_FAILED, {
        executionId,
        workflowId: workflow.id,
        status: 'failed',
        error: errorMessage,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: WorkflowAction, eventPayload: any, executionData: any): Promise<any> {
    switch (action.type) {
      case 'email':
        return await this.executeEmailAction(action.config, eventPayload);
      case 'notification':
        return await this.executeNotificationAction(action.config, eventPayload);
      case 'api_call':
        return await this.executeAPICallAction(action.config, eventPayload);
      case 'ai_task':
        return await this.executeAITaskAction(action.config, eventPayload);
      case 'webhook':
        return await this.executeWebhookAction(action.config, eventPayload);
      case 'data_update':
        return await this.executeDataUpdateAction(action.config, eventPayload);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute email action
   */
  private async executeEmailAction(config: any, eventPayload: any): Promise<any> {
    // Queue email job
    const jobId = await jobQueue.enqueueJob('email', {
      to: config.to,
      subject: this.interpolateString(config.subject, eventPayload),
      body: this.interpolateString(config.body, eventPayload),
    });
    return { jobId, type: 'email' };
  }

  /**
   * Execute notification action
   */
  private async executeNotificationAction(config: any, eventPayload: any): Promise<any> {
    // Queue notification job
    const jobId = await jobQueue.enqueueJob('notification', {
      userId: config.userId,
      title: this.interpolateString(config.title, eventPayload),
      content: this.interpolateString(config.content, eventPayload),
      type: config.type || 'info',
    });
    return { jobId, type: 'notification' };
  }

  /**
   * Execute API call action
   */
  private async executeAPICallAction(config: any, eventPayload: any): Promise<any> {
    // Queue API call job
    const jobId = await jobQueue.enqueueJob('api_call', {
      url: config.url,
      method: config.method || 'POST',
      headers: config.headers,
      body: this.interpolateObject(config.body, eventPayload),
    });
    return { jobId, type: 'api_call' };
  }

  /**
   * Execute AI task action
   */
  private async executeAITaskAction(config: any, eventPayload: any): Promise<any> {
    // Queue AI task job
    const jobId = await jobQueue.enqueueJob('ai_task', {
      prompt: this.interpolateString(config.prompt, eventPayload),
      model: config.model || 'gpt-4',
      temperature: config.temperature || 0.7,
    });
    return { jobId, type: 'ai_task' };
  }

  /**
   * Execute webhook action
   */
  private async executeWebhookAction(config: any, eventPayload: any): Promise<any> {
    // Queue webhook call job
    const jobId = await jobQueue.enqueueJob('webhook', {
      url: config.url,
      method: config.method || 'POST',
      headers: config.headers,
      body: this.interpolateObject(config.body, eventPayload),
    });
    return { jobId, type: 'webhook' };
  }

  /**
   * Execute data update action
   */
  private async executeDataUpdateAction(config: any, eventPayload: any): Promise<any> {
    // Queue data sync job
    const jobId = await jobQueue.enqueueJob('data_sync', {
      table: config.table,
      operation: config.operation,
      data: this.interpolateObject(config.data, eventPayload),
      conditions: config.conditions,
    });
    return { jobId, type: 'data_sync' };
  }

  /**
   * Evaluate workflow conditions
   */
  private evaluateConditions(conditions: WorkflowCondition[], payload: any): boolean {
    return conditions.every(condition => this.evaluateCondition(condition, payload));
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: WorkflowCondition, payload: any): boolean {
    const value = this.getNestedValue(payload, condition.field);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'gt':
        return Number(value) > Number(condition.value);
      case 'lt':
        return Number(value) < Number(condition.value);
      case 'gte':
        return Number(value) >= Number(condition.value);
      case 'lte':
        return Number(value) <= Number(condition.value);
      default:
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Interpolate variables in a string
   */
  private interpolateString(str: string, data: any): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      return String(this.getNestedValue(data, key) ?? match);
    });
  }

  /**
   * Interpolate variables in an object
   */
  private interpolateObject(obj: any, data: any): any {
    if (typeof obj === 'string') {
      return this.interpolateString(obj, data);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, data));
    }
    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value, data);
      }
      return result;
    }
    return obj;
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();

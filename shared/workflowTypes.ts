/**
 * Workflow Definition Types
 * Defines the structure of workflow configurations
 */

export interface WorkflowDefinition {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: WorkflowTrigger;
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
  errorHandling?: ErrorHandlingConfig;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: 'webhook' | 'event' | 'schedule' | 'manual';
  config: any;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  id: string;
  type: 'email' | 'notification' | 'api_call' | 'ai_task' | 'webhook' | 'data_update' | 'database' | 'transform';
  name: string;
  config: any;
  retryConfig?: RetryConfig;
  timeout?: number; // milliseconds
}

export interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number; // milliseconds
}

export interface ErrorHandlingConfig {
  onFailure: 'stop' | 'continue' | 'retry';
  notifyOnError: boolean;
  errorWebhook?: string;
}

export interface WorkflowExecution {
  id: number;
  workflowId: number;
  eventId: number;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  result?: ExecutionResult;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
}

export interface ExecutionResult {
  skipped?: boolean;
  reason?: string;
  actions?: ActionResult[];
  data?: Record<string, any>;
}

export interface ActionResult {
  actionId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  duration?: number;
  retries?: number;
}

export interface WorkflowExecutionContext {
  executionId: number;
  workflowId: number;
  eventId: number;
  eventPayload: any;
  executionData: Map<string, any>;
  startTime: number;
  parentActionId?: string;
}

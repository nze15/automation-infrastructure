/**
 * LLM-Assisted Workflow Builder
 * 
 * Converts plain English descriptions into workflow configurations
 */

import { invokeLLM } from './_core/llm';

export interface WorkflowDescription {
  description: string;
  context?: string;
}

export interface GeneratedWorkflow {
  name: string;
  description: string;
  triggerType: 'webhook' | 'event' | 'schedule' | 'manual';
  triggerConfig: Record<string, any>;
  actions: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
  }>;
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

class WorkflowBuilder {
  /**
   * Generate workflow configuration from plain English description
   */
  async generateFromDescription(input: WorkflowDescription): Promise<{
    success: boolean;
    workflow?: GeneratedWorkflow;
    error?: string;
  }> {
    try {
      const systemPrompt = `You are an expert workflow automation builder. Convert plain English descriptions into structured workflow configurations. 
      
      Return a valid JSON object with this structure:
      {
        "name": "Workflow Name",
        "description": "What this workflow does",
        "triggerType": "webhook|event|schedule|manual",
        "triggerConfig": { /* trigger-specific config */ },
        "actions": [
          {
            "id": "action_1",
            "type": "email|notification|api_call|ai_task|webhook|data_update",
            "config": { /* action-specific config */ }
          }
        ],
        "conditions": [
          {
            "field": "fieldName",
            "operator": "equals|contains|gt|lt|gte|lte",
            "value": "value"
          }
        ]
      }
      
      Common action types:
      - email: Send email with {to, subject, body}
      - notification: Send notification with {userId, title, content, type}
      - api_call: Call API with {url, method, headers, body}
      - ai_task: Run AI task with {prompt, model, temperature}
      - webhook: Call webhook with {url, method, headers, body}
      - data_update: Update database with {table, operation, data, conditions}
      
      Trigger types:
      - webhook: Triggered by incoming webhook
      - event: Triggered by internal event
      - schedule: Triggered on schedule (cron)
      - manual: Manually triggered`;

      const userPrompt = `Create a workflow for: ${input.description}${
        input.context ? `\n\nAdditional context: ${input.context}` : ''
      }`;

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'workflow_config',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                triggerType: {
                  type: 'string',
                  enum: ['webhook', 'event', 'schedule', 'manual'],
                },
                triggerConfig: { type: 'object' },
                actions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string' },
                      config: { type: 'object' },
                    },
                    required: ['id', 'type', 'config'],
                  },
                },
                conditions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      operator: { type: 'string' },
                      value: {},
                    },
                  },
                },
              },
              required: ['name', 'description', 'triggerType', 'triggerConfig', 'actions'],
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === 'string' ? content : (Array.isArray(content) && content[0]?.type === 'text' ? (content[0] as any).text : '');
      
      if (!contentStr) {
        return { success: false, error: 'No response from LLM' };
      }

      const workflow = JSON.parse(contentStr) as GeneratedWorkflow;

      return { success: true, workflow };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WorkflowBuilder] Error generating workflow:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Suggest improvements to a workflow
   */
  async suggestImprovements(workflow: GeneratedWorkflow): Promise<{
    success: boolean;
    suggestions?: string[];
    error?: string;
  }> {
    try {
      const workflowJson = JSON.stringify(workflow, null, 2);

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'You are an expert workflow automation consultant. Analyze workflows and suggest improvements.',
          },
          {
            role: 'user',
            content: `Analyze this workflow and suggest 3-5 improvements:\n\n${workflowJson}`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === 'string' ? content : (Array.isArray(content) && content[0]?.type === 'text' ? (content[0] as any).text : '');
      const suggestions = contentStr.split('\n').filter((line: string) => line.trim().length > 0);

      return { success: true, suggestions };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WorkflowBuilder] Error suggesting improvements:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Validate workflow configuration
   */
  async validate(workflow: GeneratedWorkflow): Promise<{
    success: boolean;
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!workflow.name || workflow.name.trim().length === 0) {
      errors.push('Workflow name is required');
    }

    if (!workflow.triggerType) {
      errors.push('Trigger type is required');
    }

    if (!workflow.actions || workflow.actions.length === 0) {
      errors.push('At least one action is required');
    }

    // Check for common issues
    if (workflow.actions.length > 10) {
      warnings.push('Workflow has many actions - consider breaking it into smaller workflows');
    }

    if (workflow.conditions && workflow.conditions.length > 5) {
      warnings.push('Many conditions may make the workflow complex - consider simplifying');
    }

    return {
      success: true,
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

// Export singleton instance
export const workflowBuilder = new WorkflowBuilder();

/**
 * AI Task Service
 * 
 * Executes AI-powered automation tasks using LLM
 */

import { invokeLLM } from './_core/llm';
import { eventBus, EVENTS } from './eventBus';

export interface AITask {
  prompt: string;
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AITaskResult {
  success: boolean;
  result?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class AITaskService {
  /**
   * Execute a simple text completion task
   */
  async executeTextCompletion(task: AITask): Promise<AITaskResult> {
    try {
      const messages: any[] = [];

      if (task.systemPrompt) {
        messages.push({
          role: 'system',
          content: task.systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: task.prompt,
      });

      const response = await invokeLLM({
        messages,
      });

      const content = response.choices[0]?.message?.content;
      const result = typeof content === 'string' ? content : (Array.isArray(content) && content[0]?.type === 'text' ? (content[0] as any).text : '');

      // Emit AI task completed event
      await eventBus.emit(EVENTS.AI_TASK_COMPLETED, {
        taskType: 'text_completion',
        success: true,
        timestamp: new Date(),
      });

      return {
        success: true,
        result,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AITask] Error executing text completion:', errorMessage);

      await eventBus.emit(EVENTS.AI_TASK_FAILED, {
        taskType: 'text_completion',
        error: errorMessage,
        timestamp: new Date(),
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Execute a text classification task
   */
  async executeClassification(
    text: string,
    categories: string[],
    systemPrompt?: string
  ): Promise<AITaskResult> {
    const prompt = `Classify the following text into one of these categories: ${categories.join(', ')}\n\nText: "${text}"\n\nRespond with only the category name.`;

    return this.executeTextCompletion({
      prompt,
      systemPrompt: systemPrompt || 'You are a text classification assistant. Respond with only the category name.',
    });
  }

  /**
   * Execute a content generation task
   */
  async generateContent(
    prompt: string,
    style?: string,
    maxTokens?: number
  ): Promise<AITaskResult> {
    const fullPrompt = style ? `${prompt}\n\nStyle: ${style}` : prompt;

    return this.executeTextCompletion({
      prompt: fullPrompt,
      maxTokens: maxTokens || 2000,
    });
  }

  /**
   * Execute a data extraction task
   */
  async extractData(
    text: string,
    schema: Record<string, string>
  ): Promise<AITaskResult> {
    const schemaDescription = Object.entries(schema)
      .map(([key, description]) => `- ${key}: ${description}`)
      .join('\n');

    const prompt = `Extract the following information from the text:\n\n${schemaDescription}\n\nText: "${text}"\n\nRespond in JSON format.`;

    return this.executeTextCompletion({
      prompt,
      systemPrompt: 'You are a data extraction assistant. Extract information and respond in valid JSON format only.',
    });
  }

  /**
   * Execute a sentiment analysis task
   */
  async analyzeSentiment(text: string): Promise<AITaskResult> {
    const prompt = `Analyze the sentiment of the following text and respond with one of: positive, negative, neutral\n\nText: "${text}"\n\nRespond with only the sentiment.`;

    return this.executeTextCompletion({
      prompt,
      systemPrompt: 'You are a sentiment analysis assistant. Respond with only the sentiment: positive, negative, or neutral.',
    });
  }

  /**
   * Execute a summarization task
   */
  async summarize(text: string, maxLength?: number): Promise<AITaskResult> {
    const lengthHint = maxLength ? ` Keep it under ${maxLength} characters.` : '';
    const prompt = `Summarize the following text concisely.${lengthHint}\n\nText: "${text}"\n\nSummary:`;

    return this.executeTextCompletion({
      prompt,
    });
  }

  /**
   * Execute a generic AI task
   */
  async execute(task: AITask): Promise<AITaskResult> {
    return this.executeTextCompletion(task);
  }
}

// Export singleton instance
export const aiTaskService = new AITaskService();

// Add AI task events to event bus
export const AI_TASK_EVENTS = {
  COMPLETED: 'ai_task:completed',
  FAILED: 'ai_task:failed',
};

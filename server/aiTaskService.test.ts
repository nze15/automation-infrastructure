import { describe, expect, it, vi } from "vitest";
import { aiTaskService } from "./aiTaskService";
import { eventBus, EVENTS } from "./eventBus";

// Mock the LLM service
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "Test response",
        },
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    },
  }),
}));

describe("aiTaskService", () => {
  describe("executeTextCompletion", () => {
    it("should execute text completion task", async () => {
      const result = await aiTaskService.executeTextCompletion({
        prompt: "Hello, world!",
        systemPrompt: "You are helpful",
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe("Test response");
      expect(result.usage).toBeDefined();
      expect(result.usage?.totalTokens).toBe(30);
    });

    it("should emit AI task completed event", async () => {
      const emitSpy = vi.spyOn(eventBus, "emit");

      await aiTaskService.executeTextCompletion({
        prompt: "Test prompt",
      });

      expect(emitSpy).toHaveBeenCalledWith(EVENTS.AI_TASK_COMPLETED, expect.any(Object));
    });

    it("should handle errors gracefully", async () => {
      const { invokeLLM } = await import("./_core/llm");
      vi.mocked(invokeLLM).mockRejectedValueOnce(new Error("LLM error"));

      const result = await aiTaskService.executeTextCompletion({
        prompt: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("executeClassification", () => {
    it("should classify text", async () => {
      const result = await aiTaskService.executeClassification(
        "This is great!",
        ["positive", "negative", "neutral"]
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe("generateContent", () => {
    it("should generate content", async () => {
      const result = await aiTaskService.generateContent(
        "Write a welcome email",
        "friendly and professional"
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe("extractData", () => {
    it("should extract data from text", async () => {
      const result = await aiTaskService.extractData(
        "John Doe, 30 years old",
        {
          name: "Person's name",
          age: "Person's age",
        }
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe("analyzeSentiment", () => {
    it("should analyze sentiment", async () => {
      const result = await aiTaskService.analyzeSentiment(
        "I love this product!"
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe("summarize", () => {
    it("should summarize text", async () => {
      const result = await aiTaskService.summarize(
        "This is a long text that needs to be summarized"
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe("execute", () => {
    it("should execute generic AI task", async () => {
      const result = await aiTaskService.execute({
        prompt: "Test prompt",
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });
});

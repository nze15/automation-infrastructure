import { describe, expect, it, vi } from "vitest";
import { workflowEngine } from "./workflowEngine";
import { eventBus, EVENTS } from "./eventBus";

// Mock database functions
vi.mock("./db", () => ({
  getWorkflowById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Test Workflow",
    triggerType: "event",
    triggerConfig: { eventType: "user.created" },
    conditions: [],
    actions: [],
    isActive: true,
  }),
  createWorkflowExecution: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateWorkflowExecution: vi.fn().mockResolvedValue({ affectedRows: 1 }),
}));

// Mock job queue
vi.mock("./jobQueue", () => ({
  jobQueue: {
    enqueueJob: vi.fn().mockResolvedValue(1),
  },
}));

describe("workflowEngine", () => {
  describe("executeWorkflow", () => {
    it("should execute workflow successfully", async () => {
      const result = await workflowEngine.executeWorkflow(1, 1, {
        eventType: "user.created",
      });

      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();
    });

    it("should emit workflow execution started event", async () => {
      const emitSpy = vi.spyOn(eventBus, "emit");

      await workflowEngine.executeWorkflow(1, 1, { eventType: "user.created" });

      expect(emitSpy).toHaveBeenCalledWith(EVENTS.WORKFLOW_EXECUTION_STARTED, expect.any(Object));
    });

    it("should handle workflow not found error", async () => {
      const { getWorkflowById } = await import("./db");
      vi.mocked(getWorkflowById).mockResolvedValueOnce(null);

      const result = await workflowEngine.executeWorkflow(999, 1, {
        eventType: "user.created",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Workflow not found");
    });

    it("should handle inactive workflow", async () => {
      const { getWorkflowById } = await import("./db");
      vi.mocked(getWorkflowById).mockResolvedValueOnce({
        id: 1,
        isActive: false,
      });

      const result = await workflowEngine.executeWorkflow(1, 1, {
        eventType: "user.created",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Workflow is inactive");
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import { notificationService } from "./notificationService";
import { eventBus, EVENTS } from "./eventBus";

describe("notificationService", () => {
  describe("sendEmail", () => {
    it("should send email and emit event", async () => {
      const emitSpy = vi.spyOn(eventBus, "emit");

      const result = await notificationService.sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        body: "Test body",
      });

      expect(result.success).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith(EVENTS.NOTIFICATION_CREATED, expect.any(Object));
    });

    it("should handle email sending errors", async () => {
      const emitSpy = vi.spyOn(eventBus, "emit");
      emitSpy.mockRejectedValueOnce(new Error("Event bus error"));

      const result = await notificationService.sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        body: "Test body",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("sendInApp", () => {
    it("should create in-app notification", async () => {
      const result = await notificationService.sendInApp({
        userId: 1,
        title: "Test Notification",
        content: "Test content",
        type: "info",
      });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();
    });

    it("should emit notification created event", async () => {
      const emitSpy = vi.spyOn(eventBus, "emit");

      await notificationService.sendInApp({
        userId: 1,
        title: "Test Notification",
        content: "Test content",
        type: "success",
      });

      expect(emitSpy).toHaveBeenCalledWith(EVENTS.NOTIFICATION_CREATED, expect.any(Object));
    });
  });

  describe("send", () => {
    it("should send email notification", async () => {
      const result = await notificationService.send("email", {
        to: "test@example.com",
        subject: "Test",
        body: "Test",
      });

      expect(result.success).toBe(true);
    });

    it("should send in-app notification", async () => {
      const result = await notificationService.send("in_app", {
        userId: 1,
        title: "Test",
        content: "Test",
        type: "info",
      });

      expect(result.success).toBe(true);
    });

    it("should reject unknown notification type", async () => {
      const result = await notificationService.send("unknown" as any, {} as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown notification type");
    });
  });

  describe("sendBulk", () => {
    it("should send multiple notifications", async () => {
      const notifications = [
        { to: "test1@example.com", subject: "Test 1", body: "Body 1" },
        { to: "test2@example.com", subject: "Test 2", body: "Body 2" },
      ];

      const result = await notificationService.sendBulk("email", notifications);

      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("should track failed notifications", async () => {
      const notifications = [
        { to: "test1@example.com", subject: "Test 1", body: "Body 1" },
        { to: "test2@example.com", subject: "Test 2", body: "Body 2" },
      ];

      const result = await notificationService.sendBulk("email", notifications);

      expect(result.sent + result.failed).toBe(notifications.length);
    });
  });
});

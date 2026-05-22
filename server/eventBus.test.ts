import { describe, it, expect, beforeEach } from 'vitest';
import { eventBus, EVENTS } from './eventBus';

describe('Event Bus', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  describe('subscribe and emit', () => {
    it('should call listener when event is emitted', async () => {
      let called = false;
      let receivedData: any = null;

      eventBus.subscribe('test:event', (data) => {
        called = true;
        receivedData = data;
      });

      await eventBus.emit('test:event', { message: 'hello' });

      expect(called).toBe(true);
      expect(receivedData).toEqual({ message: 'hello' });
    });

    it('should call multiple listeners for same event', async () => {
      const calls: any[] = [];

      eventBus.subscribe('test:event', (data) => calls.push(data));
      eventBus.subscribe('test:event', (data) => calls.push(data));

      await eventBus.emit('test:event', { id: 1 });

      expect(calls).toHaveLength(2);
      expect(calls[0]).toEqual({ id: 1 });
      expect(calls[1]).toEqual({ id: 1 });
    });

    it('should not call listener after unsubscribe', async () => {
      let called = false;

      const unsubscribe = eventBus.subscribe('test:event', () => {
        called = true;
      });

      unsubscribe();
      await eventBus.emit('test:event', {});

      expect(called).toBe(false);
    });
  });

  describe('once', () => {
    it('should only call listener once', async () => {
      let callCount = 0;

      eventBus.once('test:event', () => {
        callCount++;
      });

      await eventBus.emit('test:event', {});
      await eventBus.emit('test:event', {});

      expect(callCount).toBe(1);
    });
  });

  describe('getListenerCount', () => {
    it('should return correct listener count', () => {
      eventBus.subscribe('test:event', () => {});
      eventBus.subscribe('test:event', () => {});

      expect(eventBus.getListenerCount('test:event')).toBe(2);
    });

    it('should return 0 for event with no listeners', () => {
      expect(eventBus.getListenerCount('nonexistent:event')).toBe(0);
    });
  });

  describe('getEventTypes', () => {
    it('should return all event types with listeners', () => {
      eventBus.subscribe('event:one', () => {});
      eventBus.subscribe('event:two', () => {});

      const types = eventBus.getEventTypes();
      expect(types).toContain('event:one');
      expect(types).toContain('event:two');
      expect(types.length).toBe(2);
    });
  });

  describe('getHistory', () => {
    it('should return event history', async () => {
      await eventBus.emit('test:event', { id: 1 });
      await eventBus.emit('test:event', { id: 2 });

      const history = eventBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].data).toEqual({ id: 1 });
      expect(history[1].data).toEqual({ id: 2 });
    });

    it('should filter history by event type', async () => {
      await eventBus.emit('event:one', { id: 1 });
      await eventBus.emit('event:two', { id: 2 });
      await eventBus.emit('event:one', { id: 3 });

      const history = eventBus.getHistory('event:one');
      expect(history).toHaveLength(2);
      expect(history[0].data).toEqual({ id: 1 });
      expect(history[1].data).toEqual({ id: 3 });
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await eventBus.emit('test:event', { id: i });
      }

      const history = eventBus.getHistory(undefined, 5);
      expect(history).toHaveLength(5);
    });
  });

  describe('Standard event types', () => {
    it('should have all required event types defined', () => {
      expect(EVENTS.WEBHOOK_RECEIVED).toBe('webhook:received');
      expect(EVENTS.EVENT_CREATED).toBe('event:created');
      expect(EVENTS.WORKFLOW_EXECUTION_STARTED).toBe('workflow:execution:started');
      expect(EVENTS.JOB_QUEUED).toBe('job:queued');
      expect(EVENTS.NOTIFICATION_CREATED).toBe('notification:created');
    });
  });
});

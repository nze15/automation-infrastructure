import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { verifyWebhookSignature } from './webhookService';

describe('Webhook Service', () => {
  describe('verifyWebhookSignature', () => {
    it('should verify a valid webhook signature', () => {
      const payload = 'test payload';
      const secret = 'test-secret';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const result = verifyWebhookSignature(payload, signature, secret);
      expect(result).toBe(true);
    });

    it('should reject an invalid webhook signature', () => {
      const payload = 'test payload';
      const secret = 'test-secret';
      const invalidSignature = 'invalid-signature';

      const result = verifyWebhookSignature(payload, invalidSignature, secret);
      expect(result).toBe(false);
    });

    it('should reject a signature with wrong secret', () => {
      const payload = 'test payload';
      const secret = 'test-secret';
      const wrongSecret = 'wrong-secret';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const result = verifyWebhookSignature(payload, signature, wrongSecret);
      expect(result).toBe(false);
    });

    it('should handle JSON payloads correctly', () => {
      const payload = JSON.stringify({ event: 'user.created', userId: 123 });
      const secret = 'test-secret';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const result = verifyWebhookSignature(payload, signature, secret);
      expect(result).toBe(true);
    });
  });
});

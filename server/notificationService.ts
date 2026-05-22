/**
 * Notification Service
 * 
 * Handles sending notifications via email and in-app dashboard
 */

import { createNotification } from './db';
import { eventBus, EVENTS } from './eventBus';

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface InAppNotification {
  userId: number;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

class NotificationService {
  /**
   * Send email notification
   */
  async sendEmail(notification: EmailNotification): Promise<{ success: boolean; error?: string }> {
    try {
      // In a production system, integrate with email service (SendGrid, Mailgun, etc.)
      // For now, log to console
      console.log('[Email] Sending email notification:', {
        to: notification.to,
        subject: notification.subject,
      });

      // Emit email sent event
      await eventBus.emit(EVENTS.NOTIFICATION_CREATED, {
        type: 'email',
        to: notification.to,
        subject: notification.subject,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Email] Error sending email:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send in-app notification
   */
  async sendInApp(notification: InAppNotification): Promise<{ success: boolean; notificationId?: number; error?: string }> {
    try {
      // Create notification record in database
      const result = await createNotification({
        userId: notification.userId,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        isRead: false,
        createdAt: new Date(),
      });

      const notificationId = (result as any).insertId;

      // Emit notification created event
      await eventBus.emit(EVENTS.NOTIFICATION_CREATED, {
        type: 'in_app',
        notificationId,
        userId: notification.userId,
        title: notification.title,
        timestamp: new Date(),
      });

      console.log('[InApp] Notification created:', notificationId);

      return { success: true, notificationId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[InApp] Error creating notification:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send notification (auto-detect type)
   */
  async send(
    type: 'email' | 'in_app',
    notification: EmailNotification | InAppNotification
  ): Promise<{ success: boolean; notificationId?: number; error?: string }> {
    if (type === 'email') {
      return this.sendEmail(notification as EmailNotification);
    } else if (type === 'in_app') {
      return this.sendInApp(notification as InAppNotification);
    }
    return { success: false, error: 'Unknown notification type' };
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(
    type: 'email' | 'in_app',
    notifications: (EmailNotification | InAppNotification)[]
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      const result = await this.send(type, notification);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { success: failed === 0, sent, failed };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

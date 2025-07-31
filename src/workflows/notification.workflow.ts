import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as notificationActivities from '../activities/notification.activity';

const notification = proxyActivities<typeof notificationActivities>({
  startToCloseTimeout: '1 minute',
  retry: { maximumAttempts: 3 },
});

/**
 * Processes pending notifications every 60 seconds.
 */
export async function processNotificationsWorkflow(): Promise<void> {
  while (true) {
    const correlationId = `notif-${Date.now()}`;

    try {
      const pending = await notification.getPendingNotifications();

      if (!pending.length) {
        console.info(`[Notification Workflow][${correlationId}] No pending notifications`);
      }

      for (const notif of pending) {
        try {
          await notification.sendNotification(notif.phone, notif.message);
          await notification.markNotificationAsSent(notif.id);

          console.info(
            `[Notification Workflow][${correlationId}] Sent & marked notification ${notif.id}`
          );
        } catch (error: any) {
          console.error(
            `[Notification Workflow][${correlationId}] Failed to send notification ${notif.id}: ${error.message}`
          );
        }
      }
    } catch (error: any) {
      console.error(
        `[Notification Workflow][${correlationId}] Error fetching notifications: ${error.message}`
      );
    }

    await sleep('60 seconds'); // Every 1 min
  }
}

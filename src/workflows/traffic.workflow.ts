import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as dbActivities from '../activities/db.activity';
import type * as trafficActivities from '../activities/traffic.activity';
import type * as aiActivities from '../activities/ai.activity';

const db = proxyActivities<typeof dbActivities>({
  startToCloseTimeout: '1 minute',
  retry: { maximumAttempts: 3, backoffCoefficient: 2 },
});

const traffic = proxyActivities<typeof trafficActivities>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 5, backoffCoefficient: 2 },
});

const ai = proxyActivities<typeof aiActivities>({
  startToCloseTimeout: '1 minute',
  retry: { maximumAttempts: 2, backoffCoefficient: 2 },
});

/**
 * Monitors traffic for active deliveries every 5 minutes.
 * If delay changes, queues a notification for the notification workflow.
 */
export async function monitorTrafficWorkflow(): Promise<void> {
  while (true) {
    const correlationId = `traffic-${Date.now()}`;

    try {
      const deliveries = await db.getDeliveriesNeedingTrafficCheck();
      console.info(
        `[Traffic Workflow][${correlationId}] Found ${deliveries.length} deliveries to check`
      );

      for (const delivery of deliveries) {
        try {
          const { delayMinutes } = await traffic.getTrafficDelay(
            delivery.origin,
            delivery.destination
          );

          let message: string | null = null;

          if (delayMinutes > delivery.lastKnownDelay) {
            message = await ai.generateIncreasedDelayMessage(delivery.customerName, delayMinutes);
          } else if (delayMinutes < delivery.lastKnownDelay && delayMinutes > 0) {
            message = await ai.generateReducedDelayMessage(delivery.customerName, delayMinutes);
          } else if (delayMinutes === 0 && delivery.lastKnownDelay > 0) {
            message = await ai.generateClearDelayMessage(delivery.customerName);
          }

          if (message) {
            await db.createOrReplaceNotification({
              deliveryId: delivery.id,
              phone: delivery.contact,
              message,
            });
          }

          await db.updateDeliveryDelay(delivery.id, delayMinutes);
          console.info(
            `[Traffic Workflow][${correlationId}] Delivery ${delivery.id} delay updated to ${delayMinutes} min`
          );
        } catch (err: any) {
          console.error(
            `[Traffic Workflow][${correlationId}] Error processing delivery ${delivery.id}: ${err.message}`
          );
        }
      }
    } catch (err: any) {
      console.error(`[Traffic Workflow][${correlationId}] Cycle error: ${err.message}`);
    }

    await sleep('300 seconds'); // Every 5 minutes
  }
}

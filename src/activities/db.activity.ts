import { Delivery } from '../models/delivery.model';
import { Notification } from '../models/notification.model';

/**
 * Updates the last known traffic delay for a delivery.
 */
export async function updateDeliveryDelay(deliveryId: string, delayMinutes: number): Promise<void> {
  try {
    await Delivery.update({ lastKnownDelay: delayMinutes }, { where: { id: deliveryId } });
    console.info(`[DB Activity] delay update: deliveryId=${deliveryId}, delay=${delayMinutes}min`);
  } catch (err: any) {
    console.error(
      `[DB Activity] updateDeliveryDelay failed: deliveryId=${deliveryId}, error=${err.message}`
    );
    throw err;
  }
}

/**
 * Fetch deliveries still needing traffic checks.
 * Only returns indexed, minimal fields to reduce load.
 */
export async function getDeliveriesNeedingTrafficCheck(): Promise<Delivery[]> {
  try {
    const deliveries = await Delivery.findAll({
      where: { delivered: false },
    });

    console.info(`[DB Activity] traffic-check: ${deliveries.length} deliveries`);
    return deliveries.map((d) => ({
      id: d.id,
      origin: d.origin,
      destination: d.destination,
      contact: d.contact,
      lastKnownDelay: d.lastKnownDelay,
    })) as Delivery[];
  } catch (err: any) {
    console.error(`[DB Activity] getDeliveriesNeedingTrafficCheck failed: ${err.message}`);
    throw err; // Let Temporal retry
  }
}

/**
 * Creates or replaces a notification for a delivery.
 * Always resets delivered=false on create/update.
 */
export async function createOrReplaceNotification(data: {
  deliveryId: string;
  phone: string;
  message: string;
}): Promise<Notification> {
  try {
    const [notification, created] = await Notification.upsert(
      {
        deliveryId: data.deliveryId,
        phone: data.phone,
        message: data.message,
        delivered: false,
      },
      { returning: true }
    );

    console.info(
      `[DB Activity] notification ${created ? 'created' : 'updated'}: deliveryId=${data.deliveryId}`
    );
    return notification;
  } catch (err: any) {
    console.error(
      `[DB Activity] createOrReplaceNotification failed: deliveryId=${data.deliveryId}, error=${err.message}`
    );
    throw err;
  }
}

/**
 * Returns all notifications not yet sent.
 */
export async function getPendingNotifications(): Promise<Notification[]> {
  try {
    const pending = await Notification.findAll({
      where: { delivered: false },
      order: [['createdAt', 'ASC']],
    });
    console.info(`[DB Activity] pending notifications: ${pending.length}`);
    return pending;
  } catch (err: any) {
    console.error(`[DB Activity] getPendingNotifications failed: ${err.message}`);
    throw err;
  }
}

/**
 * Marks a notification as sent.
 */
export async function markNotificationAsSent(id: string): Promise<void> {
  try {
    await Notification.update({ delivered: true }, { where: { id } });
    console.info(`[DB Activity] notification marked sent: id=${id}`);
  } catch (err: any) {
    console.error(`[DB Activity] markNotificationAsSent failed: id=${id}, error=${err.message}`);
    throw err;
  }
}

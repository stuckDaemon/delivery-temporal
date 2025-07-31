import Twilio from 'twilio';
import * as dotenv from 'dotenv';
import { Notification } from '../models/notification.model';

dotenv.config();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.warn('[Notification Activity] Missing Twilio configuration. SMS sending will fail.');
}

const client =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

const fromNumber = TWILIO_PHONE_NUMBER || '';

/**
 * Queues a notification for later sending.
 */
export async function queueNotification(
  deliveryId: string,
  phone: string,
  message: string
): Promise<Notification> {
  const notification = await Notification.create({
    deliveryId,
    phone: phone.trim(),
    message: message.trim(),
    delivered: false,
  });

  console.info(`[Notification Activity] Queued notification for ${phone}`);
  return notification;
}

/**
 * Creates or replaces a notification for a given delivery.
 * Always resets `delivered=false` to ensure retry if needed.
 */
export async function createOrReplaceNotification(data: {
  deliveryId: string;
  phone: string;
  message: string;
}): Promise<Notification> {
  const [notification, created] = await Notification.upsert(
    {
      deliveryId: data.deliveryId,
      phone: data.phone.trim(),
      message: data.message.trim(),
      delivered: false,
    },
    { returning: true }
  );

  console.info(
    `[Notification Activity] Notification for delivery ${data.deliveryId} ${created ? 'created' : 'updated'}`
  );
  return notification;
}

/**
 * Fetch all notifications that have not yet been sent.
 */
export async function getPendingNotifications(): Promise<Notification[]> {
  return Notification.findAll({ where: { delivered: false }, order: [['createdAt', 'ASC']] });
}

/**
 * Marks a notification as sent in the DB.
 */
export async function markNotificationAsSent(id: string): Promise<void> {
  await Notification.update({ delivered: true }, { where: { id } });
  console.info(`[Notification Activity] Marked notification ${id} as sent`);
}

/**
 * Sends an SMS notification via Twilio.
 */
export async function sendNotification(to: string, message: string): Promise<boolean> {
  if (!client || !fromNumber) {
    console.error('[Notification Activity] Twilio not configured. Cannot send SMS.');
    return false;
  }

  try {
    const result = await client.messages.create({
      body: message.trim(),
      from: fromNumber,
      to: to.trim(),
    });

    console.info(`[Notification Activity] Sent to ${to} (SID: ${result.sid})`);
    return true;
  } catch (err: any) {
    console.error(`[Notification Activity] Failed to send to ${to}: ${err.message}`);
    return false; // allows retry mechanism to catch this
  }
}

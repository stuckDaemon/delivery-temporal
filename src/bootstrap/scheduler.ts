import { Connection, WorkflowClient } from '@temporalio/client';
import { ENV } from '../config/env';

async function createSchedules() {
  const connection = await Connection.connect();
  const client = new WorkflowClient({ connection });

  try {
    // Start (or restart) monitorTrafficWorkflow with cron
    await client.start('monitorTrafficWorkflow', {
      workflowId: ENV.WORKFLOW.TRAFFIC,
      taskQueue: 'FREIGHT_TASK_QUEUE',
      cronSchedule: '*/1 * * * *', // every N minutes
    });
    console.log('[Cron Scheduler] - Started scheduled workflow: monitorTrafficWorkflow');
  } catch (err: any) {
    console.error('[Cron Scheduler] - Failed to start monitorTrafficWorkflow:', err.message || err);
  }

  try {
    // Start (or restart) processNotificationsWorkflow with cron
    await client.start('processNotificationsWorkflow', {
      workflowId: ENV.WORKFLOW.NOTIFICATION,
      taskQueue: 'FREIGHT_TASK_QUEUE',
      cronSchedule: '*/1 * * * *', // every N minutes
    });
    console.log('[Cron Scheduler] - Started scheduled workflow: processNotificationsWorkflow');
  } catch (err: any) {
    console.error(
      '[Cron Scheduler] - Failed to start processNotificationsWorkflow:',
      err.message || err
    );
  }

  await connection.close();
}

createSchedules().catch((err) => {
  console.error('[Cron Scheduler] - Schedule bootstrap failed:', err);
  process.exit(1);
});

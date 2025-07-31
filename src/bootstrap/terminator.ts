import { Connection, WorkflowClient } from '@temporalio/client';
import { ENV } from '../config/env';

async function terminateSchedules() {
  const connection = await Connection.connect();
  const client = new WorkflowClient({ connection });

  try {
    const monitorHandle = client.getHandle(ENV.WORKFLOW.TRAFFIC);
    await monitorHandle.terminate('Terminated by admin');
    console.log('[Cron Scheduler] - Terminated monitor-traffic-workflow');
  } catch (err: any) {
    console.error(
      '[Cron Scheduler] - Failed to terminate monitor-traffic-workflow:',
      err.message || err
    );
  }

  try {
    const notificationsHandle = client.getHandle(ENV.WORKFLOW.NOTIFICATION);
    await notificationsHandle.terminate('Terminated by admin');
    console.log('[Cron Scheduler] - Terminated process-notifications-workflow');
  } catch (err: any) {
    console.error(
      '[Cron Scheduler] - Failed to terminate process-notifications-workflow:',
      err.message || err
    );
  }

  await connection.close();
}

terminateSchedules().catch((err) => {
  console.error('Termination script failed:', err);
  process.exit(1);
});

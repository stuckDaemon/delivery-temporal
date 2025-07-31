import { Worker } from '@temporalio/worker';
import path from 'path';
import { connectDb } from '../config/database';

async function run() {
  await connectDb(); // just connect, no schema sync

  const workflowsPath = path.resolve(__dirname, '../workflows');
  const worker = await Worker.create({
    workflowsPath,
    taskQueue: 'FREIGHT_TASK_QUEUE',
  });

  console.log('🚀 Worker started');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

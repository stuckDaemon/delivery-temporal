import path from 'path';
import { Worker } from '@temporalio/worker';
import { connectDb } from '../config/database';

const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'FREIGHT_TASK_QUEUE';
const WORKFLOWS_PATH = path.resolve(__dirname, './workflows');

async function runWorker() {
  try {
    console.log(`[Worker] Connecting to database...`);
    await connectDb();
    console.log(`[Worker] ✅ Database connection established.`);

    const worker = await Worker.create({
      workflowsPath: WORKFLOWS_PATH,
      taskQueue: TASK_QUEUE,
      // If you have direct activity functions, you can register them here
      // activities: require('./activities'),
    });

    console.log(`🚀 Worker ready [queue=${TASK_QUEUE}, pid=${process.pid}]`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`[Worker] ${signal} received. Shutting down gracefully...`);
      try {
        await worker.shutdown();
        console.log(`[Worker] Shutdown complete.`);
      } catch (err) {
        console.error(`[Worker] Error during shutdown:`, err);
      } finally {
        process.exit(0);
      }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    await worker.run();
  } catch (err: any) {
    console.error(`[Worker] ❌ Fatal error: ${err.message}`, err);
    process.exit(1);
  }
}

runWorker();

import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { Connection, Client } from '@temporalio/client';

const IMPORT_FOLDER = path.resolve('./imports/deliveries');
const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'FREIGHT_TASK_QUEUE';
const WORKFLOW_NAME = 'importDeliveriesWorkflow';

/**
 * Ensures the import directory exists.
 */
async function ensureImportFolder() {
  await fs.mkdir(IMPORT_FOLDER, { recursive: true });
}

/**
 * Process a detected file — rename it and start the import workflow.
 */
async function handleNewFile(filePath: string, client: Client) {
  const baseName = path.basename(filePath);

  // Avoid re-processing
  if (baseName.startsWith('imported_')) {
    console.log(`⏩ Skipping already imported file: ${baseName}`);
    return;
  }

  console.log(`📂 New file detected: ${baseName}`);

  const renamedPath = path.join(IMPORT_FOLDER, `imported_${baseName}`);

  try {
    await fs.rename(filePath, renamedPath);
  } catch (err) {
    console.error(`❌ Failed to rename ${baseName}:`, err);
    return;
  }

  try {
    console.log(`🌀 Starting workflow for ${renamedPath}`);
    await client.workflow.start(WORKFLOW_NAME, {
      taskQueue: TASK_QUEUE,
      args: [renamedPath],
      workflowId: `import-${Date.now()}`, // unique per import
    });
  } catch (err) {
    console.error(`❌ Failed to start workflow for ${renamedPath}:`, err);
  }
}

/**
 * Start watching for delivery import files.
 */
async function startWatcher() {
  await ensureImportFolder();

  const connection = await Connection.connect();
  const client = new Client({ connection });

  const watcher = chokidar.watch(IMPORT_FOLDER, { ignoreInitial: true });

  watcher.on('add', async (filePath) => {
    try {
      await handleNewFile(filePath, client);
    } catch (err) {
      console.error(`❌ Error processing file ${filePath}:`, err);
    }
  });

  console.log(`👀 Watching folder: ${IMPORT_FOLDER}`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[Watcher] ${signal} received. Stopping watcher...`);
    try {
      await watcher.close();
      await connection.close();
      console.log(`[Watcher] Shutdown complete.`);
    } catch (err) {
      console.error(`[Watcher] Error during shutdown:`, err);
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startWatcher().catch((err) => {
  console.error(`❌ Watcher failed:`, err);
  process.exit(1);
});

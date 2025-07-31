import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { Connection, Client } from '@temporalio/client';

const IMPORT_FOLDER = path.resolve('./imports/deliveries');

async function startWatcher() {
  await fs.mkdir(IMPORT_FOLDER, { recursive: true });

  const connection = await Connection.connect();
  const client = new Client({ connection });

  chokidar.watch(IMPORT_FOLDER, { ignoreInitial: true }).on('add', async (filePath) => {
    const base = path.basename(filePath);
    if (base.startsWith('imported_')) {
      console.log(`⏩ Skipping already imported file: ${base}`);
      return;
    }

    console.log(`📂 Detected new file: ${filePath}`);

    const newName = path.join(IMPORT_FOLDER, `imported_${base}`);
    await fs.rename(filePath, newName);

    console.log(`🌀 Starting workflow for ${newName}`);
    await client.workflow.start('importDeliveriesWorkflow', {
      taskQueue: 'FREIGHT_TASK_QUEUE',
      args: [newName],
      workflowId: `import-${Date.now()}`,
    });
  });

  console.log(`👀 Watching folder: ${IMPORT_FOLDER}`);
}

startWatcher().catch((err) => {
  console.error('❌ Watcher failed', err);
  process.exit(1);
});

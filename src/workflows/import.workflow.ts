import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/import.activity';

const { alreadyImported, parseAndSaveCsv, markAsImported } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 2 },
});

/**
 * Imports deliveries from a CSV file.
 * Skips import if the file has already been processed.
 */
export async function importDeliveriesWorkflow(filePath: string): Promise<void> {
  if (!filePath) {
    throw new Error('[Import Workflow] filePath is required.');
  }

  try {
    const imported = await alreadyImported(filePath);
    if (imported) {
      console.info(`[Import Workflow] Skipping ${filePath}, already imported.`);
      return;
    }

    await parseAndSaveCsv(filePath);
    await markAsImported(filePath);

    console.info(`[Import Workflow] ✅ Successfully imported deliveries from ${filePath}`);
  } catch (err: any) {
    console.error(`[Import Workflow] ❌ Failed to import ${filePath}: ${err.message}`);
    throw err; // Let Temporal retries handle it
  }
}

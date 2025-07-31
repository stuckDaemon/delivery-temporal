import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/import.activity';

const { alreadyImported, parseAndSaveCsv, markAsImported } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export async function importDeliveriesWorkflow(filePath: string): Promise<void> {
  const imported = await alreadyImported(filePath);
  if (imported) {
    console.log(`Skipping ${filePath}, already imported`);
    return;
  }

  await parseAndSaveCsv(filePath);
  await markAsImported(filePath);
}

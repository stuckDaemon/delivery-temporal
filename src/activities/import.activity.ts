import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Delivery } from '../models/delivery.model';

export async function alreadyImported(filePath: string): Promise<boolean> {
  return path.basename(filePath).startsWith('imported_');
}

export async function parseAndSaveCsv(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const deliveries: Partial<Delivery>[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        deliveries.push({
          customerName: row.customerName,
          contact: row.contact,
          origin: row.origin,
          destination: row.destination,
        });
      })
      .on('end', async () => {
        if (deliveries.length > 0) {
          await Delivery.bulkCreate(deliveries);
        }
        console.log(`✅ Imported ${deliveries.length} deliveries from ${filePath}`);
        resolve();
      })
      .on('error', reject);
  });
}

export async function markAsImported(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const newPath = path.join(dir, `imported_${base}`);
  await fs.promises.rename(filePath, newPath);
}

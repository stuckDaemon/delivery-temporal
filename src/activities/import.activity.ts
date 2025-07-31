import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Delivery } from '../models/delivery.model';

export async function alreadyImported(filePath: string): Promise<boolean> {
  return path.basename(filePath).startsWith('imported_');
}

/**
 * Parses a CSV file and stores valid deliveries in the DB.
 * Returns the number of rows successfully imported.
 */
export async function parseAndSaveCsv(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const deliveries: Partial<Delivery>[] = [];

    // Defensive: check if file exists
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`[Import Activity] File not found: ${filePath}`));
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Basic validation: all fields must be present
        if (!row.customerName || !row.contact || !row.origin || !row.destination) {
          console.warn(`[Import Activity] Skipping invalid row: ${JSON.stringify(row)}`);
          return;
        }

        deliveries.push({
          customerName: String(row.customerName).trim(),
          contact: String(row.contact).trim(),
          origin: String(row.origin).trim(),
          destination: String(row.destination).trim(),
        });
      })
      .on('end', async () => {
        try {
          if (deliveries.length > 0) {
            await Delivery.bulkCreate(deliveries, { validate: true });
            console.info(
              `[Import Activity] Imported ${deliveries.length} deliveries from ${filePath}`
            );
          } else {
            console.warn(`[Import Activity] No valid rows found in ${filePath}`);
          }
          resolve(deliveries.length);
        } catch (dbErr: any) {
          console.error(`[Import Activity] DB insert failed for ${filePath}: ${dbErr.message}`);
          reject(dbErr);
        }
      })
      .on('error', (err) => {
        console.error(`[Import Activity] CSV read error for ${filePath}: ${err.message}`);
        reject(err);
      });
  });
}

/**
 * Renames the CSV file to mark it as imported.
 */
export async function markAsImported(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const newPath = path.join(dir, `imported_${base}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`[Import Activity] Cannot mark as imported: file not found ${filePath}`);
  }

  try {
    await fs.promises.rename(filePath, newPath);
    console.info(`[Import Activity] File marked as imported: ${newPath}`);
  } catch (err: any) {
    console.error(`[Import Activity] Failed to rename ${filePath} → ${newPath}: ${err.message}`);
    throw err;
  }
}

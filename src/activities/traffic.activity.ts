import { httpClient } from '../api/utils/http';
import * as dotenv from 'dotenv';

dotenv.config();

export interface TrafficDelayResult {
  delayMinutes: number;
  rawData?: any;
}

const MAPBOX_BASE_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';

/**
 * Retrieves the estimated traffic delay in minutes for the given origin/destination.
 * Falls back to mock mode when USE_MOCK_TRAFFIC=true.
 */
export async function getTrafficDelay(
  origin: string,
  destination: string
): Promise<TrafficDelayResult> {
  const useMock = process.env.USE_MOCK_TRAFFIC === 'true';

  // --- MOCK MODE ---
  if (useMock) {
    const delayMinutes = Math.floor(Math.random() * 60);
    console.info(`[Traffic Activity] [MOCK] ${origin} → ${destination}: ${delayMinutes} min`);
    return { delayMinutes, rawData: { mock: true } };
  }

  // --- REAL API MODE ---
  if (!process.env.MAPBOX_TOKEN) {
    console.error('[Traffic Activity] MAPBOX_TOKEN is missing. Cannot fetch traffic delay.');
    throw new Error('MAPBOX_TOKEN not set');
  }

  try {
    const coordinates = `${origin};${destination}`;
    const url = `${MAPBOX_BASE_URL}/${coordinates}?access_token=${process.env.MAPBOX_TOKEN}&overview=false&annotations=duration`;

    const data = await httpClient.get<any>(url);
    const durationInSeconds = data.routes?.[0]?.duration ?? 0;
    const delayMinutes = Math.max(0, Math.round(durationInSeconds / 60));

    console.info(`[Traffic Activity] ${origin} → ${destination}: ${delayMinutes} min delay`);
    return { delayMinutes, rawData: data };
  } catch (err: any) {
    console.error(
      `[Traffic Activity] Failed to fetch delay for ${origin} → ${destination}: ${err.message}`
    );
    throw err; // Let Temporal or the scheduler retry
  }
}

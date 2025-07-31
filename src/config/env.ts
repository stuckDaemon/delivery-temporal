import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  DB: {
    HOST: process.env.DB_HOST || '',
    PORT: Number(process.env.DB_PORT) || 0,
    USERNAME: process.env.DB_USERNAME || '',
    PASSWORD: process.env.DB_PASSWORD || '',
    NAME: process.env.DB_NAME || '',
  },
  TEMPORAL: {
    ADDRESS: process.env.TEMPORAL_ADDRESS || '',
  },
  API: {
    PORT: Number(process.env.PORT) || 3000,
  },
  WORKFLOW: {
    TRAFFIC: 'monitor-traffic-workflow',
    NOTIFICATION: 'process-notifications-workflow',
  },
};

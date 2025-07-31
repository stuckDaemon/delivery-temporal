import { Sequelize } from 'sequelize-typescript';
import { ENV } from './env';
import { Delivery } from '../models/delivery.model';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: ENV.DB.HOST,
  port: ENV.DB.PORT,
  username: ENV.DB.USERNAME,
  password: ENV.DB.PASSWORD,
  database: ENV.DB.NAME,
  logging: false,
  models: [Delivery],
});

/**
 * Initialize DB for API service (runs migrations)
 */
export async function initDb() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // Keep schema updated without data loss
    await sequelize.sync({ alter: true });
    console.log('✅ DB synced');
  } catch (err) {
    console.error('❌ DB init failed', err);
    process.exit(1);
  }
}

/**
 * Lightweight DB connect for workers (no migrations)
 */
export async function connectDb() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected (worker)');
  } catch (err) {
    console.error('❌ DB connect failed (worker)', err);
    process.exit(1);
  }
}

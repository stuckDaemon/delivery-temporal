import express from 'express';
import { initDb } from '../config/database';
import deliveryRoutes from './routes/delivery.routes';
import { ENV } from '../config/env';

const app = express();
app.use(express.json());

// Routes
app.use('/deliveries', deliveryRoutes);

async function startServer() {
  try {
    await initDb();
    console.log('✅ Database connected');

    const server = app.listen(ENV.API.PORT, () =>
      console.log(`🚀 API running on port ${ENV.API.PORT}`)
    );

    // Graceful shutdown
    const shutdown = () => {
      console.log('🛑 Shutting down API...');
      server.close(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('❌ Failed to start server', err);
    process.exit(1);
  }
}

// Global unhandled error handling
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

startServer();

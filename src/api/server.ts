import express from 'express';
import { initDb } from '../config/database';
import deliveryRoutes from './routes/delivery.routes';
import { ENV } from '../config/env';

const app = express();
app.use(express.json());

app.use('/deliveries', deliveryRoutes);

(async () => {
    await initDb();
    app.listen(ENV.API.PORT, () =>
        console.log(`🚀 API running on port ${ENV.API.PORT}`)
    );
})();

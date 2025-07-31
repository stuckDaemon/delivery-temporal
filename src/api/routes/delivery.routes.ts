import { Router } from 'express';
import { BulkDeliveryDTO } from '../dto/delivery.dto';
import { DeliveryService } from '../services/delivery.service';
import { handleError, ApiError } from '../utils/errors';

const router = Router();

router.post('/import', async (req, res) => {
  try {
    const parseResult = BulkDeliveryDTO.safeParse(req.body);

    if (!parseResult.success) {
      throw new ApiError(400, parseResult.error.message);
    }

    const deliveries = await DeliveryService.createMany(parseResult.data);
    res.status(201).json({ count: deliveries.length, message: 'Deliveries imported successfully' });
  } catch (err) {
    handleError(err, res);
  }
});

export default router;

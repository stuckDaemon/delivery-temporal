import { Router } from 'express';
import { BulkDeliveryDTO } from '../dto/delivery.dto';
import { DeliveryService } from '../services/delivery.service';
import { handleError, ApiError } from '../utils/errors';

const router = Router();

/**
 * Imports multiple deliveries in bulk.
 */
router.post('/import', async (req, res) => {
  try {
    const parseResult = BulkDeliveryDTO.safeParse(req.body);

    if (!parseResult.success) {
      throw new ApiError(400, `Validation failed: ${parseResult.error.message}`);
    }

    const deliveries = await DeliveryService.createMany(parseResult.data);
    return res.status(201).json({
      count: deliveries.length,
      message: 'Deliveries imported successfully',
    });
  } catch (err) {
    return handleError(err, res);
  }
});

/**
 * Marks one or more deliveries as delivered.
 */
router.post('/mark-delivered', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, 'Invalid or missing delivery IDs');
    }

    const updatedCount = await DeliveryService.markDeliveriesAsDelivered(ids);
    return res.json({
      success: true,
      updatedCount,
    });
  } catch (err) {
    return handleError(err, res);
  }
});

export default router;

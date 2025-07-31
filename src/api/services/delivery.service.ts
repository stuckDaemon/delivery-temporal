import { Delivery } from '../../models/delivery.model';
import { DeliveryInput } from '../dto/delivery.dto';
import { ApiError } from '../utils/errors';
import { Transaction } from 'sequelize';

export class DeliveryService {
  /**
   * Creates multiple deliveries in bulk, with validation and transactional safety.
   */
  static async createMany(deliveries: DeliveryInput[]): Promise<Delivery[]> {
    if (!Array.isArray(deliveries) || deliveries.length === 0) {
      throw new ApiError(400, 'No deliveries provided for import');
    }

    return await Delivery.sequelize!.transaction(async (t: Transaction) => {
      const created = await Delivery.bulkCreate(deliveries, {
        validate: true,
        transaction: t,
      });

      if (!created.length) {
        throw new ApiError(500, 'Failed to import deliveries');
      }

      return created;
    });
  }

  /**
   * Marks specified deliveries as delivered.
   * Returns the number of records updated.
   */
  static async markDeliveriesAsDelivered(ids: string[]): Promise<number> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, 'No delivery IDs provided');
    }

    const [updatedCount] = await Delivery.update({ delivered: true }, { where: { id: ids } });

    if (updatedCount === 0) {
      throw new ApiError(404, 'No deliveries found for the provided IDs');
    }

    return updatedCount;
  }
}

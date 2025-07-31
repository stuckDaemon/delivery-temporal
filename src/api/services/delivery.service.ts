import { Delivery } from '../../models/delivery.model';
import { DeliveryInput } from '../dto/delivery.dto';

export class DeliveryService {
  static async createMany(deliveries: DeliveryInput[]) {
    return await Delivery.bulkCreate(deliveries, { validate: true });
  }
}

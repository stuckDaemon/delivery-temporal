import { Delivery } from '../models/delivery.model';

export async function createDelivery(data: any) {
  return Delivery.create(data);
}

export async function getUndelivered() {
  return Delivery.findAll({ where: { delivered: false } });
}

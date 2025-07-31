import { z } from 'zod';

export const DeliveryDTO = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  contact: z.string().min(1, 'Contact is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
});

export const BulkDeliveryDTO = z.array(DeliveryDTO);
export type DeliveryInput = z.infer<typeof DeliveryDTO>;

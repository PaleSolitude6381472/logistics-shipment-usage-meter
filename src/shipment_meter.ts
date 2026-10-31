import { z } from "zod";

export const shipmentEventSchema = z.object({
  customerId: z.string().min(1),
  shipmentId: z.string().min(1),
  kind: z.enum(["picked_up", "delivered", "exception"]),
  proofOfDeliveryFiles: z.number().int().nonnegative(),
});

export type ShipmentEvent = {
  customerId: string;
  shipmentId: string;
  kind: "picked_up" | "delivered" | "exception";
  proofOfDeliveryFiles: number;
};

export function parseShipmentEvent(input: unknown): ShipmentEvent {
  return shipmentEventSchema.parse(input) as ShipmentEvent;
}

export type CustomerUsage = {
  customerId: string;
  shipmentEvents: number;
  proofOfDeliveryFiles: number;
  exceptions: number;
};

export function summarizeCustomerUsage(events: ShipmentEvent[], customerId: string): CustomerUsage {
  const ownEvents = events.filter((event) => event.customerId === customerId);
  return {
    customerId,
    shipmentEvents: ownEvents.length,
    proofOfDeliveryFiles: ownEvents.reduce((total, event) => total + event.proofOfDeliveryFiles, 0),
    exceptions: ownEvents.filter((event) => event.kind === "exception").length,
  };
}

export function shouldFlagForReview(usage: CustomerUsage): boolean {
  return usage.exceptions >= 2 || usage.proofOfDeliveryFiles > 20;
}

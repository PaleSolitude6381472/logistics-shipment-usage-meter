import { InfraiAccountClient } from "./infrai_account.ts";
import { shouldFlagForReview, summarizeCustomerUsage, type ShipmentEvent } from "./shipment_meter.ts";

const events: ShipmentEvent[] = [
  { customerId: "acme-logistics", shipmentId: "s-100", kind: "picked_up", proofOfDeliveryFiles: 0 },
  { customerId: "acme-logistics", shipmentId: "s-100", kind: "delivered", proofOfDeliveryFiles: 2 },
  { customerId: "acme-logistics", shipmentId: "s-101", kind: "exception", proofOfDeliveryFiles: 1 },
];

const usage = summarizeCustomerUsage(events, "acme-logistics");
console.log(JSON.stringify({ usage, reviewRequired: shouldFlagForReview(usage) }, null, 2));

const key = process.env.INFRAI_API_KEY;
if (!key) {
  console.log("Set INFRAI_API_KEY to compare this local ledger with account usage.");
} else {
  const client = new InfraiAccountClient(key);
  const remoteUsage = await client.usage();
  console.log(JSON.stringify({ remoteUsage }, null, 2));
}

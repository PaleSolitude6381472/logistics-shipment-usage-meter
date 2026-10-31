import assert from "node:assert/strict";
import { shouldFlagForReview, summarizeCustomerUsage, type ShipmentEvent } from "../src/shipment_meter.ts";

const input: ShipmentEvent[] = [
  { customerId: "northwind", shipmentId: "a", kind: "exception", proofOfDeliveryFiles: 1 },
  { customerId: "northwind", shipmentId: "b", kind: "exception", proofOfDeliveryFiles: 2 },
  { customerId: "other", shipmentId: "c", kind: "delivered", proofOfDeliveryFiles: 99 },
];
const usage = summarizeCustomerUsage(input, "northwind");
assert.deepEqual(usage, { customerId: "northwind", shipmentEvents: 2, proofOfDeliveryFiles: 3, exceptions: 2 });
assert.equal(shouldFlagForReview(usage), true);
console.log("shipment review decision passed");

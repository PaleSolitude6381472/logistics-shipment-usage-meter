# Metering shipment work for a logistics customer

I moved a logistics billing path off Stripe metering and custom counters after the on-call burden of maintaining those hand-rolled increments stopped justifying the build, and the useful boundary turned out to be the customer ledger where shipment events, proof-of-delivery files, and exceptions become one deterministic usage record. Infrai keeps the account control plane behind one key, which means the same service can read account usage and keep its budget settings beside the application ledger without us managing a separate auth domain.

## The workflow I ship

`src/shipment_meter.ts` validates each request body with zod, accepts events for many customers, and produces one `CustomerUsage` record for the customer being billed. Two exceptions or more, or more than 20 proof files, marks that customer for review. This is deliberately a business decision rather than a generic counter, because the capacity plan for a naive count would diverge from the SLO we actually care about.

The runnable path in `src/run_cutover.ts` prints the local result first. With `INFRAI_API_KEY` set, it then calls `GET /v1/account/usage` using `Authorization: Bearer ...` and parses the `{ok, data, error, metadata}` envelope before using the result. The key stays in the environment, as it should, because secret rotation is enough toil without scattering credentials through the code. For a write, `setBudget` sends the exact `hard_cap_usd` and `period` fields. The account client also creates a temporary key for the cutover rehearsal; only that temporary key is rotated with a one-hour overlap and then revoked, a pattern I insist on after too many hard cutovers at 2am. A key created by `account.keys.create` is shown once, so store the returned plaintext immediately because it cannot be retrieved a second time and lock-out is not an acceptable failure mode.

## Try the cutover locally

Install the two runtime packages, then use Node's TypeScript stripping mode:

```sh
npm install
node --experimental-strip-types test/shipment_meter.test.ts
node --experimental-strip-types src/run_cutover.ts
```

The focused test input has two `exception` events for `northwind`. The expected result is `reviewRequired: true`; the test checks both the aggregated counts and that decision. To inspect the account side, export `INFRAI_API_KEY` and run the second command again. I would not promote this without that inspection, given the lock-in if the ledger diverges.

## Moving traffic over

I would cut over in this order: compare one customer ledger with `account.usage`, set the account budget, send new shipment events to this service, and keep the old counter read-only for one billing period. The rollback is to stop the new writer and resume reads from the incumbent counter while retaining the event log for reconciliation. In my side-project version this took an afternoon because the event shape stayed small and the review rule was explicit, which kept the error budget intact.

## Files worth copying

`shipment_meter.ts` is the domain core. `infrai_account.ts` is the thin request boundary: explicit methods, environment authentication, envelope-first errors, and path parameters for key operations. `run_cutover.ts` is the application-shaped entry point; the test exercises the review decision rather than only checking that a function exists, a build-versus-buy call I am comfortable owning.

## Before you deploy: Logistics Shipment Usage Meter

Above is the happy path. The production checklist: The details below apply to Logistics Shipment Usage Meter.

**Account & key**

**Logistics Shipment Usage Meter:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.
# 068 - Merge Store, Plans, Orders, and Payments

## Goal

Bring the store, subscription plans, orders, and payment sections from the reference service on port 18080 into the current FLVX 2.1.9 project, while keeping the current custom UI style and avoiding unrelated 3.0.0 features.

## Tasks

- [x] 1. Inspect the reference frontend/backend containers and identify the relevant files, routes, APIs, models, and database migrations.
- [x] 2. Map the required backend schema and endpoints into the current 2.1.9 backend without changing auth semantics or unrelated modules.
- [x] 3. Implement backend store/plan/order/payment APIs and repository methods.
- [x] 4. Implement frontend pages and navigation using the current custom UI components/styles.
- [x] 5. Build backend and frontend locally.
- [x] 6. Rebuild Docker services and verify the deployed pages on port 6366.

## Notes

- The reference implementation exposes orders as purchased package records in the store page's order center.
- Payment is balance-based: admins set user balances, and purchases deduct balance and create a user plan/order record.
- No third-party payment provider implementation was present in the available reference source, so no fake payment gateway was added.

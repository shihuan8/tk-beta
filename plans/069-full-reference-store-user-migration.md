# 069 - Full Reference Store and User Migration

## Goal

Move the 18080 reference project's store, plan, order, payment, and user-related frontend/backend functionality into the current project, while restyling the UI to match the current custom FLVX visual system.

## Tasks

- [x] 1. Audit the reference frontend user/store/profile/admin pages and all API/type dependencies.
- [x] 2. Audit the backend requirements behind those pages and identify missing repository/handler/model pieces.
- [x] 3. Port backend user/package/plan/balance/order behavior without unrelated SRT or node-tag features.
- [x] 4. Port frontend pages and navigation, adapting visuals to the current custom UI style.
- [x] 5. Build backend and frontend locally.
- [x] 6. Rebuild Docker services and verify the deployed stack on ports 6365/6366.

## Notes

- Migrated frontend pages: user management, profile center, store, plan management, balance management.
- Migrated backend capabilities: plans, balance, user plan/order list, store status, package permissions, assigning package group to user.
- Purchase creates a user plan/order record, deducts balance, and assigns the bound user group when the plan has one.
- SRT, node tags/groups, and unrelated reference-only modules were intentionally not migrated.

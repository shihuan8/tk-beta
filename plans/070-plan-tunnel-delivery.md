# Plan Tunnel Delivery

- [x] Inspect current package purchase and delivery behavior.
- [x] Add a plan-to-tunnel-group mapping and migrate it.
- [x] Persist selected tunnel groups when creating/updating plans.
- [x] On purchase, expand mapped tunnel groups into tunnels and create missing `user_tunnel` grants with plan quotas.
- [x] Expose tunnel group selection in the plan admin UI.
- [x] Redeploy after backend tests and frontend build pass.

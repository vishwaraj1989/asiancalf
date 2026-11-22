# Asiancalf Production Deployment Readiness Audit

Audit date: 2026-11-01  
Current result: **Not ready for production deployment** until the Critical items below are resolved.

This audit did not deploy services, change DNS, or write to production MongoDB. MongoDB checks were read-only. No secret values are included here.

## Critical

- [ ] **Rotate the MongoDB credential before deployment.** A credentialed MongoDB URI was found in the working copy of `server/.env.example`; that file has been replaced with a local development URI and placeholders. The actual `server/.env` is not present in the Git index. `server/.env.example` is tracked, and the indexed copy did not match the sanitized working copy; the indexed blob itself did not match the credentialed-URI check. Git commands fail because this workspace's `.git` metadata is not recognized as a repository, so commit history could not be verified. Treat the exposed database credential as compromised: rotate the database user's password at the MongoDB provider, set the new URI only in Render's secret environment, update the private local `.env`, and run a secret-history scan before pushing. If the credential was ever pushed, remove it from Git history as well as rotating it.
- [ ] **Configure persistent storage for uploads before relying on product media.** Multer writes to `server/uploads/products`, while Render's service filesystem is ephemeral and `render.yaml` has no disk configured. Attach a persistent disk to the Render Web Service at `/opt/render/project/src/server/uploads` (or verify the resolved path in the live service shell). Back up the existing upload files before attaching it; a mount overlays that directory, so restore the existing files into the mounted disk before serving products that reference them. Render disks require an eligible paid service and constrain the service to one instance with deploy availability tradeoffs. See [Render Persistent Disks](https://render.com/docs/disks).
- [ ] **Set and verify production dashboard variables before the first deployment.** The local repository cannot inspect Vercel or Render dashboard values. In Render, set `MONGO_URI` to the rotated URI for the existing database (including its existing database name), `JWT_SECRET` to a strong newly generated value, `NODE_ENV=production`, and `CLIENT_URL=https://asiancalf.com,https://www.asiancalf.com`. Render supplies `PORT`. In Vercel, set `REACT_APP_API_URL` to the actual Render service base URL, without a trailing slash, then redeploy the frontend. Never put `MONGO_URI` or `JWT_SECRET` in Vercel or any `REACT_APP_` variable.
- [ ] **Deploy and complete the one-time admin setup before login.** The protected `POST /api/auth/admin-setup` endpoint is implemented locally but is not active on Render until this backend code is deployed and `ADMIN_EMAIL` plus a unique `ADMIN_SETUP_SECRET` of at least 32 bytes are set in Render. Call it once over HTTPS with a password of 16–72 UTF-8 bytes, then remove `ADMIN_SETUP_SECRET`. This workspace did not write to production MongoDB.

## Warning

- [x] **Upgrade Multer and verify upload validation.** The backend now resolves Multer `2.5.0`, which includes the current upstream patches. Existing disk storage, endpoint fields, and 2 MB image / 25 MB video file-size limits are preserved. Upload middleware checks exact extension/MIME pairs, limits image count to five, rejects numeric multipart array indexes (not used by the current scalar-field API), and returns 400/413 errors without exposing internal details. Isolated memory-storage tests cover allowed types, MIME mismatches, both size limits, image count, and production error masking. See the [Multer advisories](https://github.com/expressjs/multer/security/advisories/GHSA-535w-7cp7-47q4) and [latest relevant advisory](https://github.com/expressjs/multer/security/advisories/GHSA-q7qp-rjg7-q26m).
- [x] **Review the missing Wishlist index and prepare a safe migration plan.** All 14 expected collections exist in the configured cloud database. The `wishlists` collection lacks the compound unique `{ user: 1, product: 1 }` index declared in `server/models/Wishlist.js`; a read-only duplicate-pair check previously found none. No production index has been changed. The server does not currently use this model in its routes. If Wishlist persistence is introduced: (1) take a provider backup; (2) run a read-only duplicate scan on the current production data; (3) resolve any duplicate pairs only under a separately approved data-cleanup plan; (4) test the named unique index on a staging copy; and (5) schedule approval for `db.wishlists.createIndex({ user: 1, product: 1 }, { unique: true, name: 'user_1_product_1' })`. Do not run that command as part of application startup or this deployment.
- [x] **Recheck current JWT authorization state.** `protect` now verifies JWT signature/expiry, loads the account from MongoDB, rejects missing or disabled users, and uses the current database role. Login also refuses disabled accounts. Unit tests cover expired tokens, disabled/deleted users, and stale role claims.
- [x] **Implement a protected admin bootstrap for Render Free.** `POST /api/auth/admin-setup` accepts only a password, targets only `ADMIN_EMAIL`, requires a separate strong setup secret, rate-limits requests, hashes passwords with bcrypt, marks the target account complete atomically, and never returns credentials. Focused controller/route tests pass; production activation remains a dashboard task above.
- [x] **Hide internal error details in production.** The error handler now returns a generic 500 message with a request ID, logs only safe error metadata in production, and maps upload validation/limit errors to client responses.
- [x] **Update the OpenAPI server URL.** `server/openapi.yaml` now lists the supplied live Render API URL, `https://asiancalf.onrender.com`.
- [ ] **Complete the MongoDB-backed order/API integration suite.** The isolated auth and upload suites pass (11 tests), and the frontend production build completes. The order/API tests use only `MongoMemoryReplSet`; the workspace could not finish downloading its 509 MB Windows MongoDB test binary within the five-minute setup timeout. These tests did not connect to production. Do not point them at the production `MONGO_URI`; test setup drops its temporary database.
- [ ] **Verify MongoDB network allowlisting from the deployed Render service.** A read-only cloud ping succeeded from this workspace, but Render egress was not tested. In Render's service dashboard, use **Connect > Outbound** to obtain the service region's current IP ranges and allowlist those with the MongoDB provider. Avoid `0.0.0.0/0` where a narrower allowlist is practical. See [Render outbound IP addresses](https://render.com/docs/outbound-ip-addresses).
- [ ] **Verify Git history and working-tree state in a valid checkout.** The current index scan found no tracked `.env` file and no credential-shaped MongoDB URI/private key/AWS/GitHub/Stripe token in indexed blobs. It found only the tracked `server/.env.example`, whose indexed blob passed that scan. However, `git status` and `git rev-parse` fail in this workspace, and commit history could not be checked. In a valid clone, run `git status --short`, confirm `git ls-files -- server/.env client/.env` returns no paths, and run a history secret scanner such as Gitleaks before pushing. If a real `.env` is tracked, use `git rm --cached server/.env` to untrack it while preserving the local file, then rotate every secret that was pushed.

## Passed

- [x] **Frontend production build:** `npm run build` completed successfully with a production API URL supplied. The generated JavaScript bundle contains no `localhost:5000` or `127.0.0.1` API URL.
- [x] **Frontend API configuration:** client requests use `REACT_APP_API_URL`; the production helper fails clearly if it is unset. `client/package.json` retains `localhost:5000` only as the Create React App development proxy.
- [x] **CORS:** production allows the apex and `www` HTTPS origins. A direct preflight check allowed both, denied localhost, and denied an unrelated origin. Vercel previews require their exact origin to be added to Render's `CLIENT_URL`; there is no wildcard preview allowance.
- [x] **Vercel routing:** `vercel.json` parses as valid JSON and rewrites SPA routes to `/index.html`, supporting direct route visits and refreshes.
- [x] **Render service commands:** `render.yaml` sets `rootDir: server`, `npm ci`, `npm start`, `NODE_ENV=production`, and `/health`. The server binds to Render's `PORT` on `0.0.0.0`.
- [x] **MongoDB and health behavior:** the configured remote MongoDB accepted a read-only ping. The health route returned 200 with `database: connected` while connected and 503 while disconnected. Existing read-only checks returned 18 users, 7 products, and 3 categories; product/category GET endpoints returned 200. No production records were modified.
- [x] **JWT/admin guard behavior:** `protect` checks live account status and role; all admin routes still apply `protect` and `authorize('admin')`. Unit tests cover stale role claims, deactivated/deleted accounts, and expiration.
- [x] **Secret examples and ignore rules:** the working `.env.example` files contain placeholders/local values only after sanitization, and `.gitignore` excludes `.env` and `.env.*` while allowing the example files.
- [x] **Dependency audit:** `npm audit` and `npm audit --omit=dev` report zero vulnerabilities for the backend after the Multer update; the frontend production dependency audit also reports zero.

## Production environment variables

| Service | Variable | Required value |
|---|---|---|
| Vercel | `REACT_APP_API_URL` | Actual Render API base URL, HTTPS, no trailing slash |
| Render | `NODE_ENV` | `production` |
| Render | `MONGO_URI` | Rotated URI for the existing cloud database and existing database name |
| Render | `JWT_SECRET` | Strong generated secret; keep backend-only |
| Render | `CLIENT_URL` | `https://asiancalf.com,https://www.asiancalf.com`; append only exact preview origins if needed |
| Render | `PORT` | Supplied by Render; do not hardcode |
| Render, optional | `MONGO_DNS_SERVERS` | Only when custom DNS resolvers are needed |

Optional notification variables are documented in `server/.env.example` and are not required for MongoDB connectivity.

## Final go-live checks

- [ ] Rotate the exposed database credential and verify no real secret remains in the working tree, Git index, or Git history.
- [x] Upgrade Multer and verify image/video upload type, size, count, and error handling with isolated tests.
- [ ] Run the MongoDB-backed order/API tests in an environment that can download or provide the test binary.
- [ ] Back up current `server/uploads`, attach and populate the Render disk, and verify old product media still loads.
- [ ] Set Render and Vercel variables, deploy both services, and confirm Render `/health` returns HTTP 200 with `database: connected`.
- [ ] Confirm `GET /api/products?limit=10` returns existing data, test login with an existing account, and verify admin access using the existing admin account.
- [ ] Open `https://asiancalf.com` and `https://www.asiancalf.com`, refresh nested React routes, and check the browser Network panel for Render API requests and CORS errors.
- [ ] Confirm MongoDB provider network rules include the current Render outbound range and keep unrelated database/network settings unchanged.

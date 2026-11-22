# Asiancalf.com deployment guide

## Existing architecture

- `client/` is a React 18 single page application built with Create React App (`react-scripts`). It uses npm and React Router 6. Run `npm ci` and `npm run build` from `client/`.
- `server/` is an Express 4 API on Node.js. Run `npm ci` and `npm start` from `server/`. It uses Mongoose 7 with MongoDB configured by `MONGO_URI`; this deployment keeps that provider and database.
- The API routes are mounted under `/api`. Authentication uses JWT bearer tokens signed with `JWT_SECRET`; authorization middleware checks user roles.
- Client development uses the existing `client/package.json` proxy to `http://localhost:5000`. Production client requests use `REACT_APP_API_URL`.
- Product image/video URLs remain `/uploads/products/<filename>`. New uploads are staged briefly under `server/uploads/products`, copied into the existing MongoDB database's `productMedia` GridFS bucket, saved on the product record, and then removed from local disk. Reads check GridFS first and fall back to local files so existing media continues working during migration.

## 1. Upload the project to GitHub

1. Check that `server/.env` and any other `.env` files are excluded by `.gitignore`. Never add real environment files, MongoDB credentials, API tokens, or JWT secrets to Git.
2. Create a private or public GitHub repository as preferred.
3. From the project root, initialize Git if needed, add the project files, review `git status`, and commit. Include the source and deployment files; omit local `node_modules`, build output if not needed, secrets, and private backups.
4. Push the branch that Vercel and Render will deploy. Keep the existing package lock files so both services can use `npm ci`.

## 2. Deploy the frontend on Vercel

1. Import the GitHub repository into Vercel.
2. Set **Root Directory** to `client`.
3. Choose **Create React App** as the framework preset (or confirm Vercel detects it). Set Install Command to `npm ci`, Build Command to `npm run build`, and Output Directory to `build`.
4. Add `REACT_APP_API_URL=https://asiancalf.onrender.com` in the Vercel project's Environment Variables for Production. Add it to Preview/Development only if those deployments should call the production API. CRA embeds `REACT_APP_*` values into public browser assets, so never put a secret there.
5. Redeploy after setting or changing this variable; Create React App embeds it during the build.
6. Because the project Root Directory is `client`, `client/vercel.json` supplies the SPA fallback for direct visits and refreshes on React Router routes. The repository-root `vercel.json` is not the config Vercel uses when `client` is the project root.

`client/.env.example` records the public backend base URL for local reference. All application API calls use `apiUrl()` and media paths use `mediaUrl()` from `client/src/utils/api.js`; relative uploaded image/video paths resolve against the Render API host. Absolute media URLs remain unchanged.

## 3. Deploy the backend on Render

1. Create a Render Web Service from the same GitHub repository, or use the included `render.yaml` Blueprint.
2. For manual setup, choose the repository root directory `server`, runtime Node, build command `npm ci`, start command `npm start`, and health check path `/health`.
3. Set `NODE_ENV=production`.
4. Add the existing database connection as `MONGO_URI` using the exact URI from your current MongoDB provider. Preserve its database and provider. Ensure that provider permits connections from Render; use the provider's recommended network access settings.
5. Set `JWT_SECRET` to a newly generated, long random secret. Changing it invalidates existing login tokens.
6. Set `CLIENT_URL` to `https://asiancalf.com,https://www.asiancalf.com`. If you need a Vercel preview, append its exact HTTPS origin to `CLIENT_URL` as a comma-separated value. The API does not allow arbitrary `*.vercel.app` origins.
7. Add optional notification variables only if the feature is configured: `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL`, `INQUIRY_TO_EMAIL`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_RECIPIENT_PHONE`. `MONGO_DNS_SERVERS` is optional and only needed for a DNS resolver issue.
8. For the currently supplied Render service, verify `https://asiancalf.onrender.com/health` returns HTTP 200 and `database: "connected"`. If Render's dashboard shows a different service URL, use that URL consistently in this guide and Vercel.

Render sets `PORT` automatically. The server listens on that port and binds to `0.0.0.0`.

### One-time admin setup without Render Shell

The existing `npm run admin:ensure` script reads `ADMIN_EMAIL` and `ADMIN_PASSWORD`, connects using `MONGO_URI`, bcrypt-hashes the password, and upserts that email as an active admin. It is a command-line script and normally requires shell access. The one-time HTTPS endpoint below provides a controlled alternative for Render plans without Shell access.

1. Deploy the backend code that includes `POST /api/auth/admin-setup`.
2. In the Render service's **Environment** settings, set `ADMIN_EMAIL` to the one intended admin address and set `ADMIN_SETUP_SECRET` to a newly generated random value with at least 32 bytes. Keep it separate from `JWT_SECRET`; do not put either value in the frontend, GitHub, a URL, or a screenshot. For example, generate a candidate locally with `openssl rand -base64 48` and paste it directly into Render.
3. Wait for the Render service to restart and confirm `/health` reports the database as connected.
4. Send one HTTPS `POST` request to `https://asiancalf.onrender.com/api/auth/admin-setup` using a local API client with cloud sync/history disabled. Do not call this endpoint from React. It only uses the email configured in `ADMIN_EMAIL`; it does not accept an email address from the request body.

   Request headers:

   ```text
   Content-Type: application/json
   x-admin-setup-secret: <the Render-only setup secret>
   ```

   Exact JSON request body:

   ```json
   {"password":"<new unique password of 16 to 72 UTF-8 bytes>"}
   ```

   Exact successful response (`HTTP 200`):

   ```json
   {"success":true,"message":"Admin account setup completed. Remove ADMIN_SETUP_SECRET from the Render environment now."}
   ```

5. On success, remove `ADMIN_SETUP_SECRET` from Render's Environment settings. The `adminSetupCompleted` flag is stored on the target user document in the existing `users` collection (it is excluded from API serialization), so it survives process restarts and redeployments. The endpoint rejects further setup attempts for that account even if a secret is later re-added. The endpoint never returns or logs the setup secret, password, or password hash. It creates or updates only the configured email, sets its role to `admin` and `isActive` to true, and uses bcrypt with the same cost as the existing setup script.

The endpoint requires a secret of at least 32 bytes, compares it in constant time, rate-limits attempts, requires an admin password of 16–72 UTF-8 bytes, and is inactive when either setup environment variable is missing. It uses the existing users collection and unique email index; it does not add a collection or database index. Use a strong password that is different from the setup secret. If the call fails, check `/health` and Render logs; never add the database URI to the request.

### Existing cloud MongoDB configuration

- The backend reads `MONGO_URI` only from its server environment. Use the same connection URI and database name that point to your existing cloud database. Do not substitute a newly created database name; the database path in the URI determines which existing collections this app opens.
- Set `MONGO_URI` in the Render service's **Environment** settings or supply it as a secret when creating the Blueprint. Do not put the credentialed URI in GitHub, Vercel, frontend variables, logs, or support screenshots. `server/.env.production.example` contains placeholders only; `server/.env.example` retains the local development URI.
- `MONGO_DNS_SERVERS` is the only other Mongo-specific variable in this code. It is optional and only changes DNS resolver addresses when troubleshooting an SRV lookup. Leave it unset unless needed.
- In the MongoDB provider, use a dedicated database user with the permissions required by this app on the existing database (read and write, including index creation where applicable). Keep the existing data and database name. The application has no production reset or migration command in its startup path.
- Restrict the database's network access to the Render service's outbound IP ranges when the provider supports IP allowlists. In the Render dashboard, open the service's **Connect → Outbound** details and allow those ranges for the service's region. The ranges can change; use the current dashboard values. For a fixed allowlist, Render offers dedicated outbound IPs on eligible plans. Avoid `0.0.0.0/0` when a narrower rule is practical. See [Render outbound IP documentation](https://render.com/docs/outbound-ip-addresses).
- The server waits for Mongoose to connect before opening its HTTP listener. Mongoose's MongoDB driver reconnect behavior is retained; connection loss and restoration are logged without credentials. Render's `/health` check performs a MongoDB ping and returns 503 when the database is disconnected or the ping fails.
- Production sets Mongoose `autoIndex` to false so a service restart does not silently add or change indexes. Local development and the isolated in-memory tests keep the existing schema index behavior. Review index changes separately before applying them to the cloud database.

### Existing models and indexes

The existing collections were read-only checked and are all present in the configured cloud database: `banners`, `carts`, `categories`, `counters`, `coupons`, `inquiries`, `inventories`, `orders`, `payments`, `products`, `returnrequests`, `reviews`, `users`, and `wishlists`. These map to the Mongoose models in `server/models`; there are no explicit collection rename rules or startup migrations. Existing unique indexes include user email, product SKU and sparse slug, category slug, cart user, coupon code, inventory product, and order number. Product, inquiry, and payment query indexes are also present. The `wishlists` collection does not currently have the compound unique `(user, product)` index declared by `Wishlist.js`. The Wishlist model is not used by the server routes at present. Production startup now leaves indexes untouched; investigate existing duplicates and review this missing index separately before creating it. Preserve the database name in `MONGO_URI` so these model mappings continue to read the existing collections.

Before deployment, confirm a recent backup exists with your database provider. Startup and the health check do not drop, reset, migrate collections, or automatically build indexes in production. Existing tests use an in-memory MongoDB replica set and are isolated from production.

### Safe database verification

1. After setting `MONGO_URI`, deploy the Render service and check `/health`. HTTP 200 with `database: "connected"` verifies the API can issue a database ping; HTTP 503 means to check Render logs, credentials, database name, network allowlist, and provider availability.
2. Check a read-only API route such as `GET /api/products?limit=10` and confirm known existing products are returned. Check `GET /api/categories` for existing categories. These requests do not create or modify records.
3. To confirm a known account can authenticate without registering another account, use the existing account's login through the frontend. Login reads the user record and returns a JWT; do not use a production registration flow as a test.
4. Confirm the returned product records and existing user account are the ones expected from the current database. Do not run seed scripts, `admin:ensure`, test suites, or write-oriented smoke checks against the production URI.
5. Run automated API and model-operation tests only with the repository's test setup, which assigns `MONGO_URI` to its temporary in-memory replica set. It drops that temporary test database during teardown, not the cloud database.

## 4. Product media persistence in MongoDB

New product images and videos are persisted in GridFS in the same MongoDB database configured by `MONGO_URI`; Render's temporary local upload is removed after the GridFS copy and product document save both succeed. Product URLs and the existing product schema stay the same. MongoDB GridFS stores file metadata and chunks in `productMedia.files` and `productMedia.chunks`; MongoDB's driver creates the bucket indexes on the first GridFS write when needed. Confirm the existing database user can create collections and indexes, and ensure the MongoDB account has enough storage for media. No database setup or media migration runs on service startup.

Local files already in `server/uploads/products` are still readable through the fallback route. Migrate them to GridFS only after confirming a current database/filesystem backup and the target `MONGO_URI` points at the existing database. From `server/`, run `npm run media:migrate:check` first; it is read-only, reports files missing from GridFS, and hashes source/stored copies when a GridFS copy already exists. Review the output and then run `npm run media:migrate:apply` to upload and verify missing files and remove only verified local source files. Files that fail verification are retained. These commands are not run automatically. Do not run the apply command against production until you are ready for the explicit migration; GridFS writes add media files to the existing database.

## 5. Connect frontend and backend

1. Set Vercel `REACT_APP_API_URL` to `https://asiancalf.onrender.com` (no trailing slash).
2. Set Render `CLIENT_URL` to exactly `https://asiancalf.com,https://www.asiancalf.com` unless an explicitly selected preview origin is also needed.
3. Redeploy the Vercel frontend whenever `REACT_APP_API_URL` changes.
4. API requests, relative image paths, and relative video paths resolve to the Render backend. Confirm product image and video responses in the browser Network panel. Existing files continue to use the local fallback until migrated with the documented command above.

## 6. Connect the GoDaddy domain to Vercel

1. In Vercel, open the frontend project's **Settings > Domains** and add both `asiancalf.com` and `www.asiancalf.com`. Assign both to the Production deployment and choose which hostname redirects to the canonical one.
2. For each domain, read the exact DNS instruction shown in Vercel **Settings > Domains**. Vercel may show an A record for the apex, a project-specific CNAME for `www`, and/or a TXT ownership-verification record. Values may vary by project/account; do not copy a generic value from an example or this guide in place of the dashboard values. If Vercel shows a trailing dot in a CNAME target, preserve it if GoDaddy accepts it.
3. In GoDaddy, go to **My Products > Domains > asiancalf.com > DNS / Manage DNS**. Add or edit records by copying Vercel's Type, Name/Host, Value/Points to, and TTL fields exactly. GoDaddy commonly expects `@` for the apex and `www` for the subdomain; use the exact host format Vercel lists.

| Domain | GoDaddy record | Host/Name | Value |
|---|---|---|---|
| `asiancalf.com` (apex) | `A` (usually) | `@` | Copy the exact IPv4 address shown in Vercel Settings > Domains |
| `www.asiancalf.com` | `CNAME` (usually) | `www` | Copy the exact project-specific CNAME target shown in Vercel |
| Only if Vercel requests verification | `TXT` | Copy exact host/name | Copy exact token shown in Vercel |
4. The currently observed public DNS answers (2026-11-01) are apex A records `3.33.130.190` and `15.197.148.33`, and `www` is a CNAME to `asiancalf.com`. GoDaddy documents these two IPs as its domain-parking targets ([GoDaddy parking guide](https://www.godaddy.com/en-uk/help/park-a-domain-registered-with-godaddy-23936)); this indicates the apex currently resolves to GoDaddy parking rather than your Vercel project. Verify the records in GoDaddy and compare with Vercel before changing anything. Project-specific values cannot be read from this repository or outside your Vercel account, so obtain them from **Settings > Domains** first.
5. In GoDaddy, replace only conflicting website records for `@`/`www` that Vercel identifies. Preserve MX, mail-related TXT, domain verification, and unrelated subdomain records. Do not change nameservers as part of this A/CNAME setup.
6. Save the records, wait for DNS propagation, then use Vercel's domain status/verify action. If Vercel requires a TXT ownership record, add that exact TXT record too.

Vercel's instructions for external DNS providers require copying the exact records from the project's domain settings; the apex uses an A record and a subdomain uses a CNAME. See [Vercel custom domain setup](https://vercel.com/docs/domains/set-up-custom-domain) and [GoDaddy DNS management](https://www.godaddy.com/help/manage-dns-records-680).

## 7. HTTPS and SSL

After DNS verification, Vercel automatically provisions and renews TLS certificates. Wait for both domains to show valid/secure in Vercel **Settings > Domains**, then open `https://asiancalf.com` and `https://www.asiancalf.com` and confirm the selected canonical redirect. See [Vercel SSL certificate verification](https://vercel.com/docs/domains/set-up-custom-domain#6-verify-ssl-certificate).

## 8. Production environment variables

Set values in the hosting dashboards, not in committed files:

| Service | Variable | Value |
|---|---|---|
| Vercel | `REACT_APP_API_URL` | `https://asiancalf.onrender.com` |
| Render | `NODE_ENV` | `production` |
| Render | `MONGO_URI` | Existing MongoDB URI |
| Render | `JWT_SECRET` | Long random secret |
| Render | `CLIENT_URL` | `https://asiancalf.com,https://www.asiancalf.com` |
| Render | `PORT` | Supplied by Render; do not hardcode |

The backend `.env.example` documents the existing optional integration variable names. Keep every secret backend-only.

## 9. Verify the production site

1. Open [`https://asiancalf.onrender.com/health`](https://asiancalf.onrender.com/health) and confirm HTTP 200 with `database: "connected"`.
2. Open the Vercel deployment and confirm the browser's Network panel shows API requests going to the Render hostname, without localhost URLs or CORS errors.
3. Load the home page, refresh a nested route such as `/login`, and open a product detail route directly.
4. Test registration/login and role-appropriate admin/seller access. Confirm unauthorized requests remain rejected.
5. Verify product images and videos load from `https://asiancalf.onrender.com/uploads/products/<filename>`. New uploads should be served from GridFS; existing media is served from the local fallback until migrated. Avoid upload smoke tests that create unwanted production products or files.
6. Test cart and checkout navigation and inquiry submission using the production database carefully.
7. Test both custom domain hosts over HTTPS and ensure the selected canonical redirect works.
8. If CORS blocks an allowed site, check the exact browser origin against Render's `CLIENT_URL` value. Do not solve this by allowing every origin.

## Local checks

From `client/`, run `npm run build`. From `server/`, run `npm test`. Tests use an in-memory MongoDB replica set; if the dependency cannot download its MongoDB binary in the current environment, run them in CI or a network-enabled environment.

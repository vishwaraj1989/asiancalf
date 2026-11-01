# Asiancalf.com deployment guide

## Existing architecture

- `client/` is a React 18 single page application built with Create React App (`react-scripts`). It uses npm and React Router 6. Run `npm ci` and `npm run build` from `client/`.
- `server/` is an Express 4 API on Node.js. Run `npm ci` and `npm start` from `server/`. It uses Mongoose 7 with MongoDB configured by `MONGO_URI`; this deployment keeps that provider and database.
- The API routes are mounted under `/api`. Authentication uses JWT bearer tokens signed with `JWT_SECRET`; authorization middleware checks user roles.
- Client development uses the existing `client/package.json` proxy to `http://localhost:5000`. Production client requests use `REACT_APP_API_URL`.
- Product images and videos are stored in `server/uploads` on the local filesystem, while their `/uploads/...` paths are saved in MongoDB.

## 1. Upload the project to GitHub

1. Check that `server/.env` and any other `.env` files are excluded by `.gitignore`. Never add real environment files, MongoDB credentials, API tokens, or JWT secrets to Git.
2. Create a private or public GitHub repository as preferred.
3. From the project root, initialize Git if needed, add the project files, review `git status`, and commit. Include the source and deployment files; omit local `node_modules`, build output if not needed, secrets, and private backups.
4. Push the branch that Vercel and Render will deploy. Keep the existing package lock files so both services can use `npm ci`.

## 2. Deploy the frontend on Vercel

1. Import the GitHub repository into Vercel.
2. Set **Root Directory** to `client`.
3. Use `npm ci` as the install command and `npm run build` as the build command. The output directory is `build`.
4. Add the environment variable `REACT_APP_API_URL` with the Render service URL, for example `https://asiancalf-api.onrender.com` (no trailing slash). The actual hostname is assigned by Render.
5. Redeploy after setting or changing this variable; Create React App embeds it during the build.
6. `vercel.json` provides the SPA fallback so direct visits and refreshes on React Router routes load the app.

`client/.env.example` is a placeholder for local configuration only. Do not put backend secrets in Vercel variables prefixed with `REACT_APP_`; those variables are public in the browser bundle.

## 3. Deploy the backend on Render

1. Create a Render Web Service from the same GitHub repository, or use the included `render.yaml` Blueprint.
2. For manual setup, choose the repository root directory `server`, runtime Node, build command `npm ci`, start command `npm start`, and health check path `/health`.
3. Set `NODE_ENV=production`.
4. Add the existing database connection as `MONGO_URI` using the exact URI from your current MongoDB provider. Preserve its database and provider. Ensure that provider permits connections from Render; use the provider's recommended network access settings.
5. Set `JWT_SECRET` to a newly generated, long random secret. Changing it invalidates existing login tokens.
6. Set `CLIENT_URL` to `https://asiancalf.com,https://www.asiancalf.com`. If you need a Vercel preview, append its exact HTTPS origin to `CLIENT_URL` as a comma-separated value. The API does not allow arbitrary `*.vercel.app` origins.
7. Add optional notification variables only if the feature is configured: `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL`, `INQUIRY_TO_EMAIL`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_RECIPIENT_PHONE`. `MONGO_DNS_SERVERS` is optional and only needed for a DNS resolver issue.
8. Deploy and verify `https://<your-render-service>.onrender.com/health` returns HTTP 200 and `database: "connected"`.

Render sets `PORT` automatically. The server listens on that port and binds to `0.0.0.0`.

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

## 4. Product media persistence on Render

The current application writes uploaded media to `server/uploads`. A normal Render filesystem is ephemeral: uploads can be lost when the service is replaced or redeployed. Before relying on admin media uploads in production, attach a persistent disk to the Render service mounted at the backend's `uploads` directory (with the service path resolved under the `server` root), or migrate media storage to an object storage service. A persistent disk may require a paid Render plan. Existing media files in the repository are not a substitute for a persistent production upload store.

## 5. Connect frontend and backend

1. Copy the Render service base URL into Vercel's `REACT_APP_API_URL`.
2. Ensure Render `CLIENT_URL` contains both the apex and `www` HTTPS origins.
3. Redeploy the Vercel frontend whenever `REACT_APP_API_URL` changes.
4. The client prefixes API routes and uploaded media paths with that backend URL. Absolute external media URLs continue to work.

## 6. Connect the GoDaddy domain to Vercel

1. In Vercel, open the project's **Settings → Domains** and add `asiancalf.com` and `www.asiancalf.com`.
2. Follow the exact DNS records Vercel shows for this project. The values displayed there are authoritative and can vary by account or setup.
3. In GoDaddy, open the domain's DNS management and add or update those records. Commonly, the apex uses an A record and `www` uses a CNAME, but use the names and values shown by Vercel. Remove conflicting records for the same host only when Vercel identifies them as conflicts.
4. Keep unrelated email and verification records intact. Do not change nameservers unless you intend to move all DNS management to another provider.
5. Wait for DNS propagation and Vercel's domain verification.

## 7. HTTPS and SSL

After domain verification, Vercel provisions and renews TLS certificates for the assigned domains. Wait until Vercel reports the domains as configured and HTTPS is active. Choose the preferred canonical host/redirect behavior in Vercel and test both `https://asiancalf.com` and `https://www.asiancalf.com`.

## 8. Production environment variables

Set values in the hosting dashboards, not in committed files:

| Service | Variable | Value |
|---|---|---|
| Vercel | `REACT_APP_API_URL` | Render service base URL |
| Render | `NODE_ENV` | `production` |
| Render | `MONGO_URI` | Existing MongoDB URI |
| Render | `JWT_SECRET` | Long random secret |
| Render | `CLIENT_URL` | `https://asiancalf.com,https://www.asiancalf.com` |
| Render | `PORT` | Supplied by Render; do not hardcode |

The backend `.env.example` documents the existing optional integration variable names. Keep every secret backend-only.

## 9. Verify the production site

1. Open the Render `/health` URL and confirm HTTP 200.
2. Open the Vercel deployment and confirm the browser's Network panel shows API requests going to the Render hostname, without localhost URLs or CORS errors.
3. Load the home page, refresh a nested route such as `/login`, and open a product detail route directly.
4. Test registration/login and role-appropriate admin/seller access. Confirm unauthorized requests remain rejected.
5. Verify product images and videos load from the Render backend; upload a test item only after persistent media storage is configured.
6. Test cart and checkout navigation and inquiry submission using the production database carefully.
7. Test both custom domain hosts over HTTPS and ensure the selected canonical redirect works.
8. If CORS blocks an allowed site, check the exact browser origin against Render's `CLIENT_URL` value. Do not solve this by allowing every origin.

## Local checks

From `client/`, run `npm run build`. From `server/`, run `npm test`. Tests use an in-memory MongoDB replica set; if the dependency cannot download its MongoDB binary in the current environment, run them in CI or a network-enabled environment.

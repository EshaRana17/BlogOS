# Deploying BlogOS to Firebase App Hosting

Firebase App Hosting runs Next.js 14 in full SSR mode on Cloud Run —
API routes, middleware, SSE streams and server components all work natively.
Plain Firebase Hosting (static) is NOT enough for this app.

## Prerequisites

- Firebase CLI: `npm install -g firebase-tools` (version 13.29+ for App Hosting)
- `firebase login`
- Billing enabled on the `buildwithesha` Google Cloud project
  (App Hosting requires the Blaze pay-as-you-go plan)

## One-time setup

1. Link the local repo to the Firebase project:

   ```bash
   firebase use buildwithesha
   ```

2. Create the App Hosting backend (first time only):

   ```bash
   firebase apphosting:backends:create --project buildwithesha
   ```

   - Backend ID: `blogos`
   - Region: `us-central1` (or your preferred region)
   - Root directory: `/`
   - Live branch: `main`

3. Provision secrets in Google Secret Manager (do NOT put these in
   `apphosting.yaml`):

   ```bash
   # LLM + scraping + image generation
   firebase apphosting:secrets:set GROQ_API_KEY
   firebase apphosting:secrets:set FIRECRAWL_API_KEY
   firebase apphosting:secrets:set REPLICATE_API_KEY

   # Firebase Admin SDK
   firebase apphosting:secrets:set FIREBASE_ADMIN_PROJECT_ID
   firebase apphosting:secrets:set FIREBASE_ADMIN_CLIENT_EMAIL
   firebase apphosting:secrets:set FIREBASE_ADMIN_PRIVATE_KEY
   ```

   Then uncomment the matching entries in `apphosting.yaml`.

4. Fill in the placeholder client Firebase config values in
   `apphosting.yaml` (everything starting with `NEXT_PUBLIC_FIREBASE_`).
   These ship to the browser, so they are fine to commit.

## Deploy

Either connect the GitHub repo to the App Hosting backend (recommended —
auto-deploys on push to `main`) or trigger a manual rollout:

```bash
firebase apphosting:rollouts:create blogos --project buildwithesha
```

The first build takes 5–10 minutes; subsequent rollouts are faster.

## After first deploy

1. In the Firebase Console → App Hosting, copy the live URL and set it as
   `NEXT_PUBLIC_SITE_URL` in `apphosting.yaml`. Redeploy.
2. Add the custom domain (`blogos.live`) under App Hosting → Domains when
   you are ready.
3. Verify `/sitemap.xml` and `/robots.txt` resolve, then submit the sitemap
   in Google Search Console.

## Useful commands

```bash
firebase apphosting:backends:list                 # list backends
firebase apphosting:rollouts:list blogos          # rollout history
firebase apphosting:secrets:grantaccess GROQ_API_KEY --backend=blogos
```

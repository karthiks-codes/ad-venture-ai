# ADventure Ads

ADventure 2026 — One Product. Endless Possibilities. is a two-person AI advertising competition hosted by BVRIT Hyderabad, College of Engineering for Women, Department of CSE (AI & ML), on 13 October 2026.

This repository is a Next.js App Router application. MongoDB Atlas is the production persistence layer; the optional in-memory repository is only for explicitly selected local demo mode. Video upload bytes are sent from the browser directly to Google Drive using resumable upload sessions.

## Current implementation

- Poster-inspired, responsive public landing page, event rules, sample problem briefs, public toolkit and light/dark theme.
- Team login by normalized team code or email, bcrypt password hashes, signed HTTP-only cookies, shared MongoDB-backed login/reset rate limits, forced first-login password changes, logout, and single-use password reset links.
- Team dashboard, static challenge configuration, concurrent-allocation protection, dynamic MongoDB-backed AI tools, AI declaration, and submission status workflow.
- Administrator Google OAuth with PKCE, state/nonce validation, signature-verified Google ID tokens, and an active MongoDB administrator allowlist. Google login does not create or promote admins.
- Admin overview with audit events refreshed every five seconds without a page reload, individual and CSV team creation/status/credential actions, audited assignment/reassignment, static problem counts, submissions, editable AI-tool configuration and MongoDB-backed event settings.
- MongoDB unique/query indexes and transaction-serialized allocation. Submission reservation and finalization use a unique per-team document and conditional database state transitions.
- Google Drive resumable upload session service and a browser chunk uploader. Vercel/Next.js handles metadata and authorization only; video bytes never pass through the application server.
- Gmail API templates for credentials, password reset and submission confirmation. The provider reports success only after Gmail accepts the send request.

Live MongoDB, Google OAuth, Gmail API, and Drive credentials are not included in this repository. Their real external connections and a production upload have not been verified here. The remaining setup/verification steps are listed below.

## Requirements and local development

- Node.js 20.9 or later
- npm
- A MongoDB Atlas database for persistent local or production workflows

```sh
npm install
cp .env.example .env.local
# Set the variables described below.
npm run dev
```

The app is available at `http://localhost:3000`. Generate an `AUTH_SECRET` with `openssl rand -base64 48`. Do not commit `.env.local`.

### Local demo mode

Set `DEMO_MODE=true` and `DEMO_TEAM_PASSWORD` in `.env.local` to use an in-memory sample dataset for local UI testing. The six sample teams and demo AI tools are process-memory fixtures; they disappear on restart and are never a production data source. Do not use this mode for the event or for persistence testing. Production rejects demo mode unless a separate explicit override is configured in code.

## MongoDB Atlas

1. Create an Atlas database and a least-privilege database user.
2. Add the development machine or Vercel egress/network configuration to the Atlas IP access list.
3. Set `MONGODB_URI` and `MONGODB_DB_NAME` in `.env.local` or Vercel project settings.
4. The app creates required indexes when it first connects. It never automatically seeds teams or other sample business data.
5. To seed six synthetic demo records explicitly, set a non-production database and run:

   ```sh
   npm run db:seed -- --confirm
   ```

   The command refuses to run without `--confirm` and refuses production-like targets unless `SEED_ALLOW_PRODUCTION=true` is explicitly supplied. Seeded team passwords are independently generated and hashed; they are never printed. The `.test` email addresses are intentionally non-deliverable and are not event credentials. The script is idempotent and does not overwrite existing teams.

6. To verify read/write connectivity using a uniquely named temporary document:

   ```sh
   npm run db:smoke
   ```

   It reads the inserted record back, deletes only that temporary record, verifies cleanup, and exits nonzero on failure.

The required persistence acceptance test—create a real team, verify it in Atlas, restart the app and retrieve it—must still be run against the event Atlas instance. No Atlas connection was available during this implementation.

## Administrator bootstrap and Google OAuth

Google OAuth is enabled only for a verified Google identity matching an active document in MongoDB's `admins` collection. There is no public admin signup and no automatic promotion.

1. Create a Google OAuth web client and configure the exact authorized redirect URI:
   `https://YOUR_HOST/api/auth/admin/callback`
2. Set `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`, and `AUTH_SECRET`.
3. Bootstrap the initial allowlisted admin explicitly:

   ```sh
   npm run admin:bootstrap -- --email organizer@example.org --role owner
   ```

   Supported roles are `owner`, `admin` and `viewer`; viewers are read-only. The command creates or updates only the specified email. Google login binds the verified Google subject on the first successful authorized login.

4. Open `/admin` and complete Google sign-in.

The bootstrap command requires `MONGODB_URI` and `MONGODB_DB_NAME`; it never uses demo memory.

## Gmail API email

Email sends through the Gmail API as one organizer-controlled Gmail or Google Workspace mailbox. Create/select a Google Cloud project, enable the Gmail API, and configure an OAuth consent screen. Create OAuth credentials, then grant offline access with the `https://www.googleapis.com/auth/gmail.send` scope for the mailbox that will send event email. Store the resulting client ID, client secret and refresh token as `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET` and `GMAIL_OAUTH_REFRESH_TOKEN`; set `GMAIL_SENDER_EMAIL` to that same authorized mailbox. Keep the refresh token server-only and out of source control. For OAuth consent screens in Testing status, Google may expire refresh tokens after seven days; publish/approve the consent configuration or plan to rotate the token before the event.

`NEXT_PUBLIC_APP_URL` must be the public application origin so credential and reset links are correct. Team creation/credential reset, password recovery and submission confirmation use this Gmail provider. The API acceptance response is not proof of inbox delivery; verify a real test message in the sender's Sent folder and the recipient inbox. Gmail has sending quotas and anti-abuse policies; confirm the mailbox can send the expected event volume (including resets and retries) before importing all teams. If Gmail throttles sends, the operation reports an error and does not claim email acceptance.

The admin Teams page accepts CSV imports with `teamCode,teamName,member1Name,member2Name,email` headers (headers are case-insensitive and may be in any order). Quoted commas and escaped quotes are supported. Each import is limited to 200 rows and 200 KB; existing team codes/emails are reported per row. Accounts activate only after Gmail accepts their credential email, so configure and test email before importing event teams.

## Google Drive resumable uploads

1. Enable the Google Drive API in the organizer's Google Cloud project.
2. Authorize a dedicated organizer Google account with an OAuth client and the `https://www.googleapis.com/auth/drive` scope. Configure `GOOGLE_DRIVE_OAUTH_CLIENT_ID`, `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`, and `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`. The OAuth account must have permission to create files in the event folder; this avoids requiring a service-account key.
3. Create the root `ADventure 2026` folder and set its ID as `GOOGLE_DRIVE_ROOT_FOLDER_ID`. The application creates `Submissions/<TEAMCODE - Team Name>/` beneath it.
4. If using a Shared Drive, set `GOOGLE_DRIVE_SHARED_DRIVE_ID` and grant the authorized organizer account access to that Shared Drive.
5. Configure `NEXT_PUBLIC_APP_URL` to the exact browser origin used for the upload session.
6. Enable uploads and configure the deadline, MIME types and size limit in `/admin/settings`.
7. Test with a small MP4 first, then verify the file's parent folder, exact size/MIME type, final submission record, and Drive link. Test interruption/resume and deadline rejection before the event.

The browser uploads 8 MiB chunks directly to the Google Drive resumable session and reports progress. The app server never accepts or proxies video bytes. OAuth client credentials and refresh tokens are server-only. A live Drive session, Google CORS behavior on the event domain, and large-file resume/finalization remain unverified until real organizer credentials are configured.

## Environment variables

`.env.example` documents all current runtime and script settings. The key production requirements are:

- `MONGODB_URI`, `MONGODB_DB_NAME`
- `AUTH_SECRET` (at least 32 characters)
- `NEXT_PUBLIC_APP_URL`
- Google OAuth client ID/secret/callback URI
- `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, `GMAIL_OAUTH_REFRESH_TOKEN`, `GMAIL_SENDER_EMAIL`
- Google Drive OAuth client ID/secret/refresh token and root folder ID
- Event start/deadline/timezone/upload settings

Private keys and API secrets must not use a `NEXT_PUBLIC_` prefix.

## Commands and validation

```sh
npm run dev
npm run build
npm run start
npm run typecheck
npm run lint
npm test
```

Credential-independent unit tests cover repository selection/no production memory fallback, seed guards/idempotence, team normalization and uniqueness, allocation balancing/concurrent requests in the memory adapter, one-use password reset tokens, one-submission finalization, and upload rules/deadlines. MongoDB transaction contention and all third-party API calls still require integration tests against disposable/configured services.

## Vercel deployment

1. Import the repository into Vercel. Set **Framework Preset** to **Next.js**, **Root Directory** to the repository root, and **Build Command** to `npm run build` (or leave Vercel's Next.js default). Do not set the Output Directory to `dist`; clear/disable any Output Directory override so Vercel uses Next.js output automatically.
2. Add production environment variables in the Vercel project settings. Set `DEMO_MODE=false`.
3. Ensure the Atlas user is least-privileged and Atlas network access permits the deployment.
4. Register the Google OAuth callback URL for the production domain and bootstrap the first admin against the intended Atlas database.
5. Configure Gmail API sending for the organizer mailbox and Drive OAuth access to the organizer-controlled folder.
6. Deploy and verify `/`, `/login`, `/admin`, team login, settings, reset email and a small direct-to-Drive upload.

MongoDB transactions require an Atlas replica set, as provided by Atlas clusters. Never run the seed command against production unless intentionally authorized and explicitly enabled.

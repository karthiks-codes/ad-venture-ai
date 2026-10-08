# ADventure Creative Hub

Build the initial full-stack application for an event called “ADventure 2026 — One Product. Endless Possibilities.” This is a real competition operations portal, not a generic landing-page template.

IMPORTANT PRODUCT/STACK REQUIREMENTS
- Repository/project name: ad-venture-ads
- Strong preference: Next.js App Router + TypeScript. If the current Lovable runtime cannot generate Next.js, preserve the architecture and code organization so it can be exported and continued as a Next.js project; do not substitute a different backend architecture without clearly isolating it.
- UI: Tailwind CSS + shadcn/ui, Lucide icons.
- Deployment target: Vercel.
- Database: MongoDB Atlas, accessed server-side with the official MongoDB Node driver or Mongoose. Do NOT use Supabase/PostgreSQL.
- All secrets/config must be environment variables. Create a complete .env.example with placeholders and never hard-code secrets.
- The generated UI should be production-oriented and responsive, but initially use mock/sample data where external credentials are unavailable.
- Do not build a fake upload that sends large video files through the app server.

EVENT CONTEXT
Organizer: BVRIT Hyderabad, College of Engineering for Women
Department: CSE (AI & ML)
Event: Innovation Day
Competition: ADventure
Tagline: “One Product. Endless Possibilities.”
Date: 13 October 2026 (Tuesday)
Time: 1:30 PM–4:00 PM
Venue: PB-G3, G4
Team size: 2 members
Challenge: teams receive a problem/product statement, conceptualize an advertisement, use AI for ad creation, create/edit a short video, submit it, and present it.
Evaluation criteria from the poster:
- Creativity & Originality
- Storytelling
- Persuasiveness
- Video Production Quality
- Overall Impact

DESIGN DIRECTION
Use the supplied event poster as the visual reference conceptually:
- premium cinematic advertising + futuristic creative studio aesthetic
- deep navy/near-black backgrounds
- electric cyan/blue glow
- violet/purple accent gradients
- white typography
- subtle circuit/tech-line motifs
- product photography/card imagery
- strong display typography for ADventure
- neon outlines/glows used selectively, not everywhere
- also build a polished LIGHT theme using white/off-white backgrounds, deep navy text, cyan and violet accents
- theme switcher must work
- avoid making it look like a cybersecurity dashboard; this is an AI advertising/creative competition
- mobile responsive
- accessible contrast and keyboard navigation
- use tasteful motion, not excessive animation
- landing page should feel like an event microsite, dashboard should feel like a professional competition control panel.

PUBLIC ROUTES / PAGES
1. /
   - Hero: ADventure, One Product. Endless Possibilities.
   - event date/time/venue
   - short explanation
   - primary Team Login CTA
   - rules CTA
   - “How it works” 7-step visual flow
   - evaluation criteria
   - event timeline/countdown
   - AI creation emphasis
   - footer with organizer/event details
2. /rules
   - complete rules and eligibility/format/process
   - clearly explain AI usage requirement
   - submission constraints
   - fairness/originality/copyright guidance
3. /problems
   - public overview only; do NOT reveal the actual randomly assigned team-specific challenge if configured as private
   - show example problem cards and how allocation works
4. /ai-tools
   - public overview of categories and sample tools
5. /login
   - team login with team ID/email + password
   - forgot/reset password flow
   - first-login forced password change

TEAM AUTH / TEAM EXPERIENCE
Teams are pre-created by the admin; there is no public sign-up.
Team data lives in MongoDB.
Each team should have:
- teamCode
- teamName
- member1Name
- member2Name
- email
- passwordHash
- mustChangePassword
- active/status
- createdAt/updatedAt
- problemAssignment fields
- submission status fields
Use secure server-side sessions/cookies and role-based authorization. Never store plaintext passwords.

FIRST LOGIN
After first successful login:
- force a password change before allowing competition actions
- after password change, take them to dashboard
- email should be used to send initial temporary credentials and password-reset links.

TEAM DASHBOARD
Route group such as /dashboard.
Sections:
- Overview
- Challenge
- AI Toolkit
- Submission
- Profile/Account
Use a clear progress tracker:
1 Account activated
2 Problem selected
3 Challenge reviewed
4 AI toolkit explored
5 Submission prepared
6 Submitted

PROBLEM ALLOCATION
There will be 10–12 STATIC problem statements.
The actual problem statement definitions should be static configuration/code, NOT stored as editable DB records.
However, the team-to-problem mapping MUST be stored in MongoDB.
Allocation must be server-side and fair/even.
When a team clicks “DRAW PROBLEM STATEMENT” for the first time:
- atomically assign one available problem
- keep allocations as balanced as possible across all problem statements
- never assign beyond configured capacity
- prevent double-click/race-condition duplicate assignments
- once assigned, the team cannot redraw
- admin can perform a controlled override/reassignment if necessary
- show a dramatic but tasteful reveal UI, then permanently show the assigned challenge.
Do not rely on client-side Math.random for authoritative assignment.
Make the allocation algorithm easy to understand and test.

Include 3 realistic sample problem statements for the initial UI:
A. Eco-friendly shoes
B. Coffee cups made from rice husk
C. Another consumer product such as a sustainable smart water bottle
Each problem should have:
- title
- short hook
- full description
- target audience
- key selling proposition
- creative constraints
- expected advertisement objective
- recommended output duration
- suggested creative angles
- relevant AI tool categories
These are examples and should be clearly replaceable in a static problem configuration file.

CHALLENGE DETAIL PAGE
After assignment show:
- “Your Challenge”
- product/problem
- mission
- target audience
- core message
- requirements
- constraints
- creative direction
- suggested AI workflow
- link to AI toolkit.

AI TOOLKIT
This is important: teams are expected to use AI to make advertisements.
Create a polished /dashboard/ai-toolkit page and a public /ai-tools page.
Categories:
- Script & Copy
- Image Generation
- Video Generation
- Voice / TTS
- Music / Sound
- Editing
- Optional supporting tools
Cards should contain:
- tool name
- category
- concise description
- external URL
- recommended badge where applicable
- “Open Tool” link.
The tools/configuration MUST be dynamic and stored in MongoDB so admin can add/edit/disable/reorder tools without changing code.
Do not hardcode the admin-managed toolkit into UI components.
Seed sample tools such as ChatGPT, Gemini, Claude, Runway, Kling, Google Veo, Pika, Adobe Firefly, Ideogram, ElevenLabs, Suno, Canva, CapCut. These are examples and must be editable/disableable.

AI DECLARATION
Before final submission, team must provide:
- AI tools used (multi-select from configured tools)
- brief description of how AI was used
- confirmation that the submission follows event rules
- originality/copyright acknowledgement
This should be stored in MongoDB.
Make this part of submission readiness.

SUBMISSION
Only ONE final video upload is permitted per team.
Once successfully finalized/submitted:
- no re-upload button
- no replace/delete from team UI
- show immutable submitted state
- admin may have a controlled administrative override, but this must be explicit and audited.
Expected video size: approximately 0.5–1 GB.
Potential volume: approximately 100–200 uploads in a day.
CRITICAL:
- NEVER proxy the video through Vercel/Next.js API routes.
- Use Google Drive direct/resumable upload architecture.
- Server should create/authorize a Google Drive resumable upload session and return the upload session URL/token needed by the browser.
- Browser uploads video bytes directly to Google Drive in resumable chunks.
- Vercel only handles small metadata/status operations.
- Store only metadata and Google Drive file/folder IDs/URLs in MongoDB.
- Show upload progress, pause/resume where supported, network error handling, and finalization.
- Prevent a second upload once a successful submission exists.
- Validate allowed file types, configured maximum size, and deadline server-side.
- Do not expose Google service-account private keys or refresh tokens to the browser.

GOOGLE DRIVE ORGANIZATION
Use a clear folder hierarchy under an organizer-configured root folder, preferably:
ADventure 2026/
  Submissions/
    ADV-001 - Team Name/
      final-video.mp4
      submission-metadata.json or equivalent small metadata if useful
    ADV-002 - Team Name/
      final-video.mp4
...
Folder creation should happen server-side.
Persist:
- driveFolderId
- driveFileId
- driveFileName
- driveFileSize
- driveWebViewLink if available
- uploadStartedAt
- uploadCompletedAt
- submission status
The Google Drive implementation must be isolated behind a service/module so credentials and provider details can be changed later.
Do not implement a fake local/Vercel file storage fallback for production.

EMAIL
Expected load: approximately 150–200 teams.
Use Resend as the recommended email provider because this is a transactional event workflow and the volume is modest.
Implement a provider abstraction so SMTP can be used later if needed.
Emails:
- initial credentials
- password reset
- optional submission confirmation
Use environment variables.
Do not send passwords after the first credential email except for reset flows; use secure reset links.
Create reusable email templates.

ADMIN
Admin is a simple protected /admin route.
Admin authentication should use Google OAuth.
Only explicitly allowed admin Google email(s) or configured Google account/domain may access /admin.
Do not create a public admin signup.
Admin dashboard is intentionally simple, not an enterprise system.

Admin pages/sections:
- /admin overview
- /admin/teams
- /admin/problems (view static problem configuration/allocation counts; no need to edit problem statements in DB)
- /admin/submissions
- /admin/ai-tools
- /admin/settings

ADMIN OVERVIEW
Show:
- total teams
- active teams
- first logins completed
- problem statements assigned
- unassigned teams
- submitted videos
- pending submissions
- allocation distribution
- recent activity
Use clean cards/tables.

ADMIN TEAMS
Table:
team code, team name, members, email, login status, assigned problem, submission status, timestamps.
Search/filter/sort.
Team detail view.
Allow controlled actions:
- activate/deactivate team
- reset temporary password / trigger credential email
- manually assign/reassign problem with confirmation
- reopen a submission only as an explicit emergency action
All sensitive admin actions should be logged.

ADMIN AI TOOLS / “SKILLS CONFIG”
The admin must be able to manage the AI toolkit from the dashboard:
- add tool
- edit tool
- enable/disable
- category
- description
- URL
- recommended flag
- display order
Persist this configuration in MongoDB.
Seed it with the sample tools above.

ADMIN SUBMISSIONS
Show:
- team
- problem
- file name
- size
- submitted time
- status
- Google Drive link
- AI declaration status
Allow “Open in Google Drive”.
No video bytes should be downloaded through Vercel just to display the admin table.

AUDIT LOG
Record important actions:
- login
- password change/reset
- problem assignment
- problem override
- upload start
- upload complete
- submission finalized
- admin actions
Keep enough metadata for event-day troubleshooting.

DEADLINES / EVENT SETTINGS
Do not hardcode event timing into business logic.
Store configurable event settings in MongoDB:
- event start
- submission deadline
- event timezone (Asia/Kolkata)
- max video size
- allowed file types
- upload enabled/disabled
- event active/paused
Admin can view these settings and change them if needed.
Server-side deadline enforcement is mandatory.
Countdown is UI only; server is authoritative.

MONGODB DATA MODEL
Use MongoDB collections roughly:
- teams
- assignments or teamAssignments
- aiTools
- submissions
- aiDeclarations
- eventSettings
- auditLogs
- passwordResetTokens/session-related collection as appropriate
Do not create a problemStatements collection unless needed for caching; source of truth for problem statements is static config.
Use indexes for teamCode, email, assignment uniqueness, submission uniqueness, and relevant admin queries.
Make team assignment and one-upload enforcement concurrency-safe.

SECURITY
- server-side authorization for every team/admin protected operation
- secure, httpOnly, sameSite cookies
- password hashing with Argon2 or bcrypt
- rate limit login/reset endpoints
- validate all input server-side
- never trust client-side role/status/deadline
- prevent a team from accessing another team’s challenge/submission
- prevent duplicate assignment and duplicate final submission
- never expose secrets in client bundles
- include security-conscious error handling without leaking internals.

ENVIRONMENT
Create .env.example containing placeholders for at least:
NEXT_PUBLIC_APP_URL=
MONGODB_URI=
MONGODB_DB_NAME=
AUTH_SECRET=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=
ADMIN_EMAILS=
RESEND_API_KEY=
EMAIL_FROM=
GOOGLE_DRIVE_CLIENT_EMAIL=
GOOGLE_DRIVE_PRIVATE_KEY=
GOOGLE_DRIVE_ROOT_FOLDER_ID=
GOOGLE_DRIVE_SHARED_DRIVE_ID=
EVENT_TIMEZONE=Asia/Kolkata
EVENT_START_AT=
SUBMISSION_DEADLINE=
MAX_VIDEO_SIZE_BYTES=
ALLOWED_VIDEO_TYPES=video/mp4,video/quicktime
Also include any other variables the implementation actually needs.
Document which Google Drive setup is expected (prefer Shared Drive/service-account access for organizer-controlled storage if applicable).

IMPORTANT GOOGLE DRIVE IMPLEMENTATION NOTE
The generated code should have a clear server module for Google Drive resumable upload session creation and browser-direct chunk upload. Do not route 0.5–1 GB files through Vercel. If the exact browser-direct Drive upload mechanics cannot be fully implemented in the first pass, build the UI and service abstraction honestly with a clearly marked TODO, rather than silently implementing a Vercel proxy.

SEED / DEMO MODE
Provide safe sample data for development:
- 6 sample teams
- 3 sample problem statements
- sample AI tools
- example assignment/submission states
But make it obvious these are demo data and do not use them in production automatically unless a seed command/environment flag is used.

CODE QUALITY
- TypeScript strict
- reusable components
- clear separation of UI, server actions/API, database access, auth, email, Google Drive service, static problem configuration
- no giant monolithic page
- no unnecessary dependencies
- meaningful loading, empty, error and success states
- README with local setup, MongoDB Atlas setup, Google OAuth setup, Resend setup, Google Drive setup, Vercel deployment, and .env instructions
- include .env.example
- include a basic testable allocation utility and submission-state rules.
- Do not claim external integrations are working unless credentials are configured.

INITIAL BUILD PRIORITY
1. High-quality public landing page and design system
2. Team login/first-login flow and dashboard shell
3. Problem draw/reveal UX with server-side allocation abstraction
4. Challenge detail and AI toolkit
5. Submission UI with direct Google Drive upload architecture
6. Admin dashboard
7. MongoDB integration
8. Email integration
9. audit/deadline/security hardening

The first implementation should be polished enough to demo end-to-end with mock/demo data, while keeping all real integrations behind production-ready service boundaries.

Do NOT use Supabase. Do NOT use PostgreSQL. Do NOT store videos on Vercel. Do NOT create a generic SaaS dashboard. This is ADventure 2026, a creative AI advertising competition, and the visual identity should clearly reflect the provided event poster.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f42e33b4-828b-410a-8890-b124c43c177e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

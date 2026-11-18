# Campus Marketplace — Web Development Third Evaluation

This project is **plain HTML, CSS, and browser JavaScript**, not React/Vite. It uses **Supabase Auth, PostgreSQL (with Row-Level Security), and Storage**. Supabase provides the required MongoDB replacement (as approved by the instructor).

## What's implemented

- Login/signup with BMU email checks, password recovery, editable profiles.
- Listings: search/filter/sort, details, image uploads, create/edit/delete, status.
- Wanted requests: create and browse, communicate with listing owners and request owners.
- Inbox: sends/loads messages; names resolved from `public.profiles` instead of generic labels.
- Third-evaluation API demo: Node.js + Express with local JSON file CRUD.

### Setup and test the website

```bash
# From project root. No npm install needed for the static website.
python -m http.server 8000
# Open http://localhost:8000
```

Use **two real BMU accounts** to test a real marketplace listing, initiate a conversation, send a message, log into the other account, and reply. Inbox polls messages every 5 seconds and checks for new conversations every 15 seconds. No Supabase Realtime publication is required for this polling approach.

**Important:** Four existing seeded listings in the current database have `owner_id = NULL`. These are sample/demo listings, not contactable sellers. Use a real student-created listing for the messaging demonstration. The listing details page labels unowned samples rather than showing a broken Contact Seller button.

### Node + Express and JSON-file API demonstration (for professor)

```bash
cd server
npm install
npm start
# Open http://127.0.0.1:3000/evaluation
```

The interactive `/evaluation` page shows:
- `GET /api/feedback` reads `server/data/feedback.json`.
- `POST /api/feedback` validates and writes a record.
- `PATCH /api/feedback/:id` modifies a saved record.
- `DELETE /api/feedback/:id` deletes one.
- `GET /api/health` responds with API status.

The Express server also provides **Supabase database CRUD endpoints**: `GET /api/listings`, `POST /api/listings`, `PATCH /api/listings/:id`, and `DELETE /api/listings/:id`. A signed-in student's Supabase **access token** must be sent as `Authorization: Bearer <access_token>` for writes; the same student's `owner_id` must be used on inserts, and Supabase RLS prevents editing anyone else's listing. The browser site continues calling Supabase directly for production; these optional Express proxy routes demonstrate the requested Express + database integration without needing MongoDB or an admin/service-role key. Never publish an access token in a repository or screenshot.

The Express server binds `127.0.0.1` by default and is **for local evaluation only**. The Express JSON file API is separate from the main Supabase marketplace, which persists its data to cloud PostgreSQL. Express is not deployed with Cloudflare Pages. Do not publish this unauthenticated JSON API to the public Internet.

### Verify local static project

```bash
node scripts/check-static.mjs
node --test tests/*.test.cjs
npm run build
```

The static build copies only `index.html`, `pages/`, `css/`, `js/`, `assets/`, and `_headers` to `dist/`; server files, migrations, and Git history are excluded.

### Deploy to Cloudflare Pages (GitHub-connected)

This is a **static multi-page website**. Do **not** select the Vite/React framework preset. Cloudflare Pages settings:

- Framework preset: **None**.
- Root directory: repository root.
- Build command: **`npm run build`**.
- Build output directory: **`dist`**.

After the first Cloudflare deployment, go to **Supabase Dashboard → Authentication → URL Configuration**. Set the site URL to the live `https://...pages.dev` origin, and add exact production redirect URLs including `https://...pages.dev/pages/login.html` and the password reset route `https://...pages.dev/pages/login.html?mode=recovery` as appropriate. Test confirmation and password reset links end-to-end. Add any custom domain separately.

Only the public **publishable** Supabase key is used in `js/supabase-config.js` by design; **do not** insert service-role or secret keys into browser files.

### Rubric and remaining caveats

1. External API calls: Supabase browser SDK calls remote Auth/PostgREST/Storage APIs, which satisfies external API use if the professor accepts it. There is no unrelated weather/news API (not needed for the marketplace).
2. Node/Express setup: provided in `server/` for evaluation; **the production site does not require it**.
3. Express save/fetch local JSON: provided in `server/data/feedback.json` using GET/POST/PATCH/DELETE.
4. Database CRUD: the browser uses Supabase directly; the local Express server additionally exposes protected Supabase listing CRUD routes for grading. Confirm whether the instructor requires the **production browser** to use Express routes rather than Supabase SDK calls. Making Express mandatory would require deploying the backend separately from Cloudflare Pages.

**Safety and access:** RLS policies currently restrict listing mutations and private messages. An optional SQL hardening plan is in `supabase/reviewed-optional-hardening.sql`; it has **not** been applied to the live database. Do not change the public `profiles` SELECT policy to expose personal details. Production readiness also needs testing of allowed-email enforcement on the backend, Supabase auth redirect URLs, and warnings in Supabase Database Advisors. Actual browser and multiple-account integration tests require valid credentials and network access.


## Fix: `127.0.0.1:5500` connection refused + `otp_expired` after email confirmation

These are **two separate problems**: (1) nothing was serving the website on 127.0.0.1:5500 when the browser followed Supabase's redirect, and (2) the email link was already used, expired or invalid. Restarting the website alone cannot repair an invalid email token; request a new verification email.

**Windows (PowerShell), from the `campus-marketplace` project root:**

```powershell
py -m http.server 5500 --bind 127.0.0.1
```

Keep that terminal open and visit `http://127.0.0.1:5500/pages/login.html`. Do **not** run this command inside the `server/` folder: its Express app uses port 3000 and serves a separate assessment API. You can use the VS Code *Live Server* extension instead, but ensure it is running on 127.0.0.1 port 5500 before clicking an email link.

**Supabase Dashboard:** Open your project → Authentication → URL Configuration. For this exact local setup, set **Site URL** to `http://127.0.0.1:5500/` (or use your permanent Cloudflare URL when deployed) and add the allowed **Redirect URL** `http://127.0.0.1:5500/pages/login.html` and `http://127.0.0.1:5500/pages/login.html?mode=recovery` (or use `http://127.0.0.1:5500/**` for local development only). `localhost` and `127.0.0.1`, and ports `5500` and `8000`, are **not interchangeable**. Any link previously sent to an old port may still redirect to that old port; new links pick up the updated settings. For Cloudflare, configure the production domain as Site URL and add the exact production callback URLs.

At `/pages/login.html`, click **Verification email expired or missing? Resend it**, enter your official BMU email, and request a fresh email. If the email address is already verified, sign in with your password instead. If you are trying to reset a password, use **Forgot password?** instead. Supabase email links are single-use; automated mail security scanners can sometimes consume them. Do not open the same confirmation link twice. The website now handles Supabase `#error=...&error_code=otp_expired` fragments by explaining the error and offering an in-app confirmation resend.

Security note: never copy the full password-reset or confirmation email URL into support chats; it may contain a single-use authentication token.

### Profile notice correction (18 November)

The profile page previously displayed an unconditional yellow notice saying that email confirmations were disabled. That notice was **hardcoded HTML**, not an authentication status from Supabase. It has been removed from `pages/profile.html` and its unused notice styling from `css/profile.css`. This is only a UI correction. Before public deployment, use Supabase Authentication settings to enable email confirmation and test confirmation links against the production redirect URL; do not interpret the notice's removal as proof that verification has been enabled.

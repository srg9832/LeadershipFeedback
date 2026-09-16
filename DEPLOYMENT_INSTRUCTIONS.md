# CAP Leadership Feedback — Detailed Deployment Instructions

These instructions install CAP Leadership Feedback into the **existing CAP Schedule Supabase project** and deploy the website as a separate GitHub Pages / PWA application.

Development target:

- Supabase project ref: `vosvdkkuiijywwmqzdiu`
- Supabase URL: `https://vosvdkkuiijywwmqzdiu.supabase.co`
- Suggested GitHub repository: `CAPLeadershipFeedback`
- App name: **CAP Leadership Feedback**

The migration is additive. It is designed not to delete CAP Schedule units, users, schedules, rooms, permissions, or history.

---

## Before you start

1. Make sure the existing **CAP Schedule** application is currently working.
2. Keep a copy of this ZIP untouched so you can return to the original deployment package.
3. In Supabase, confirm you are working in project `vosvdkkuiijywwmqzdiu` before running SQL.
4. If Supabase provides a database backup option for your plan, taking a backup first is a good precaution. At minimum, do not run the migration in a different project by accident.

The migration includes a preflight check. It refuses to continue if the CAP Schedule `profiles`, `units`, `user_unit_permissions`, `is_app_admin()`, or `set_updated_at()` foundation is missing.

---

# STEP 1 — Run the Supabase migration

1. Open the Supabase Dashboard.
2. Open the existing CAP Schedule project: `vosvdkkuiijywwmqzdiu`.
3. In the left menu choose **SQL Editor**.
4. Click **New query**.
5. On your computer open:

   `supabase/migrations/20260915_cap_leadership_feedback.sql`

6. Press **Ctrl+A**, then **Ctrl+C**.
7. Paste the entire SQL file into the Supabase SQL Editor.
8. Click **Run**.
9. Wait for the query to complete successfully.

Do not deploy the website yet if this step returns an error.

### What the migration adds

Shared CAP data:

- `members`
- `member_unit_assignments`
- `profiles.member_id`

Leadership Feedback data:

- `leadership_global_permissions`
- `leadership_unit_permissions`
- `leadership_encampments`
- `leadership_feedback`
- `leadership_audit_log`

It also adds Leadership-specific RLS policies, helper functions, and the secure RPCs used to save feedback and maintain the shared member roster.

### Initial App Administrator

At the end of the migration, existing CAP Schedule users with `profiles.is_app_admin = true` are copied into Leadership Feedback as Leadership App Administrators.

That means your existing CAP Schedule App Admin login should be able to log directly into CAP Leadership Feedback after deployment.

This bootstrap does **not** permanently tie the two app-admin roles together. After installation, Leadership Feedback uses its own Leadership permissions.

---

# STEP 2 — Verify the migration

1. Open another **New query** in Supabase SQL Editor.
2. Paste the contents of:

   `supabase/VERIFY_AFTER_INSTALL.sql`

3. Click **Run**.

You should see the new tables, functions, RLS status, shared units, and the Leadership App Admin bootstrap rows.

Pay particular attention to the final App Admin query. At least your existing CAP Schedule App Administrator should be present.

---

# STEP 3 — Deploy the Leadership user-admin Edge Function

This package uses a **new** Edge Function named:

`leadership-admin-users`

It does not replace the CAP Schedule `admin-users` Edge Function.

The function can reuse an existing Supabase Auth account by email, or create a new Auth account directly when needed. The Supabase service-role key remains server-side inside the Edge Function environment and is never placed in GitHub Pages.

### Open PowerShell in the extracted project folder

For example:

```powershell
cd "C:\Users\YOURNAME\Documents\CAP-Leadership-Feedback"
```

The prompt should be at the folder containing `index.html` and the `supabase` folder.

Verify the function exists:

```powershell
dir .\supabase\functions\leadership-admin-users\
```

You should see `index.ts`.

### Log into the Supabase CLI if needed

```powershell
npx supabase@latest login
```

Your browser may open so you can authorize the CLI.

### Link the local folder to the existing CAP Schedule project

```powershell
npx supabase@latest link --project-ref vosvdkkuiijywwmqzdiu
```

If the folder was already linked to that exact project, this is harmless.

### Deploy the function

```powershell
npx supabase@latest functions deploy leadership-admin-users --project-ref vosvdkkuiijywwmqzdiu
```

When it completes, open **Supabase Dashboard → Edge Functions** and verify that `leadership-admin-users` exists.

You do **not** put a service-role key in any website file. Supabase supplies its server-side environment variables to the deployed function.

---

# STEP 4 — Configure `config.js`

Open:

`config.js`

It already contains the correct project URL:

```js
supabaseUrl: "https://vosvdkkuiijywwmqzdiu.supabase.co"
```

The key is intentionally a placeholder:

```js
supabaseAnonKey: "PASTE_YOUR_EXISTING_CAP_SCHEDULE_ANON_KEY_HERE"
```

Open the working `config.js` from your existing CAP Schedule GitHub repository and copy the **same public anon/publishable key** into this file.

The finished file should look conceptually like:

```js
window.CAP_LEADERSHIP_CONFIG = {
  supabaseUrl: "https://vosvdkkuiijywwmqzdiu.supabase.co",
  supabaseAnonKey: "YOUR_EXISTING_PUBLIC_KEY",
  appName: "CAP Leadership Feedback",
  adminFunctionName: "leadership-admin-users"
};
```

The anon/publishable key is intended for browser applications. **Never** put a Supabase service-role key in `config.js`, GitHub, or any client-side file.

---

# STEP 5 — Create the GitHub repository

A clean repository name would be:

`CAPLeadershipFeedback`

1. Sign into GitHub.
2. Create a new repository.
3. Name it `CAPLeadershipFeedback`.
4. Public repositories work with GitHub Pages on standard GitHub accounts. Use your normal GitHub Pages settings for your account/plan.
5. Do not add a different starter website over the supplied files.

Upload the **contents** of the `CAP-Leadership-Feedback` folder to the repository root.

The repository root should contain at least:

```text
index.html
styles.css
app.js
config.js
manifest.json
service-worker.js
.nojekyll
assets/
supabase/
README.md
DEPLOYMENT_INSTRUCTIONS.md
DATABASE_DESIGN.md
QA_CHECKLIST.md
```

The `supabase/` folder is not required by GitHub Pages at runtime, but keeping it in the repository gives you source control for your database migration and Edge Function.

---

# STEP 6 — Enable GitHub Pages

In the GitHub repository:

1. Open **Settings**.
2. Select **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Choose branch **main**.
5. Choose folder **/(root)**.
6. Click **Save**.
7. Wait for GitHub to publish the site.

If your GitHub username is still `srg9832` and the repository is named `CAPLeadershipFeedback`, the resulting URL should normally be:

`https://srg9832.github.io/CAPLeadershipFeedback/`

Open the URL in a new browser tab.

---

# STEP 7 — Supabase Auth URL configuration

CAP Leadership Feedback uses normal email/password login, so routine login does not require an email redirect. It is still useful to authorize the new GitHub Pages URL for future password-reset/auth flows.

In Supabase:

1. Open **Authentication**.
2. Open **URL Configuration**.
3. Keep the existing CAP Schedule Site URL unless you intentionally want to change your primary auth landing page.
4. Add the Leadership Feedback GitHub Pages URL to the **Redirect URLs / allowed redirect URLs** list.

For example:

`https://srg9832.github.io/CAPLeadershipFeedback/**`

Do not remove the existing CAP Schedule URL.

---

# STEP 8 — First login

1. Open the GitHub Pages site.
2. Log in with the **same email and password** you already use for CAP Schedule.
3. If that account is a CAP Schedule App Admin, the migration should have bootstrapped it as a Leadership App Admin.
4. Open **Administration**.

At first, your existing login may not yet be linked to a CAPID. That is expected. Use **Administration → Users** to edit/link the account to its CAPID, member name, member type, and unit.

Once linked, `profiles.member_id` connects the Supabase login to the shared `members` record.

---

# STEP 9 — Build the shared member roster

The new `members` table is intended to become the common CAPID/member source for future applications.

In **Administration → Member List** you can:

- add CAPID records;
- edit first and last names;
- change Cadet/Senior member type;
- move a member to a different current unit when authorized;
- mark a member inactive or active;
- retain prior unit assignments in `member_unit_assignments`.

A CAP member does not need a login account. A login is only needed when that member needs to use an application.

### CAPID design

`members.id` is the database UUID primary key.

`members.capid` is the unique organization/business key used for lookup across applications.

This means correcting a CAPID later does not require rewriting every application foreign key.

---

# STEP 10 — Assign Leadership Feedback permissions

Leadership Feedback permissions are separate from CAP Schedule permissions.

Per-unit roles:

- Cadet Evaluator
- Cadet Reviewer
- Senior Evaluator
- Senior Reviewer
- Unit Admin

Application-wide / encampment roles:

- Encampment Evaluator
- Encampment Reviewer
- Encampment Admin
- Leadership App Admin

Important rules:

- Cadet accounts cannot receive Senior Evaluator or Senior Reviewer.
- Unit Admin does not grant Senior feedback visibility.
- Encampment Admin manages event setup but does not automatically see encampment feedback.
- Encampment Reviewer provides encampment report/trend visibility.
- Leadership App Admin has full Leadership Feedback access.
- Unit Admins can create/link users and assign local roles only for units they administer.

When adding a user, enter the email address of an existing CAP Schedule login to reuse that exact Auth account. For security, a Unit Admin can link an existing login only when that account is already associated with the selected unit through its shared member assignment, CAP Schedule unit permission/default unit, or existing Leadership permission. A Leadership App Admin can resolve cross-unit/unlinked accounts. If the email does not exist, the Leadership Edge Function can create the account directly using the initial password entered in the form.

---

# STEP 11 — Set up encampments

In **Administration → Encampment Events**:

1. Enter encampment name.
2. Enter location.
3. Enter start date.
4. Enter end date.
5. Keep it Active while it should appear as an Evaluation Unit.

Encampment Evaluators see active encampments in the Evaluation Unit selector.

Encampment Student and Encampment Cadre feedback is accepted only from **3 days before the encampment start date through the encampment end date**, inclusive. Outside that window the event can remain visible, but entry is locked.

Inactive/past encampments remain available in historical reports for authorized Encampment Reviewers/App Admins.

---

# STEP 12 — Confirm the Reports / eServices workflow

Open **Reports** with a reviewer account. The default internal tab is **Unit Feedback**.

1. Select the Unit or Encampment.
2. Confirm the running list is newest first.
3. Confirm the columns include Evaluation Date, CAPID, Member, Grade, **Pass / Retain in Grade**, Feedback Type, Evaluator, and View.
4. Phase I–IV records should show **Pass** for Promotion Approved and **Retain in Grade** for Sustained in Grade. Other form types show a dash when that decision does not apply.
5. The first 10 records remain visible when **Show Next 10** is clicked; the next records are appended underneath.
6. Change **Records to Show at a Time** if the eServices data-entry person wants a larger or smaller batch.
7. Open **Member Reports** to confirm the individual-member report and date-range tools still work.

The list only contains feedback that the signed-in reviewer is authorized to read under RLS. Senior feedback is not exposed to a Cadet Reviewer or Unit Admin merely because they can see the same unit.

---

# STEP 13 — Test before broad use

Use `QA_CHECKLIST.md` and test with at least:

- Leadership App Admin
- Unit Admin
- Cadet Evaluator
- Cadet Reviewer
- Senior Evaluator
- Senior Reviewer
- Encampment Evaluator
- Encampment Reviewer
- Encampment Admin

Also open CAP Schedule after running the migration and verify it still functions normally. This migration intentionally leaves its schedules and permission tables intact.

---

# STEP 14 — Install the PWA

The application is named **CAP Leadership Feedback**.

On supported Chrome/Edge desktop or Android browsers, an **Install App** button should appear in the header when the browser exposes the install prompt.

On other browsers/platforms, use the browser's normal **Add to Home Screen / Install** workflow.

The PWA does not intentionally cache confidential feedback records. If the device is offline, do not expect evaluation data to be available for viewing or submission.

---

# Updating the app later

When you change website code:

1. update the GitHub files;
2. if you changed `service-worker.js` or cached website assets, increment the cache name in `service-worker.js` (for example `shell-v1` → `shell-v2`);
3. if database changes are needed, create a **new migration file** instead of rewriting this migration after production use;
4. redeploy an Edge Function only when its source changes.

For production data, prefer additive migrations that preserve old feedback/history.

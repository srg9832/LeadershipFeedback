# CAP Leadership Feedback

Production GitHub Pages / Supabase build of the Civil Air Patrol Leadership Feedback application.

This package is designed to **extend the existing CAP Schedule Supabase project** rather than create another Supabase project. It reuses the existing Supabase Auth accounts and `units` table, then adds a shared CAP membership foundation plus Leadership Feedback-specific permissions and records.

## What is shared across CAP applications

- Supabase Auth login accounts (`auth.users`)
- `public.profiles`
- `public.units`
- **New:** `public.members` — organization-wide CAP member roster keyed by unique CAPID
- **New:** `public.member_unit_assignments` — current and historical unit assignments
- Login accounts are shared through Supabase Auth. Leadership permissions are assigned directly to those login accounts and do not require CAPID/member linkage

A CAP member does **not** need a login. Members may exist in the shared roster solely so applications can identify them by CAPID.

## What remains Leadership Feedback-specific

- `leadership_global_permissions`
- `leadership_unit_permissions`
- `leadership_encampments`
- `leadership_feedback`
- `leadership_audit_log`
- `leadership-admin-users` Edge Function

This separation keeps CAP Schedule permissions independent from Leadership Feedback permissions.

## Security model

The browser receives only the Supabase public/anon/publishable key. It never receives the service-role key.

Feedback visibility is enforced by Supabase Row Level Security (RLS), not merely by hidden buttons in the website. Senior feedback is separately protected from cadet feedback. Encampment administration does not automatically grant feedback viewing rights.

Feedback records are intentionally immutable after submission in this initial production build. Administrative roster and event data can be edited, while submitted feedback remains historical.


## Reports / eServices workflow

The Reports area opens to **Unit Feedback** by default. Authorized reviewers can select a Unit or Encampment and work down a newest-first running list containing the evaluation date, CAPID, member, grade, **Pass / Retain in Grade**, feedback type, evaluator, and a View button.

The list initially shows 10 records. **Show Next 10** appends the next records beneath the rows already on screen rather than replacing them. The reviewer can choose a different batch size from 1–100. **Member Reports** remains available as the second Reports tab for individual history and date-range analysis.

## PWA / installable app

The site is installable as **CAP Leadership Feedback** on supported phones, tablets, and computers when served over HTTPS by GitHub Pages.

The service worker caches only the application shell/static files. It intentionally does **not** cache Supabase feedback, authentication, or Edge Function traffic for offline use.

## Package contents

```text
CAP-Leadership-Feedback/
├── index.html
├── styles.css
├── app.js
├── config.js
├── manifest.json
├── service-worker.js
├── .nojekyll
├── assets/
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
├── supabase/
│   ├── migrations/
│   │   └── 20260915_cap_leadership_feedback.sql
│   ├── functions/
│   │   └── leadership-admin-users/
│   │       └── index.ts
│   └── VERIFY_AFTER_INSTALL.sql
├── DEPLOYMENT_INSTRUCTIONS.md
├── DATABASE_DESIGN.md
└── QA_CHECKLIST.md
```

Start with **DEPLOYMENT_INSTRUCTIONS.md**. Run the migration and deploy the Edge Function **before** putting the website live.

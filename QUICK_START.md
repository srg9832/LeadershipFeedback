# CAP Leadership Feedback — Quick Start

Use the existing **CAP Schedule** Supabase project. Do not create a new Supabase project.

1. In Supabase project `vosvdkkuiijywwmqzdiu`, open **SQL Editor** and run `supabase/migrations/20260915_cap_leadership_feedback.sql`.
2. Run `supabase/VERIFY_AFTER_INSTALL.sql` and confirm the new tables/functions and at least one Leadership App Admin.
3. From this project folder in PowerShell, run `npx supabase@latest login` if needed.
4. Run `npx supabase@latest link --project-ref vosvdkkuiijywwmqzdiu`.
5. Deploy the new function: `npx supabase@latest functions deploy leadership-admin-users --project-ref vosvdkkuiijywwmqzdiu`.
6. Copy the **same public anon/publishable key** used by CAP Schedule into `config.js`. Never use the service-role key in a website file.
7. Upload the contents of this folder to the root of a GitHub repository such as `CAPLeadershipFeedback`, then enable GitHub Pages from `main` / root.
8. Add the new GitHub Pages URL to Supabase **Authentication → URL Configuration → Redirect URLs** without removing the CAP Schedule URL.
9. Log in with the same account used by CAP Schedule. Existing Schedule App Admins are bootstrapped as Leadership App Admins by the migration.
10. In **Administration**, link your login to your CAPID, populate the shared Member List, assign Leadership permissions, and create encampment events as needed.
11. Test with `QA_CHECKLIST.md`, especially Senior confidentiality and the Reports → Unit Feedback list.
12. Install the site as **CAP Leadership Feedback** from the browser/PWA install option.

For screenshots-level detail and explanations, follow `DEPLOYMENT_INSTRUCTIONS.md`.

# Rollback / Recovery Notes

The migration is additive and intentionally preserves the existing CAP Schedule data model.

## If the migration fails before `COMMIT`

The migration runs inside a transaction (`BEGIN` / `COMMIT`). A normal SQL error before the final commit should roll back the transaction automatically, so the partial Leadership objects should not remain.

Read the Supabase SQL error, correct the cause, and rerun the migration only after confirming you are in the correct CAP Schedule project.

## If you want to remove the app before collecting real data

If you have not begun production use, the safest approach is still to take a database backup/snapshot first, then remove the Leadership-specific objects deliberately.

Do not blindly drop `members`, `member_unit_assignments`, or `profiles.member_id` once other CAP applications begin using the shared member foundation.

## After production use begins

Do **not** use a destructive rollback script. Submitted Leadership feedback is historical data and should be retained.

Use a new forward migration to correct schema/policy issues. If the website must be taken offline temporarily, disable/remove the GitHub Pages deployment while leaving the database records intact.

## Objects dedicated to Leadership Feedback

- `leadership_global_permissions`
- `leadership_unit_permissions`
- `leadership_encampments`
- `leadership_feedback`
- `leadership_audit_log`
- Leadership helper/RPC functions whose names begin with `leadership_` plus `is_leadership_app_admin`, `has_leadership_*`, and `can_read_leadership_feedback`
- `leadership-admin-users` Edge Function

## Shared objects added by this project

- `members`
- `member_unit_assignments`
- `profiles.member_id`

Treat these as shared infrastructure for future CAP applications, not as disposable Leadership-only objects.

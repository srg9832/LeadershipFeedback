# CAP Leadership Feedback — Database Design

## Shared CAP application foundation

```text
auth.users
    |
    | 1:1
    v
profiles ---------------------> default_unit_id -> units
    |
    | member_id (nullable)
    v
members
    |
    | 1:many
    v
member_unit_assignments ------> units
```

### `members`

The shared organization-wide CAP member table.

- UUID `id` is the database primary key.
- `capid` is unique and is the business/lookup key across CAP applications.
- CAPID is stored as text because it is an identifier, not a number used for arithmetic.
- Name and current Cadet/Senior classification live here.
- Grade is **not** stored here because grade changes; applications should snapshot grade at the time of each transaction/evaluation when historically important.
- A member may exist without a Supabase login.

### `member_unit_assignments`

Stores unit membership history rather than overwriting a single `members.unit_id` value.

The current assignment is the row where:

- `active = true`
- `is_primary = true`

When an authorized administrator moves a member, the previous row is closed and retained for history.

### Login accounts vs. CAP member records

Leadership login accounts and evaluated CAP members are intentionally separate concepts. `auth.users` / `profiles` identify who can sign in and which Leadership permissions an administrator grants. The shared `members` table identifies people being evaluated by CAPID. A `profiles.member_id` value may exist because another CAP application uses it, but Leadership permissions do not depend on that link.

## Leadership-specific permissions

```text
leadership_global_permissions
  - is_app_admin
  - encampment_evaluator
  - encampment_reviewer
  - encampment_admin

leadership_unit_permissions
  - cadet_evaluator
  - cadet_reviewer
  - senior_evaluator
  - senior_reviewer
  - unit_admin
```

These roles are intentionally independent from CAP Schedule's `user_unit_permissions`.

## Leadership Feedback records

`leadership_feedback` uses foreign keys to the shared member and evaluator login, but also stores snapshots:

- CAPID snapshot
- first/last name snapshot
- Cadet/Senior snapshot
- grade snapshot
- evaluator name/title snapshot
- unit/encampment at evaluation
- evaluation dates
- rating JSON
- comments/narratives/decision JSON

This keeps old feedback historically meaningful if a member later changes name, CAPID, grade, member type, or unit.

## Evaluation locations

Normal CAP units continue to use the existing shared `units` table.

Encampments use `leadership_encampments`. The website combines units and encampments into a single Evaluation Unit user experience without pretending that an encampment is a chartered CAP unit.

## Feedback immutability

This initial production design does not grant browser insert/update/delete rights directly on `leadership_feedback`.

New feedback is written through `leadership_save_feedback(jsonb)`, which validates permissions, member type, unit, and encampment date windows before inserting the record.

No feedback edit/delete workflow is exposed. This preserves the submitted historical record.

## RLS summary

- Cadet Evaluator: own Phase I–IV feedback for authorized unit(s).
- Cadet Reviewer: all Phase I–IV feedback for authorized unit(s).
- Unit Admin: local administration and cadet unit review; no automatic Senior access.
- Senior Evaluator: own Senior feedback for authorized unit(s), when an App Admin or Unit Admin grants that permission.
- Senior Reviewer: all Senior feedback for authorized unit(s), when an App Admin or Unit Admin grants that permission.
- Encampment Evaluator: own encampment records and entry access during active date window.
- Encampment Reviewer: all authorized encampment feedback/reports/trends.
- Encampment Admin: encampment setup only unless separately granted review/evaluator permissions.
- Leadership App Admin: full Leadership Feedback access.

## Future applications

Future CAP applications should reference `members.id` as a foreign key and use CAPID for human/business lookup.

Examples:

```text
uniform_inspections.member_id -> members.id
attendance.member_id          -> members.id
training_records.member_id    -> members.id
leadership_feedback.subject_member_id -> members.id
```

This avoids creating separate member rosters in every application.

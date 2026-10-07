# CAP Leadership Feedback — Production QA Checklist

## Existing CAP Schedule safety

- [ ] CAP Schedule still opens after the migration.
- [ ] Existing CAP Schedule user can still log in.
- [ ] Existing units still appear in CAP Schedule.
- [ ] Existing schedules/history still load.
- [ ] Existing Schedule permissions still work.

## Login / shared identity

- [ ] Existing CAP Schedule email/password logs into CAP Leadership Feedback.
- [ ] Existing Schedule App Admin was bootstrapped as a Leadership App Admin.
- [ ] Existing Auth email is reused rather than duplicated when granted Leadership permissions.
- [ ] New user creation works with email + initial password and sends no invitation email.

## Shared member roster

- [ ] Add a member with CAPID, first/last name, member type, and unit.
- [ ] CAPID lookup auto-populates the name in Feedback Entry.
- [ ] Edit a misspelled member name.
- [ ] Correct a CAPID and confirm existing member identity remains linked.
- [ ] Change a Cadet member to Senior.
- [ ] Mark a member inactive.
- [ ] Filter Active / Inactive / All.
- [ ] Enter new feedback for an inactive member and confirm the member reactivates.
- [ ] Move a member between units as App Admin and confirm prior assignment history remains in the database.
- [ ] A Unit Admin cannot take a member away from a unit they do not administer.

## Units

- [ ] Existing shared units load from CAP Schedule.
- [ ] Leadership App Admin can edit unit name/charter.
- [ ] Mark a unit inactive; it disappears from operational selectors.
- [ ] Historical feedback remains readable after a unit is inactive.
- [ ] Reactivate the unit.

## Cadet feedback

- [ ] Cadet Evaluator sees authorized normal unit(s).
- [ ] Normal unit shows Phase 1, 2, 3, and 4 forms only (plus Senior only when separately permitted).
- [ ] CAPID is before Last Name / First Name.
- [ ] Name auto-populates from CAPID.
- [ ] Grade remains manually selected from the rank dropdown.
- [ ] Inclusive Review Start can be blank.
- [ ] Inclusive Review End is required and defaults to today.
- [ ] Evaluator can view only feedback they personally entered.
- [ ] Cadet Reviewer can view all cadet feedback in authorized unit.

## Senior feedback confidentiality

- [ ] App Admin or Unit Admin can grant Senior Evaluator/Reviewer without linking the login to a CAP member.
- [ ] Senior Evaluator can submit Senior feedback in authorized unit.
- [ ] Senior Evaluator sees only Senior records they entered unless also Senior Reviewer.
- [ ] Senior Reviewer sees Senior feedback in authorized unit.
- [ ] Cadet Reviewer cannot see Senior feedback.
- [ ] Unit Admin alone cannot see Senior feedback.
- [ ] Encampment Admin alone cannot see Senior feedback.

## Encampments

- [ ] Encampment Admin can add event name/location/start/end/active status.
- [ ] Encampment Admin can edit existing event name and dates.
- [ ] Encampment Evaluator sees active encampments in Evaluation Unit selector.
- [ ] Selecting a normal unit shows normal Phase forms, not encampment forms.
- [ ] Selecting an encampment shows only Encampment Student and Encampment Cadre.
- [ ] Entry opens exactly 3 days before start date.
- [ ] Entry remains open through end date.
- [ ] Entry is locked before/after the allowed range.
- [ ] Inactive encampment cannot accept new entries.
- [ ] Encampment Reviewer can see historical encampment reports/trends.
- [ ] Encampment Admin without Reviewer cannot read confidential encampment feedback.

## Reports

### Unit Feedback

- [ ] Reports opens to **Unit Feedback** by default.
- [ ] Unit/Encampment selector shows only locations the reviewer is authorized to review.
- [ ] Running list is newest first.
- [ ] Columns show Evaluation Date, CAPID, Member, Grade, Pass / Retain in Grade, Feedback Type, Evaluator, and View.
- [ ] Promotion Approved displays **Pass**.
- [ ] Sustained in Grade displays **Retain in Grade**.
- [ ] Forms without a promotion decision display a dash in that column.
- [ ] First 10 records display by default.
- [ ] **Show Next 10** appends rows underneath the first 10 instead of replacing them.
- [ ] Records-to-show count accepts a custom batch size from 1–100.
- [ ] Senior rows appear only when the current user's Senior-review permissions allow them.

### Member Reports

- [ ] Member Reports defaults to last 1 year.
- [ ] 1 Month preset works.
- [ ] 3 Months preset works.
- [ ] 6 Months preset works.
- [ ] 1 Year preset works.
- [ ] Custom start/end range works.
- [ ] Unit/Encampment selector filters first.
- [ ] Cadet/Senior report type filters second.
- [ ] Member list reflects selected unit and type.
- [ ] Encampment member list comes from that encampment's records.

## Unit Trends

- [ ] Normal unit Cadet trends show only Phase I–IV categories.
- [ ] Normal units never show Encampment Cadre categories such as Personal Integrity / Safety Focus.
- [ ] Encampment trends show only Encampment Student/Cadre categories.
- [ ] All Units excludes encampment feedback.
- [ ] Senior unit trends contain only Senior feedback categories.
- [ ] Date presets/custom dates work.

## Administration permissions

- [ ] Unit Admin can manage local users/member roster for authorized unit only.
- [ ] Unit Admin can grant Cadet Evaluator/Reviewer, Senior Evaluator/Reviewer, and Unit Admin locally.
- [ ] Unit Admin cannot grant Leadership App Admin or encampment-wide roles.
- [ ] Leadership App Admin can manage every unit and global role.
- [ ] Application prevents removing the last Leadership App Admin.

## PWA / security

- [ ] GitHub Pages site is served over HTTPS.
- [ ] Install App appears/works on a supported browser.
- [ ] App launches as `CAP Leadership Feedback` after installation.
- [ ] `config.js` contains only the public anon/publishable key, never the service-role key.
- [ ] Disconnect network and confirm confidential feedback is not available from an intentional offline data cache.
- [ ] Browser dev tools/network calls show Supabase requests governed by authenticated sessions/RLS.

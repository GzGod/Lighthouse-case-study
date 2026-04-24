# KAIO baseline alignment design

## Goal
Unify the reporting scope so KAIO is counted as part of the baseline sample set. "Flagship" remains only a project label and narrative tag, not a separate counting dimension in homepage or Matrix copy.

## Decision
- KAIO stays `is_baseline: 1`
- `baselineCount` includes KAIO
- Matrix and homepage copy must not present a separate "baseline + flagship sample" counting structure
- "Flagship" may still appear as a row tag, project label, or off-range narrative note for KAIO

## Scope
1. Update Matrix title and related wording so it no longer depends on `nonBaselineCount`
2. Remove the independent-count implication from any copy that frames flagship samples as outside baseline statistics
3. Keep existing KAIO off-range chart note if it is purely presentational and does not imply exclusion from baseline
4. Extend static regression coverage so future edits cannot reintroduce the split-count wording

## Data model impact
No schema or seed change is needed for this pass because the intended state is already:
- KAIO seeded as `is_baseline: 1`
- baseline aggregation includes KAIO

## UI/content impact
- Matrix title should describe the full baseline table directly
- Any "flagship" mention should read as a descriptive tag, not a separate sample bucket
- Scatter note and KAIO note can remain as display guidance if they only explain off-range plotting

## Files expected to change
- `i18n.jsx`
- `app.jsx` if `nonBaselineCount` is removed or left unused
- `scripts/static-regression-check.js`

## Testing
- Run `npm test`
- Confirm static checks cover:
  - no Matrix title wording that splits baseline and flagship counts
  - KAIO still marked as flagship tag only
  - dynamic Matrix reference labels remain intact

## Out of scope
- Runtime browser verification
- Railway schema/data verification
- postMessage preview behavior verification

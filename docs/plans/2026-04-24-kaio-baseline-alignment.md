# KAIO Baseline Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the case-study reporting scope so KAIO counts inside the baseline sample set while "flagship" remains only a descriptive tag and off-range narrative label.

**Architecture:** Keep the data model unchanged because KAIO is already seeded as `is_baseline: 1`, then remove the last UI copy that implies a separate flagship count. Lock the decision in with static regression checks so future wording edits cannot reintroduce a split between baseline and flagship sample counts.

**Tech Stack:** Vanilla React via Babel JSX, static HTML seed data, Node.js regression script, npm

---

### Task 1: Add a failing regression check for the split-count wording

**Files:**
- Modify: `scripts/static-regression-check.js`
- Test: `scripts/static-regression-check.js`

**Step 1: Write the failing test**

Add a regression assertion that fails when Matrix table copy still presents a separate baseline-plus-flagship counting structure.

```js
test('Matrix table title should not split baseline and flagship counts', () => {
  assert.ok(!/matrix\.table\.title":\s*".*\{nonBaselineCount\}.*旗舰样本/.test(i18n), 'zh Matrix title still splits baseline and flagship counts');
  assert.ok(!/matrix\.table\.title":\s*".*\{nonBaselineCount\}.*flagship samples/.test(i18n), 'en Matrix title still splits baseline and flagship counts');
});
```

**Step 2: Run test to verify it fails**

Run: `cd "E:/vibe/Lighthouse case study" && npm test`

Expected: FAIL with a message showing that `matrix.table.title` still includes `{nonBaselineCount}` plus flagship wording.

**Step 3: Do not change implementation yet**

Keep the product code unchanged for this step. The purpose is to confirm the regression exists before editing copy.

**Step 4: Run test again only if needed to confirm failure is stable**

Run: `cd "E:/vibe/Lighthouse case study" && npm test`

Expected: Same FAIL.

**Step 5: Commit**

```bash
git add scripts/static-regression-check.js
git commit -m "test: cover kaio baseline wording"
```

### Task 2: Remove the split-count wording from Matrix copy

**Files:**
- Modify: `i18n.jsx`
- Test: `scripts/static-regression-check.js`

**Step 1: Write the minimal copy change**

Replace the Matrix table title so it describes the full baseline table directly, without a separate flagship count.

Use wording in this shape:

```js
"matrix.table.title": "完整数据表 · {baselineCount} 个基准项目"
```

```js
"matrix.table.title": "Full data table · {baselineCount} baseline projects"
```

Do not change the KAIO tag text or the off-range note in this step.

**Step 2: Run the targeted regression check**

Run: `cd "E:/vibe/Lighthouse case study" && npm test`

Expected: PASS for the new Matrix-title regression check and the previously existing checks.

**Step 3: Verify the remaining flagship wording is narrative-only**

Read and confirm these strings still behave as labels instead of count dimensions:
- `matrix.kaio_note`
- `tag.flagship`
- `matrix.nonbase` only if it is still used for true non-baseline rows, not for KAIO baseline presentation

No code change is needed unless one of them still implies KAIO is outside baseline statistics.

**Step 4: Re-run the full static regression suite**

Run: `cd "E:/vibe/Lighthouse case study" && npm test`

Expected: PASS.

**Step 5: Commit**

```bash
git add i18n.jsx scripts/static-regression-check.js
git commit -m "fix: align kaio wording with baseline scope"
```

### Task 3: Remove or neutralize unused split-count plumbing

**Files:**
- Modify: `app.jsx`
- Test: `scripts/static-regression-check.js`

**Step 1: Check whether `nonBaselineCount` still drives any user-visible copy**

Inspect `buildStatsVars()` and grep for `nonBaselineCount` usage.

Run: `cd "E:/vibe/Lighthouse case study" && grep -R "nonBaselineCount" -n app.jsx i18n.jsx app-part3.jsx scripts/static-regression-check.js`

Expected: Either only the removed Matrix title used it, or no remaining meaningful UI dependency exists.

**Step 2: Apply the smallest cleanup**

Choose exactly one:
- If `nonBaselineCount` is now unused, remove it from `buildStatsVars()`
- If some harmless future-safe usage remains, keep it but ensure it drives no flagship-vs-baseline count wording

Minimal removal shape:

```js
return {
  totalCount: projects.length,
  baselineCount: stats.baselineCount,
  totalBudgetLabel: budgetK,
  totalImpFmt: new Intl.NumberFormat('en-US').format(stats.totalImp),
  totalImpLabel: impM,
  totalTweets: stats.totalTweets,
  baselineTweets: stats.baselineTweets,
  peakErWho: stats.peakErProject?.name || '—',
  lowestCpmWho: stats.lowestCpmProject?.name || '—',
  lowestCpeWho: stats.lowestCpeProject?.name || '—',
  maxImpWho: stats.maxImpProject?.name || '—',
};
```

**Step 3: Run the regression suite**

Run: `cd "E:/vibe/Lighthouse case study" && npm test`

Expected: PASS.

**Step 4: Sanity-check against current design decision**

Confirm all of these are true:
- KAIO is still `is_baseline: 1` in `Lighthouse Case Study.html`
- KAIO is still `is_baseline: 1` in `server/db.js`
- `matrix.table.title` no longer mentions a separate flagship count
- `matrix.kaio_note` still only explains off-range display behavior

**Step 5: Commit**

```bash
git add app.jsx i18n.jsx scripts/static-regression-check.js
git commit -m "refactor: drop split-count wording support"
```

### Task 4: Final verification before handoff

**Files:**
- Verify: `i18n.jsx`
- Verify: `app.jsx`
- Verify: `Lighthouse Case Study.html`
- Verify: `server/db.js`
- Verify: `scripts/static-regression-check.js`

**Step 1: Run the full test command**

Run: `cd "E:/vibe/Lighthouse case study" && npm test`

Expected: All checks PASS.

**Step 2: Do a final static wording audit**

Read and verify these locations:
- `i18n.jsx` Matrix title copy
- `i18n.jsx` KAIO note copy
- `Lighthouse Case Study.html` KAIO seed row
- `server/db.js` KAIO seed row

Expected result:
- Baseline counting includes KAIO
- "Flagship" survives only as a descriptive label or note
- No homepage or Matrix title copy implies a separate flagship count bucket

**Step 3: Record residual risk**

Document in the handoff summary that this is still a static-only verification because there is no local PG/server runtime verification in this environment.

**Step 4: Commit**

```bash
git add app.jsx i18n.jsx scripts/static-regression-check.js "Lighthouse Case Study.html" server/db.js
git commit -m "test: lock kaio baseline reporting scope"
```

**Step 5: Handoff summary**

State exactly:
- what wording changed
- whether `nonBaselineCount` was removed or left unused
- that KAIO remains baseline in both HTML seed and DB seed
- that runtime browser verification is still pending

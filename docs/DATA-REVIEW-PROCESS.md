# Data review process — universities, programs, deadlines

*Created 2026-07-03. Owner: Adi. Applies to `data/institutions.json`, `data/programs.json`, and admission-related fields.*

## Why

Users clicked university/program links that led to wrong pages, and 292/357 programs carry `deadlineYear: 2026` — all of which go stale when the admission cycle wraps in September 2026. Institution and program data decays on a yearly rhythm; this process catches the decay before students do.

## The toolchain

| Command | What it does | Blocking? |
|---|---|---|
| `npm run data:validate` | Structural integrity (ids, refs, formats) | Yes — run before every data commit |
| `npm run data:links` | Checks all 199 URLs; flags BROKEN, HOME-REDIRECT (deep link → homepage), CROSS-DOMAIN | No — writes `reports/link-check-<date>.md` |
| `npm run data:review` | Full review report: stale `deadlineYear`, missing URLs/`lastReviewed`/tuition, + folds in link-check results | No — writes `reports/data-review-<date>.md` |
| `npm run data:freshness` | Flags records with `lastReviewed` older than thresholds (programs 12mo, careers/institutions 24mo) | No |

`data:links` needs open internet — run it on your machine, not in CI sandboxes.

## Cadence

- **Monthly (5 min):** `npm run data:links`. Fix anything BROKEN or HOME-REDIRECT the same day — a dead link on a result page costs more trust than a missing program.
- **Yearly full review (September, before the new admission cycle):** `npm run data:links && npm run data:review`. Work through every CRITICAL: each program's `admission.deadline`, `deadlineYear`, `tuition`, and `url` gets re-verified against the university site. This is the big one — plan 2-3 sessions.
- **Spring touch-up (March-April):** universities publish the summer admission calendars around now. Re-run `data:review`; update deadlines that were "TBD" in September.

## The one rule that makes it work

**Any time you manually verify a record against the source, stamp it:** set `lastReviewed: "YYYY-MM-DD"` on that program/institution. The freshness and review scripts are only as good as these stamps. (Currently 337/357 programs and all 163 institutions are unstamped — the first full review pass should fix that as it goes.)

## Fixing findings

- **Dead / homepage-redirecting link:** find the current page via the university site's search or sitemap. If the program genuinely no longer exists, don't delete silently — set a note, remove it from matching, and log it in the review report commit message.
- **Stale `deadlineYear`:** verify the new cycle's dates on the university admission page. If not yet published, keep the old text but set `deadline: "de confirmat <month>"` and leave `deadlineYear` at the new cycle so it stays visible in the next review.
- **Missing `deadlineYear`:** 65 programs have free-text deadlines with no year — add the year so staleness detection can see them.
- **Missing URL:** 278 programs and 43 institutions have none. Not urgent as a backfill project; add opportunistically whenever a record is touched, and prioritize programs that appear most in match results.

## Definition of done for a review cycle

1. `npm run data:links` → zero BROKEN, zero HOME-REDIRECT.
2. `npm run data:review` → zero CRITICAL.
3. `npm run data:validate` passes.
4. Reports committed under `reports/` (they're the audit trail; prune ones older than 2 years).

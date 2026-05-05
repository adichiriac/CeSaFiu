# Profil Complet — pilot-free bundle, future paid positioning

Status: **decided** (2026-05-05). Current release keeps Profil Complet **free during the pilot**. The code keeps a single bundle surface so we can add payment/entitlement later without reworking routing, copy shape, or consent gates.
Owner: Adi.
Drives: copy in `apps/web/messages/{ro,en}.json`, gates in `apps/web/src/app/[locale]/test/[slug]/page.tsx` and `apps/web/src/app/api/match/route.ts`, UI in `results-client.tsx` + `profile-client.tsx` + landing + `components/profil-complet-card.tsx`.
Lawyer-relevant: yes — read §8 before the DPIA call.

---

## 1. Decision

**One bundle: "Profil Complet" (`profil-complet`).** During the pilot it is free. Later it should become one paid SKU that bundles IPIP-NEO-60 + Vocațional Complet (60-item O*NET) + the detailed PDF report. Single bundle, future single payment, single parent-consent gate.

The free tier stays the same: scenarii (12), personalitate scurt (15-item Big5), vocațional scurt (20-item Holland). Free tier is always available, including for pending_parent users.

The two deep tests stay bundled in the product model. They are not shown as separate standalone paid products. During the pilot the user can start Profil Complet for free unless they are `pending_parent`.

Future target price: **19 EUR**. Do not show it as a current charge while the pilot is free.

## 2. Why bundle, not à la carte

- Cleaner consent story for the regulator: one deep product surface → one consent grant. Two SKUs would mean two consent moments, two future payment flows, and a UX with a half-unlocked profile that's confusing to explain.
- Cleaner matcher logic: `profile.has_paid_bundle` is one bit. With separate SKUs the matcher would need to handle "deep Big5 but short vocational" combinations.
- Cleaner copy: the short tests are "explore," Profil Complet is "decide." During the pilot both are free; later this can become the free vs paid distinction.
- Honest about value: the deep report's value comes from combining both deep instruments. Splitting them makes each weaker on its own — IPIP-NEO-60 alone is useful but vocational-deep is what carries the matching weight in this product.

The cost later: less revenue from users who would only want one of the two tests. Acceptable for a first paid cycle after we validate accuracy and willingness-to-pay; revisit if data shows demand for à la carte.

## 3. Pilot vs future paid feature matrix

| | Short tests | Profil Complet during pilot | Future paid Profil Complet |
|---|---|---|
| Scenarii (12 itemi) | ✓ | ✓ | ✓ |
| Personalitate Big5 (15 itemi) | ✓ | ✓ | ✓ |
| Vocațional Holland (20 itemi) | ✓ | ✓ | ✓ |
| IPIP-NEO-60 (60 itemi) | — | ✓ | ✓ |
| Vocațional Complet O*NET (60 itemi) | — | ✓ | ✓ |
| Career matches (top 6, MMR) | ✓ | ✓ (more confident) | ✓ (more confident) |
| Detailed PDF report | — | Pilot/report preview | ✓ |
| Save careers | ✓ (after 16+ self-consent or parent confirm) | ✓ (after parent confirm if under 16) | ✓ (after parent confirm if under 16) |
| Payment/entitlement check | — | — | required before launch |
| Match confidence | low–medium | medium–high | medium–high |

Match confidence wording above is for internal use; in the UI we show the existing 0–1 confidence number, not the words "low/medium/high."

## 4. The "better accuracy" claim — defensible language

We are NOT claiming clinical-grade or professional-grade — neither test is a clinical instrument and that wording invites trouble.

We ARE claiming:

- "60 itemi validați științific" (already in use for IPIP). True for IPIP-NEO-60 (Goldberg's IPIP, validated against NEO-PI-R).
- "Mai detaliat" / "mai precis" — defensible because more items measure each Big5 dimension and each Holland code with lower standard error of measurement than 15- or 20-item short forms. Test-retest reliability for full IPIP-NEO is published in the .80–.90 range per dimension; short Big5 forms (Mini-IPIP, BFI-10) are typically .65–.75. Same logic applies to O*NET 60-item vs Holland short form.
- "Sub-faţete" / "sub-facets" — the 60-item versions distinguish facets within each dimension that 15-item versions cannot; this is the honest mechanical reason for "mai precis."

What to AVOID in copy:
- "Profesional" / "clinical" / "diagnostic" — not what these are.
- "100% accurate" or any precision number we can't source.
- Comparisons to specific competing products by name.

What to PUT in a footnote / "ce înseamnă mai precis?" expander:
- "Testele lungi măsoară fiecare dimensiune cu mai mulţi itemi, ceea ce reduce eroarea standard a scorului. Profilul tău e mai stabil în timp şi mai detaliat pe sub-faţete."

## 5. Under-16 (pending_parent) experience

| Surface | Free user (16+ or parent-confirmed) | Pending_parent user |
|---|---|---|
| Landing — free tests cards | normal | normal |
| Landing — Profil Complet card | normal CTA, free-in-pilot copy | **disabled** card with "NEVOIE DE ACORD PĂRINTE" badge + short consent message |
| `/test/scenarii` etc | accessible | accessible |
| `/test/ipip-neo-60` | accessible | server-rendered consent panel (current behavior) |
| `/test/vocational-deep` | accessible | server-rendered consent panel |
| Results page — Profil Complet CTA | normal, free-in-pilot copy | disabled CTA (current behavior) |
| Profile — Profil Complet card | normal | disabled with consent message (NEW pattern) |
| `/api/match` with deep scores | scored | 403 (extend current IPIP gate to also cover vocationalDeepRaw) |

Shape: the user always sees what they're missing. Hiding the cards entirely was rejected because (a) it removes the upsell, (b) the parent giving consent should be able to see what they're consenting to.

## 6. Copy — RO

**Landing — Profil Complet card (replaces standalone IPIP/vocational-deep cards)**

```
Eyebrow:  PROFIL COMPLET · GRATUIT ÎN PILOT
Title:    Mai precis. Mai detaliat.
Body:     60 itemi Big Five validaţi ştiinţific + 60 itemi vocaţional + raport PDF complet.
          Foloseşti rezultatul ca să decizi între opţiuni reale: facultate, școală
          profesională, primul job.
Price:    Gratuit în pilot
CTA:      ÎNCEPE PROFILUL COMPLET →
```

**Landing — Profil Complet card, pending_parent variant**

```
Eyebrow:  PROFIL COMPLET · GRATUIT ÎN PILOT
Title:    Mai precis. Mai detaliat. Pentru când contează.
Body:     (same)
Badge:    NEVOIE DE ACORD PĂRINTE
CTA:      (disabled) DISPONIBIL DUPĂ ACORDUL PĂRINTELUI
Footer:   Gratuit în pilot. Sub 16 ani: disponibil după acordul unui părinte sau tutore.
```

**Consent-required panel (replaces current `consentRequiredLead` text)**

```
Eyebrow:  ACORD PĂRINTE NECESAR
Title:    Profilul Complet are nevoie de acord părinte
Lead:     Dacă ai sub 16 ani, poţi continua testele gratuite (scenarii,
          personalitate scurt, vocaţional scurt). Profilul Complet —
          IPIP-NEO-60 + Vocaţional Complet + raport detaliat — este gratuit
          în pilot şi devine disponibil
          după acordul unui părinte sau tutore.
CTA:      CONTINUĂ CU TESTELE GRATUITE
```

**Profile page — Profil Complet section**

```
Eyebrow:  PROFIL COMPLET
Title:    Vrei un profil mai precis?
Body:     Două teste lungi şi un raport detaliat care arată exact ce te
          recomandă pentru fiecare carieră.
CTA:      VEZI PROFILUL COMPLET →
```

Pending_parent variant of profile card mirrors the landing pattern.

**Footnote / "ce înseamnă mai precis?" expander**

```
Testele lungi măsoară fiecare dimensiune cu mai mulţi itemi, ceea ce reduce
eroarea standard a scorului. Profilul tău e mai stabil în timp şi mai
detaliat pe sub-faţete.
```

## 7. Copy — EN

```
Eyebrow:  COMPLETE PROFILE · FREE IN PILOT
Title:    More precise. More detailed.
Body:     60-item scientifically validated Big Five + 60-item vocational test
          + full PDF report. Use the result to choose between real options:
          university, vocational school, first job.
Price:    Free during pilot
CTA:      START COMPLETE PROFILE →
```

```
(pending_parent)
Badge:    PARENT CONSENT REQUIRED
CTA:      (disabled) AVAILABLE AFTER PARENT CONSENT
Footer:   Free during the pilot. Under 16: available after a parent or guardian consents.
```

```
(consent panel)
Eyebrow:  PARENT CONSENT REQUIRED
Title:    Complete Profile needs parent consent
Lead:     If you are under 16, you can keep using the free tests (scenarios,
          short personality, short vocational). Complete Profile — IPIP-NEO-60
          + Full Vocational + detailed report — is free during the pilot and
          becomes available after a parent or guardian confirms.
CTA:      CONTINUE WITH FREE TESTS
```

## 8. Lawyer DPIA one-pager (for the consult)

**Product summary.** AI-assisted career and education matching for Romanian students, ages 10+ (current product targets 14–18; expanding to K-12). Current pilot has two surfaces:

- Free: short psychometric screening (scenarii, 15-item Big5, 20-item Holland). Results live client-side only (browser localStorage); we never persist test answers or scores server-side. Server-side `/api/match` is a stateless scoring service — receives scores, returns matches, no DB write.
- Profil Complet (free during pilot; future target paid SKU at 19 EUR): two long psychometric instruments (60-item IPIP-NEO Big5, 60-item O*NET vocational) + a detailed report surface. This is the only product where deep psychometric data is generated.

**Data we persist on identified users (any age).**
- `profiles`: user_id, age_band, consent_status, optional display name, HMAC of parent email (for under-16). No raw test scores.
- `saved_careers`: user-saved career IDs.
- `consent_records`: audit log (user_id, event, HMAC of IP and user-agent).
- `parent_consent_tokens`: HMAC of issued token, child user_id, HMAC of parent email, 7-day TTL.

We do not currently persist test answers or scores on the server, including for Profil Complet users. The future PDF/report output should be generated on demand from client-submitted scores unless the lawyer consult changes this — flagged as an open question in §9.

**Why we gate Profil Complet for under-16s and not the short tests.**
- The free tests are screening-grade, run client-side, with no server persistence on minors. The user's data never leaves their browser unless they sign in and save a career, which itself requires consent for under-16s.
- Profil Complet generates a deeper psychometric profile. Later, it may also require payment and produce a stored PDF output. The depth alone is enough reason to require a parent for under-16 users during the pilot; payment will add a second gate later.
- Romanian DPA's reading of GDPR Art 8 puts the digital-consent threshold at 16. We treat 13–15 (and 10–12 in the new model) as needing parental consent for any non-screening profiling.

**Consent flow summary.**
1. User signs in via Supabase magic link (no password storage).
2. App asks age band: 10–12, 13–15, 16–17, 18+, or "I'm a parent."
3. 10–12 and 13–15 → state set to `pending_parent`.
4. User enters parent/guardian email. We HMAC it (server-side pepper), generate a 256-bit token, HMAC the token, store the hash, and (planned) email the plaintext token to the parent.
5. Parent clicks the link, confirms consent. State moves to `parent_confirmed`.
6. Until `parent_confirmed`: no remote save, no Profil Complet, no /api/match for deep scores.

**Data minimization choices made.**
- No raw IP, no raw user-agent stored — both HMACed.
- No plaintext parent email stored — HMACed.
- No plaintext consent token stored — HMACed.
- No raw test answers persisted server-side at all (today).
- Magic link auth → no passwords to lose.

**Open questions for the lawyer.**
- Q1: Is "screening-grade vs assessment-grade" a distinction Romanian DPA would recognize for the consent threshold? Or does any psychometric profiling of a minor require parental consent regardless of depth?
- Q2: For the future paid bundle, should we store the user's submitted scores server-side (for resending the PDF, for parent transparency) — and if so, what's the right retention window?
- Q3: Parent verification — magic-link email today. Is that sufficient, or does Romanian DPA expect a stronger verification (e.g., reverse-charge SMS, ID upload)?
- Q4: We tag children's account types in `age_band`. Does GDPR Art 9 (special categories) get triggered by storing personality/vocational scores about a minor? Our read: no, because these aren't health/biometric/etc data — but worth confirming.
- Q5: Right to deletion — when an under-16 deletes their account, do we also need to notify the parent who consented?

## 9. Implementation checklist

In dependency order:

1. **i18n**: add/update Profil Complet keys (RO + EN) for landing card, results CTA, profile card, consent panel. During pilot the visible copy says "gratuit în pilot"; the future price stays documented only.
2. **Server gate** in `apps/web/src/app/[locale]/test/[slug]/page.tsx`: extend the `slug === 'ipip-neo-60'` check to `slug === 'ipip-neo-60' || slug === 'vocational-deep'`. Single-source the slug list as a constant in `lib/consent.ts` (e.g., `PAID_TEST_SLUGS`).
3. **API gate** in `apps/web/src/app/api/match/route.ts`: extend the body check from `body.ipipNeo60Scores` to also cover `body.vocationalDeepRaw`. Same `pending_parent` → 403.
4. **Results page** in `results-client.tsx`: rename the old paid hook to "Profil Complet" copy. The disabled-CTA logic for `pending_parent` already exists; reuse it.
5. **Profile page** in `profile-client.tsx`: add a Profil Complet card that mirrors the landing pattern. Disabled variant for pending_parent.
6. **Landing page** in `[locale]/page.tsx`: replace the IPIP-NEO-60 card with the Profil Complet bundle card. Disabled variant for pending_parent.
7. **AUTH-CONSENT-FLOW.md**: update the doc to reflect both gates and the bundle decision.
8. **Tests**: add a server test that pending_parent → 403 on `/api/match` with vocationalDeepRaw, and that the `/test/vocational-deep` page renders the consent panel for pending_parent.
9. **Backfill check**: any existing `vocational-deep` analytics events should keep working; no schema change needed in Umami.

Out of scope for this slice (separate work):
- Actual payment and entitlement flow (Stripe / SmartBill / etc). Before switching the UI from pilot-free to paid, add a DB-backed entitlement gate on `/test/[slug]` and `/api/match`.
- Parent confirmation email backend (still TODO from the consent slice).
- PDF report generation.
- Storing scores server-side (depends on lawyer Q2).

## 10. Definition of done

- All 9 items above shipped.
- `npm run lint && typecheck && test && build` clean.
- One real Umami session-replay reviewed: the disabled card appears for a pending_parent user on landing, profile, and results, with no leakage of the parent email field.
- Updated AUTH-CONSENT-FLOW.md merged.
- This doc says "free during pilot" clearly and treats payment/entitlement as a separate future slice.

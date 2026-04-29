# Psychometrics — what tests we use, what we claim, and why

*Living document. Last updated: 2026-04-29.*

This page is the canonical answer to: *"are these real tests? are we exposed legally? what should we use for the paid tier?"* If a lawyer, partner, or future contributor asks, point them here.

## TL;DR

- Three tests in the prototype today. Only one is a validated public-domain instrument; the other two are original Romanian items styled after Big Five and Holland Code but **not** validated.
- **No copyright infringement** — items are original. **But there is misrepresentation risk** if we don't disclose what's validated and what isn't, especially once we start charging.
- All three result screens now carry honest disclaimers (shipped 2026-04-29).
- Paid tier (Phase 2) is anchored to the validated **IPIP-NEO-60** + **O*NET Interest Profiler** — both public-domain or CC-BY, commercial use OK, no licensing fees.
- TestCentral / Cognitrom RO partnership remains the realistic premium-premium tier for Phase 3.

## What's in the app today

### 1. Quick quiz (6 questions) — `quiz` route

**What it is:** original 6-question vibe test with 4 options each. Each option is tagged with RIASEC codes, a path-type bias, and legacy traits. The matcher (cosine similarity across RIASEC + path + traits) maps the user's answer profile to the closest careers.

**What it isn't:** a psychometric assessment. 6 questions cannot reliably measure anything. It's a discovery hook.

**Disclaimer text shown to users:** *"⚠ TEST RAPID DE ORIENTARE · 6 întrebări nu pot prezice cariera ta. E un punct de pornire — testele aprofundate îți dau date reale."*

**Licensing:** zero exposure — original items, no derivative work.

### 2. Short personality test (15 items) — `personality` route

**What it is:** 15 Likert items, 3 per Big Five dimension (O/C/E/A/N), with reverse-scored items. Original Romanian items styled after Big Five.

**What it isn't:** the Big Five Inventory (BFI), NEO-PI-R, or any other validated instrument. Items haven't been factor-analyzed, reliability-tested, or validated against a population. No published psychometric data.

**Disclaimer text shown to users:** *"⚠ DOAR ORIENTATIV · Acesta e un test scurt inspirat din Big Five — nu e versiune validată. Pentru evaluare reală, ia testul complet IPIP-NEO-60 (gratuit, mai jos)."*

**Licensing:** the items are original, so no copyright issue. But we cannot label results "Big Five" without the disclaimer; that would be misrepresentation.

### 3. IPIP-NEO-60 (60 items) — `ipip-neo` route — **VALIDATED**

**What it is:** International Personality Item Pool NEO short form. 60 items, 12 per Big Five dimension, drawn from Goldberg's IPIP item bank (specifically the IPIP-NEO-120 by Johnson 2014, top 12 items per dimension by factor loading). Translated to Romanian; v1 translation.

**What it is officially:** a validated public-domain alternative to the proprietary NEO-PI-R. Used in thousands of peer-reviewed studies. Factor structure mirrors the Five-Factor Model.

**Disclaimer text shown to users:** *"✓ TEST VALIDAT ȘTIINȚIFIC · IPIP-NEO-60 (Goldberg) — instrument public-domain, validat pe populație internațională. Versiune RO v1."*

**Licensing — confirmed via primary source:**
- Wikipedia (IPIP entry): *"because the IPIP has been placed in the public domain, permission has already been automatically granted for any person to use IPIP items, scales, and inventories for any purpose, commercial or non-commercial."*
- IPIP item bank explicitly allows: *"items can be reworded, translated into other languages, and administered on the World Wide Web without asking permission of anyone."*
- No attribution required by license; we cite Goldberg/IPIP voluntarily as good practice.

**RO translation status:**
- v1 drafted 2026-04-29 (Claude-assisted, Adi-approved at first pass).
- **Needs review by an RO psycholinguist** before public/paid launch — items 'a08 Insult oameni', 'a12 Profit de pe urma altora' etc. need natural-Romanian polish; some teen-audience adjustments may be appropriate.
- Once polished, ideally tested on a small RO sample (n ≥ 50) for factor-structure consistency. This is **best practice for paid use** but not legally required.

### 4. Vocational test (12 forced-choice pairs) — `vocational` route

**What it is:** 12 Holland-style A/B pairs, each option contributing 1 point to one of R/I/A/S/E/C. Original Romanian items.

**What it isn't:** the Self-Directed Search (Holland's own instrument), Strong Interest Inventory, or O*NET Interest Profiler. Not validated.

**Disclaimer text shown to users:** *"⚠ DOAR ORIENTATIV · Test scurt inspirat din Holland Code — nu versiune validată. Pentru evaluare oficială, vezi O*NET Interest Profiler (gratuit, US Dept. of Labor) sau consultă un consilier vocațional autorizat."*

**Licensing:** original items, no exposure. Same misrepresentation risk as the short personality test — disclaimers carry the load.

## Roadmap: what to use for what

### Free / public-domain (commercial use OK — what we ship)

| Instrument | Framework | Where used today | Where used Phase 2 |
|---|---|---|---|
| **IPIP-NEO-60** (60 items, Goldberg) | Big Five | `ipip-neo` route, free | Anchor of paid PDF report |
| **O*NET Interest Profiler 60** | RIASEC | Linked externally from vocational results | Replace internal 12-pair vocational |
| **Mini-IPIP** (20 items) | Big Five | — | Optional ultra-short variant |

Both IPIP and O*NET allow commercial redistribution, derivative works, and translation. Zero licensing fees. The only obligation is honesty: don't claim O*NET is endorsing us; cite Goldberg/IPIP somewhere visible.

### Avoid for commercial use

| Instrument | Why we avoid |
|---|---|
| **BFI / BFI-2** (Soto, John) | Free *for non-commercial research only*. Commercial use requires explicit Soto/John permission. |
| **HEXACO-PI-R** | Research use free; commercial requires permission from Lee/Ashton. |
| **VIA Character Strengths** | Free for individual use; commercial use requires VIA Institute license. |
| **MBTI** | Paid + scientifically weak validity (test-retest reliability, factor structure). Not recommended. |
| **NEO-PI-3 / NEO-FFI-3** | Paid (~$3-5/test, PAR Inc.). Use only via TestCentral RO partnership at premium-premium tier. |

### Paid options (only if we want premium credibility)

| Instrument | Cost (~) | RO availability | Use case |
|---|---|---|---|
| NEO-PI-3 (PAR Inc.) | $5/test | Via TestCentral | Premium paid tier |
| Strong Interest Inventory | $10/test | Limited RO | Career-counselor surface |
| Self-Directed Search (SDS) | $5/test | Via TestCentral | Validated alt to O*NET |
| **Cognitrom CCP-online** | varies | Native RO | Phase 3 partnership > compete |
| **TestCentral RO portfolio** | varies | Native RO | Phase 3 partnership |

Phase 3 plan: pursue TestCentral / Cognitrom as a distribution partner. They license validated RO instruments (NEO-PI-3 RO translation, Holland SDS RO, etc.); we license and offer a "Raport validat TestCentral" tier at €49-79. That positions us as a legitimate platform without requiring us to validate our own instruments from scratch.

## Risk analysis

### What the disclaimers protect us from

- **Consumer protection (RO Law 363/2007 + EU Directive 2005/29/EC on unfair commercial practices):** the law prohibits misleading commercial practices. If we sell a €19 PDF report based on an unvalidated test labeled "Big Five," that's exposed. Once we explicitly disclose "this is a short test, not a validated instrument" — the user has informed consent and the misleading-practice claim falls.
- **GDPR Article 5(1)(d) — accuracy principle:** personal data (including test scores) must be accurate. An unvalidated test producing scores users believe are "their Big Five score" arguably isn't accurate. Disclaimers shift this to a recognized hint vs. measurement.
- **Misrepresentation tort:** less likely to be litigated for €19 transactions but plausible at scale. Disclaimers + use of validated instruments for paid product close this gap.

### What disclaimers DON'T protect us from

- **Reputational damage** if a teen makes a bad decision and the parent blames the platform. The product strategy mitigates: paid report uses validated instruments + manual fulfillment by named author + clear "starting point not verdict" framing.
- **Cognitrom challenging our positioning** as "the AI-native career platform" while their CCP-online has 15 years of RO validation data behind it. Mitigation: don't compete on instrument validity (we lose); compete on UX, data integration (RO universities + salaries + adjacencies), and conversational AI.
- **Crisis scenario** — teen with mental-health profile takes the IPIP-NEO and the high-Neuroticism feedback amplifies distress. Mitigation: scoring narrative needs care. The current "Sensibil emoțional — simți totul intens" framing for high N is intentionally non-pathologizing. Continue this in the paid report.

## How we cite

When using IPIP items or O*NET data, citation is good practice (not required by license). Add to the test screen footer or about page:

> Acest test folosește itemi din International Personality Item Pool (Goldberg, 1999), instrument public-domain. Versiunea engleză originală: ipip.ori.org

> Categorii vocaționale și interpretare bazate pe Holland's RIASEC (1959, 1997) și O*NET Interest Profiler (US Department of Labor, CC-BY 4.0).

## Operational checklist

- [x] Disclaimers shipped on quick-quiz, personality short, vocational, paid hook.
- [x] IPIP-NEO-60 RO v1 in `data.js` as `ipipNeo60` dataset.
- [x] PersonalityScreen generalized to render either short or full test based on `dataKey`.
- [x] PaidHookCard shows free upgrade to IPIP-NEO-60 on the personality-test surface.
- [ ] **Next:** RO psycholinguist review of IPIP-NEO-60 v1 translation (parking lot until Phase 1.5).
- [ ] **Next:** O*NET Interest Profiler RO translation to replace internal 12-pair vocational (Phase 1.5).
- [ ] **Next:** unify `deep-results.jsx` VocationalResults career matching with the cosine-similarity matcher in `app.jsx` (currently uses raw RIASEC overlap — inconsistent with quick-quiz scoring).
- [ ] **Phase 2:** decide if paid report rests on IPIP+O*NET interpretations alone, or if we license a TestCentral RO instrument as basis.
- [ ] **Phase 2:** add citation footer to test screens (cite Goldberg / IPIP / O*NET).

## References

- [International Personality Item Pool (ipip.ori.org)](https://ipip.ori.org/) — official IPIP item bank
- [IPIP permission page](https://ipip.ori.org/newPermission.htm)
- [Goldberg et al. 2006 — IPIP and the future of public-domain measures (PDF)](https://ipip.ori.org/Goldberg_etal_2006_IPIP_JRP.pdf)
- [O*NET Interest Profiler manual](https://www.onetcenter.org/reports/IP_Manual.html)
- [O*NET license — CC-BY 4.0](https://www.onetcenter.org/IP.html)
- Johnson, J. A. (2014). *Measuring thirty facets of the Five-Factor Model with a 120-item public domain inventory: Development of the IPIP-NEO-120.* Journal of Research in Personality, 51, 78-89.
- Donnellan, M. B., Oswald, F. L., Baird, B. M., & Lucas, R. E. (2006). *The Mini-IPIP scales: Tiny-yet-effective measures of the Big Five factors of personality.* Psychological Assessment, 18(2), 192–203.

---

*Anything in this doc is best-effort legal interpretation, not professional legal advice. For commercial launch, validate with a Romanian lawyer specialized in consumer protection + personal data.*

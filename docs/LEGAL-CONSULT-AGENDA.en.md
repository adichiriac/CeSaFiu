# Legal consult agenda — Ce Să Fiu? (M0)

*Version: v0.1 (2026-04-29). Audience: Romanian privacy lawyer (data-protection specialty). Owner: Adi.*

*This is the English mirror. The [Romanian version](LEGAL-CONSULT-AGENDA.md) is canonical for the consult itself.*

The point of this document is to walk into the consult with a *closed* set of questions and a default position on each, so the consult time is spent confirming or correcting — not explaining the product. Lawyer should have read [`PRIVACY-POLICY.md`](PRIVACY-POLICY.md) + [`DPIA.md`](DPIA.md) + [`CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md) beforehand.

Items prefixed `[DPIA]` directly affect the DPIA risk register. Items prefixed `[PP]` affect privacy policy wording. Items prefixed `[BAN]` affect the consent banner.

---

## 1. ANSPDCP filings and DPO

### 1.1 Notification of processing (Romanian Law 190/2018, Art. 22)

**Question:** Given the scale (target ≤ 50,000 MAU in Phase 2), the categories (minor data, analytics), and the legal bases (mostly contract + consent), is ANSPDCP notification required before launch?

**Our default:** No, based on the WP29 / EDPB position that GDPR removed general notification obligations — RO Art. 22 retained them only for specific high-risk categories. We don't believe we hit them.

**What we need from you:** confirm or correct. If yes, what is the timeline and what fee/process?

### 1.2 [DPIA] DPIA filing with ANSPDCP (Art. 36 GDPR)

**Question:** Art. 36 requires prior consultation with the supervisory authority when a DPIA shows residual high risk that we cannot mitigate. R2 (parent-bypass via age gate) is rated High residual in our DPIA. Does this trigger Art. 36?

**Our default:** No — the residual is high *probability* but the *impact severity* is constrained by limited data collection on under-16 declared as 16+ (no payment, sensitive content disclaimers). We believe this is below the Art. 36 threshold.

**What we need from you:** clear yes/no, plus drafting tweaks to DPIA §4 R2 if you want stronger language.

### 1.3 DPO appointment

**Question:** Does our processing meet the Art. 37(1)(b) "regular and systematic monitoring on a large scale" threshold, or Art. 37(1)(c) "large-scale processing of special categories"?

**Our default:** Borderline. We argue: (a) we're not yet at "large scale" by WP243 (Guidelines on DPOs) size criteria; (b) we don't process Art. 9 special categories, despite personality scores being psychologically sensitive; therefore DPO appointment is optional, and Adi acts as the contact point.

**What we need from you:** confirm. If yes-DPO, recommendation for who in RO offers DPO-as-a-service at a small-startup scale.

---

## 2. Children's data and parental consent

### 2.1 [DPIA][PP] Romanian digital-consent age confirmation

**Question:** We've assumed Romanian Law 190/2018 Art. 6 sets the digital-consent age at 16 (taking the GDPR Art. 8(1) ceiling, not lowering). Confirm.

### 2.2 [DPIA] Age-gate honour basis vs. verified age

**Question:** Our age gate is honor-based (self-declared). The DPIA rates this as the highest residual risk (R2). Does Romanian regulator practice or ANSPDCP guidance require stronger age verification (e.g. via mojeID-equivalent, ID upload, parental-credential gate before any flow) for a service with our risk profile?

**Our default:** No, on grounds of proportionality (we collect minimal data; paid surface is gated; replay is blocked). We rely on signal-based detection in Phase 2.5 + revocation flow as compensating controls.

**What we need from you:** is this defensible, or do you recommend stronger gating before launch? If gating, what is the minimum viable approach?

### 2.3 [PP] Parent-consent token mechanism legal validity

**Question:** Our parental consent flow: child enters parent email → we send a 256-bit-token link → parent clicks → consent confirmed. Does this satisfy the "verifiable" requirement of Art. 8(2) GDPR / RO Law 190 Art. 6?

**Our default:** Yes, as long as we (a) hash the parent email (audit), (b) log IP+UA hash on confirmation, (c) the email-click pattern matches the EDPB's "reasonable efforts" guidance for online services. We are explicitly not claiming notarised verification.

**What we need from you:** confirm sufficiency. If insufficient, the alternative we'd accept: a credit-card-€0.01-charge mechanism (added complexity but stronger evidence).

### 2.4 [PP] Treatment of 16-17 self-consent and paid contract

**Question:** A 16-17yo can self-consent for personal data processing (per Art. 8 GDPR + RO Law 190). But Romanian civil law treats 14-18 as having limited capacity for contract. Is the paid €19 report contract enforceable against a 16-17yo without parental authorisation, or do we require parental authorisation specifically for the contract layer (separate from data consent)?

**Our default:** Require parental authorisation for the paid contract for users under 18, even if data consent is self-given. Phase 2 doesn't take payment automatically (manual fulfilment), so this is a Phase 3 hardening.

**What we need from you:** confirm split treatment (data consent: self at 16; contract: parental until 18). If we can simplify, we will.

---

## 3. Legal bases and special categories

### 3.1 [DPIA][PP] Personality scores as Art. 9 special category data

**Question:** IPIP-NEO-60 yields Big Five scores including Neuroticism. Are these "data concerning health" under Art. 9 GDPR, or general personal data?

**Our default:** General personal data (Art. 6), not Art. 9. Reasoning: the instrument is non-clinical, public-domain; scores are dispositional traits, not diagnostic. ECJ case law and EDPB opinions on profiling have not treated personality dimensions as Art. 9.

**What we need from you:** confirm. If you say Art. 9, we have to switch the legal basis to Art. 9(2)(a) explicit consent + adjust the policy and DPIA accordingly. Major change — get the call right.

### 3.2 [PP][BAN] Analytics legal basis — confirmed consent

**Internal decision (2026-04-30):** we removed the dual posture. Analytics and session replay run exclusively under **consent (Art. 6(1)(a))** — banner opt-in. Sentry remains on **legitimate interest (Art. 6(1)(f))** with a documented balancing test in DPIA §3.2 (automatic scrubbing of email/tokens/answers/parent fields + `user_id` omitted for under-16 / unknown-age sessions).

**What we need from you:** confirm the choice and the split (consent for analytics/replay vs. legitimate interest for Sentry/security). Flag if you want a separate formal LIA written up for Sentry beyond what DPIA §3.2 contains.

### 3.3 [DPIA] Profiling under Art. 22 GDPR

**Question:** Our matcher (cosine similarity → top-N career recommendations) is profiling. Does the recommendation surface produce "decisions with legal effect or similarly significant effect" under Art. 22?

**Our default:** No — recommendations are framed as "starting points, not verdicts" with explicit disclaimers; users make the actual choice. Art. 22 is not engaged.

**What we need from you:** confirm. Note: Phase 3 introduces B2B partner-rank weighting → we'll need a re-assessment.

---

## 4. [PP] Retention periods

### 4.1 Consent records — 3 years (with pseudonymisation on user erasure)

**Updated position (2026-04-30):** privacy policy now states `consent_records` retention as **3 years** (aligned with Law 287/2009 Civil Code Art. 2517). On user account erasure, the row is pseudonymised (user_id nulled, hash IP/UA + timestamp retained); pseudonymised rows are hard-deleted by a nightly cleanup at 3-year mark from `created_at`. Schema changed to `on delete set null` for `consent_records.user_id`.

**What we need from you:** confirm 3 years is the right window for evidence-of-consent obligations, or specify the right one. Also confirm pseudonymise-then-delete is the right model versus delete-immediately.

### 4.2 Test-history retention — 24 months

**Question:** We retain `quiz_runs` / `personality_runs` / `vocational_runs` linked to `user_id` for 24 months after last use, then anonymise. Is this proportionate?

**Our default:** Yes. Test outputs lose user-utility quickly; 24 months covers the typical 9th→12th grade window for revisits.

**What we need from you:** confirm. If shorter (e.g. 18 months), we'll adjust.

### 4.3 Paid-intent retention — 24 months or unsubscribe

**Question:** Paid-intents are a marketing-adjacent list (waitlist for €19 report). Standard email-marketing retention in RO is "until unsubscribe" with periodic re-confirmation. Is 24 months the right cap?

**Our default:** Yes, with a re-confirm prompt at 12 months ("Mai vrei să primești update-uri?").

**What we need from you:** confirm.

---

## 5. [PP] Processors and transfers

### 5.1 DPA template adequacy

**Question:** Our processors are Supabase Inc., Vercel Inc., Resend Inc., Sentry, Railway. Each ships a default DPA. Are their standard DPAs adequate under Romanian law, or do we need add-on clauses (e.g., SCC riders for US transfers)?

**Our default:** Adequate, given the processors' operations in Frankfurt EU and SCC inclusion. Schrems II adequacy via the EU-US Data Privacy Framework when the processor is certified.

**What we need from you:** confirm. If you flag any specific clause we should add, list them — we'll request riders.

### 5.2 Transfer impact assessment (TIA)

**Question:** For each US-headquartered processor, do we need a documented TIA per Schrems II / EDPB Recommendations 01/2020?

**Our default:** Yes for at least Supabase + Vercel + Resend (the data flow is most direct). Sentry less so (de-identified breadcrumbs). We can produce one TIA covering all three using the same standard analysis.

**What we need from you:** confirm scope; recommend a template.

---

## 6. [PP] Privacy policy wording review

### 6.1 General readability + accuracy

**Question:** Read [`PRIVACY-POLICY.md`](PRIVACY-POLICY.md) end-to-end. Flag:
- Any factual claim that is overreaching or under-stated.
- Wording where Romanian regulator practice prefers a specific phrasing.
- Missing categories under Art. 13/14 GDPR information requirements.

### 6.2 EN translation parity

**Question:** Does the EN version hold the same legal weight as RO, or do we need explicit "RO version prevails" disclaimer? (We've added one — confirm sufficient.)

### 6.3 Children-facing language

**Question:** Plain Romanian + 14-19yo audience. We've kept legalese minimal. Does this compromise legal robustness, or is it acceptable / preferred (per Art. 12(1) GDPR's "concise, transparent, intelligible" + Recital 58 child-specific)?

---

## 7. Consumer protection (paid report)

### 7.1 [PP] Misleading commercial practices (RO Law 363/2007)

**Question:** The €19 paid report bases its analysis on a mix of validated (IPIP-NEO-60) and unvalidated (12-pair vocational, 6-question quick quiz) instruments. Disclaimers are shipped. Is this legally bulletproof against a misleading-practice complaint, or is the safest path "drop unvalidated tests entirely from paid surface"?

**Our default:** Disclaimers + clear scoping ("starting point not diagnosis") sufficient. Phase 2 anchors paid output on IPIP-NEO + O*NET (both validated/credible) so unvalidated tests provide context only.

**What we need from you:** confirm. If there's a specific phrasing convention from RO consumer protection cases, share it.

### 7.2 Right to withdraw and refund policy

**Question:** Does Romanian consumer law give a 14-day cooling-off window on the digital report? The umbrella consumer-protection framework is Law 296/2004; the operative transposition of the Consumer Rights Directive 2011/83/EU (which contains the digital-content withdrawal mechanics) is **OUG 34/2014**. Confirm which is the controlling text for our case and what wording we need on the purchase flow.

**Our default:** Yes for digital content, unless the user explicitly waives it after starting consumption (per OUG 34/2014 Art. 16(m)). Build the waiver checkbox in the purchase flow.

**What we need from you:** confirm controlling law + adequacy of the waiver mechanism + recommended waiver wording.

---

## 8. [BAN] ePrivacy / Romanian Law 506/2004

### 8.1 Banner pattern compliance

**Question:** Romanian Law 506/2004 transposes the ePrivacy Directive. Does ANSPDCP's interpretation of Art. 5(3) require any banner UI pattern beyond what we've spec'd in [`CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md)? Specifically: equal prominence of "Reject all" vs. "Accept all"?

**Our default:** Our pattern (Acceptă tot / Doar esențial / Personalizează) gives equal prominence to accept and reject. We believe this matches the EDPB Guidelines 03/2022 on dark patterns + ANSPDCP's published positions.

**What we need from you:** confirm. If you want a specific button-order or visual treatment, tell us.

### 8.2 Localstorage technical-necessity argument

**Question:** We rely on localStorage for: anonymous saves, locale, consent state. ePrivacy treats localStorage like cookies for consent purposes. We argue the uses above are "strictly necessary" (Art. 5(3) exception). Confirm.

---

## 9. [DPIA][PP] Child-directed conversion patterns (dark-pattern review)

GDPR (Recital 38) + EDPB Guidelines 03/2022 on dark patterns + Romanian Law 363/2007 (unfair commercial practices) impose stricter standards for vulnerable audiences. For users under 16 and 16-17, three specific product surfaces need to be checked beyond general GDPR mechanics:

### 9.1 Account-creation prompt after the 3rd save (PHASE-2-PLAN §6)

**Situation:** after the 3rd "Salvează în vibe-uri", the platform prompts account creation. The prompt promises "to keep your choices across devices".

**Question for the lawyer:** is this prompt aligned with fairness standards for minors, or do we need:
- An alternative wording for users we suspect are under 16 (behavioural signals)?
- A clear, permanent opt-out ("No, continue anonymously")?
- A pre-prompt explanation of what happens to data once an account is created?

**Our default position:** the prompt is transparent, not too pressing, offers an exit ("Later" / continue without account). We believe it respects fairness for minors.

### 9.2 Viral share cards ("I'm RIASEC: ASR. You?")

**Situation:** test results can be shared via dynamically generated OG cards, optimised for Instagram Story / TikTok / WhatsApp. The tagline includes the user's RIASEC code.

**Question for the lawyer:**
- The data shown on the shared card (RIASEC code, career label, optionally display name) is personal data of the sharing user — sharing is implicit consent, but is that sufficient for minors?
- Should the share banner warn "your data will become public"?
- For users under 16, should the share card be blocked / disabled / require additional confirmation?

**Our default position:** acceptable for 16+, blocked for 14-15 (gated by age). For all: the card includes no directly-identifying info (real name empty by default; only the test result code).

### 9.3 The "I want the paid report" prompt for minors

**Situation:** the paid report (€19) is shown at multiple points — after test result, on the career detail screen, in the profile. For minors (even 16-17), the commercial prompt is sensitive.

**Question for the lawyer:**
- Is it sufficient for the prompt to be identical at all ages, or do we need a variant for minors that:
  - Reduces the offer's frequency / prominence
  - Adds a disclaimer "discuss with a parent first"
  - Requires additional parental authorisation for the payment contract (see §2.4)?
- The frequency of the prompt (test end, profile, deep-results) — does it rise to "inappropriate commercial pressure on minors" under Law 363/2007?

**Our default position:** Phase 2 fulfils manually; the report is not auto-purchased. The prompt stays identical but adds a "discuss with a parent first" disclaimer for under 18. Phase 3 (when payment becomes automatic) requires parental authorisation for the contract under 18.

**What we need from the lawyer on all three (9.1-9.3):** concrete review of the proposed copy for these flows (we'll bring screenshots + text to the consult); flag any wording that crosses the fairness threshold for minors.

---

## 10. Documents to formally review and sign off

End-state of consult: lawyer has reviewed and signed off on:

- [ ] [`docs/PRIVACY-POLICY.md`](PRIVACY-POLICY.md) — RO canonical
- [ ] [`docs/PRIVACY-POLICY.en.md`](PRIVACY-POLICY.en.md) — EN parity
- [ ] [`docs/DPIA.md`](DPIA.md) — including residual-risk acceptance
- [ ] [`docs/CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md) — banner copy + state machine
- [ ] Parent-consent email template *(to be drafted in M5; bring back for review at that point)*

---

## 11. Out of scope for this consult

Surface for Phase 3, not now:

- B2B partner ranking (re-DPIA at Phase 3 kickoff).
- Cross-border expansion (Moldova, Hungary).
- Payment processing (Stripe, etc.).
- Data export/import partnerships with universities.

---

*Agenda v0.1 — 2026-04-29. Update after the consult with notes on each item; re-version to v1.0 once the lawyer signs off.*

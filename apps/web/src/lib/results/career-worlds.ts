/**
 * Archetypes V2 — Phase B sidecar: career → worlds map.
 *
 * Deliberately a SIDECAR (not a `worlds[]` field on careers.json) per
 * docs/ARCHETYPES-V2-PLAN.md §4: small diff, easy review, simple rollback.
 * Once the taxonomy stabilises this can be denormalised into careers.json
 * or moved to the DB.
 *
 * Rules:
 *   - every id in data/careers.json appears exactly once here
 *   - 1–2 worlds per career
 *   - enforced by career-worlds.test.ts (CI bijection test)
 *
 * Editorial placement decisions (2026-06-11):
 *   - justice-civic is the canonical home for law/public administration;
 *     DPO/compliance keep numbers-people as canonical home + justice-civic
 *     as secondary.
 *   - retail/sales floor roles sit with founders (the commerce shelf);
 *     admin-support and logistics sit with numbers-people.
 *   - performance/stage roles (actor, DJ) sit with adventurers per plan
 *     table; translation sits with storytellers.
 */

import type {WorldId} from './worlds';

export const CAREER_WORLDS: Record<string, WorldId[]> = {
  // ── Prototype-era roles ──────────────────────────────────────────────────
  'product-designer': ['visual-creators'],
  'data-scientist': ['ai-minds', 'numbers-people'],
  'creative-director': ['visual-creators'],
  'social-entrepreneur': ['founders', 'people-people'],
  researcher: ['life-explorers'],
  'community-builder': ['people-people', 'founders'],
  'freelance-developer': ['digital-builders'],
  'content-creator': ['storytellers'],
  'startup-founder': ['founders'],
  'freelance-designer': ['visual-creators'],
  'crafts-entrepreneur': ['makers', 'founders'],
  'self-taught-engineer': ['digital-builders'],

  // ── Law / civic ──────────────────────────────────────────────────────────
  avocat: ['justice-civic'],
  'civil-servant': ['justice-civic'],
  'customs-officer': ['justice-civic', 'protectors'],
  'compliance-officer': ['numbers-people', 'justice-civic'],
  'data-protection-officer': ['numbers-people', 'justice-civic'],
  'eu-project-manager': ['numbers-people', 'justice-civic'],
  'urban-planner': ['planet-guardians', 'justice-civic'],

  // ── Engineering / physical world ─────────────────────────────────────────
  'inginer-mecanic': ['world-builders'],
  'inginer-electric': ['world-builders'],
  'inginer-electronic': ['world-builders'],
  'inginer-energetic': ['planet-guardians', 'world-builders'],
  'inginer-chimist': ['world-builders', 'life-explorers'],
  'inginer-auto': ['world-builders'],
  'inginer-constructii': ['world-builders'],
  arhitect: ['world-builders', 'visual-creators'],
  'electrician-autorizat': ['world-builders'],
  'tehnician-hvac': ['world-builders'],
  'mecanic-auto': ['world-builders'],
  'instalator-sanitar': ['world-builders'],
  'operator-cnc': ['world-builders'],
  'mecanic-frigotehnist': ['world-builders'],
  'mason-bricklayer': ['world-builders'],
  'mechatronics-technician': ['world-builders'],
  'auto-electrician': ['world-builders'],
  'robotics-engineer': ['world-builders', 'ai-minds'],
  'quality-engineer': ['world-builders'],
  'painter-finisher': ['world-builders'],
  'process-engineer': ['world-builders'],
  'building-automation-technician': ['world-builders'],
  'inginer-aparare': ['protectors', 'world-builders'],

  // ── Digital ──────────────────────────────────────────────────────────────
  'software-engineer': ['digital-builders'],
  devops: ['digital-builders'],
  cybersecurity: ['digital-builders', 'protectors'],
  'game-developer': ['digital-builders', 'visual-creators'],
  'mobile-developer': ['digital-builders'],
  'qa-tester': ['digital-builders'],
  sysadmin: ['digital-builders'],
  'low-code-developer': ['digital-builders'],
  'sap-erp-consultant': ['digital-builders', 'numbers-people'],
  'data-engineer': ['digital-builders', 'ai-minds'],

  // ── AI ───────────────────────────────────────────────────────────────────
  'ai-engineer': ['ai-minds'],
  'machine-learning-engineer': ['ai-minds'],
  'mlops-engineer': ['ai-minds'],
  'ai-ethicist': ['ai-minds', 'justice-civic'],
  'prompt-engineer': ['ai-minds'],
  'ai-trainer': ['ai-minds'],
  'ai-red-teamer': ['ai-minds', 'protectors'],
  'conversation-designer': ['ai-minds', 'visual-creators'],

  // ── Health ───────────────────────────────────────────────────────────────
  'asistent-medical': ['healers'],
  'medic-generalist': ['healers'],
  stomatolog: ['healers'],
  farmacist: ['healers', 'life-explorers'],
  kinetoterapeut: ['healers'],
  optician: ['healers'],
  'tehnician-dentar': ['healers', 'makers'],
  maseur: ['healers'],
  paramedic: ['healers', 'protectors'],
  'medic-veterinar': ['healers', 'life-explorers'],
  'asistent-vet': ['healers'],
  'radiology-technician': ['healers'],
  'medical-lab-technician': ['healers', 'life-explorers'],
  midwife: ['healers'],
  'nutritionist-dietetician': ['healers'],
  'occupational-therapist': ['healers'],
  'digital-health-specialist': ['healers', 'digital-builders'],

  // ── Life sciences ────────────────────────────────────────────────────────
  biolog: ['life-explorers'],
  'clinical-research-coordinator': ['life-explorers'],
  'biomedical-engineer': ['life-explorers', 'world-builders'],
  bioinformatician: ['life-explorers', 'digital-builders'],
  'genetic-counselor': ['life-explorers', 'healers'],
  'longevity-specialist': ['life-explorers', 'people-people'],

  // ── Climate / environment / green energy ─────────────────────────────────
  agronom: ['planet-guardians'],
  'instalator-pv': ['planet-guardians'],
  'ev-charging-technician': ['planet-guardians'],
  'energy-auditor': ['planet-guardians'],
  'environmental-engineer': ['planet-guardians'],
  'sustainability-manager': ['planet-guardians'],
  'wind-turbine-technician': ['planet-guardians'],
  'battery-technician': ['planet-guardians'],
  'carbon-accounting-specialist': ['planet-guardians'],
  'gis-specialist': ['planet-guardians', 'digital-builders'],
  'climate-risk-analyst': ['planet-guardians', 'numbers-people'],
  'urban-farmer': ['planet-guardians'],

  // ── Media / storytelling ─────────────────────────────────────────────────
  'jurnalist-reporter': ['storytellers'],
  'jurnalist-editor': ['storytellers'],
  'jurnalist-podcast': ['storytellers'],
  'jurnalist-investigativ': ['storytellers'],
  youtuber: ['storytellers'],
  'social-media-manager': ['storytellers'],
  'pr-specialist': ['storytellers'],
  traducator: ['storytellers'],

  // ── Visual / design ──────────────────────────────────────────────────────
  fotograf: ['visual-creators'],
  'editor-video': ['visual-creators'],
  'artist-plastic': ['visual-creators', 'makers'],
  'ux-researcher': ['visual-creators'],
  '3d-artist': ['visual-creators'],
  'motion-designer': ['visual-creators'],
  'game-designer': ['visual-creators', 'digital-builders'],

  // ── Craft / makers ───────────────────────────────────────────────────────
  bucatar: ['makers'],
  stilist: ['makers'],
  frizer: ['makers'],
  coafor: ['makers'],
  manichiurista: ['makers'],
  cosmeticiana: ['makers'],
  'make-up-artist': ['makers'],
  'cofetar-patiser': ['makers'],
  tatuator: ['makers'],
  florar: ['makers'],
  croitor: ['makers'],
  sudor: ['makers', 'world-builders'],
  restaurator: ['makers'],
  ceramist: ['makers'],
  bijutier: ['makers'],
  'tamplar-mobilier': ['makers'],

  // ── Business / growth / sales ────────────────────────────────────────────
  'marketing-performance': ['founders'],
  'marketing-content-seo': ['founders', 'storytellers'],
  'marketing-brand': ['founders'],
  'marketing-growth': ['founders'],
  'product-manager': ['founders', 'digital-builders'],
  'ecommerce-founder': ['founders'],
  'sales-rep': ['founders'],
  'crm-specialist': ['founders'],
  'customer-success-manager': ['founders'],
  'revenue-operations-specialist': ['founders'],
  'agent-imobiliar': ['founders'],
  'casier-vanzator': ['founders'],

  // ── Numbers / finance / ops ──────────────────────────────────────────────
  contabil: ['numbers-people'],
  'functionar-bancar': ['numbers-people'],
  'specialist-achizitii': ['numbers-people'],
  'financial-analyst': ['numbers-people'],
  'logistics-planner': ['numbers-people'],
  auditor: ['numbers-people'],
  'manager-proiect': ['numbers-people', 'founders'],
  'asistent-manager': ['numbers-people'],
  'operator-depozit': ['numbers-people'],

  // ── Education / care / social ────────────────────────────────────────────
  'psiholog-clinician': ['people-people', 'healers'],
  'psiholog-scolar': ['people-people'],
  'psiholog-organizational': ['people-people'],
  'profesor-gimnaziu-liceu': ['people-people'],
  'profesor-universitar': ['people-people', 'life-explorers'],
  'asistent-social': ['people-people'],
  logoped: ['people-people', 'healers'],
  educator: ['people-people'],
  'hr-specialist': ['people-people'],
  'ingrijitor-batrani': ['people-people'],
  'special-education-teacher': ['people-people'],
  'instructional-designer': ['people-people'],
  'corporate-trainer': ['people-people'],
  'child-protection-specialist': ['people-people'],
  'community-health-worker': ['people-people', 'healers'],
  'mental-health-coach': ['people-people'],
  'elder-care-coordinator': ['people-people'],
  'accessibility-specialist': ['people-people', 'visual-creators'],

  // ── Defence / public safety ──────────────────────────────────────────────
  'agent-securitate': ['protectors'],
  'ofiter-armata': ['protectors'],
  'subofiter-armata': ['protectors'],
  'pilot-militar': ['protectors'],
  'ofiter-politie': ['protectors'],
  jandarm: ['protectors'],
  'pompier-isu': ['protectors'],
  'ofiter-informatii': ['protectors'],
  'security-systems-technician': ['protectors'],

  // ── Tourism / sport / mobility / stage ───────────────────────────────────
  'antrenor-sportiv': ['adventurers'],
  ospatar: ['adventurers'],
  'dj-producer': ['adventurers'],
  'ghid-turistic': ['adventurers'],
  actor: ['adventurers'],
  'sofer-profesionist': ['adventurers'],
  'receptioner-hotel': ['adventurers'],
  'curier-livrator': ['adventurers'],
  'event-planner': ['adventurers'],
  'drone-operator': ['adventurers'],
};

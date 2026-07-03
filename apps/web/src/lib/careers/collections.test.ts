import {describe, expect, it} from 'vitest';
import type {Career} from '@/lib/matcher';
import {
  inCollection,
  isCreative,
  isInDemand,
  isNoDegree,
  isWellPaid,
  matchedInstitutions,
  parseSalaryMaxEur,
} from './collections';

function career(overrides: Partial<Career>): Career {
  return {
    id: 'c-test',
    name: 'Test',
    tagline: '',
    color: 'purple',
    emoji: '★',
    pathType: 'facultate',
    traits: [],
    riasec: [],
    big5: [],
    salary: '',
    demand: '',
    vibe: '',
    description: '',
    day: [],
    skills: [],
    paths: [],
    ...overrides,
  };
}

describe('parseSalaryMaxEur', () => {
  it('parses dot-thousands seniority bands and takes the max', () => {
    expect(
      parseSalaryMaxEur('Junior: 1.200 — 2.500 €/lună · Mid: 2.500 — 4.500 €/lună · Senior: 4.500 — 7.500 €/lună'),
    ).toBe(7500);
  });

  it('parses open-top ranges ("20.000+")', () => {
    expect(parseSalaryMaxEur('Top global: 12.000 — 20.000+ €/lună')).toBe(20000);
  });

  it('parses plain hundreds without thousands separator', () => {
    expect(parseSalaryMaxEur('Academic stagiar (RO): 800 — 1.500 €/lună')).toBe(1500);
  });

  it('converts hourly rates to a monthly equivalent', () => {
    expect(parseSalaryMaxEur('25 — 50 €/oră')).toBe(50 * 160);
  });

  it('returns null for non-numeric salaries', () => {
    expect(parseSalaryMaxEur('Variabil — depinde de impact')).toBeNull();
    expect(parseSalaryMaxEur('')).toBeNull();
    expect(parseSalaryMaxEur(undefined)).toBeNull();
  });
});

describe('isWellPaid', () => {
  it('includes careers whose top band clears the threshold', () => {
    expect(isWellPaid(career({salary: 'Mid: 2.500 — 4.500 €/lună'}))).toBe(true);
  });

  it('excludes low bands and unparseable salaries', () => {
    expect(isWellPaid(career({salary: '800 — 1.500 €/lună'}))).toBe(false);
    expect(isWellPaid(career({salary: 'Variabil — depinde de impact'}))).toBe(false);
  });
});

describe('isInDemand', () => {
  it('matches the hot demand phrasings, diacritics-insensitive', () => {
    expect(isInDemand(career({demand: 'Extremă'}))).toBe(true);
    expect(isInDemand(career({demand: 'Foarte mare'}))).toBe(true);
    expect(isInDemand(career({demand: 'În creștere'}))).toBe(true);
  });

  it('rejects steady/niche demand', () => {
    expect(isInDemand(career({demand: 'Stabilă'}))).toBe(false);
    expect(isInDemand(career({demand: 'Mare'}))).toBe(false);
    expect(isInDemand(career({demand: 'Saturată dar nișată'}))).toBe(false);
  });
});

describe('isNoDegree / isCreative', () => {
  it('flags non-university pathTypes', () => {
    for (const pathType of ['autodidact', 'profesional', 'creator', 'freelance', 'antreprenor']) {
      expect(isNoDegree(career({pathType}))).toBe(true);
    }
    expect(isNoDegree(career({pathType: 'facultate'}))).toBe(false);
    expect(isNoDegree(career({pathType: 'mixt'}))).toBe(false);
  });

  it('flags Artistic RIASEC careers as creative', () => {
    expect(isCreative(career({riasec: ['A', 'I']}))).toBe(true);
    expect(isCreative(career({riasec: ['R', 'C']}))).toBe(false);
  });
});

describe('matchedInstitutions', () => {
  const programs = [
    {universityId: 'uni-a', careerIds: ['c1', 'c9'], name: 'Informatică'},
    {universityId: 'uni-a', careerIds: ['c2'], name: 'Automatică'},
    {universityId: 'uni-b', careerIds: ['c9'], name: 'Drept'},
    {universityId: 'uni-c', careerIds: [], name: 'Fără legături'},
    {universityId: 'uni-d', name: 'Fără careerIds'},
  ];
  const match = (id: string, score: number) => ({career: {id}, score});

  it('collects institutions hosting programs for the top-3 scored careers', () => {
    const {uniIds, reason} = matchedInstitutions([match('c1', 90), match('c2', 80)], programs);
    expect(uniIds).toEqual(new Set(['uni-a']));
    expect(reason['uni-a']).toBe('Informatică'); // first matching program wins
  });

  it('ignores zero-score matches and careers beyond the top-N', () => {
    const matches = [match('c1', 90), match('c2', 80), match('c3', 70), match('c9', 60)];
    const {uniIds} = matchedInstitutions(matches, programs);
    expect(uniIds.has('uni-b')).toBe(false); // c9 is 4th — outside top-3
    expect(matchedInstitutions([match('c9', 0)], programs).uniIds.size).toBe(0);
  });

  it('returns empty for null/no matches', () => {
    expect(matchedInstitutions(null, programs).uniIds.size).toBe(0);
    expect(matchedInstitutions([], programs).uniIds.size).toBe(0);
  });
});

describe('inCollection', () => {
  it('routes user-state collections through ctx', () => {
    const c = career({});
    expect(inCollection(c, 'matched', {matchScore: 42})).toBe(true);
    expect(inCollection(c, 'matched', {})).toBe(false);
    expect(inCollection(c, 'saved', {isSaved: true})).toBe(true);
    expect(inCollection(c, 'saved', {})).toBe(false);
    expect(inCollection(c, 'all', {})).toBe(true);
  });
});

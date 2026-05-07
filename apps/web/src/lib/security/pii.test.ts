import {describe, expect, it} from 'vitest';
import {redactPii, scoreSpamShape} from './pii';

describe('redactPii', () => {
  it('passes through clean text unchanged', () => {
    const result = redactPii('Mi se pare prea complicat formularul de la pasul 3.');
    expect(result.text).toBe('Mi se pare prea complicat formularul de la pasul 3.');
    expect(result.spamScore).toBe(0);
    expect(result.hits).toEqual([]);
  });

  it('redacts email addresses', () => {
    const result = redactPii('Sunați-mă pe maria.popescu@example.com');
    expect(result.text).toContain('[redacted:email]');
    expect(result.text).not.toContain('maria.popescu@example.com');
    expect(result.hits).toContain('email');
    expect(result.spamScore).toBeGreaterThan(0);
  });

  it('redacts Romanian mobile phone numbers', () => {
    const result = redactPii('numarul meu este 0721234567');
    expect(result.text).toContain('[redacted:phone]');
    expect(result.hits).toContain('phone');
  });

  it('redacts +40 prefixed phone numbers', () => {
    const result = redactPii('Suna la +40 721 234 567');
    expect(result.text).toContain('[redacted:phone]');
  });

  it('redacts CNP-shaped 13-digit runs with high spam score', () => {
    const result = redactPii('CNP-ul meu este 1850715040020');
    expect(result.text).toContain('[redacted:id]');
    expect(result.hits).toContain('cnp');
    expect(result.spamScore).toBeGreaterThanOrEqual(0.6);
  });

  it('redacts long digit runs (card-like)', () => {
    const result = redactPii('cardul meu 4111111111111111');
    expect(result.text).toContain('[redacted:digits]');
    expect(result.hits).toContain('long_digits');
  });

  it('redacts URLs and accumulates spam score per URL', () => {
    const result = redactPii('vezi https://a.com și www.b.com și c.io');
    expect(result.text.match(/\[redacted:url\]/g)?.length).toBeGreaterThanOrEqual(2);
    expect(result.hits).toContain('url');
    expect(result.spamScore).toBeGreaterThan(0.3);
  });

  it('preserves Romanian diacritics in surrounding text', () => {
    const result = redactPii('Îmi place mult, mulțumesc!');
    expect(result.text).toBe('Îmi place mult, mulțumesc!');
  });
});

describe('scoreSpamShape', () => {
  it('does not penalise normal text', () => {
    expect(scoreSpamShape('Normal feedback message here.', 0)).toBe(0);
  });

  it('penalises shouting', () => {
    const score = scoreSpamShape('YOU MUST FIX THIS RIGHT NOW PLEASE WORKING', 0);
    expect(score).toBeGreaterThan(0);
  });

  it('penalises char-flood', () => {
    const score = scoreSpamShape('hellooooooooo there', 0);
    expect(score).toBeGreaterThan(0);
  });

  it('passes through baseline score', () => {
    expect(scoreSpamShape('clean', 0.5)).toBe(0.5);
  });
});

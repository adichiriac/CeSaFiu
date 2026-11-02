import {describe, expect, it} from 'vitest';
import {isValidEmail, normalizeEmail} from './email';

describe('email helpers', () => {
  it('trims surrounding whitespace and normalizes case', () => {
    expect(normalizeEmail('  Chiriac.Adrian@GMAIL.COM  ')).toBe('chiriac.adrian@gmail.com');
  });

  it('accepts valid email addresses after normalization', () => {
    expect(isValidEmail('  Chiriac.Adrian+test@GMAIL.COM  ')).toBe(true);
  });

  it.each(['', 'adrian', 'adrian@', '@gmail.com', 'adrian @gmail.com', 'adrian@gmail com'])(
    'rejects invalid email address %j',
    (value) => {
      expect(isValidEmail(value)).toBe(false);
    }
  );
});

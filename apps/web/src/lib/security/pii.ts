/**
 * Lightweight PII redaction for free-text user input.
 *
 * Goal: keep things like phone numbers, emails, and CNPs (Romanian national ID)
 * out of plaintext columns. We replace them with `[redacted:phone]` etc. and
 * return a `spamScore` increment so the caller can flag suspicious submissions
 * without dropping them outright. Bias toward false positives — better to
 * mask too much than to leak a single CNP.
 *
 * This is NOT a security boundary. A determined attacker can encode PII to
 * defeat any regex. The point is to keep accidental PII out of the feedback
 * table so a triage operator browsing recent rows doesn't see other people's
 * phone numbers.
 */

export type RedactionResult = {
  text: string;
  spamScore: number;
  /** Diagnostics — what the regex caught. Useful for triage UI later. */
  hits: Array<'email' | 'phone' | 'cnp' | 'url' | 'long_digits'>;
};

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

// Romanian phone numbers: +40XXXXXXXXX, 40XXXXXXXXX, 0XXXXXXXXX, 07XXXXXXXX (mobile).
// Tolerates spaces, dashes, dots between groups.
const PHONE_RE = /(?:\+?40[\s.-]?)?(?:0\d|7\d)(?:[\s.-]?\d){7,8}/g;

// Romanian CNP: 13 digits, starts with 1-8 then YYMMDDSSNNNC. We don't validate
// the checksum — any 13 consecutive digits is suspicious enough for redaction.
const CNP_RE = /\b\d{13}\b/g;

// Long digit runs that aren't a CNP — credit card-ish. 14-19 digits.
const LONG_DIGITS_RE = /\b\d{14,19}\b/g;

// URLs — captures bare domains too (anti-spam).
const URL_RE = /\b((?:https?:\/\/|www\.)\S+|[a-z0-9-]+\.(?:com|net|org|ro|info|biz|xyz|io|co)\b\S*)/gi;

const SPAM_WEIGHTS = {
  email: 0.2,
  phone: 0.3,
  cnp: 0.6, // very suspicious — no legit reason to put a CNP in feedback
  url: 0.15,
  long_digits: 0.4
} as const;

/**
 * Redact PII patterns and return a numeric spam score that callers can
 * accumulate. Score is unbounded — combine with other signals.
 */
export function redactPii(input: string): RedactionResult {
  let text = input;
  const hits: RedactionResult['hits'] = [];
  let spamScore = 0;

  // Order matters: redact CNP / long digits before phone (they share digits)
  // and email before URL (bare domains in URL_RE don't pick up email locals).
  text = text.replace(EMAIL_RE, () => {
    hits.push('email');
    spamScore += SPAM_WEIGHTS.email;
    return '[redacted:email]';
  });

  text = text.replace(CNP_RE, () => {
    hits.push('cnp');
    spamScore += SPAM_WEIGHTS.cnp;
    return '[redacted:id]';
  });

  text = text.replace(LONG_DIGITS_RE, () => {
    hits.push('long_digits');
    spamScore += SPAM_WEIGHTS.long_digits;
    return '[redacted:digits]';
  });

  text = text.replace(PHONE_RE, () => {
    hits.push('phone');
    spamScore += SPAM_WEIGHTS.phone;
    return '[redacted:phone]';
  });

  // Count URLs separately so 5 URLs is much more spammy than 1.
  let urlCount = 0;
  text = text.replace(URL_RE, () => {
    urlCount += 1;
    return '[redacted:url]';
  });
  if (urlCount > 0) {
    hits.push('url');
    // Linear with diminishing first-hit penalty: 1 url = 0.15, 2 = 0.30, etc.
    spamScore += SPAM_WEIGHTS.url * urlCount;
  }

  return {text, spamScore, hits};
}

/**
 * Heuristic: this looks more like spam than feedback. Combines the redaction
 * spam score with shape heuristics (very long, all caps, repeated chars).
 *
 * Threshold tuning: we mark `spam` at >= 1.0. That's:
 *   - 1 CNP + anything else, or
 *   - 1 phone + a long-digit run, or
 *   - 7 URLs, or
 *   - moderate PII + caps/repetition.
 */
export function scoreSpamShape(text: string, baseScore: number): number {
  let score = baseScore;
  const trimmed = text.trim();
  if (!trimmed) return score;

  // All-caps shouting (>20 chars and >70% uppercase).
  const letters = trimmed.replace(/[^A-Za-zĂÂÎȘȚăâîșț]/g, '');
  if (letters.length >= 20) {
    const upper = letters.replace(/[^A-ZĂÂÎȘȚ]/g, '');
    if (upper.length / letters.length > 0.7) {
      score += 0.2;
    }
  }

  // Char-flood: same char ≥ 8 times in a row.
  if (/(.)\1{7,}/.test(trimmed)) {
    score += 0.3;
  }

  return score;
}

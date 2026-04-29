import type {ErrorEvent} from '@sentry/nextjs';

const SENSITIVE_KEY_PATTERNS = [
  /email/i,
  /token/i,
  /password/i,
  /authorization/i,
  /cookie/i,
  /^parent_/i,
  /parent/i,
  /^answers?$/i,
  /^responses?$/i,
  /^picks$/i,
  /^testAnswers$/i
];

const REDACTED = '[Filtered]';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSensitiveKey(key: string) {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function scrubValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(scrubValue);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      isSensitiveKey(key) ? REDACTED : scrubValue(child)
    ])
  );
}

function getTag(event: ErrorEvent, key: string) {
  const value = event.tags?.[key];
  return typeof value === 'string' ? value : undefined;
}

function canAttachStableUser(event: ErrorEvent) {
  const ageBand = getTag(event, 'age_band');
  const consentStatus = getTag(event, 'consent_status');
  return ageBand === '16-17' || ageBand === '18+' || ageBand === 'adult' || consentStatus === 'parent_confirmed';
}

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent | null {
  const scrubbed = scrubValue(event) as ErrorEvent;

  if (!canAttachStableUser(scrubbed)) {
    delete scrubbed.user;
  } else if (scrubbed.user) {
    delete scrubbed.user.email;
    delete scrubbed.user.username;
    delete scrubbed.user.ip_address;
  }

  return scrubbed;
}

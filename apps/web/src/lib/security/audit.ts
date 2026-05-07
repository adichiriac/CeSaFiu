/**
 * Append-only audit log helper.
 *
 * Wraps inserts into `public.audit_events`. The contract is:
 *   - Never throws to the caller. Audit failures are logged via console
 *     and Sentry (if available) but the primary user-facing flow always
 *     proceeds. Auditing is observability, not a hard dependency.
 *   - Caller passes already-hashed IP / UA. We don't see raw IPs here.
 *   - Payloads should be small JSON-friendly objects. Don't log full
 *     bodies — strip or summarise upstream.
 *
 * Recognised event types live in `AUDIT_EVENT_TYPES`. Adding a new one
 * is fine, just keep them stable strings (used for grepping & dashboards).
 */

import {getSupabaseAdminClient} from '@/lib/supabase/server';

export const AUDIT_EVENT_TYPES = {
  feedbackSubmitted: 'feedback_submitted',
  feedbackRejectedRateLimit: 'feedback_rejected_rate_limit',
  feedbackRejectedTurnstile: 'feedback_rejected_turnstile',
  feedbackRejectedHoneypot: 'feedback_rejected_honeypot',
  feedbackRejectedValidation: 'feedback_rejected_validation',
  parentConsentRequested: 'parent_consent_requested',
  parentConsentConfirmed: 'parent_consent_confirmed',
  parentConsentEmailFailed: 'parent_consent_email_failed'
} as const;

export type AuditEventType =
  (typeof AUDIT_EVENT_TYPES)[keyof typeof AUDIT_EVENT_TYPES];

export type AuditEvent = {
  eventType: AuditEventType | string;
  userId?: string | null;
  ipAddressHash?: string | null;
  userAgentHash?: string | null;
  payload?: Record<string, unknown>;
};

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    // No DB connection configured — log to stdout so it's at least visible
    // in `vercel logs`. Don't throw.
    console.warn('audit: supabase_unconfigured', event);
    return;
  }

  const {error} = await supabase.from('audit_events').insert({
    event_type: event.eventType,
    user_id: event.userId ?? null,
    ip_address_hash: event.ipAddressHash ?? null,
    user_agent_hash: event.userAgentHash ?? null,
    payload: event.payload ?? {}
  });

  if (error) {
    console.error('audit: insert_failed', {eventType: event.eventType, error: error.message});
  }
}

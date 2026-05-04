import type {ErrorEvent} from '@sentry/nextjs';
import {describe, expect, it} from 'vitest';
import {scrubSentryEvent} from './scrub';

describe('scrubSentryEvent', () => {
  it('removes sensitive fields and stable user identity for unknown age sessions', () => {
    const event = {
      type: undefined,
      user: {
        id: 'user-123',
        email: 'student@example.com',
        username: 'student'
      },
      extra: {
        email: 'student@example.com',
        authToken: 'secret-token',
        answers: ['a', 'b'],
        parent_email: 'parent@example.com',
        nested: {
          token: 'nested-token',
          safe: 'kept'
        }
      }
    } satisfies ErrorEvent;

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed).not.toBeNull();
    expect(scrubbed?.user).toBeUndefined();
    expect(scrubbed?.extra).toMatchObject({
      email: '[Filtered]',
      authToken: '[Filtered]',
      answers: '[Filtered]',
      parent_email: '[Filtered]',
      nested: {
        token: '[Filtered]',
        safe: 'kept'
      }
    });
  });

  it('keeps only a stable id for confirmed 16+ users', () => {
    const event = {
      type: undefined,
      tags: {
        age_band: '16-17'
      },
      user: {
        id: 'user-456',
        email: 'student@example.com',
        username: 'student',
        ip_address: '127.0.0.1'
      }
    } satisfies ErrorEvent;

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed?.user).toEqual({id: 'user-456'});
  });

  it('keeps only a stable id for parent-confirmed users', () => {
    const event = {
      type: undefined,
      tags: {
        age_band: '13-15',
        consent_status: 'parent_confirmed'
      },
      user: {
        id: 'child-789',
        email: 'child@example.com'
      }
    } satisfies ErrorEvent;

    const scrubbed = scrubSentryEvent(event);

    expect(scrubbed?.user).toEqual({id: 'child-789'});
  });
});

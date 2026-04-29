'use client';

import * as Sentry from '@sentry/nextjs';
import {useEffect} from 'react';
import roMessages from '../../messages/ro.json';

type GlobalErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function GlobalError({error, reset}: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const copy = roMessages.error;

  return (
    <html lang="ro">
      <body>
        <main className="shell">
          <section className="intro">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p className="lead">{copy.lead}</p>
            <button className="button" onClick={reset} type="button">
              {copy.action}
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

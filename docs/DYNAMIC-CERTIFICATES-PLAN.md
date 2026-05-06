# Dynamic Certificates Plan

Status: idea documented, not started (2026-05-06).
Owner: Adi.
Scope: animated certificate video generated from a completed CeSaFiu result.
Non-goal for this slice: implementation, database migration, renderer setup, or social-platform automation.

## 1. Product Goal

Turn a completed CeSaFiu test/result into a branded, shareable "digital certificate" video.

The intended user story:

- A student completes a test or sees their career result.
- They choose to generate a short animated certificate.
- The certificate includes their name or safe display label, top result, and strongest skills/signals.
- They can download/share the MP4 and optionally share a public preview page.

The certificate should feel like a proud result artifact, not a formal diploma or psychometric diagnosis.

## 2. Why This Could Matter

This is a potential virality layer on top of the existing results flow.

Possible benefits:

- Makes results more emotionally rewarding.
- Gives students a social object to share on WhatsApp, Instagram, TikTok, or stories.
- Creates a reason for friends to take the test without needing a spammy referral mechanic.
- Reuses the existing result/matching work as personalized content.

The product bet: students are more likely to share an animated artifact about "what came out for me" than a plain referral link.

## 3. Current Constraints

The current app is not yet ready for durable certificate rendering.

Relevant current behavior:

- Test completion is saved in browser `localStorage`.
- `/rezultate` rebuilds the match by reading local stored test results and calling `/api/match`.
- There is no persisted result snapshot that a renderer can safely load later.
- There is no media rendering pipeline or storage model yet.

Implication: before video rendering, the app needs a server-side, sanitized result snapshot.

## 4. Privacy and Minor-Safe Rules

This feature touches personal data because it can expose a student's name, career fit, and inferred skills.

Baseline rules:

- Generate only on explicit user action, not automatically after every completion.
- Do not put raw answers in certificate payloads.
- Do not expose detailed psychometric scores publicly by default.
- For minors or users with pending parent consent, use a conservative public format.
- Allow a no-name fallback such as `Explorator Ce Să Fiu` or first name only.
- Avoid language that sounds like a formal diagnosis, official qualification, or guaranteed career prediction.

Suggested public-safe fields:

- Display name or safe alias.
- Top career/vibe.
- Top 3 broad skills/signals.
- Confidence label, if phrased carefully.
- Completion date.
- CeSaFiu brand and call to action.

Avoid public fields:

- Raw questionnaire answers.
- Full Big Five or psychometric profile.
- Parent/minor consent status.
- Internal match weights or scoring explanation.

## 5. Renderer Recommendation

Default path: Remotion.

Reasoning:

- The app is already Next.js + React.
- Remotion is React-based and supports parameterized MP4 rendering.
- A Remotion composition can reuse familiar component patterns and brand tokens.
- It has a clearer path to local rendering first, then server/serverless rendering later.

Secondary spike: HyperFrames.

HyperFrames is worth revisiting if the team wants HTML/CSS/JS-to-video workflows, agent-generated templates, or URL-to-video experiments. For the first production path, it is probably more new surface area than necessary.

Decision for now: use Remotion for the first spike; keep HyperFrames as a comparison option after the MVP proves useful.

References:

- Remotion: https://www.remotion.dev/
- Remotion Next.js starter/docs: https://next.remotion.dev/
- HyperFrames: https://hyperframes.app/

## 6. MVP Shape

First certificate format:

- Aspect ratio: `9:16`.
- Duration: 8-12 seconds.
- Output: MP4.
- Language: Romanian first.
- Audio: defer unless a clear brand-safe track is available.
- Template count: one.

Certificate scenes:

1. Brand intro: Ce Să Fiu mark and completion moment.
2. Identity reveal: name or alias.
3. Result reveal: top career/vibe.
4. Skills reveal: top 3 broad strengths/signals.
5. End card: `Fă și tu testul` with share URL or QR-style CTA later.

Suggested copy style:

- Confident, playful, and teen-friendly.
- "Puncte forte" / "direcții bune pentru tine", not "certified skills".
- "Rezultat Ce Să Fiu", not "official certificate".

## 7. Data Model Direction

Add durable result snapshots before rendering.

Possible tables:

```sql
create table result_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  locale text not null default 'ro',
  snapshot_version integer not null default 1,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table certificate_renders (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references result_snapshots(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  render_version integer not null default 1,
  status text not null check (status in ('queued', 'rendering', 'ready', 'failed')),
  video_url text,
  poster_url text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Snapshot payload should be sanitized and versioned:

```json
{
  "displayName": "Ana",
  "topCareer": {
    "id": "ux-designer",
    "title": "Designer UX",
    "color": "green"
  },
  "topSignals": [
    {"label": "Creezi", "scoreLabel": "puternic"},
    {"label": "Înțelegi", "scoreLabel": "solid"},
    {"label": "Asculți", "scoreLabel": "solid"}
  ],
  "confidenceLabel": "Solidă",
  "completedTests": 3,
  "completedAt": "2026-05-06T12:00:00.000Z"
}
```

## 8. UX Flow

Recommended flow:

1. User reaches `/rezultate`.
2. App computes or loads result.
3. If result is valid, app creates or updates a sanitized result snapshot.
4. Results page shows a certificate preview card.
5. User clicks `Generează certificatul`.
6. API creates a certificate render job.
7. UI shows rendering state.
8. Once ready, user can preview, download, copy link, or use native share.

Do not render automatically on every result view. Rendering should be on-demand to control cost and avoid unwanted public artifacts.

## 9. Implementation Phases

### Phase A — Snapshot foundation

- Define sanitized certificate payload.
- Add `result_snapshots`.
- Persist a snapshot from the results flow after `/api/match` returns.
- Add tests for payload mapping and privacy-safe fields.

### Phase B — Static preview

- Add a certificate preview card to `/rezultate`.
- Use the exact snapshot payload planned for video.
- Validate copy, mobile layout, and CTA placement.
- Track preview CTA clicks.

### Phase C — Remotion spike

- Add a standalone Remotion composition.
- Render locally from a mocked snapshot payload.
- Verify `9:16` MP4 output.
- Keep all visuals deterministic and template-based.

### Phase D — On-demand render pipeline

- Add `certificate_renders`.
- Add an API route or job trigger that verifies access to the snapshot.
- Render MP4 and poster.
- Store output in a media bucket.
- Return render status and media URLs.

### Phase E — Production hardening

- Move rendering to a queue/worker/serverless renderer if route-handler rendering is too slow.
- Add retries and failure states.
- Add rate limits.
- Add cleanup rules for old failed renders.
- Add analytics for generate, ready, download, copy link, and share.

## 10. Acceptance Criteria for First MVP

- A user can generate a certificate only from a valid result.
- The renderer uses a sanitized snapshot, not raw answers.
- The user sees clear states: idle, rendering, ready, failed.
- The output is a valid `9:16` MP4.
- The certificate includes name/alias, top result, top 3 signals, CeSaFiu brand, and CTA.
- The user can download the MP4.
- The implementation has a documented fallback for anonymous users and minor consent constraints.

## 11. Risks

- Rendering cost may be high if too many users generate videos.
- Serverless request limits may make direct API rendering unreliable.
- Social platforms may not support direct video sharing from all browsers.
- Public certificates can create privacy risk if copy or fields are too specific.
- The artifact may feel too formal if called a "certificate" without careful framing.

Mitigations:

- Generate only on demand.
- Start with download + public preview page, not platform-specific automation.
- Use broad signals and safe aliases.
- Keep render jobs versioned.
- Measure share behavior before adding more templates.

## 12. Open Questions

- Should the public artifact say `Certificat`, `Vibe Card`, `Rezultat animat`, or another label?
- Should users be able to edit the display name before rendering?
- Should anonymous users be allowed to generate certificates, or only signed-in users?
- What is the parent-safe certificate version for under-16 users?
- Where should rendered MP4s live: Supabase Storage, S3/R2, or Vercel Blob?
- Is `9:16` enough for MVP, or should `1:1` be included from the start?
- Should the certificate include a referral link/code from the existing viral sharing system?

## 13. Suggested Next Step

When this idea is picked back up, start with Phase A and Phase B together: define the snapshot payload and add a static certificate preview on the results page. Only start Remotion after the preview copy and payload feel right.

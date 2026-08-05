// Server-side half of Cloudflare Turnstile. The widget in components/blocks/
// shared/LeadForm.tsx only produces a token; a token nobody verifies is
// decoration, so every public form runs through here (CLAUDE.md §9).

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Whether the token is a genuine, unused Turnstile solve.
 *
 * With no `TURNSTILE_SECRET_KEY` configured the check is skipped **outside
 * production only** — that keeps a fresh clone able to submit the form, which is
 * the graceful no-op .env.example promises. In production a missing secret
 * throws: failing the request is recoverable, silently accepting every bot for
 * however long the misconfiguration goes unnoticed is not.
 *
 * Tokens are single-use with a ~300s TTL. A second verify of the same token
 * fails with `timeout-or-duplicate`, which is why the client resets the widget
 * after any rejected submit.
 */
export async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('TURNSTILE_SECRET_KEY is required in production — see docs/SECRETS.md.')
    }
    return true
  }

  if (!token) return false

  const response = await fetch(SITEVERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: ip ?? undefined }),
  })

  if (!response.ok) return false

  // Cloudflare returns more than this (`error-codes`, `challenge_ts`, hostname).
  // None of it is actionable here and some of it is request-identifying, so only
  // the verdict crosses the boundary — nothing about a visitor gets logged
  // (rules/data-privacy.md).
  const result: unknown = await response.json()

  return (
    typeof result === 'object' && result !== null && 'success' in result && result.success === true
  )
}

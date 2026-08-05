import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// DELIBERATELY `middleware.ts`, not Next 16's new `proxy.ts` — do not "fix" the
// deprecation warning that `next build` prints here.
//
// `proxy.ts` always runs on the Node.js runtime and that is NOT configurable
// (Next throws on a route segment config in a proxy file). OpenNext/Cloudflare
// hard-errors on Node.js middleware: "Node.js middleware is not currently
// supported. Consider switching to Edge Middleware." So `proxy.ts` passes
// `next build` and then fails `opennextjs-cloudflare build` — i.e. it breaks the
// deploy target, not the local build. Next's own v16 upgrade guide says to stay
// on `middleware` if you need edge. Revisit when Next ships edge support for
// `proxy` (promised for a later minor release).
export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] ?? ''

  // Headers.set() returns void, so it cannot be chained off the constructor.
  const headers = new Headers(request.headers)
  headers.set('x-tenant-host', host)

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

// Reached when no published landing page owns the request's host. No tenant means
// no theme, so this page deliberately uses the :root fallbacks from globals.css.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl">404</h1>
      <p className="text-ink-dim text-sm">Nenhuma página publicada para este domínio.</p>
    </main>
  )
}

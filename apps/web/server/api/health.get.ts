export default defineEventHandler(() => {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'forge-pages-web',
  }
})

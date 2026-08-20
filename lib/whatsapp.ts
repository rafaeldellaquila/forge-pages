/** Builds a wa.me deep link, optionally with a pre-filled message. */
export function buildWhatsappLink(number: string, message?: string): string {
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${number}${text}`
}

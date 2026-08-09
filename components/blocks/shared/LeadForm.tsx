'use client'

import Script from 'next/script'
import { useCallback, useRef, useState } from 'react'

interface LeadFormProps {
  ctaLabel: string
  selectOptions: { label: string; value: string }[]
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

const FIELD =
  'bg-transparent border border-surface-line text-ink placeholder:text-ink-muted rounded-sm px-4 py-3 text-[0.95rem] outline-none transition-colors focus:border-tenant-primary'

// Native <select> keeps its OS-drawn dropdown arrow under `appearance: auto`,
// which renders in a color the theme has no control over — appearance-none
// plus the inline chevron below is what makes it follow the tenant palette
// like every other field.
const SELECT_FIELD = `${FIELD} appearance-none pr-10`

// Same accent the fields already use on focus (ADR-0002 rule 4 bans a
// hardcoded error color) — reused here to flag a field that failed validation.
const FIELD_INVALID = 'border-tenant-primary'

const LABEL = 'font-tenant-secondary text-ink-dim text-[0.72rem] tracking-[0.08em] uppercase'

const ERROR_TEXT = 'font-tenant-secondary text-tenant-primary text-[0.75rem]'

// BR mobile format: DDD + 5-digit prefix + 4-digit line, e.g. "(11) 90000-0000".
function formatWhatsapp(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function getWhatsappError(formatted: string) {
  const digits = formatted.replace(/\D/g, '')
  if (digits.length === 0) return undefined
  return digits.length < 10 ? 'Informe um WhatsApp válido com DDD.' : undefined
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getEmailError(value: string) {
  if (value.trim().length === 0) return undefined
  return EMAIL_PATTERN.test(value.trim()) ? undefined : 'Informe um e-mail válido.'
}

// The submit button mirrors CtaButton's primary tone. That component renders an
// <a>, which a form cannot submit, so the classes are repeated rather than
// abstracted — three duplicated lines beat a wrapper that has to support both
// elements (CLAUDE.md development principles).
const SUBMIT =
  'font-tenant-secondary mt-2 inline-flex items-center justify-center gap-2 rounded-sm bg-[linear-gradient(135deg,var(--tenant-primary),var(--tenant-secondary))] px-7 py-4 text-[0.85rem] font-bold tracking-[0.03em] text-tenant-background transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0'

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/**
 * The lead form itself — the only Client Component on the page.
 *
 * UTMs are read from the URL at submit time rather than kept in state: they
 * cannot change while the visitor is on the page, and reading them late means a
 * visitor who lands with campaign parameters still gets them attributed after any
 * amount of scrolling.
 */
export function LeadForm({ ctaLabel, selectOptions }: LeadFormProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [status, setStatus] = useState<Status>('idle')
  const [token, setToken] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [whatsappError, setWhatsappError] = useState<string | undefined>(undefined)
  const [emailError, setEmailError] = useState<string | undefined>(undefined)
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)

  // Explicit rendering, not the `cf-turnstile` class: implicit rendering races
  // hydration, and only the explicit form hands back the widget id that reset()
  // needs.
  const renderWidget = useCallback(() => {
    if (!siteKey || !widgetRef.current || widgetIdRef.current) return

    widgetIdRef.current = window.turnstile?.render(widgetRef.current, {
      sitekey: siteKey,
      theme: 'auto',
      callback: setToken,
      'expired-callback': () => setToken(''),
      'error-callback': () => setToken(''),
    })
  }, [siteKey])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const whatsappValidation = getWhatsappError(whatsapp)
    const emailValidation = getEmailError(email)
    setWhatsappError(whatsappValidation)
    setEmailError(emailValidation)
    if (whatsappValidation || emailValidation) return

    setStatus('submitting')

    const form = new FormData(event.currentTarget)
    const params = new URLSearchParams(window.location.search)

    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        whatsapp,
        email: email || undefined,
        message: form.get('message') || undefined,
        intent: form.get('intent') || undefined,
        turnstileToken: token,
        utmSource: params.get('utm_source') || undefined,
        utmMedium: params.get('utm_medium') || undefined,
        utmCampaign: params.get('utm_campaign') || undefined,
      }),
    })

    if (!response.ok) {
      // Turnstile tokens are single-use: without a reset every retry fails with
      // `timeout-or-duplicate`, so the visitor would be locked out by their own
      // first mistake.
      setToken('')
      window.turnstile?.reset(widgetIdRef.current)
      setStatus('error')
      return
    }

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <p className="text-ink border-surface-line mx-auto max-w-[520px] rounded-sm border px-6 py-8 text-[1.02rem]">
        Recebemos seu contato. Em breve alguém da equipe fala com você no WhatsApp.
      </p>
    )
  }

  return (
    <>
      {siteKey ? <Script src={TURNSTILE_SRC} onReady={renderWidget} /> : null}

      <form onSubmit={handleSubmit} className="mx-auto flex max-w-[520px] flex-col gap-4 text-left">
        <label className="flex flex-col gap-2">
          <span className={LABEL}>Nome</span>
          <input name="name" type="text" required minLength={2} maxLength={120} className={FIELD} />
        </label>

        <label className="flex flex-col gap-2">
          <span className={LABEL}>WhatsApp</span>
          <input
            name="whatsapp"
            type="tel"
            required
            placeholder="(11) 90000-0000"
            value={whatsapp}
            onChange={(event) => {
              setWhatsapp(formatWhatsapp(event.target.value))
              if (whatsappError) setWhatsappError(undefined)
            }}
            onBlur={(event) => setWhatsappError(getWhatsappError(event.target.value))}
            aria-invalid={whatsappError ? true : undefined}
            aria-describedby={whatsappError ? 'whatsapp-error' : undefined}
            className={`${FIELD} ${whatsappError ? FIELD_INVALID : ''}`}
          />
          {whatsappError ? (
            <span id="whatsapp-error" className={ERROR_TEXT}>
              {whatsappError}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className={LABEL}>E-mail</span>
          <input
            name="email"
            type="email"
            maxLength={180}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (emailError) setEmailError(undefined)
            }}
            onBlur={(event) => setEmailError(getEmailError(event.target.value))}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? 'email-error' : undefined}
            className={`${FIELD} ${emailError ? FIELD_INVALID : ''}`}
          />
          {emailError ? (
            <span id="email-error" className={ERROR_TEXT}>
              {emailError}
            </span>
          ) : null}
        </label>

        {selectOptions.length > 0 ? (
          <label className="flex flex-col gap-2">
            <span className={LABEL}>Setor</span>
            <div className="relative">
              <select name="intent" required defaultValue="" className={SELECT_FIELD}>
                <option value="" disabled>
                  Selecione
                </option>
                {selectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="text-ink-dim pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2"
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </label>
        ) : null}

        <label className="flex flex-col gap-2">
          <span className={LABEL}>Mensagem</span>
          <textarea name="message" rows={4} maxLength={2000} className={`${FIELD} resize-y`} />
        </label>

        <div ref={widgetRef} />

        <button type="submit" disabled={status === 'submitting'} className={SUBMIT}>
          {status === 'submitting' ? 'Enviando…' : ctaLabel}
        </button>

        {status === 'error' ? (
          <p role="alert" className="font-tenant-secondary text-ink-dim text-[0.8rem]">
            Não foi possível enviar agora. Confira os dados e tente novamente.
          </p>
        ) : null}
      </form>
    </>
  )
}

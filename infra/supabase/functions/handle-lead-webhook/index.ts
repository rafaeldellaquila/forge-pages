import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

interface LeadRecord {
  id: string
  name: string
  whatsapp: string
  email: string | null
  landing_page_id: string
  intent: string | null
}

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: LeadRecord
  retry?: boolean
}

async function sendEmailNotification(lead: LeadRecord): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('RESEND_FROM_EMAIL'),
      to: [Deno.env.get('RESEND_NOTIFICATION_EMAIL')],
      subject: `Novo lead: ${lead.name}`,
      html: `
        <h2>Novo lead capturado</h2>
        <p><strong>Nome:</strong> ${lead.name}</p>
        <p><strong>WhatsApp:</strong> ${lead.whatsapp}</p>
        ${lead.email ? `<p><strong>E-mail:</strong> ${lead.email}</p>` : ''}
        ${lead.intent ? `<p><strong>Interesse:</strong> ${lead.intent}</p>` : ''}
        <p><strong>ID:</strong> ${lead.id}</p>
      `,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Resend error: ${error}`)
  }
}

async function sendWhatsAppNotification(lead: LeadRecord): Promise<void> {
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const notificationNumber = Deno.env.get('WHATSAPP_NOTIFICATION_NUMBER')

  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: notificationNumber,
      type: 'text',
      text: {
        body: `🔔 Novo lead!\n\n👤 ${lead.name}\n📱 ${lead.whatsapp}${lead.email ? `\n📧 ${lead.email}` : ''}${lead.intent ? `\n🎯 ${lead.intent}` : ''}`,
      },
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`WhatsApp error: ${error}`)
  }
}

async function handleRetries(): Promise<void> {
  const { data: retries } = await supabase
    .from('webhook_retries')
    .select('*, leads(*)')
    .is('resolved_at', null)
    .lt('attempts', 3)
    .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
    .limit(10)

  if (!retries?.length) return

  for (const retry of retries) {
    const lead = retry.leads as LeadRecord
    try {
      if (retry.channel === 'email') await sendEmailNotification(lead)
      if (retry.channel === 'whatsapp') await sendWhatsAppNotification(lead)

      await supabase
        .from('webhook_retries')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', retry.id)
    } catch (err) {
      const nextRetry = new Date(Date.now() + (retry.attempts + 1) * 5 * 60 * 1000)
      await supabase
        .from('webhook_retries')
        .update({
          attempts: retry.attempts + 1,
          last_error: err instanceof Error ? err.message : String(err),
          next_retry_at: nextRetry.toISOString(),
        })
        .eq('id', retry.id)
    }
  }
}

async function handleNewLead(lead: LeadRecord): Promise<void> {
  const channels: Array<'email' | 'whatsapp'> = ['email', 'whatsapp']

  await Promise.allSettled(
    channels.map(async (channel) => {
      try {
        if (channel === 'email') await sendEmailNotification(lead)
        if (channel === 'whatsapp') await sendWhatsAppNotification(lead)
      } catch (err) {
        // Store failed notification for retry
        await supabase.from('webhook_retries').insert({
          lead_id: lead.id,
          channel,
          attempts: 1,
          last_error: err instanceof Error ? err.message : String(err),
          next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })
      }
    }),
  )
}

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as WebhookPayload

    if (payload.retry) {
      await handleRetries()
      return new Response(JSON.stringify({ ok: true, action: 'retried' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (payload.type === 'INSERT' && payload.table === 'leads') {
      await handleNewLead(payload.record)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})

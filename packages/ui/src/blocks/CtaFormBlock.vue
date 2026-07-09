<script setup lang="ts">
import type { CtaFormBlock } from '@forge-pages/types'
import { onMounted, reactive, ref } from 'vue'

const props = defineProps<CtaFormBlock & { turnstileSiteKey?: string }>()

const emit = defineEmits<{
  view: []
  submit: [intent?: string]
  success: [leadId: string]
  error: [message: string]
}>()

interface TurnstileApi {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const form = reactive({
  name: '',
  whatsapp: '',
  email: '',
  message: '',
  intent: '',
})

const status = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
const errorMessage = ref('')
const turnstileToken = ref('')
const turnstileEl = ref<HTMLDivElement | null>(null)

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

const renderTurnstile = (): void => {
  if (!props.turnstileSiteKey || !turnstileEl.value || !window.turnstile) return
  window.turnstile.render(turnstileEl.value, {
    sitekey: props.turnstileSiteKey,
    callback: (token) => {
      turnstileToken.value = token
    },
  })
}

onMounted(() => {
  emit('view')
  if (!props.turnstileSiteKey) return
  if (window.turnstile) {
    renderTurnstile()
    return
  }
  const script = document.createElement('script')
  script.src = TURNSTILE_SRC
  script.async = true
  script.defer = true
  script.onload = renderTurnstile
  document.head.appendChild(script)
})

const submit = async (): Promise<void> => {
  status.value = 'submitting'
  errorMessage.value = ''
  emit('submit', form.intent || undefined)
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, turnstileToken: turnstileToken.value }),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(data.message ?? 'Request failed')
    }
    const data = (await res.json()) as { leadId: string }
    status.value = 'success'
    emit('success', data.leadId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    status.value = 'error'
    errorMessage.value = message
    emit('error', message)
  }
}
</script>

<template>
  <section id="contato" class="bg-[var(--tenant-secondary)] text-white">
    <div class="container mx-auto px-4 py-20 max-w-2xl">
      <div class="text-center mb-8">
        <h2 class="text-3xl md:text-4xl font-bold">{{ props.headline }}</h2>
        <p v-if="props.subheadline" class="mt-3 text-lg opacity-90">{{ props.subheadline }}</p>
      </div>

      <div v-if="status === 'success'" class="rounded-xl bg-white/10 p-8 text-center">
        <p class="text-lg font-semibold">Recebemos seu contato! 🎉</p>
        <p class="opacity-90 mt-1">Em breve entraremos em contato com você.</p>
      </div>

      <form v-else class="grid gap-4 rounded-2xl bg-white p-8 text-gray-900" @submit.prevent="submit">
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="Seu nome"
          class="rounded-lg border border-gray-300 px-4 py-3 focus:border-[var(--tenant-primary)] focus:outline-none"
        />
        <input
          v-model="form.whatsapp"
          type="tel"
          required
          placeholder="Seu WhatsApp"
          class="rounded-lg border border-gray-300 px-4 py-3 focus:border-[var(--tenant-primary)] focus:outline-none"
        />
        <input
          v-model="form.email"
          type="email"
          placeholder="Seu e-mail (opcional)"
          class="rounded-lg border border-gray-300 px-4 py-3 focus:border-[var(--tenant-primary)] focus:outline-none"
        />
        <select
          v-if="props.selectOptions?.length"
          v-model="form.intent"
          class="rounded-lg border border-gray-300 px-4 py-3 focus:border-[var(--tenant-primary)] focus:outline-none"
        >
          <option value="" disabled>Selecione uma opção</option>
          <option v-for="opt in props.selectOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <textarea
          v-model="form.message"
          rows="3"
          placeholder="Mensagem (opcional)"
          class="rounded-lg border border-gray-300 px-4 py-3 focus:border-[var(--tenant-primary)] focus:outline-none"
        />

        <div v-if="props.turnstileSiteKey" ref="turnstileEl" />

        <button
          type="submit"
          :disabled="status === 'submitting'"
          class="rounded-lg bg-[var(--tenant-primary)] px-6 py-4 font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {{ status === 'submitting' ? 'Enviando…' : props.ctaLabel }}
        </button>
        <p v-if="status === 'error'" class="text-sm text-red-600">{{ errorMessage }}</p>
      </form>
    </div>
  </section>
</template>

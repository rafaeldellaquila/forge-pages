<script setup lang="ts">
import type { CtaFormBlock } from '@forge-pages/types'
import { reactive, ref } from 'vue'

const props = defineProps<CtaFormBlock>()

const form = reactive({
  name: '',
  whatsapp: '',
  email: '',
  message: '',
  intent: '',
})

const status = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
const errorMessage = ref('')

const submit = async (): Promise<void> => {
  status.value = 'submitting'
  errorMessage.value = ''
  try {
    // Turnstile token is injected by the Nuxt layer in Phase 5 (bot protection).
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form }),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(data.message ?? 'Request failed')
    }
    status.value = 'success'
  } catch (err) {
    status.value = 'error'
    errorMessage.value = err instanceof Error ? err.message : 'Something went wrong'
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

        <!-- Cloudflare Turnstile widget mounts here in Phase 5 -->

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

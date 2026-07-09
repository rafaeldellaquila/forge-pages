<script setup lang="ts">
import type { FooterBlock } from '@forge-pages/types'

const props = defineProps<FooterBlock>()
</script>

<template>
  <footer class="bg-gray-900 text-gray-300">
    <div class="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-4">
      <div class="md:col-span-2">
        <img v-if="props.logo" :src="props.logo.url" :alt="props.logo.alternativeText ?? ''" class="h-8 w-auto mb-4" />
        <p v-if="props.description" class="max-w-sm text-sm text-gray-400">{{ props.description }}</p>
      </div>

      <div v-if="props.links?.length">
        <h3 class="text-white font-semibold mb-4">Links</h3>
        <ul class="space-y-2 text-sm">
          <li v-for="link in props.links" :key="link.url">
            <a :href="link.url" class="hover:text-white transition-colors">{{ link.label }}</a>
          </li>
        </ul>
      </div>

      <div>
        <h3 v-if="props.phones?.length" class="text-white font-semibold mb-4">Contato</h3>
        <ul v-if="props.phones?.length" class="space-y-2 text-sm">
          <li v-for="(phone, i) in props.phones" :key="i">
            <span v-if="phone.label" class="text-gray-500">{{ phone.label }}: </span>{{ phone.number }}
          </li>
        </ul>
        <p v-if="props.schedule" class="mt-4 text-sm text-gray-400">{{ props.schedule }}</p>
        <div v-if="props.socialLinks?.length" class="mt-4 flex gap-3">
          <a
            v-for="social in props.socialLinks"
            :key="social.url"
            :href="social.url"
            target="_blank"
            rel="noopener"
            class="text-gray-400 hover:text-white transition-colors"
          >
            {{ social.platform }}
          </a>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-800">
      <div class="container mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
        <span>{{ props.copyright }}</span>
        <a v-if="props.privacyLink" :href="props.privacyLink" class="hover:text-white transition-colors">
          Política de Privacidade
        </a>
      </div>
    </div>
  </footer>
</template>

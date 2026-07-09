import type { StorybookConfig } from '@storybook/vue3-vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  async viteFinal(cfg) {
    cfg.plugins = cfg.plugins ?? []
    // pnpm strict resolution prevents the framework from auto-adding these
    cfg.plugins.push(vue(), tailwindcss())
    return cfg
  },
}

export default config

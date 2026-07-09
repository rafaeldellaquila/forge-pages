import '@forge-pages/config/tailwind'
import type { Preview } from '@storybook/vue3'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f4f8fb' },
        { name: 'dark', value: '#0a1628' },
      ],
    },
  },
  decorators: [
    () => ({
      template: `
        <div style="--tenant-primary: #065a82; --tenant-secondary: #1c7293; --tenant-font: Inter">
          <story />
        </div>
      `,
    }),
  ],
}

export default preview

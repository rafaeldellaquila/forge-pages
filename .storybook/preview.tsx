import type { Preview } from '@storybook/nextjs-vite'
import type { CSSProperties } from 'react'
import '../app/globals.css'

/**
 * globals.css's `:root` fallback already renders every block correctly (dark
 * ramp, default brand colors) with no mocking. A story can override any
 * --tenant-* custom property to preview a specific tenant's palette instead —
 * e.g. `parameters: { tenantVars: { '--tenant-primary': '#ff0055' } }` — the
 * same mechanism app/layout.tsx uses per request, just scoped to a wrapper
 * div here instead of <html>.
 */
type TenantVars = Partial<Record<`--tenant-${string}`, string>>

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
  decorators: [
    (Story, context) => {
      const tenantVars = (context.parameters.tenantVars as TenantVars | undefined) ?? {}
      return (
        <div style={tenantVars as CSSProperties}>
          <Story />
        </div>
      )
    },
  ],
}

export default preview

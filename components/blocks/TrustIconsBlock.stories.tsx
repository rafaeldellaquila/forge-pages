import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TrustIconsBlock } from '@/components/blocks/TrustIconsBlock'

const meta = {
  title: 'Blocks/TrustIcons',
  component: TrustIconsBlock,
} satisfies Meta<typeof TrustIconsBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'trust-icons',
    items: [
      { icon: '⚡', text: 'Entrega em até 7 dias' },
      { icon: '🔒', text: 'SSL grátis em todo domínio' },
      { icon: '📈', text: 'Analytics incluso' },
      { icon: '💬', text: 'Suporte direto no WhatsApp' },
    ],
  },
}

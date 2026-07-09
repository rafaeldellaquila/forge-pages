import type { Meta, StoryObj } from '@storybook/vue3'
import TrustIconsBlock from './TrustIconsBlock.vue'

const meta: Meta<typeof TrustIconsBlock> = {
  title: 'Blocks/TrustIcons',
  component: TrustIconsBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.trust-icons',
    items: [
      { icon: '🛡️', text: 'Compra segura' },
      { icon: '🚚', text: 'Entrega rápida' },
      { icon: '⭐', text: 'Nota 4.9' },
      { icon: '🔧', text: 'Garantia estendida' },
    ],
  },
}

export const TwoItems: Story = {
  args: {
    __component: 'blocks.trust-icons',
    items: [
      { icon: '🛡️', text: 'Compra segura' },
      { icon: '🚚', text: 'Entrega rápida' },
    ],
  },
}

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { StatsBlock } from '@/components/blocks/StatsBlock'

const meta = {
  title: 'Blocks/Stats',
  component: StatsBlock,
} satisfies Meta<typeof StatsBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'stats',
    items: [
      { number: '120+', label: 'Páginas entregues' },
      { number: '98%', label: 'Clientes satisfeitos' },
      { number: '7 dias', label: 'Prazo médio' },
      { number: '24h', label: 'Tempo de resposta' },
    ],
  },
}

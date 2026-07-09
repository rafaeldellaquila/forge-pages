import type { Meta, StoryObj } from '@storybook/vue3'
import StatsBlock from './StatsBlock.vue'

const meta: Meta<typeof StatsBlock> = {
  title: 'Blocks/Stats',
  component: StatsBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.stats',
    items: [
      { number: '30+', label: 'Anos de mercado' },
      { number: '10k', label: 'Clientes felizes' },
      { number: '4.9', label: 'Avaliação média' },
      { number: '24h', label: 'Suporte' },
    ],
  },
}

export const Two: Story = {
  args: {
    __component: 'blocks.stats',
    items: [
      { number: '30+', label: 'Anos de mercado' },
      { number: '10k', label: 'Clientes felizes' },
    ],
  },
}

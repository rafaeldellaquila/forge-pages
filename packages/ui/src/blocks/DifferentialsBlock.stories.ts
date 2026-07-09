import type { Meta, StoryObj } from '@storybook/vue3'
import DifferentialsBlock from './DifferentialsBlock.vue'

const meta: Meta<typeof DifferentialsBlock> = {
  title: 'Blocks/Differentials',
  component: DifferentialsBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.differentials',
    headline: 'Nossos diferenciais',
    text: 'O que nos torna a melhor escolha.',
    items: [
      { icon: '✅', text: 'Entrega em todo o Brasil' },
      { icon: '✅', text: 'Parcelamento em até 12x' },
      { icon: '✅', text: 'Garantia de fábrica' },
      { icon: '✅', text: 'Test-ride gratuito' },
    ],
  },
}

export const WithoutText: Story = {
  args: {
    __component: 'blocks.differentials',
    headline: 'Nossos diferenciais',
    items: [
      { icon: '✅', text: 'Entrega em todo o Brasil' },
      { icon: '✅', text: 'Parcelamento em até 12x' },
      { icon: '✅', text: 'Garantia de fábrica' },
      { icon: '✅', text: 'Test-ride gratuito' },
    ],
  },
}

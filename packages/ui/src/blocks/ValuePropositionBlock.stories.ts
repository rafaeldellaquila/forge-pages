import type { Meta, StoryObj } from '@storybook/vue3'
import ValuePropositionBlock from './ValuePropositionBlock.vue'

const meta: Meta<typeof ValuePropositionBlock> = {
  title: 'Blocks/ValueProposition',
  component: ValuePropositionBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.value-proposition',
    headline: 'Por que escolher a gente',
    text: 'Tudo o que você precisa em um só lugar.',
    cards: [
      { icon: '⚡', title: 'Rápido', description: 'Atendimento ágil do início ao fim.' },
      { icon: '💬', title: 'Próximo', description: 'Suporte humano e transparente.' },
      { icon: '🔒', title: 'Seguro', description: 'Seus dados sempre protegidos.' },
    ],
  },
}

export const WithoutText: Story = {
  args: {
    __component: 'blocks.value-proposition',
    headline: 'Por que escolher a gente',
    cards: [
      { icon: '⚡', title: 'Rápido', description: 'Atendimento ágil do início ao fim.' },
      { icon: '💬', title: 'Próximo', description: 'Suporte humano e transparente.' },
      { icon: '🔒', title: 'Seguro', description: 'Seus dados sempre protegidos.' },
    ],
  },
}

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

export const WithTags: Story = {
  args: {
    __component: 'blocks.differentials',
    headline: 'Toda agência promete personalização. Quase nenhuma entrega.',
    text: 'A maioria dos materiais comerciais sai de um molde pronto — o cliente sente na hora.',
    items: [
      { tag: 'SEM', text: 'apresentação genérica de 80 slides que ninguém lê' },
      { tag: 'SEM', text: 'pacote fechado que ignora o seu momento de negócio' },
      { tag: 'SEM', text: 'promessa de resultado sem antes olhar seus dados' },
      { tag: 'COM', text: 'diagnóstico real antes de qualquer plano de ação' },
    ],
  },
}

import type { Meta, StoryObj } from '@storybook/vue3'
import CtaFormBlock from './CtaFormBlock.vue'

const meta: Meta<typeof CtaFormBlock> = {
  title: 'Blocks/CtaForm',
  component: CtaFormBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.cta-form',
    headline: 'Fale com a gente',
    subheadline: 'Preencha o formulário e retornamos em minutos.',
    selectOptions: [
      { label: 'Comprar uma moto', value: 'buy' },
      { label: 'Agendar revisão', value: 'service' },
      { label: 'Outro assunto', value: 'other' },
    ],
    ctaLabel: 'Enviar',
    whatsappNumber: '+55 11 99999-9999',
    whatsappMessage: 'Olá! Vim pelo site.',
  },
}

export const WithoutOptions: Story = {
  args: {
    __component: 'blocks.cta-form',
    headline: 'Fale com a gente',
    selectOptions: [],
    ctaLabel: 'Enviar',
    whatsappNumber: '+55 11 99999-9999',
  },
}

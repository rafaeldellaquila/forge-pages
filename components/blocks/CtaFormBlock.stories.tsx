import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CtaFormBlock } from '@/components/blocks/CtaFormBlock'

const meta = {
  title: 'Blocks/CtaForm',
  component: CtaFormBlock,
} satisfies Meta<typeof CtaFormBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'cta-form',
    headline: 'Vamos colocar sua página no ar?',
    subheadline: 'Preencha o formulário e falamos com você no mesmo dia.',
    selectOptions: [
      { label: 'Landing Page', value: 'landing-page' },
      { label: 'Manutenção', value: 'manutencao' },
      { label: 'Outro', value: 'outro' },
    ],
    ctaLabel: 'Enviar',
    whatsappNumber: '5511900000000',
    whatsappMessage: 'Quero saber mais sobre landing pages',
  },
}

export const WithoutSubheadline: Story = {
  args: {
    ...Default.args,
    subheadline: undefined,
  },
}

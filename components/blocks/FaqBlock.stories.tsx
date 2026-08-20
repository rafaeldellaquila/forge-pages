import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FaqBlock } from '@/components/blocks/FaqBlock'

const meta = {
  title: 'Blocks/Faq',
  component: FaqBlock,
} satisfies Meta<typeof FaqBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'faq',
    eyebrow: 'Dúvidas frequentes',
    headline: 'Respondendo suas principais dúvidas',
    text: 'Não encontrou o que procurava? Fale com a gente pelo WhatsApp.',
    items: [
      {
        question: 'Qual a região de atendimento?',
        answer:
          'Operamos com logística própria em um raio de 300km, cobrindo todo o estado e regiões vizinhas.',
      },
      {
        question: 'Vocês entregam o projeto completo?',
        answer: 'Sim, do planejamento à entrega final, incluindo montagem.',
      },
      {
        question: 'Como vocês garantem que não haverá atrasos?',
        answer: 'Cronograma acompanhado semanalmente com relatórios enviados ao cliente.',
      },
    ],
  },
}

export const WithoutEyebrowOrText: Story = {
  args: {
    ...Default.args,
    eyebrow: undefined,
    text: undefined,
  },
}

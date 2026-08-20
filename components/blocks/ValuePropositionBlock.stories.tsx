import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ValuePropositionBlock } from '@/components/blocks/ValuePropositionBlock'

const meta = {
  title: 'Blocks/ValueProposition',
  component: ValuePropositionBlock,
} satisfies Meta<typeof ValuePropositionBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'value-proposition',
    eyebrow: 'Como funciona',
    headline: 'Do briefing ao ar em uma semana',
    text: 'Um processo simples, pensado para quem não tem tempo a perder.',
    cards: [
      { stepLabel: '01', icon: '📝', title: 'Briefing', description: 'Você conta o que precisa.' },
      { stepLabel: '02', icon: '🎨', title: 'Design', description: 'Criamos a identidade visual.' },
      {
        stepLabel: '03',
        icon: '💻',
        title: 'Desenvolvimento',
        description: 'Colocamos tudo no ar.',
      },
      {
        stepLabel: '04',
        icon: '🚀',
        title: 'Lançamento',
        description: 'Sua página recebendo leads.',
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

export const WithoutStepLabels: Story = {
  args: {
    ...Default.args,
    cards: Default.args.cards.map((card) => ({ ...card, stepLabel: undefined })),
  },
}

export const Timeline: Story = {
  args: {
    ...Default.args,
    variant: 'timeline',
    eyebrow: 'Como funciona',
    headline: 'Do agendamento ao acompanhamento',
    cards: [
      {
        stepLabel: 'Passo 01',
        icon: '📋',
        title: 'Avaliação',
        description: 'Entendemos seu caso e definimos o protocolo ideal.',
      },
      {
        stepLabel: 'Passo 02',
        icon: '🗓️',
        title: 'Procedimento',
        description: 'Executamos com equipe especializada e tecnologia própria.',
      },
      {
        stepLabel: 'Passo 03',
        icon: '📈',
        title: 'Acompanhamento',
        description: 'Seguimos com você até o resultado final.',
      },
    ],
  },
}

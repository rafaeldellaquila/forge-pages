import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { DifferentialsBlock } from '@/components/blocks/DifferentialsBlock'

const meta = {
  title: 'Blocks/Differentials',
  component: DifferentialsBlock,
} satisfies Meta<typeof DifferentialsBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'differentials',
    eyebrow: 'Por que nós',
    headline: 'O que nos diferencia',
    text: 'Não vendemos só uma página, vendemos um processo completo.\n\nDo domínio ao primeiro lead, cuidamos de tudo.',
    items: [
      { tag: '01', icon: '⚡', text: 'Entrega rápida, sem enrolação' },
      { tag: '02', icon: '🎯', text: 'Foco total em conversão' },
      { tag: '03', text: 'Suporte direto com quem construiu' },
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

export const WithoutIconsOrTags: Story = {
  args: {
    ...Default.args,
    items: Default.args.items.map((item) => ({ text: item.text })),
  },
}

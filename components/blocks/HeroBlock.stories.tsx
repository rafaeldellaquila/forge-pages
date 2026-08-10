import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { HeroBlock } from '@/components/blocks/HeroBlock'

const meta = {
  title: 'Blocks/Hero',
  component: HeroBlock,
} satisfies Meta<typeof HeroBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'hero',
    variant: 'default',
    badgeText: 'Novo',
    headline: 'Landing pages que convertem visitantes em clientes',
    subheadline: 'Construímos a página do seu negócio, você foca em atender quem chega.',
    ctaPrimaryLabel: 'Quero minha página',
    ctaPrimaryLink: '#planos',
    ctaSecondaryLabel: 'Ver exemplos',
    ctaSecondaryLink: '#servicos',
    image: { url: '/brand/icon_positive.svg', alternativeText: 'Ilustração' },
  },
}

export const Centered: Story = {
  args: {
    ...Default.args,
    variant: 'centered',
  },
}

export const WithoutImage: Story = {
  args: {
    ...Default.args,
    image: undefined,
  },
}

export const WithoutBadgeOrSecondaryCta: Story = {
  args: {
    ...Default.args,
    badgeText: undefined,
    ctaSecondaryLabel: undefined,
    ctaSecondaryLink: undefined,
  },
}

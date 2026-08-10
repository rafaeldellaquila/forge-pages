import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PricingBlock } from '@/components/blocks/PricingBlock'

const meta = {
  title: 'Blocks/Pricing',
  component: PricingBlock,
} satisfies Meta<typeof PricingBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'pricing',
    eyebrow: 'Planos',
    headline: 'Escolha o plano ideal',
    subheadline: 'Sem fidelidade, cancele quando quiser.',
    plans: [
      {
        title: 'Essencial',
        price: 'R$ 197/mês',
        features: [{ text: 'Página única' }, { text: 'Domínio próprio' }, { text: 'SSL grátis' }],
        ctaLabel: 'Assinar',
        ctaLink: '#cta',
      },
      {
        badge: 'Mais popular',
        eyebrow: 'Recomendado',
        title: 'Profissional',
        description: 'Para quem quer captar mais leads.',
        price: 'R$ 397/mês',
        features: [
          { text: 'Tudo do Essencial' },
          { text: 'Formulário de leads' },
          { text: 'Analytics avançado' },
        ],
        ctaLabel: 'Assinar',
        ctaLink: '#cta',
        featured: true,
      },
    ],
    note: 'Valores sujeitos a alteração sem aviso prévio.',
  },
}

export const WithoutOptionalPlanFields: Story = {
  args: {
    ...Default.args,
    plans: Default.args.plans.map(({ title, price, features, ctaLabel, ctaLink }) => ({
      title,
      price,
      features,
      ctaLabel,
      ctaLink,
    })),
  },
}

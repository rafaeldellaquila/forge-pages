import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ProductGridBlock } from '@/components/blocks/ProductGridBlock'

const meta = {
  title: 'Blocks/ProductGrid',
  component: ProductGridBlock,
} satisfies Meta<typeof ProductGridBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'product-grid',
    headline: 'Estoque desta semana',
    subheadline: 'Veículos revisados e prontos para sair pela porta.',
    items: [
      {
        image: { url: '/brand/logo_negative.svg', alternativeText: 'Chevrolet Onix' },
        badge: 'Vistoriado',
        name: 'Chevrolet Onix',
        subtitle: '1.0 Turbo LT Plus',
        specs: ['Multimídia', 'Turbo', 'Baixo KM'],
        priceLabel: 'À vista',
        price: 'R$ 74.500',
        ctaLabel: 'Tenho interesse',
        ctaWhatsapp: '5566996540519',
        ctaMessage: 'Tenho interesse no Chevrolet Onix',
      },
      {
        image: { url: '/brand/logo_negative.svg', alternativeText: 'Renault Duster' },
        name: 'Renault Duster',
        subtitle: '1.6 Intense CVT',
        specs: ['Único dono', 'Automático', 'Completo'],
        priceLabel: 'À vista',
        price: 'R$ 92.900',
        ctaLabel: 'Tenho interesse',
        ctaLink: '#contato',
      },
      {
        image: { url: '/brand/logo_negative.svg', alternativeText: 'Jeep Compass' },
        badge: '2020/21',
        name: 'Jeep Compass',
        subtitle: 'Longitude 2.0 Diesel',
        specs: ['4x4', 'Diesel', 'Couro'],
        priceLabel: 'À vista',
        price: 'R$ 118.900',
        ctaLabel: 'Tenho interesse',
        ctaLink: '#contato',
      },
    ],
    viewAllLabel: 'Ver estoque completo',
    viewAllLink: '#estoque',
  },
}

export const WithoutPriceOrSpecs: Story = {
  args: {
    ...Default.args,
    items: Default.args.items.map((item) => ({
      ...item,
      badge: undefined,
      specs: undefined,
      priceLabel: undefined,
      price: undefined,
    })),
    viewAllLabel: undefined,
    viewAllLink: undefined,
  },
}

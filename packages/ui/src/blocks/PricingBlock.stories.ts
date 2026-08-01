import type { Meta, StoryObj } from '@storybook/vue3'
import PricingBlock from './PricingBlock.vue'

const meta: Meta<typeof PricingBlock> = {
  title: 'Blocks/Pricing',
  component: PricingBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.pricing',
    headline: 'Pacotes',
    subheadline: 'Dois pontos de entrada, ajustados depois de entendermos sua operação.',
    plans: [
      {
        badge: 'Mais procurado',
        eyebrow: 'Operação contínua',
        title: 'Pacote Base',
        description: 'O motor de aquisição do seu negócio rodando todo mês.',
        price: 'Valor sob medida',
        features: [
          { text: 'Estratégia de marketing sob medida' },
          { text: 'Gestão de tráfego pago (Meta / Google)' },
          { text: 'Criativos voltados para performance' },
          { text: 'Acompanhamento e relatórios periódicos' },
        ],
        ctaLabel: 'Vem orçar conosco',
        ctaLink: '#contato',
        featured: true,
      },
      {
        eyebrow: 'Diagnóstico profundo',
        title: 'Planejamento Estratégico',
        description: 'Uma estruturação completa antes de colocar dinheiro em anúncio.',
        price: 'Valor sob medida',
        features: [
          { text: 'Análise das contas de anúncio existentes' },
          { text: 'Auditoria do material digital atual' },
          { text: 'Cliente oculto e análise de concorrência' },
          { text: 'Plano de ação priorizado' },
        ],
        ctaLabel: 'Vem orçar conosco',
        ctaLink: '#contato',
      },
    ],
    note: 'Os dois pacotes são modulares — muitos clientes começam pelo Planejamento Estratégico.',
  },
}

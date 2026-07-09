import type { Meta, StoryObj } from '@storybook/vue3'
import ServicesBlock from './ServicesBlock.vue'

const meta: Meta<typeof ServicesBlock> = {
  title: 'Blocks/Services',
  component: ServicesBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.services',
    headline: 'Nossos serviços',
    tabs: [
      {
        label: 'Venda',
        title: 'Motos novas e seminovas',
        text: 'Catálogo completo com as melhores condições do mercado.',
        ctaLabel: 'Ver catálogo',
        ctaLink: '#catalogo',
      },
      {
        label: 'Oficina',
        title: 'Manutenção especializada',
        text: 'Mecânicos certificados e peças originais.',
        ctaLabel: 'Agendar',
        ctaLink: '#agendar',
      },
    ],
  },
}

export const SingleTab: Story = {
  args: {
    __component: 'blocks.services',
    headline: 'Nossos serviços',
    tabs: [
      {
        label: 'Venda',
        title: 'Motos novas e seminovas',
        text: 'Catálogo completo com as melhores condições do mercado.',
      },
    ],
  },
}

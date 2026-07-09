import type { Meta, StoryObj } from '@storybook/vue3'
import FooterBlock from './FooterBlock.vue'

const meta: Meta<typeof FooterBlock> = {
  title: 'Blocks/Footer',
  component: FooterBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.footer',
    description: 'A sua loja de motos de confiança há mais de 30 anos.',
    links: [
      { label: 'Serviços', url: '#servicos' },
      { label: 'Sobre', url: '#sobre' },
      { label: 'Contato', url: '#contato' },
    ],
    phones: [
      { label: 'Vendas', number: '+55 11 99999-9999' },
      { label: 'Oficina', number: '+55 11 98888-8888' },
    ],
    schedule: 'Seg–Sex 8h às 18h · Sáb 8h às 12h',
    socialLinks: [
      { platform: 'Instagram', url: 'https://instagram.com' },
      { platform: 'Facebook', url: 'https://facebook.com' },
    ],
    copyright: '© 2026 Forge Motos. Todos os direitos reservados.',
    privacyLink: '/privacidade',
  },
}

export const Minimal: Story = {
  args: {
    __component: 'blocks.footer',
    links: [],
    phones: [],
    socialLinks: [],
    copyright: '© 2026 Forge Motos.',
  },
}

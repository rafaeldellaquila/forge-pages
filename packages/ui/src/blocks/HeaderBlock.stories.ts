import type { Meta, StoryObj } from '@storybook/vue3'
import HeaderBlock from './HeaderBlock.vue'

const meta: Meta<typeof HeaderBlock> = {
  title: 'Blocks/Header',
  component: HeaderBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.header',
    menuLinks: [
      { label: 'Serviços', url: '#servicos' },
      { label: 'Sobre', url: '#sobre' },
      { label: 'Contato', url: '#contato' },
    ],
    ctaLabel: 'Fale conosco',
    ctaWhatsapp: '+55 11 99999-9999',
    ctaMessage: 'Olá! Vim pelo site.',
  },
}

export const NoMenu: Story = {
  args: {
    __component: 'blocks.header',
    menuLinks: [],
    ctaLabel: 'Fale conosco',
    ctaWhatsapp: '+55 11 99999-9999',
  },
}

export const WithCtaLink: Story = {
  args: {
    __component: 'blocks.header',
    menuLinks: [
      { label: 'Manifesto', url: '#manifesto' },
      { label: 'Processo', url: '#processo' },
      { label: 'Pacotes', url: '#pacotes' },
    ],
    ctaLabel: 'Forjar proposta',
    ctaLink: '#contato',
  },
}

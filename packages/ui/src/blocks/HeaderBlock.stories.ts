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

export const Centered: Story = {
  args: {
    __component: 'blocks.header',
    variant: 'centered',
    menuLinks: [
      { label: 'Manifesto', url: '#manifesto' },
      { label: 'Processo', url: '#processo' },
      { label: 'Pacotes', url: '#pacotes' },
      { label: 'Setores', url: '#setores' },
    ],
    ctaLabel: 'Forjar proposta',
    ctaLink: '#contato',
  },
}

export const CenteredGlassOnDark: Story = {
  args: {
    ...Centered.args,
    background: { type: 'glass', colorToken: 'custom', customColor: '#141009' },
  },
  parameters: { backgrounds: { default: 'dark' } },
}

export const Transparent: Story = {
  args: {
    ...Centered.args,
    background: { type: 'transparent' },
  },
}

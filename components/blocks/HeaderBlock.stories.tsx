import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { HeaderBlock } from '@/components/blocks/HeaderBlock'

const meta = {
  title: 'Blocks/Header',
  component: HeaderBlock,
} satisfies Meta<typeof HeaderBlock>

export default meta
type Story = StoryObj<typeof meta>

const menuLinks = [
  { label: 'Serviços', url: '#servicos' },
  { label: 'Planos', url: '#planos' },
  { label: 'Contato', url: '#contato' },
]

export const Default: Story = {
  args: {
    type: 'header',
    variant: 'default',
    logo: { url: '/brand/logo_positive.svg', alternativeText: 'Logo' },
    menuLinks,
    ctaLabel: 'Fale conosco',
    ctaWhatsapp: '5511900000000',
  },
}

export const Centered: Story = {
  args: {
    ...Default.args,
    variant: 'centered',
  },
}

export const WithoutLogo: Story = {
  args: {
    ...Default.args,
    logo: undefined,
  },
}

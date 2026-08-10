import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FooterBlock } from '@/components/blocks/FooterBlock'

const meta = {
  title: 'Blocks/Footer',
  component: FooterBlock,
} satisfies Meta<typeof FooterBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'footer',
    logo: { url: '/brand/logo_positive.svg', alternativeText: 'Logo' },
    description: 'Landing pages sob medida para o seu negócio.',
    links: [
      { label: 'Serviços', url: '#servicos' },
      { label: 'Planos', url: '#planos' },
    ],
    phones: [{ label: 'Comercial', number: '5511900000000' }],
    schedule: 'Seg a sex, 9h às 18h',
    socialLinks: [{ platform: 'Instagram', url: 'https://instagram.com' }],
    copyright: '© 2026 Forge Company. Todos os direitos reservados.',
    privacyLink: '/privacidade',
  },
}

/** Exercises the `hasDetails` gate: only the copyright line renders. */
export const MinimalCopyrightOnly: Story = {
  args: {
    type: 'footer',
    links: [],
    phones: [],
    socialLinks: [],
    copyright: '© 2026 Forge Company. Todos os direitos reservados.',
  },
}

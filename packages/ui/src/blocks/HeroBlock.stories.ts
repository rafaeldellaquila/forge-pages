import type { Meta, StoryObj } from '@storybook/vue3'
import HeroBlock from './HeroBlock.vue'

const meta: Meta<typeof HeroBlock> = {
  title: 'Blocks/Hero',
  component: HeroBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.hero',
    headline: 'Sua moto nova está aqui',
    subheadline: 'Mais de 30 anos de experiência no mercado de motos',
    ctaPrimaryLabel: 'Ver catálogo',
    ctaPrimaryLink: '#servicos',
    ctaSecondaryLabel: 'Saiba mais',
    ctaSecondaryLink: '#sobre',
    badgeText: '+30 anos de mercado',
  },
}

export const WithImage: Story = {
  args: {
    ...Default.args,
    image: {
      url: 'https://placehold.co/600x400',
      alternativeText: 'Moto exemplo',
    },
  },
}

export const WithoutBadge: Story = {
  args: {
    __component: 'blocks.hero',
    headline: 'Sua moto nova está aqui',
    subheadline: 'Mais de 30 anos de experiência no mercado de motos',
    ctaPrimaryLabel: 'Ver catálogo',
    ctaPrimaryLink: '#servicos',
    ctaSecondaryLabel: 'Saiba mais',
    ctaSecondaryLink: '#sobre',
  },
}

export const Ember: Story = {
  args: {
    __component: 'blocks.hero',
    variant: 'ember',
    headline: 'Forge Co. — Built to Convert',
    subheadline:
      'Marketing digital forjado, não copiado. Estratégia, tráfego pago e criativos feitos sob medida para o seu negócio.',
    ctaPrimaryLabel: 'Ver pacotes',
    ctaPrimaryLink: '#pacotes',
    ctaSecondaryLabel: 'Falar com a gente',
    ctaSecondaryLink: '#contato',
    image: {
      // biome-ignore lint/security/noSecrets: placeholder image URL, not a secret
      url: 'https://placehold.co/400x120/141009/F3EADB?text=Forge+Co.',
      alternativeText: 'Forge Co.',
    },
  },
}

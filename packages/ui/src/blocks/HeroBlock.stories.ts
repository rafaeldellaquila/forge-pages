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

export const Centered: Story = {
  args: {
    __component: 'blocks.hero',
    variant: 'centered',
    headline: 'Forge Co. — Built to Convert',
    subheadline:
      'Marketing digital forjado, não copiado. Estratégia, tráfego pago e criativos feitos sob medida para o seu negócio.',
    ctaPrimaryLabel: 'Ver pacotes',
    ctaPrimaryLink: '#pacotes',
    ctaSecondaryLabel: 'Falar com a gente',
    ctaSecondaryLink: '#contato',
  },
}

export const CenteredWithParticles: Story = {
  args: {
    ...Centered.args,
    background: {
      type: 'solid',
      colorToken: 'custom',
      customColor: '#141009',
      effect: 'particles',
    },
  },
}

export const Gradient: Story = {
  args: {
    ...Default.args,
    background: { type: 'gradient', colorToken: 'primary', gradientToToken: 'secondary' },
  },
}

export const FineLineTexture: Story = {
  args: {
    ...Centered.args,
    background: { type: 'fine-line-texture', colorToken: 'custom', customColor: '#141009' },
  },
}

export const ImageBackground: Story = {
  args: {
    ...Centered.args,
    background: {
      type: 'image',
      // biome-ignore lint/security/noSecrets: placeholder image URL, not a secret
      image: { url: 'https://placehold.co/1600x900/141009/F3EADB?text=Forge+Co.' },
    },
  },
}

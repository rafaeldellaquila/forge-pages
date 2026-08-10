import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { TestimonialsBlock } from '@/components/blocks/TestimonialsBlock'

const meta = {
  title: 'Blocks/Testimonials',
  component: TestimonialsBlock,
} satisfies Meta<typeof TestimonialsBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'testimonials',
    headline: 'Quem já usou, recomenda',
    items: [
      {
        name: 'Carla Souza',
        role: 'Dona, Studio Fit',
        photo: { url: '/brand/icon_positive.svg', alternativeText: 'Carla' },
        text: 'Em uma semana minha página estava no ar e já recebendo mensagens.',
        rating: 5,
      },
      {
        name: 'Marcos Lima',
        role: 'Sócio, Lima Advocacia',
        text: 'Processo simples, sem burocracia. Recomendo.',
        rating: 4,
      },
      {
        name: 'Juliana Prado',
        text: 'Equipe atenciosa do início ao fim.',
      },
    ],
  },
}

export const WithoutPhotosOrRatings: Story = {
  args: {
    ...Default.args,
    items: Default.args.items.map(({ name, role, text }) => ({ name, role, text })),
  },
}

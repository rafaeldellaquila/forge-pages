import type { Meta, StoryObj } from '@storybook/vue3'
import TestimonialsBlock from './TestimonialsBlock.vue'

const meta: Meta<typeof TestimonialsBlock> = {
  title: 'Blocks/Testimonials',
  component: TestimonialsBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.testimonials',
    headline: 'O que dizem nossos clientes',
    items: [
      {
        name: 'Ana Souza',
        role: 'Motociclista',
        text: 'Atendimento impecável e moto perfeita!',
        rating: 5,
      },
      { name: 'Carlos Lima', role: 'Entregador', text: 'Melhor negócio que já fiz.', rating: 5 },
      { name: 'Marina Alves', text: 'Recomendo de olhos fechados.', rating: 4 },
    ],
  },
}

export const WithPhotos: Story = {
  args: {
    __component: 'blocks.testimonials',
    headline: 'O que dizem nossos clientes',
    items: [
      {
        name: 'Ana Souza',
        role: 'Motociclista',
        text: 'Atendimento impecável e moto perfeita!',
        rating: 5,
        photo: { url: 'https://placehold.co/80x80', alternativeText: 'Ana' },
      },
    ],
  },
}

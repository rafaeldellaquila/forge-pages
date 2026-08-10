import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ServicesBlock } from '@/components/blocks/ServicesBlock'

const meta = {
  title: 'Blocks/Services',
  component: ServicesBlock,
} satisfies Meta<typeof ServicesBlock>

export default meta
type Story = StoryObj<typeof meta>

const tabsWithImage = [
  {
    label: 'Landing Pages',
    title: 'Páginas que vendem',
    text: 'Design pensado para conversão, com copy e estrutura testados.',
    ctaLabel: 'Saiba mais',
    ctaLink: '#planos',
    image: { url: '/brand/icon_positive.svg', alternativeText: 'Serviço' },
  },
  {
    label: 'Manutenção',
    title: 'Sempre no ar',
    text: 'Monitoramos, atualizamos e corrigimos sem você precisar pedir.',
    image: { url: '/brand/icon_positive.svg', alternativeText: 'Serviço' },
  },
]

export const Default: Story = {
  args: {
    type: 'services',
    variant: 'default',
    headline: 'O que fazemos',
    tabs: tabsWithImage,
  },
}

export const ImageLeft: Story = {
  args: {
    ...Default.args,
    variant: 'image-left',
  },
}

/** Exercises the reflow fix: the grid must collapse to one column, not leave an empty cell. */
export const WithoutImage: Story = {
  args: {
    ...Default.args,
    tabs: tabsWithImage.map((tab) => ({ ...tab, image: undefined })),
  },
}

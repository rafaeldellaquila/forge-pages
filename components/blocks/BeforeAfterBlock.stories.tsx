import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BeforeAfterBlock } from '@/components/blocks/BeforeAfterBlock'

const meta = {
  title: 'Blocks/BeforeAfter',
  component: BeforeAfterBlock,
} satisfies Meta<typeof BeforeAfterBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'before-after',
    headline: 'Sorrisos transformados',
    subheadline: 'Confira nossa experiência.',
    items: [
      {
        beforeImage: { url: '/brand/logo_negative.svg', alternativeText: 'Antes' },
        afterImage: { url: '/brand/logo_negative.svg', alternativeText: 'Depois' },
        caption: 'Clareamento e lentes de contato dental',
      },
      {
        beforeImage: { url: '/brand/logo_negative.svg', alternativeText: 'Antes' },
        afterImage: { url: '/brand/logo_negative.svg', alternativeText: 'Depois' },
        caption: 'Alinhamento com facetas',
      },
      {
        beforeImage: { url: '/brand/logo_negative.svg', alternativeText: 'Antes' },
        afterImage: { url: '/brand/logo_negative.svg', alternativeText: 'Depois' },
      },
    ],
  },
}

export const WithoutHeadlineOrCaptions: Story = {
  args: {
    ...Default.args,
    headline: undefined,
    subheadline: undefined,
    items: Default.args.items.map((item) => ({ ...item, caption: undefined })),
  },
}

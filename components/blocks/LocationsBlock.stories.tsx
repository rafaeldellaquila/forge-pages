import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LocationsBlock } from '@/components/blocks/LocationsBlock'

const meta = {
  title: 'Blocks/Locations',
  component: LocationsBlock,
} satisfies Meta<typeof LocationsBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'locations',
    eyebrow: 'Nossas unidades',
    headline: 'Presente nos principais estados',
    items: [
      {
        icon: '📍',
        city: 'Rio de Janeiro',
        address: 'Rua Praia de Botafogo, 501 - Botafogo, Rio de Janeiro/RJ',
        mapLink: 'https://maps.google.com',
      },
      {
        icon: '📍',
        city: 'São Paulo',
        address: 'Rua Fidêncio Ramos, 195 - Vila Olímpia, São Paulo/SP',
      },
      {
        icon: '📍',
        city: 'Goiânia',
        address: 'Avenida 136, 638 - Setor Marista, Goiânia/GO',
      },
    ],
  },
}

export const WithoutIconsOrMapLinks: Story = {
  args: {
    ...Default.args,
    items: Default.args.items.map((item) => ({ ...item, icon: undefined, mapLink: undefined })),
  },
}

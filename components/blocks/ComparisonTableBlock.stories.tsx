import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ComparisonTableBlock } from '@/components/blocks/ComparisonTableBlock'

const meta = {
  title: 'Blocks/ComparisonTable',
  component: ComparisonTableBlock,
} satisfies Meta<typeof ComparisonTableBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    type: 'comparison-table',
    eyebrow: 'A diferença é estrutural',
    headline: 'Por que as maiores empresas escolhem a gente',
    columns: [
      {
        title: 'Varejo comum',
        rows: [
          { text: 'Desgaste em poucos meses', positive: false },
          { text: 'Preço inflado por intermediários', positive: false },
          { text: 'Fornecedores fragmentados', positive: false },
          { text: 'Atrasos na entrega', positive: false },
        ],
      },
      {
        title: 'Nossa empresa',
        badge: 'Ideal',
        featured: true,
        rows: [
          { text: 'Durabilidade industrial', positive: true },
          { text: 'Cronograma respeitado rigidamente', positive: true },
          { text: 'Fabricação, entrega e montagem', positive: true },
          { text: 'Preço direto de fábrica', positive: true },
        ],
      },
    ],
  },
}

export const WithoutBadge: Story = {
  args: {
    ...Default.args,
    columns: Default.args.columns.map((column) => ({ ...column, badge: undefined })),
  },
}

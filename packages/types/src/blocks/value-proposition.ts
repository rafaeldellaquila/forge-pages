export interface ValuePropositionBlock {
  __component: 'blocks.value-proposition'
  headline: string
  text?: string
  cards: { icon: string; title: string; description: string }[]
}

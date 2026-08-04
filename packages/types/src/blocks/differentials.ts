import type { Background } from '../shared'

export interface DifferentialsBlock {
  __component: 'blocks.differentials'
  background?: Background
  headline: string
  text?: string
  items: { icon?: string; tag?: string; text: string }[]
}

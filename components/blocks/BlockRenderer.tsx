import { CtaFormBlock } from '@/components/blocks/CtaFormBlock'
import { DifferentialsBlock } from '@/components/blocks/DifferentialsBlock'
import { FooterBlock } from '@/components/blocks/FooterBlock'
import { HeaderBlock } from '@/components/blocks/HeaderBlock'
import { HeroBlock } from '@/components/blocks/HeroBlock'
import { PricingBlock } from '@/components/blocks/PricingBlock'
import { Seam } from '@/components/blocks/shared/Seam'
import { ValuePropositionBlock } from '@/components/blocks/ValuePropositionBlock'
import type { BlockType } from '@/lib/types/blocks'

// Blocks with more than one layout still branch internally on `variant`; the
// two-level map ADR-0002 describes is deferred until a block needs a *third*
// layout (ADR-0005).
//
// A switch rather than a lookup object: it narrows the discriminated union to
// each component's own props, so the mapping is checked instead of asserted.
//
// The mapping is deliberately partial. lib/schemas/blocks.ts validates all
// eleven block types, but only the ones with a component render — a valid yet
// unmapped type renders nothing instead of breaking the page. trust-icons,
// stats, services and testimonials get their components in Fase 3, when the
// second and third tenants need them.
function renderBlock(block: BlockType) {
  switch (block.type) {
    case 'header':
      return <HeaderBlock {...block} />
    case 'hero':
      return <HeroBlock {...block} />
    case 'value-proposition':
      return <ValuePropositionBlock {...block} />
    case 'differentials':
      return <DifferentialsBlock {...block} />
    case 'pricing':
      return <PricingBlock {...block} />
    case 'cta-form':
      return <CtaFormBlock {...block} />
    case 'footer':
      return <FooterBlock {...block} />
    default:
      return null
  }
}

/** A seam separates in-flow sections, but not the sticky header or the footer. */
function needsSeamBefore(blocks: BlockType[], index: number) {
  if (index === 0) return false
  if (blocks[index].type === 'footer') return false
  return blocks[index - 1].type !== 'header'
}

interface BlockRendererProps {
  blocks: BlockType[]
  dividerGlyph?: string | null
}

export function BlockRenderer({ blocks, dividerGlyph }: BlockRendererProps) {
  return (
    <main>
      {blocks.map((block, index) => {
        const rendered = renderBlock(block)
        if (!rendered) return null

        return (
          // Blocks are an ordered JSON array with no stable ids — position *is*
          // the identity. Nothing here holds client state that a reorder could
          // strand, so the index key is accurate rather than merely convenient.
          // biome-ignore lint/suspicious/noArrayIndexKey: position is the block's identity in an ordered content array
          <div key={`${block.type}-${index}`}>
            {needsSeamBefore(blocks, index) ? <Seam glyph={dividerGlyph} /> : null}
            {rendered}
          </div>
        )
      })}
    </main>
  )
}

export interface TestimonialsBlock {
  __component: 'blocks.testimonials'
  headline: string
  items: {
    name: string
    role?: string
    photo?: { url: string; alternativeText?: string }
    text: string
    rating?: number
  }[]
}

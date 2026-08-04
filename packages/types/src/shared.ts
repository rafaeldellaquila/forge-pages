export type BackgroundType =
  | 'transparent'
  | 'solid'
  | 'gradient'
  | 'image'
  | 'fine-line-texture'
  | 'glass'

export type BackgroundColorToken = 'primary' | 'secondary' | 'custom'

export interface Background {
  type?: BackgroundType
  colorToken?: BackgroundColorToken
  customColor?: string
  gradientToToken?: BackgroundColorToken
  gradientToCustom?: string
  image?: { url: string; alternativeText?: string }
  effect?: 'none' | 'particles'
}

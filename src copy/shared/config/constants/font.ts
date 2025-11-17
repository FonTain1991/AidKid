type Font = {
  regular: string
  medium: string
  bold: string
  italic?: string
  [key: string]: string | undefined
}

export const FONT_FAMILY: Font = {
  regular: 'Roboto-Regular',
  medium: 'Roboto-Medium',
  bold: 'Roboto-Bold',
  italic: 'Roboto-Italic'
}

export const FONT_SIZE = {

  /** Extra small — 10 */
  xs: 10,

  /** Small — 12 */
  sm: 12,

  /** Medium — 14 */
  md: 14,

  /** Large — 16 */
  lg: 16,

  /** Extra large — 18 */
  xl: 18,

  /** Heading — 24 */
  heading: 24,
} as const

export const FONT_WEIGHT = {

  /** Thin — 100 */
  thin: 100,

  /** Extra Light — 200 */
  extraLight: 200,

  /** Light — 300 */
  light: 300,

  /** Regular — 400 */
  regular: 400,

  /** Medium — 500 */
  medium: 500,

  /** Semi Bold — 600 */
  semiBold: 600,

  /** Bold — 700 */
  bold: 700,

  /** Extra Bold — 800 */
  extraBold: 800,

  /** Black — 900 */
  black: 900,
} as const
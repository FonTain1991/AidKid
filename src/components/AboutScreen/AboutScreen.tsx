import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { memo } from 'react'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import { PaddingHorizontal } from '../Layout'
import { Text } from '../Text'

interface AboutScreenProps {
  title: string
  text: string
  style?: StyleProp<ViewStyle>
}
export const AboutScreen = memo(({ title, text, style }: AboutScreenProps) => {
  const { colors } = useTheme()
  return (
    <PaddingHorizontal style={style}>
      <Text style={[styles.infoTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.infoText, { color: colors.muted }]}>
        {text}
      </Text>
    </PaddingHorizontal>
  )
})

const styles = StyleSheet.create({
  infoTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
  infoText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
})
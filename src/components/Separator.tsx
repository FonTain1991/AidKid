import { SPACING } from '@/constants'
import { useTheme } from '@/providers/theme'
import React from 'react'
import { View, StyleSheet } from 'react-native'

interface SeparatorProps {
  style?: any
}

export const Separator: React.FC<SeparatorProps> = ({ style }) => {
  const { colors } = useTheme()

  return (
    <View style={[styles.separator, { backgroundColor: colors.border }, style]} />
  )
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    flexGrow: 1,
    marginHorizontal: SPACING.md,
  },
})

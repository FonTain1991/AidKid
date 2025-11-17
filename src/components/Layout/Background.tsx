import { useTheme } from '@/providers/theme'
import { memo, PropsWithChildren } from 'react'
import { View, ViewProps } from 'react-native'

export const Background = memo(({ children }: PropsWithChildren<ViewProps>) => {
  const { colors } = useTheme()
  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      {children}
    </View>
  )
})
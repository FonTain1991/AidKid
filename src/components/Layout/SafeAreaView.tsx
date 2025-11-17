import { useTheme } from '@/providers/theme'
import type { ComponentProps, ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { SafeAreaView as RNSSafeAreaView } from 'react-native-safe-area-context'

type NativeSafeAreaViewProps = ComponentProps<typeof RNSSafeAreaView>

interface SafeAreaViewProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  flexZero?: boolean
  edges?: NativeSafeAreaViewProps['edges']
}
export function SafeAreaView({ children, style, flexZero, edges }: SafeAreaViewProps) {
  const { colors } = useTheme()
  const flexStyle = flexZero ? { flex: 0 } : { flex: 1 }

  return (
    <RNSSafeAreaView edges={edges} style={[{
      backgroundColor: colors.background
    },
      flexStyle,
      style]}>
      {children}
    </RNSSafeAreaView>
  )
}
import { SPACING } from '@/constants'
import { StyleProp, View, ViewStyle } from 'react-native'

interface FlexProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export function PaddingHorizontal({ children, style }: FlexProps) {
  return (
    <View style={[{ paddingHorizontal: SPACING.md }, style]}>
      {children}
    </View>
  )
}
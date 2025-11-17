import { SPACING } from '@/constants'
import { StyleProp, View, ViewStyle } from 'react-native'

interface FlexProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export function Padding({ children, style }: FlexProps) {
  return (
    <View style={[style, { padding: SPACING.md }]}>
      {children}
    </View>
  )
}
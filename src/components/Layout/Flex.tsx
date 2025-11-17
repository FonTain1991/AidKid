import { StyleProp, View, ViewStyle } from 'react-native'

interface FlexProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export function Flex({ children, style }: FlexProps) {
  return (
    <View style={[style, { flex: 1 }]}>
      {children}
    </View>
  )
}
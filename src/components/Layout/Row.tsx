import { StyleProp, View, ViewStyle } from 'react-native'

interface RowProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  itemsCenter?: boolean
  between?: boolean
}

export function Row({ children, style, itemsCenter = false, between = false }: RowProps) {
  return (
    <View style={[style, {
      flexDirection: 'row',
      alignItems: itemsCenter ? 'center' : 'flex-start',
      justifyContent: between ? 'space-between' : 'flex-start'
    }]}>
      {children}
    </View>
  )
}
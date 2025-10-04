import { StyleProp, View, ViewStyle } from 'react-native'
interface IProps {
  children?: React.ReactNode,
  style?: StyleProp<ViewStyle>,
}

export function IconWrap({ children, style }: IProps) {
  return (
    <View style={[{
      height: 24,
      width: 24,
      alignItems: 'center',
      justifyContent: 'center'
    }, style]}>
      {children && children}
    </View>
  )
}
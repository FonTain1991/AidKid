import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import { Edge, SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import { IS_ANDROID, SPACING } from '../config'

interface IProps {
  style?: StyleProp<ViewStyle>,
  children: React.ReactNode
  edges?: Edge[]
}

export function SafeAreaView({ style, children, edges }: IProps) {
  return (
    <RNSafeAreaView
      style={[styles.container, style]}
      children={children}
      edges={edges ?? ['top']}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: IS_ANDROID ? SPACING.sm : 0,
    paddingBottom: IS_ANDROID ? SPACING.sm : 0,
  },
})
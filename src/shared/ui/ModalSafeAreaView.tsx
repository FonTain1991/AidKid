import { StyleProp, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { IS_ANDROID, SPACING } from '../config'

interface IProps {
  style?: StyleProp<ViewStyle>
  children: React.ReactNode
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
  androidPadding?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
  iosPadding?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
  useDefaultPadding?: boolean
}

export function ModalSafeAreaView({
  style,
  children,
  edges = ['top', 'bottom'],
  androidPadding = {},
  iosPadding = {},
  useDefaultPadding = true
}: IProps) {
  const insets = useSafeAreaInsets()

  const defaultPadding = useDefaultPadding ? {
    top: IS_ANDROID ? SPACING.md / 2 : 0,
    bottom: IS_ANDROID ? SPACING.md / 2 : 0,
    left: 0,
    right: 0
  } : { top: 0, bottom: 0, left: 0, right: 0 }

  const osPadding = IS_ANDROID ? androidPadding : iosPadding

  const finalPadding = {
    top: osPadding.top !== undefined ? osPadding.top : defaultPadding.top,
    bottom: osPadding.bottom !== undefined ? osPadding.bottom : defaultPadding.bottom,
    left: osPadding.left !== undefined ? osPadding.left : defaultPadding.left,
    right: osPadding.right !== undefined ? osPadding.right : defaultPadding.right,
  }

  const paddingStyle = {
    paddingTop: edges.includes('top') ? insets.top + finalPadding.top : finalPadding.top,
    paddingBottom: edges.includes('bottom') ? insets.bottom + finalPadding.bottom : finalPadding.bottom,
    paddingLeft: edges.includes('left') ? insets.left + finalPadding.left : finalPadding.left,
    paddingRight: edges.includes('right') ? insets.right + finalPadding.right : finalPadding.right,
  }

  return (
    <View
      style={[{
        flex: 1,
        ...paddingStyle
      }, style]}
    >
      {children}
    </View>
  )
} 
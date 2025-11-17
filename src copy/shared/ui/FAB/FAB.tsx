import { TouchableOpacity, ViewStyle, StyleSheet } from 'react-native'
import { TabIcon } from '../TabIcon'
import { useTheme } from '@/app/providers/theme'
import { useFABStyles } from './useFABStyles'

interface FABProps {
  onPress: () => void
  icon?: string
  size?: number
  style?: ViewStyle
}

export const FAB = ({ onPress, icon = 'plus', size = 24, style }: FABProps) => {
  const { colors } = useTheme()
  const styles = useFABStyles({ style })

  return (
    <TouchableOpacity
      style={StyleSheet.flatten(styles.fab)}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <TabIcon name={icon} color={colors.white} size={size} />
    </TouchableOpacity>
  )
}

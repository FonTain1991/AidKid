import { useMemo } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '@/app/providers/theme'

interface UseFABStylesProps {
  style?: ViewStyle
}

export const useFABStyles = ({ style }: UseFABStylesProps = {}) => {
  const { colors } = useTheme()

  return useMemo(() => {
    const baseStyles = StyleSheet.create({
      fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: colors.text,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        zIndex: 1000,
      },
    })

    return {
      fab: style ? [baseStyles.fab, style] : baseStyles.fab,
    }
  }, [colors, style])
}

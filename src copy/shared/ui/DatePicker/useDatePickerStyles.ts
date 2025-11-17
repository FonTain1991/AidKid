import { useTheme } from '@/app/providers/theme'
import { StyleSheet } from 'react-native'

export const useDatePickerStyles = () => {
  const { colors } = useTheme()

  const styles = StyleSheet.create({
    button: {
      // Дополнительные стили для кнопки DatePicker, если нужно
    },
  })

  return {
    styles,
    colors,
  }
}

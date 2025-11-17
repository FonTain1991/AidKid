import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import dayjs from 'dayjs'
import { memo } from 'react'
import isBetween from 'dayjs/plugin/isBetween'
import { StyleSheet, Text, View } from 'react-native'

dayjs.extend(isBetween)
export const Greetings = memo(() => {
  const { colors } = useTheme()
  const today = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')

  let text = 'Добрый утро!'
  if (dayjs().isBetween(`${today} 12:01.00`, `${today} 18:00.00`, 'm', '[]')) {
    text = 'Добрый день!'
  }
  if (dayjs().isBetween(`${today} 18:01.00`, `${tomorrow} 04:59.00`, 'm', '[]')) {
    text = 'Добрый вечер!'
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16
  },
  text: {
    fontSize: FONT_SIZE.heading,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: FONT_SIZE.heading,
  },
})
import { RADIUS, SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { Pressable, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { Text } from '../Text'
import { Row } from '../Layout'

interface EmptyListProps {
  onPress: () => void
  title: string
  options: any[]
  children: React.ReactNode
  error?: string
}

export function EmptyList({ onPress, title, options, children, error }: EmptyListProps) {
  const { colors } = useTheme()

  const { length } = options
  return (
    <>
      {!length && (
        <Pressable
          style={({ pressed }) => [
            styles.container,
            { opacity: pressed ? 0.7 : 1 },
            error && {
              paddingVertical: SPACING.xs,
              borderRadius: RADIUS.md,
              borderWidth: 1,
              borderColor: colors.error,
            }
          ]}
          onPress={onPress}
        >
          <Row itemsCenter>
            <Icon name='database' size={30} color={colors.error} />
            <Text style={[styles.title, { color: colors.text }]}>{title}{'\n'}<Text style={{ color: colors.link }}>Добавить</Text></Text>
          </Row>
        </Pressable>
      )}
      {!!length && children}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    marginLeft: SPACING.sm,
    textAlign: 'center'
  }
})
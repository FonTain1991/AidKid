import { SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useTheme } from '@/providers/theme'
import { StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { Background, Flex } from '../Layout'
import { Text } from '../Text'

interface EmptyProps {
  icon: string
  title: string
  description: string
  children?: React.ReactNode
}

export function Empty({ icon, title, description, children }: EmptyProps) {
  const { colors } = useTheme()

  return (
    <Background>
      <Flex style={styles.container}>
        <Icon name={icon} size={100} color={colors.muted} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
        {children}
      </Flex>
    </Background>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginTop: SPACING.md
  },
  description: {
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.xxl,
    textAlign: 'center'
  },
})
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useDatabase } from '@/shared/lib'
import { useTheme } from '@/app/providers/theme'

export function SplashScreen() {
  const { colors } = useTheme()
  const { isInitialized, error } = useDatabase()

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>AidKit</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {error ? 'Ошибка инициализации' : 'Загрузка...'}
      </Text>
      {!error && (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  loader: {
    marginTop: 16,
  },
}) 
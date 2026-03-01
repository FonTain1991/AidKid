import { AboutScreen } from '@/components/AboutScreen'
import { Backup } from '@/components/Backup'
import { Background, SafeAreaView } from '@/components/Layout'
import { SPACING } from '@/constants'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'

export function BackupScreen() {
  const { t } = useTranslation()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: t('screens.backup')
    }
  })
  useNavigationBarColor()

  return (
    <Background>
      <SafeAreaView edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <Backup />
          <AboutScreen
            title={t('empty.aboutBackups')}
            text={t('empty.backupInfo')}
            style={{ marginTop: SPACING.md, paddingHorizontal: 0 }}
          />
        </ScrollView>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md
  },
})
import { AboutScreen } from '@/components/AboutScreen'
import { Backup } from '@/components/Backup'
import { Background, SafeAreaView } from '@/components/Layout'
import { SPACING } from '@/constants'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { ScrollView, StyleSheet } from 'react-native'

export function BackupScreen() {
  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Резервная копия'
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
            title='О резервных копиях'
            text={'💡 Резервные копии включают все ваши аптечки, лекарства, запасы, напоминания, историю приема фотографии.\n\n☁️ Google Drive хранит данные в защищённой папке приложения, недоступной другим приложениям.'}
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
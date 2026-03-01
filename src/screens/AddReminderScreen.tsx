
import { AddReminder } from '@/components/AddReminder'
import { useStyles } from '@/components/AddReminder/useStyles'
import { SafeAreaView } from '@/components/Layout'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

export function AddReminderScreen() {
  const styles = useStyles()
  const { t } = useTranslation()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: t('screens.addReminder')
    },
  })

  useNavigationBarColor()

  return (
    <SafeAreaView edges={['bottom']}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps='handled'
        nestedScrollEnabled
        style={styles.scroll}
      >
        <AddReminder />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}
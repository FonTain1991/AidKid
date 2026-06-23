
import { AddReminder } from '@/components/AddReminder'
import { useStyles } from '@/components/AddReminder/useStyles'
import { SafeAreaView } from '@/components/Layout'
import { useNavigationBarColor, useRoute, useScreenProperties } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

export function AddReminderScreen() {
  const styles = useStyles()
  const { t } = useTranslation()
  const { params } = useRoute()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: params?.reminderId ? t('screens.editReminder') : t('screens.addReminder')
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
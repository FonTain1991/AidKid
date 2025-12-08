
import { AddReminder } from '@/components/AddReminder'
import { useStyles } from '@/components/AddReminder/useStyles'
import { SafeAreaView } from '@/components/Layout'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

export function AddReminderScreen() {
  const styles = useStyles()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Добавить напоминание'
    },
  })

  useNavigationBarColor()

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
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
import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { NotificationSettings } from '@/components/NotificationSettings'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { ScrollView } from 'react-native'

export function NotificationSettingsScreen() {
  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Настройки уведомлений'
    }
  })

  useNavigationBarColor()


  return (
    <SafeAreaView edges={[]}>
      <Background>
        <Flex>
          <ScrollView
            keyboardShouldPersistTaps='handled'
            nestedScrollEnabled
          >
            <NotificationSettings />
          </ScrollView>
        </Flex>
      </Background>
    </SafeAreaView>
  )
}
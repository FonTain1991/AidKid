import { Flex, SafeAreaView } from '@/components/Layout'
import { Reminders } from '@/components/Reminders'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { UseScreenPropertiesOptions } from '@/hooks/useScreenProperties'
import { useMemo } from 'react'
import { ScrollView } from 'react-native'

export function RemindersScreen() {
  const options = useMemo<UseScreenPropertiesOptions>(() => ({
    navigationOptions: {
      headerShown: true,
      title: 'Напоминания'
    }
  }), [])

  useScreenProperties(options)
  useNavigationBarColor()

  return (
    <SafeAreaView>
      <Flex>
        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps='handled'
        >
          <Reminders />
        </ScrollView>
      </Flex>
    </SafeAreaView >
  )
}

import { AboutScreen } from '@/components/AboutScreen'
import { Flex, SafeAreaView } from '@/components/Layout'
import { Today } from '@/components/Today'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { UseScreenPropertiesOptions } from '@/hooks/useScreenProperties'
import { useMemo } from 'react'
import { ScrollView } from 'react-native'

export function TodayScreen() {
  const options = useMemo<UseScreenPropertiesOptions>(() => ({
    navigationOptions: {
      headerShown: true,
      title: 'Сегодня'
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
          <Today />
          {/* <AboutScreen
            title='О разделе "Сегодня"'
            text={'• Здесь отображаются все запланированные приемы на сегодня\n• Нажмите на прием, чтобы отметить его выполненным\n• Количество лекарства автоматически уменьшится\n• Приемы показываются на основе настроенных напоминаний'}
          /> */}
        </ScrollView>
      </Flex>
    </SafeAreaView >
  )
}

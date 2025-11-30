import { Flex, SafeAreaView } from '@/components/Layout'
import { MedicineListForQuickIntake } from '@/components/MedicineListForQuickIntake'
import { SPACING } from '@/constants'
import { useNavigationBarColor } from '@/hooks'
import { useScreenProperties, UseScreenPropertiesOptions } from '@/hooks/useScreenProperties'
import { useMemo } from 'react'
import { ScrollView } from 'react-native'

export function QuickIntakeScreen() {
  const options = useMemo<UseScreenPropertiesOptions>(() => ({
    navigationOptions: {
      headerShown: true,
      title: 'Быстрый прием'
    }
  }), [])


  useScreenProperties(options)
  useNavigationBarColor()
  return (
    <SafeAreaView edges={[]}>
      <Flex>
        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps='handled'
          contentContainerStyle={{ gap: SPACING.md, paddingVertical: SPACING.md }}
        >
          <MedicineListForQuickIntake />
        </ScrollView>
      </Flex>
    </SafeAreaView>
  )
}
import { QuickIntakeButton } from '@/components/Buttons'
import { Flex, PaddingHorizontal, SafeAreaView } from '@/components/Layout'
import { MedicineListForQuickIntake } from '@/components/MedicineListForQuickIntake'
import { SPACING } from '@/constants'
import { useEvent, useNavigationBarColor } from '@/hooks'
import { useScreenProperties, UseScreenPropertiesOptions } from '@/hooks/useScreenProperties'
import { useTheme } from '@/providers/theme'
import { useAppStore } from '@/store'
import { useFocusEffect } from '@react-navigation/native'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'

export function QuickIntakeScreen() {
  const { colors } = useTheme()
  const [searchText, setSearchText] = useState('')
  const { setQuickIntakeMedicines } = useAppStore(state => state)

  const options = useMemo<UseScreenPropertiesOptions>(() => ({
    navigationOptions: {
      headerShown: true,
      title: 'Быстрый прием',
      headerSearchBarOptions: {
        placeholder: 'Поиск лекарства',
        onChangeText: event => {
          setSearchText(event.nativeEvent.text)
        },
        onCancelButtonPress: () => {
          setSearchText('')
        },
        headerIconColor: colors.text,
        shouldShowHintSearchIcon: false,
        autoFocus: true
      }
    }
  }), [colors])


  useScreenProperties(options)
  useNavigationBarColor()

  useFocusEffect(useEvent(() => {
    setSearchText('')
    setQuickIntakeMedicines([])
  }))

  return (
    <SafeAreaView edges={['bottom']}>
      <Flex>
        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps='handled'
          contentContainerStyle={{
            gap: SPACING.md,
            paddingVertical: SPACING.md,
            flexGrow: 1
          }}
        >
          <MedicineListForQuickIntake searchText={searchText} />
        </ScrollView>
        <PaddingHorizontal>
          <QuickIntakeButton />
        </PaddingHorizontal>
      </Flex>
    </SafeAreaView>
  )
}
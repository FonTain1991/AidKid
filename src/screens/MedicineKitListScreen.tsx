import { FloatingButton } from '@/components/FloatingButton'
import { Background, Flex, PaddingHorizontal, SafeAreaView } from '@/components/Layout'
import { MedicineKitList } from '@/components/MedicineKitList'
import { MedicineList } from '@/components/MedicineList'
import { MedicineLowQuantity } from '@/components/MedicineLowQuantity'
import { SPACING } from '@/constants'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { useTheme } from '@/providers/theme'
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

export function MedicineKitListScreen() {
  const { colors } = useTheme()
  const [searchText, setSearchText] = useState('')

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Аптечки',
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
    },
  })

  useNavigationBarColor()

  return (
    <SafeAreaView edges={[]}>
      <Background>
        <Flex>
          <ScrollView
            keyboardShouldPersistTaps='handled'
            nestedScrollEnabled
            contentContainerStyle={styles.contentContainer}
          >
            {!searchText && (
              <>
                <PaddingHorizontal>
                  <MedicineLowQuantity />
                </PaddingHorizontal>
                <MedicineKitList />
              </>
            )}
            {!!searchText && <MedicineList searchText={searchText} showKit />}
          </ScrollView>
          <FloatingButton />
        </Flex>
      </Background>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  }
})
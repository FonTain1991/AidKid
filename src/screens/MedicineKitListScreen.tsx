import { FloatingButton } from '@/components/FloatingButton'
import { Background, Flex, PaddingHorizontal, SafeAreaView } from '@/components/Layout'
import { MedicineKitList } from '@/components/MedicineKitList'
import { MedicineLowQuantity } from '@/components/MedicineLowQuantity'
import { SPACING } from '@/constants'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { ScrollView, StyleSheet } from 'react-native'

export function MedicineKitListScreen() {
  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Аптечки'
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
            <PaddingHorizontal>
              <MedicineLowQuantity />
            </PaddingHorizontal>
            <MedicineKitList />
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
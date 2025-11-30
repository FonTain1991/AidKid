import { GoBackMedicineScreen } from '@/components/Buttons'
import { Empty } from '@/components/Empty'
import { FloatingButton } from '@/components/FloatingButton'
import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { MedicineKitList } from '@/components/MedicineKitList'
import { MedicineList } from '@/components/MedicineList'
import { SPACING } from '@/constants'
import { useBackHandlerMedicineScreen, useMedicineScreenTitle, useNavigationBarColor, useRoute, useScreenProperties } from '@/hooks'
import { useAppStore } from '@/store'
import { useMemo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

export function MedicineListScreen() {
  const { params } = useRoute()
  const { medicineKits, medicines } = useAppStore(state => state)
  const title = useMedicineScreenTitle()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title,
      headerLeft: () => <GoBackMedicineScreen />
    }
  })

  useNavigationBarColor()
  useBackHandlerMedicineScreen()

  const isEmpty = useMemo(() => {
    const medicineKitsIsEmpty = medicineKits.filter(medicineKit => medicineKit.parentId === params?.medicineKitId).length === 0
    const medicinesIsEmpty = medicines.filter(medicine => medicine.medicineKitId === params?.medicineKitId).length === 0

    return medicineKitsIsEmpty && medicinesIsEmpty
  }, [medicineKits, medicines, params?.medicineKitId])

  if (isEmpty) {
    return <Empty icon='box' title='Аптечка пуста' description='Добавьте лекарства в аптечку' />
  }

  return (
    <SafeAreaView edges={['bottom']}>
      <Background>
        <Flex>
          <ScrollView
            keyboardShouldPersistTaps='handled'
            nestedScrollEnabled
            contentContainerStyle={styles.contentContainer}
          >
            <MedicineKitList />
            <MedicineList />
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
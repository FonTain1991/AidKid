import { GoBackMedicineScreen } from '@/components/Buttons'
import { Empty } from '@/components/Empty'
import { FloatingButton } from '@/components/FloatingButton'
import { Background, Flex, SafeAreaView } from '@/components/Layout'
import { MedicineKitList } from '@/components/MedicineKitList'
import { MedicineList, type SortValue } from '@/components/MedicineList'
import { SortList } from '@/components/Sort'
import { SPACING } from '@/constants'
import { useBackHandlerMedicineScreen, useMedicineScreenTitle, useNavigationBarColor, useRoute, useScreenProperties } from '@/hooks'
import { useAppStore } from '@/store'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'

export function MedicineListScreen() {
  const { t } = useTranslation()
  const { params } = useRoute()
  const { medicineKits, medicines } = useAppStore(state => state)
  const title = useMedicineScreenTitle()
  const [sort, setSort] = useState<SortValue>('name_asc')

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title,
      headerLeft: () => <GoBackMedicineScreen />,
      headerRight: () => <SortList value={sort} onChange={setSort} />
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
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Empty
            icon='box'
            title={t('empty.emptyKitTitle')}
            description={t('empty.emptyKitDesc')}
          />
          <FloatingButton parentId={params?.medicineKitId} />
        </Background>
      </SafeAreaView>
    )
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
            <MedicineList sort={sort} />
          </ScrollView>
          <FloatingButton parentId={params?.medicineKitId} />
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
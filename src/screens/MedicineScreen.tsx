import { Flex, SafeAreaView } from '@/components/Layout'
import { MedicineDelete, MedicineForm } from '@/components/MedicineForm'
import { useNavigationBarColor, useRoute, useScreenProperties } from '@/hooks'
import { useTranslation } from 'react-i18next'

export function MedicineScreen() {
  const { params } = useRoute()
  const { t } = useTranslation()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: params?.medicineId ? t('medicine.editMedicine') : t('medicine.createMedicine'),
      headerRight: () => params?.medicineId && <MedicineDelete />,
    },
  })

  useNavigationBarColor()

  return (
    <SafeAreaView edges={['bottom']}>
      <Flex>
        <MedicineForm />
      </Flex>
    </SafeAreaView>
  )
}

import { Flex, SafeAreaView } from '@/components/Layout'
import { MedicineKitDelete, MedicineKitForm } from '@/components/MedicineKitForm'
import { useNavigationBarColor, useRoute, useScreenProperties } from '@/hooks'
import { useTranslation } from 'react-i18next'

export function MedicineKitScreen() {
  const { params } = useRoute()
  const { t } = useTranslation()

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: params?.medicineKitId ? t('medicineKit.editKit') : t('medicineKit.createKit'),
      headerRight: () => params?.medicineKitId && <MedicineKitDelete />,
    },
  })

  useNavigationBarColor()

  return (
    <SafeAreaView edges={['bottom']}>
      <Flex>
        <MedicineKitForm />
      </Flex>
    </SafeAreaView>
  )
}

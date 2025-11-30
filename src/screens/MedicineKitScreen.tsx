import { Flex, SafeAreaView } from '@/components/Layout'
import { MedicineKitDelete, MedicineKitForm } from '@/components/MedicineKitForm'
import { useNavigationBarColor, useRoute, useScreenProperties } from '@/hooks'

export function MedicineKitScreen() {
  const { params } = useRoute()


  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: params?.medicineKitId ? 'Редактирование аптечки' : 'Создание аптечки',
      headerRight: () => params?.medicineKitId && <MedicineKitDelete />
    }
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

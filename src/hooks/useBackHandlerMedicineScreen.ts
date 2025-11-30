import { useAppStore } from '@/store'
import { useEvent } from './useEvent'
import { useMyNavigation } from './useMyNavigation'
import { useRoute } from './useRoute'
import { useEffect } from 'react'
import { BackHandler } from 'react-native'
import { MedicineKit } from '@/services/models'

export function useBackHandlerMedicineScreen() {
  const { params } = useRoute()
  const { navigate, goBack } = useMyNavigation()
  const { medicineKits } = useAppStore(state => state)

  const handleSmartBackPress = useEvent(() => {
    const currentKit = medicineKits.find((kit: MedicineKit) => kit.id === params?.medicineKitId)
    if (currentKit?.parentId) {
      navigate('medicineList', { medicineKitId: Number(currentKit?.parentId) })
      return true
    }

    goBack()
    return true
  })

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleSmartBackPress)
    return () => backHandler.remove()
  }, [handleSmartBackPress])
}
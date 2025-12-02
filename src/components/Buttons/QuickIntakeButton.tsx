import { useEvent } from '@/hooks'
import { useMedicine } from '@/hooks/useMedicine'
import { useAppStore } from '@/store'
import { memo } from 'react'
import { Alert } from 'react-native'
import { Button } from '../Button'

export const QuickIntakeButton = memo(() => {
  const {
    quickIntakeMedicines,
    setQuickIntakeMedicines,
    setIsClearedQuickIntakeMedicines,
    medicines
  } = useAppStore(state => state)

  const { updateMedicine } = useMedicine()

  const handleQuickIntake = useEvent(async () => {
    if (!quickIntakeMedicines?.length) {
      return
    }
    await Promise.all(quickIntakeMedicines.map(async medicine => {
      return await updateMedicine({
        id: medicine.medicineId,
        quantity: Number(medicines.find(m => m.id === medicine.medicineId)?.quantity) - Number(medicine.dosage)
      })
    }))
    setIsClearedQuickIntakeMedicines(true)
    setQuickIntakeMedicines([])
    Alert.alert(
      '✅ Прием отмечен',
      `Принято лекарств: ${quickIntakeMedicines?.length}`,
      [{
        text: 'OK', onPress: () => {
          setIsClearedQuickIntakeMedicines(false)
        }
      }]
    )
  })

  if (quickIntakeMedicines?.length) {
    return (
      <Button
        title={`Принять выбранные (${quickIntakeMedicines?.length})`}
        onPress={handleQuickIntake}
      />
    )
  }

  return null
})
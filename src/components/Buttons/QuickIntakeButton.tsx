import { useEvent } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { useMedicine } from '@/hooks/useMedicine'
import { useAppStore } from '@/store'
import { medicineUsageModel } from '@/services/models'
import { memo } from 'react'
import { Alert } from 'react-native'
import { Button } from '../Button'

export const QuickIntakeButton = memo(() => {
  const { t } = useTranslation()
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
    
    // Обновляем количество лекарств и создаем записи о приеме
    await Promise.all(quickIntakeMedicines.map(async medicine => {
      const medicineData = medicines.find(m => m.id === medicine.medicineId)
      const quantityUsed = Number(medicine.dosage) || 1
      
      // Обновляем количество
      await updateMedicine({
        id: medicine.medicineId,
        quantity: Number(medicineData?.quantity || 0) - quantityUsed
      })
      
      // Создаем запись о приеме
      await medicineUsageModel.create({
        medicineId: medicine.medicineId,
        quantityUsed,
        usageDate: new Date().toISOString(),
      })
    }))
    
    setIsClearedQuickIntakeMedicines(true)
    setQuickIntakeMedicines([])
    Alert.alert(
      t('today.intakeMarkedTitle'),
      t('today.medicinesTaken', { count: quickIntakeMedicines?.length }),
      [{
        text: t('common.ok'), onPress: () => {
          setIsClearedQuickIntakeMedicines(false)
        }
      }]
    )
  })

  if (quickIntakeMedicines?.length) {
    return (
      <Button
        title={t('today.takeSelected', { count: quickIntakeMedicines?.length })}
        onPress={handleQuickIntake}
      />
    )
  }

  return null
})
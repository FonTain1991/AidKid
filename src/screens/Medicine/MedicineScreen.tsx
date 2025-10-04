import React, { useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { MedicineForm } from '@/features/medicine-form'
import { MedicineFormData } from '@/features/medicine-form/model'
import { useNavigationBarColor, useRoute, useScreenProperties } from '@/shared/hooks'
import { BackButton } from '@/shared/ui'
import { useTheme } from '@/app/providers/theme'
import { medicineService } from '@/entities/medicine'

interface RouteParams {
  medicineId?: string
  mode: 'create' | 'edit'
  kitId?: string
}

export const MedicineScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { mode, medicineId, kitId } = (route.params as RouteParams) || {
    mode: 'create'
  }
  const { colors } = useTheme()
  const [initialData, setInitialData] = useState<MedicineFormData | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      headerTransparent: false,
      headerLeft: () => <BackButton />,
      title: mode === 'create' ? 'Добавить лекарство' : 'Редактировать лекарство'
    }
  })

  useNavigationBarColor({ color: 'transparent' })

  // Загружаем данные лекарства для редактирования
  useEffect(() => {
    if (mode === 'edit' && medicineId) {
      const loadMedicineData = async () => {
        setLoading(true)
        try {
          const [medicine, stock] = await Promise.all([
            medicineService.getMedicineById(medicineId),
            medicineService.getMedicineStock(medicineId)
          ])

          if (medicine) {
            const formData: MedicineFormData = {
              id: medicine.id,
              name: medicine.name,
              description: medicine.description || '',
              manufacturer: medicine.manufacturer || '',
              dosage: medicine.dosage || '',
              form: medicine.form,
              kitId: medicine.kitId,
              quantity: stock?.quantity || 0,
              unit: stock?.unit || '',
              expiryDate: stock?.expiryDate?.toISOString()
            }
            setInitialData(formData)
          }
        } catch (error) {
          console.error('Error loading medicine:', error)
        } finally {
          setLoading(false)
        }
      }
      loadMedicineData()
    }
  }, [mode, medicineId])

  const handleSubmit = async (data: MedicineFormData) => {
    try {
      if (!data.kitId) {
        throw new Error('Аптечка обязательна')
      }

      if (mode === 'create') {
        // Создаем новое лекарство
        const medicine = await medicineService.createMedicine({
          name: data.name,
          description: data.description || undefined,
          manufacturer: data.manufacturer || undefined,
          dosage: data.dosage || undefined,
          form: data.form,
          prescriptionRequired: false,
          kitId: data.kitId
        })

        // Создаем запись о запасе, если указано количество
        if (data.quantity > 0) {
          await medicineService.createMedicineStock({
            medicineId: medicine.id,
            quantity: data.quantity,
            unit: data.unit,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
          })
        }
      } else {
        // Обновляем существующее лекарство
        if (!data.id) {
          throw new Error('ID is required for update')
        }

        await medicineService.updateMedicine(data.id, {
          name: data.name,
          description: data.description || undefined,
          manufacturer: data.manufacturer || undefined,
          dosage: data.dosage || undefined,
          form: data.form,
          prescriptionRequired: false
        })

        // Обновляем запасы
        const existingStock = await medicineService.getMedicineStock(data.id)
        if (existingStock) {
          await medicineService.updateMedicineStock(existingStock.id, {
            quantity: data.quantity,
            unit: data.unit,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
          })
        } else if (data.quantity > 0) {
          // Создаем новый запас, если его не было
          await medicineService.createMedicineStock({
            medicineId: data.id,
            quantity: data.quantity,
            unit: data.unit,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
          })
        }
      }

      navigation.goBack()
    } catch (error) {
      console.error('Error saving medicine:', error)
      throw error // Перебрасываем ошибку, чтобы MedicineForm мог показать Alert
    }
  }

  // Показываем загрузку при редактировании
  if (mode === 'edit' && loading) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.background }}>
      <MedicineForm
        initialData={initialData}
        onSubmit={handleSubmit}
        kitId={kitId}
      />
    </SafeAreaView>
  )
}

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
import { scheduleMedicineExpiryNotifications, cancelMedicineNotifications, canCreateMedicine, formatLimitMessage } from '@/shared/lib'
import type { RootStackParamList } from '@/app/navigation/types'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Alert } from 'react-native'

interface RouteParams {
  medicineId?: string
  mode: 'create' | 'edit'
  kitId?: string
  initialName?: string
  initialDescription?: string
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export const MedicineScreen = () => {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute()
  const params = (route.params as RouteParams) || {}
  // Если route.name === 'AddMedicine', то это создание
  const mode = params.mode || (route.name === 'AddMedicine' ? 'create' : 'create')
  const { medicineId, kitId, initialName, initialDescription } = params
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

  // Устанавливаем начальные данные из параметров навигации
  useEffect(() => {
    if (mode === 'create' && (initialName || initialDescription)) {
      console.log('Setting initial data from params:', { initialName, initialDescription })
      const data = {
        name: initialName || '',
        description: initialDescription || '',
        manufacturer: '',
        dosage: '',
        form: 'Таблетки',
        kitId: kitId || '',
        photoPath: undefined,
        barcode: undefined,
        quantity: 0,
        unit: 'шт',
        expiryDate: undefined
      }
      console.log('Initial data object:', data)
      setInitialData(data)
    }
  }, [initialName, initialDescription, kitId, mode])

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
              photoPath: medicine.photoPath,
              barcode: medicine.barcode,
              quantity: stock?.quantity || 0,
              unit: stock?.unit || '',
              expiryDate: stock?.expiryDate?.toISOString()
            }
            console.log('Loading medicine data:', { medicine, stock, formData })
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
      console.log('Saving medicine data:', data)
      if (!data.kitId) {
        throw new Error('Аптечка обязательна')
      }

      if (mode === 'create') {
        // Проверка лимита для бесплатной версии
        const limitCheck = await canCreateMedicine()
        
        if (!limitCheck.allowed) {
          Alert.alert(
            'Достигнут лимит 🚫',
            formatLimitMessage(limitCheck),
            [
              {
                text: 'Отмена',
                style: 'cancel',
              },
              {
                text: 'Оформить Premium 💎',
                onPress: () => {
                  navigation.navigate('Subscription')
                },
                style: 'default',
              },
            ],
            { cancelable: true }
          )
          return
        }

        // Создаем новое лекарство
        const medicine = await medicineService.createMedicine({
          name: data.name,
          description: data.description || undefined,
          manufacturer: data.manufacturer || undefined,
          dosage: data.dosage || undefined,
          form: data.form,
          prescriptionRequired: false,
          kitId: data.kitId,
          photoPath: data.photoPath,
          barcode: data.barcode
        })

        // Создаем запись о запасе, если указано количество
        if (data.quantity > 0) {
          const stock = await medicineService.createMedicineStock({
            medicineId: medicine.id,
            quantity: data.quantity,
            unit: data.unit,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
          })

          // Планируем множественные уведомления о сроке годности
          if (stock.expiryDate) {
            await scheduleMedicineExpiryNotifications(medicine, stock)
          }
        }
      } else {
        // Обновляем существующее лекарство
        if (!data.id) {
          throw new Error('ID is required for update')
        }

        // Получаем существующий stock для отмены уведомлений
        const existingStockForCancel = await medicineService.getMedicineStock(data.id)
        if (existingStockForCancel) {
          await cancelMedicineNotifications(data.id, existingStockForCancel.id)
        }

        await medicineService.updateMedicine(data.id, {
          name: data.name,
          description: data.description || undefined,
          manufacturer: data.manufacturer || undefined,
          dosage: data.dosage || undefined,
          form: data.form,
          prescriptionRequired: false,
          photoPath: data.photoPath,
          barcode: data.barcode
        })

        // Обновляем запасы
        const existingStock = await medicineService.getMedicineStock(data.id)
        console.log('Existing stock:', existingStock)
        console.log('Updating stock with:', { quantity: data.quantity, unit: data.unit, expiryDate: data.expiryDate })

        let updatedStock

        if (existingStock) {
          await medicineService.updateMedicineStock(existingStock.id, {
            quantity: data.quantity,
            unit: data.unit,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
          })
          console.log('Stock updated successfully')
          updatedStock = await medicineService.getMedicineStock(data.id)
        } else if (data.quantity > 0 || data.expiryDate) {
          // Создаем новый запас, если есть количество ИЛИ дата
          updatedStock = await medicineService.createMedicineStock({
            medicineId: data.id,
            quantity: data.quantity,
            unit: data.unit,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
          })
          console.log('New stock created successfully')
        }

        // Планируем новые уведомления, если есть срок годности
        if (updatedStock && updatedStock.expiryDate) {
          const medicine = await medicineService.getMedicineById(data.id)
          if (medicine) {
            await scheduleMedicineExpiryNotifications(medicine, updatedStock)
          }
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
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background }}>
      <MedicineForm
        initialData={initialData}
        onSubmit={handleSubmit}
        kitId={kitId}
      />
    </SafeAreaView>
  )
}

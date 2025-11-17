import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useRef, useEffect } from 'react'
import { Alert } from 'react-native'
import { RootStackParamList } from '@/app/navigation'
import { useKitListState } from '@/features/kit-list'
import { QuickCreateSheetRef } from '@/features/quick-create'
import { kitApi } from '@/entities/kit/api'
import { useRootKits } from './useRootKits'

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BottomTabs'>

export const useHomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>()
  const quickCreateSheetRef = useRef<QuickCreateSheetRef>(null)
  const { kits, loading, error, refreshKits, removeKit } = useKitListState()
  const { rootKits } = useRootKits(kits)

  // Обновлять список при фокусе экрана
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshKits()
    })

    return unsubscribe
  }, [navigation, refreshKits])

  const handleAddCategory = () => {
    navigation.navigate('Kit', { mode: 'create' })
  }

  const handleAddMedicine = () => {
    navigation.navigate('Medicine', {
      mode: 'create'
    })
  }

  const handleAddMedicineToKit = (kitId: string) => {
    navigation.navigate('Medicine', {
      mode: 'create',
      kitId
    })
  }

  const handleKitPress = (kitId: string) => {
    // Навигация к деталям аптечки
    navigation.navigate('KitDetails', { kitId })
  }

  const handleKitEdit = (kitId: string) => {
    navigation.navigate('Kit', { mode: 'edit', kitId })
  }

  const handleKitDelete = (kitId: string) => {
    Alert.alert(
      'Удалить аптечку',
      'Вы уверены, что хотите удалить эту аптечку? Это действие нельзя отменить.',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await kitApi.deleteKit(kitId)
              removeKit(kitId)
              Alert.alert('Успех', 'Аптечка удалена')
            } catch (err) {
              console.error('Error deleting kit:', err)
              Alert.alert('Ошибка', 'Не удалось удалить аптечку')
            }
          },
        },
      ]
    )
  }

  const handleScanBarcode = () => {
    navigation.navigate('BarcodeScanner')
  }

  const hasKits = kits.length > 0

  const quickCreateOptions = [
    {
      id: 'category',
      title: 'Добавить аптечку',
      icon: 'folder-plus',
      onPress: handleAddCategory,
    },
    ...(hasKits ? [
      {
        id: 'medicine',
        title: 'Добавить лекарство',
        icon: 'pill',
        onPress: handleAddMedicine,
      },
      {
        id: 'scan',
        title: 'Сканировать штрих-код',
        icon: 'barcode-scan',
        onPress: handleScanBarcode,
      },
    ] : []),
  ]

  const handleOptionPress = (option: { onPress: () => void }) => {
    option.onPress()
  }

  return {
    kits: rootKits, // Возвращаем только корневые категории
    loading,
    error,
    refreshKits,
    quickCreateSheetRef,
    quickCreateOptions,
    handleKitPress,
    handleKitEdit,
    handleKitDelete,
    handleAddMedicineToKit,
    handleOptionPress,
  }
}

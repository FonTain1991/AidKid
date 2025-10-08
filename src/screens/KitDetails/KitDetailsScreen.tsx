import React, { useEffect, useState, useRef, useCallback } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, View, BackHandler } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/app/navigation'
import { useScreenProperties } from '@/shared/hooks'
import { useTheme } from '@/app/providers/theme'
import { kitApi } from '@/entities/kit/api'
import { medicineService } from '@/entities/medicine'
import { MedicineKit } from '@/entities/kit/model/types'
import { MedicineWithStock } from '@/entities/medicine/model/types'
import { Breadcrumbs, KitCard, MedicineCard, EmptyState, KitMenuSheet, KitMenuSheetRef, MedicineMenuSheet, MedicineMenuSheetRef, BackButton } from '@/shared/ui'
import { SPACING } from '@/shared/config'

type KitDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'KitDetails'>

interface KitContent {
  kit: MedicineKit | null
  subKits: MedicineKit[]
  medicines: MedicineWithStock[]
  breadcrumbs: { id: string; name: string }[]
}

export const KitDetailsScreen = () => {
  const navigation = useNavigation<KitDetailsNavigationProp>()
  const route = useRoute()
  const { kitId } = route.params as { kitId: string }
  const { colors } = useTheme()

  const [content, setContent] = useState<KitContent>({
    kit: null,
    subKits: [],
    medicines: [],
    breadcrumbs: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null)

  const kitMenuSheetRef = useRef<KitMenuSheetRef>(null)
  const medicineMenuSheetRef = useRef<MedicineMenuSheetRef>(null)

  // Функция для умной навигации назад
  const handleSmartBackPress = useCallback(() => {
    // Если есть breadcrumbs и мы не в корневой категории
    if (content.breadcrumbs.length > 1 && content.kit?.parent_id) {
      // Переходим к родительской категории
      navigation.navigate('KitDetails', { kitId: content.kit.parent_id })
      return true
    }

    // Если это корневая категория или нет родителя, выполняем обычный goBack
    navigation.goBack()
    return true
  }, [content.breadcrumbs, content.kit, navigation])

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      headerTransparent: false,
      headerLeft: () => <BackButton onPress={handleSmartBackPress} />,
      title: content.kit?.name || 'Загрузка...'
    }
  })

  // Обработчик системной кнопки назад Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleSmartBackPress)

    return () => backHandler.remove()
  }, [handleSmartBackPress])

  const loadKitContent = useCallback(async () => {
    try {
      setLoading(true)

      // Загружаем текущую категорию
      const currentKit = await kitApi.getKitById(kitId)
      if (!currentKit) {
        throw new Error('Категория не найдена')
      }

      // Загружаем подкатегории
      const allKits = await kitApi.getKits()
      const subKits = allKits.filter(kit => kit.parent_id === kitId)

      // Загружаем лекарства и остатки, считаем количество и сроки
      const medicinesData = await medicineService.getMedicinesByKitId(kitId)
      const medicines: MedicineWithStock[] = await Promise.all(medicinesData.map(async medicine => {
        const stock = await medicineService.getMedicineStock(medicine.id)
        const totalQuantity = stock?.quantity ?? 0
        const expiryMs = stock?.expiryDate ? stock.expiryDate.getTime() - Date.now() : undefined
        const daysUntilExpiry = expiryMs != null ? Math.ceil(expiryMs / (1000 * 60 * 60 * 24)) : undefined
        const isExpiringSoon = daysUntilExpiry != null ? daysUntilExpiry <= 7 : false

        return {
          ...medicine,
          stock,
          totalQuantity,
          isExpiringSoon,
          daysUntilExpiry,
        }
      }))

      // Строим breadcrumbs
      const breadcrumbs = await buildBreadcrumbs(currentKit!)

      setContent({
        kit: currentKit,
        subKits,
        medicines,
        breadcrumbs
      })
    } catch (error) {
      console.error('Error loading kit content:', error)
    } finally {
      setLoading(false)
    }
  }, [kitId])

  const buildBreadcrumbs = async (kit: MedicineKit): Promise<{ id: string; name: string }[]> => {
    const breadcrumbs: { id: string; name: string }[] = []
    let currentKit = kit

    while (currentKit) {
      breadcrumbs.unshift({ id: currentKit.id, name: currentKit.name })

      if (currentKit.parent_id) {
        const parentKit = await kitApi.getKitById(currentKit.parent_id)
        if (parentKit) {
          currentKit = parentKit
        } else {
          break
        }
      } else {
        break
      }
    }

    return breadcrumbs
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadKitContent()
    setRefreshing(false)
  }

  const handleKitPress = (pressKitId: string) => {
    navigation.navigate('KitDetails', { kitId: pressKitId })
  }

  const handleMedicinePress = (medicineId: string) => {
    // Можно открыть детали лекарства или модальное окно
    console.log('Medicine pressed:', medicineId)
  }

  const handleBreadcrumbPress = (breadcrumbKitId: string) => {
    navigation.navigate('KitDetails', { kitId: breadcrumbKitId })
  }

  const handleKitMenuPress = (menuKitId: string) => {
    setSelectedKitId(menuKitId)
    const kit = content.subKits.find(k => k.id === menuKitId)
    if (kit) {
      kitMenuSheetRef.current?.present(menuKitId, kit.name)
    }
  }

  const handleKitEdit = (editKitId: string) => {
    navigation.navigate('Kit', { mode: 'edit', kitId: editKitId })
  }

  const handleKitDelete = async (deleteKitId: string) => {
    try {
      await kitApi.deleteKit(deleteKitId)

      // Обновляем содержимое после удаления
      await loadKitContent()
    } catch (error) {
      console.error('Error deleting kit:', error)
    }
  }

  const handleMedicineMenuPress = (medicineId: string) => {
    setSelectedMedicineId(medicineId)
    const medicine = content.medicines.find(m => m.id === medicineId)
    if (medicine) {
      medicineMenuSheetRef.current?.present(medicineId, medicine.name)
    }
  }

  const handleMedicineEdit = (medicineId: string) => {
    navigation.navigate('Medicine', { mode: 'edit', medicineId })
  }

  const handleMedicineDelete = async (medicineId: string) => {
    try {
      await medicineService.deleteMedicine(medicineId)

      // Обновляем содержимое после удаления
      await loadKitContent()
    } catch (error) {
      console.error('Error deleting medicine:', error)
    }
  }

  useEffect(() => {
    loadKitContent()
  }, [kitId, loadKitContent])

  // Обновляем данные при возврате с экрана редактирования
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadKitContent()
    })

    return unsubscribe
  }, [navigation, loadKitContent])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    )
  }

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'kit') {
      return (
        <KitCard
          id={item.data.id}
          name={item.data.name}
          description={item.data.description}
          color={item.data.color}
          onPress={() => handleKitPress(item.data.id)}
          onMenuPress={() => handleKitMenuPress(item.data.id)}
          onAddMedicine={addMedicineKitId => navigation.navigate('Medicine', { mode: 'create', kitId: addMedicineKitId })}
        />
      )
    }

    if (item.type === 'medicine') {
      return (
        <View style={{ paddingHorizontal: SPACING.md }}>
          <MedicineCard
            medicine={item.data}
            onPress={() => handleMedicinePress(item.data.id)}
            onMenuPress={() => handleMedicineMenuPress(item.data.id)}
          />
        </View>
      )
    }

    return null
  }

  // Подготавливаем данные для FlatList
  const flatListData = [
    ...content.subKits.map(kit => ({ type: 'kit', data: kit })),
    ...content.medicines.map(medicine => ({ type: 'medicine', data: medicine }))
  ]

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: SPACING.md }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={content.breadcrumbs}
        onPress={handleBreadcrumbPress}
      />

      {/* Контент */}
      {flatListData.length > 0 ? (
        <FlatList
          data={flatListData}
          renderItem={renderItem}
          keyExtractor={item => `${item.type}-${item.data.id}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <EmptyState
          kit={content.kit}
          onCreateKit={() => navigation.navigate('Kit', { mode: 'create', kitId: kitId })}
          onCreateMedicine={() => navigation.navigate('Medicine', { mode: 'create', kitId: kitId })}
        />
      )}

      <KitMenuSheet
        ref={kitMenuSheetRef}
        onEdit={() => selectedKitId && handleKitEdit(selectedKitId)}
        onDelete={() => selectedKitId && handleKitDelete(selectedKitId)}
      />

      <MedicineMenuSheet
        ref={medicineMenuSheetRef}
        onEdit={() => selectedMedicineId && handleMedicineEdit(selectedMedicineId)}
        onDelete={() => selectedMedicineId && handleMedicineDelete(selectedMedicineId)}
      />
    </View>
  )
}

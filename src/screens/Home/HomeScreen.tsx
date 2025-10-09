import { useTheme } from '@/app/providers/theme'
import { useHomeScreenStyles } from '@/shared/hooks/useHomeScreenStyles'
import { ErrorState, useHomeScreen } from '@/features/home'
import { QuickCreateSheet } from '@/features/quick-create'
import { useNavigationBarColor, useScreenProperties } from '@/shared/hooks'
import { FAB } from '@/shared/ui/FAB'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { Separator } from '@/shared/ui'
import { Alert, TouchableOpacity, Text, View, ScrollView, TextInput, RefreshControl, Image } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { databaseService, getMedicinePhotoUri } from '@/shared/lib'
import { useState, useEffect, useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
import type { Medicine } from '@/entities/medicine/model/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BottomTabs'>

interface MedicineWithKit extends Medicine {
  kitName: string
  kitColor?: string
}

export function HomeScreen() {
  const { colors } = useTheme()
  const styles = useHomeScreenStyles()
  const navigation = useNavigation<NavigationProp>()
  const {
    kits,
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
  } = useHomeScreen()

  const [searchQuery, setSearchQuery] = useState('')
  const [expiringCount, setExpiringCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [medicines, setMedicines] = useState<MedicineWithKit[]>([])
  const [kitsWithMedicines, setKitsWithMedicines] = useState<any[]>([])

  const loadKitsWithMedicines = useCallback(async () => {
    try {
      await databaseService.init()
      const kitsWithData = await Promise.all(kits.map(async kit => {
        const kitMedicines = await databaseService.getMedicinesByKitId(kit.id)
        const medicinesWithStock = await Promise.all(kitMedicines.map(async (medicine: Medicine) => {
          const stock = await databaseService.getMedicineStock(medicine.id)
          return { ...medicine, stock }
        }))
        return { ...kit, medicines: medicinesWithStock }
      }))
      setKitsWithMedicines(kitsWithData)
    } catch (err) {
      console.error('Failed to load kits with medicines:', err)
    }
  }, [kits])

  useEffect(() => {
    loadAlerts()
    loadMedicines()
    if (kits.length > 0) {
      loadKitsWithMedicines()
    }
  }, [kits.length])

  const loadMedicines = async () => {
    try {
      await databaseService.init()
      const allMedicines = await databaseService.getMedicines()
      const allKitsData = await databaseService.getKits()
      const kitsMap = new Map(allKitsData.map(k => [k.id, k]))

      const medicinesWithKits: MedicineWithKit[] = allMedicines.map(medicine => ({
        ...medicine,
        kitName: kitsMap.get(medicine.kitId)?.name || 'Неизвестная аптечка',
        kitColor: kitsMap.get(medicine.kitId)?.color
      }))

      setMedicines(medicinesWithKits)
    } catch (err) {
      console.error('Failed to load medicines:', err)
    }
  }

  const loadAlerts = async () => {
    try {
      await databaseService.init()
      const allMedicines = await databaseService.getMedicines()

      let expiring = 0
      let lowStock = 0
      const now = new Date()

      const promises = allMedicines.map(async medicine => {
        try {
          const stock = await databaseService.getMedicineStock(medicine.id)
          return stock
        } catch (err) {
          return null
        }
      })

      const stocks = await Promise.all(promises)

      stocks.forEach(stock => {
        if (stock) {
          // Проверяем срок годности
          if (stock.expiryDate) {
            const daysUntilExpiry = Math.ceil((stock.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
              expiring++
            }
          }

          // Проверяем низкий запас (включая 0)
          if (stock.quantity <= 5) {
            lowStock++
          }
        }
      })

      setExpiringCount(expiring)
      setLowStockCount(lowStock)
    } catch (err) {
      console.error('Failed to load alerts:', err)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshKits()
    await loadAlerts()
    await loadMedicines()
    await loadKitsWithMedicines()
    setIsRefreshing(false)
  }

  const filteredKits = kits.filter(kit => kit.name.toLowerCase().includes(searchQuery.toLowerCase()) || kit.description?.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredMedicines = medicines.filter(medicine => medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) || medicine.description?.toLowerCase().includes(searchQuery.toLowerCase()) || medicine.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) || medicine.kitName.toLowerCase().includes(searchQuery.toLowerCase()))

  const hasSearchQuery = searchQuery.trim().length > 0
  const hasResults = filteredKits.length > 0 || filteredMedicines.length > 0

  useScreenProperties({
    navigationOptions: {
      headerShown: false,
    }
  })
  useNavigationBarColor()


  if (error) {
    return (
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background, flex: 1 }}>
        <ErrorState error={error} onRetry={refreshKits} />
        <FAB onPress={() => quickCreateSheetRef.current?.present()} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Заголовок */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Аптечки</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Управление домашней аптечкой
          </Text>
        </View>

        {/* Плашки предупреждений - показываем сверху, скрываем при поиске */}
        {!hasSearchQuery && (expiringCount > 0 || lowStockCount > 0) && (
          <View style={styles.alertsContainer}>
            {expiringCount > 0 && (
              <TouchableOpacity
                style={[styles.alertCard, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' }]}
                onPress={() => (navigation as any).navigate('ExpiringMedicines')}
              >
                <Text style={styles.alertIcon}>⏰</Text>
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: '#E65100' }]}>
                    Истекает срок годности
                  </Text>
                  <Text style={[styles.alertText, { color: '#F57C00' }]}>
                    {expiringCount} {expiringCount === 1 ? 'лекарство' : 'лекарств'} требует внимания
                  </Text>
                </View>
                <Text style={[styles.alertArrow, { color: '#FF9800' }]}>›</Text>
              </TouchableOpacity>
            )}

            {lowStockCount > 0 && (
              <TouchableOpacity
                style={[styles.alertCard, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}
                onPress={() => (navigation as any).navigate('LowStockMedicines')}
              >
                <Text style={styles.alertIcon}>📦</Text>
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: '#C62828' }]}>
                    Заканчиваются
                  </Text>
                  <Text style={[styles.alertText, { color: '#E53935' }]}>
                    {lowStockCount} {lowStockCount === 1 ? 'лекарство' : 'лекарств'} с низким запасом
                  </Text>
                </View>
                <Text style={[styles.alertArrow, { color: '#F44336' }]}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Разделитель между предупреждениями и поиском */}
        {!hasSearchQuery && (expiringCount > 0 || lowStockCount > 0) && (
          <View style={styles.separatorContainer}>
            <Separator />
          </View>
        )}

        {/* Поиск - перемещен после предупреждений */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBox, { backgroundColor: 'white', borderColor: colors.border }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder='Поиск аптечек и лекарств...'
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Результаты поиска */}
        {loading && kits.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Загрузка...</Text>
          </View>
        ) : hasSearchQuery && !hasResults ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Ничего не найдено
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Попробуйте изменить поисковый запрос
            </Text>
          </View>
        ) : !hasSearchQuery && kits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Нет аптечек
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Создайте свою первую аптечку
            </Text>
          </View>
        ) : (
          <>
            {/* Результаты по лекарствам */}
            {hasSearchQuery && filteredMedicines.length > 0 && (
              <View style={styles.section}>
                <View style={styles.kitsHeader}>
                  <Text style={[styles.kitsTitle, { color: colors.text }]}>💊 Лекарства</Text>
                  <Text style={[styles.kitsCount, { color: colors.textSecondary }]}>
                    {filteredMedicines.length}
                  </Text>
                </View>
                <View style={styles.medicinesList}>
                  {filteredMedicines.map(medicine => (
                    <TouchableOpacity
                      key={medicine.id}
                      style={[styles.medicineCard, { borderColor: colors.border }]}
                      onPress={() => (navigation as any).navigate('Medicine', { medicineId: medicine.id, mode: 'edit' })}
                    >
                      <View style={[styles.medicineColorBar, { backgroundColor: medicine.kitColor || colors.primary }]} />
                      <View style={styles.medicineContent}>
                        {/* Фото лекарства */}
                        {medicine.photoPath ? (
                          <Image
                            source={{ uri: getMedicinePhotoUri(medicine.photoPath) || undefined }}
                            style={styles.medicinePhoto}
                          />
                        ) : (
                          <View style={styles.medicinePhotoPlaceholder}>
                            <Text style={styles.medicinePhotoIcon}>💊</Text>
                          </View>
                        )}

                        <View style={styles.medicineInfo}>
                          <Text style={[styles.medicineName, { color: colors.text }]}>
                            {medicine.name}
                          </Text>
                          <Text style={[styles.medicineForm, { color: colors.textSecondary }]}>
                            {medicine.form}
                          </Text>
                          <Text style={[styles.medicineKit, { color: colors.textSecondary }]}>
                            📦 {medicine.kitName}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Результаты по аптечкам */}
            {filteredKits.length > 0 && (
              <View style={styles.section}>
                <View style={styles.kitsHeader}>
                  <Text style={[styles.kitsTitle, { color: colors.text }]}>
                    {hasSearchQuery ? '📦 Аптечки' : 'Мои аптечки'}
                  </Text>
                  <Text style={[styles.kitsCount, { color: colors.textSecondary }]}>
                    {filteredKits.length}
                  </Text>
                </View>
                <View style={styles.kitsList}>
                  {kitsWithMedicines.map(kit => (
                    <TouchableOpacity
                      key={kit.id}
                      style={styles.kitCard}
                      onPress={() => handleKitPress(kit.id)}
                    >
                      <View style={[styles.kitColorBar, { backgroundColor: kit.color || colors.primary }]} />

                      <TouchableOpacity
                        style={styles.kitMenuButton}
                        onPress={() => {
                          Alert.alert(
                            kit.name,
                            'Выберите действие',
                            [
                              {
                                text: 'Редактировать',
                                onPress: () => handleKitEdit(kit.id)
                              },
                              {
                                text: 'Добавить лекарство',
                                onPress: () => handleAddMedicineToKit(kit.id)
                              },
                              {
                                text: 'Удалить',
                                onPress: () => handleKitDelete(kit.id),
                                style: 'destructive'
                              },
                              {
                                text: 'Отмена',
                                style: 'cancel'
                              }
                            ],
                            {
                              cancelable: true,
                              onDismiss: () => {
                                // Закрытие без действия
                              }
                            }
                          )
                        }}
                      >
                        <Icon name='more-horizontal' size={20} color={colors.textSecondary} />
                      </TouchableOpacity>

                      <View style={styles.kitContent}>
                        <View style={styles.kitHeader}>
                          <View style={styles.kitTitleContainer}>
                            <View style={[styles.kitIconContainer, { backgroundColor: kit.color || colors.primary }]}>
                              <Icon name='package' size={28} color={colors.white} />
                            </View>
                            <Text style={styles.kitTitle}>{kit.name}</Text>
                            {kit.description && (
                              <Text style={styles.kitDescription} numberOfLines={2}>
                                {kit.description}
                              </Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.kitStats}>
                          <View style={styles.kitStat}>
                            <Text style={styles.kitStatValue}>{kit.medicines?.length || 0}</Text>
                            <Text style={styles.kitStatLabel}>Лекарств</Text>
                          </View>
                          <View style={styles.kitStat}>
                            <Text style={styles.kitStatValue}>{kit.medicines?.filter((m: any) => m.stock?.quantity > 0).length || 0}</Text>
                            <Text style={styles.kitStatLabel}>В наличии</Text>
                          </View>
                          <View style={styles.kitStat}>
                            <Text style={styles.kitStatValue}>{kit.medicines?.filter((m: any) => m.stock?.quantity === 0).length || 0}</Text>
                            <Text style={styles.kitStatLabel}>Закончились</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <FAB onPress={() => quickCreateSheetRef.current?.present()} />

      <QuickCreateSheet
        ref={quickCreateSheetRef}
        options={quickCreateOptions}
        onOptionPress={handleOptionPress}
      />
    </SafeAreaView>
  )
}

// Styles теперь в useHomeScreenStyles hook
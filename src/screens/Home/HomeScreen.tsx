import { useTheme } from '@/app/providers/theme'
import { ErrorState, useHomeScreen } from '@/features/home'
import { QuickCreateSheet } from '@/features/quick-create'
import { useNavigationBarColor, useScreenProperties } from '@/shared/hooks'
import { FAB } from '@/shared/ui/FAB'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { Alert, TouchableOpacity, Text, View, ScrollView, TextInput, StyleSheet, RefreshControl, Image } from 'react-native'
import { databaseService, getMedicinePhotoUri } from '@/shared/lib'
import { useState, useEffect } from 'react'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
import { Medicine } from '@/entities/medicine/model/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BottomTabs'>

interface MedicineWithKit extends Medicine {
  kitName: string
  kitColor?: string
}

export function HomeScreen() {
  const { colors } = useTheme()
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

  useEffect(() => {
    loadAlerts()
    loadMedicines()
  }, [])

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
      <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
        <ErrorState error={error} onRetry={refreshKits} />
        <FAB onPress={() => quickCreateSheetRef.current?.present()} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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

        {/* Поиск */}
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

        {/* Плашки предупреждений - скрываем при поиске */}
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
                  {filteredKits.map(kit => (
                    <TouchableOpacity
                      key={kit.id}
                      style={[styles.kitCard, { borderColor: colors.border }]}
                      onPress={() => handleKitPress(kit.id)}
                    >
                      <View style={[styles.kitColorBar, { backgroundColor: kit.color || colors.primary }]} />
                      <View style={styles.kitContent}>
                        <View style={styles.kitHeader}>
                          <View style={styles.kitTitleContainer}>
                            <Text style={[styles.kitName, { color: colors.text }]}>{kit.name}</Text>
                            {kit.description && (
                              <Text style={[styles.kitDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                                {kit.description}
                              </Text>
                            )}
                          </View>
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
                            <Text style={[styles.kitMenuIcon, { color: colors.textSecondary }]}>⋯</Text>
                          </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.heading,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchIcon: {
    fontSize: FONT_SIZE.lg,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    padding: 0,
  },
  clearIcon: {
    fontSize: FONT_SIZE.lg,
    color: '#999',
    paddingLeft: SPACING.sm,
  },
  alertsContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    padding: SPACING.md,
  },
  alertIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  alertText: {
    fontSize: FONT_SIZE.sm,
  },
  alertArrow: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  kitsHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kitsTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  kitsCount: {
    fontSize: FONT_SIZE.sm,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  medicinesList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  medicineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medicineColorBar: {
    height: 4,
  },
  medicineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  medicinePhoto: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: SPACING.md,
    backgroundColor: '#f0f0f0',
  },
  medicinePhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: SPACING.md,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicinePhotoIcon: {
    fontSize: 28,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  medicineForm: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  medicineKit: {
    fontSize: FONT_SIZE.sm,
  },
  kitsList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  kitCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  kitColorBar: {
    height: 6,
  },
  kitContent: {
    padding: SPACING.md,
  },
  kitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kitTitleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  kitName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  kitDescription: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
  },
  kitMenuButton: {
    padding: SPACING.xs,
  },
  kitMenuIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
})
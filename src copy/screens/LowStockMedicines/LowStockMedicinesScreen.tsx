import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService, getMedicinePhotoUri } from '@/shared/lib'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { Medicine, MedicineStock } from '@/entities/medicine/model/types'
import { MedicineKit } from '@/entities/kit/model/types'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface LowStockMedicine extends Medicine {
  stock: MedicineStock
  kitName: string
}

export function LowStockMedicinesScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [medicines, setMedicines] = useState<LowStockMedicine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadLowStockMedicines()
  }, [])

  const loadLowStockMedicines = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      await databaseService.init()

      const allMedicines = await databaseService.getMedicines()
      const allKits = await databaseService.getKits()
      const kitsMap = new Map(allKits.map(k => [k.id, k]))

      const lowStock: LowStockMedicine[] = []

      for (const medicine of allMedicines) {
        try {
          const stock = await databaseService.getMedicineStock(medicine.id)
          if (stock && stock.quantity <= 5) {
            const kit = kitsMap.get(medicine.kitId)
            lowStock.push({
              ...medicine,
              stock,
              kitName: kit?.name || 'Неизвестная аптечка'
            })
          }
        } catch (error) {
          console.warn(`Failed to load stock for medicine ${medicine.id}:`, error)
        }
      }

      // Сортируем по количеству
      lowStock.sort((a, b) => a.stock.quantity - b.stock.quantity)

      setMedicines(lowStock)
    } catch (error) {
      console.error('Failed to load low stock medicines:', error)
      Alert.alert('Ошибка', 'Не удалось загрузить лекарства')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const getStockColor = (quantity: number) => {
    if (quantity === 0) {
      return colors.error
    }
    if (quantity === 1) {
      return '#FF6B00'
    }
    if (quantity <= 3) {
      return colors.warning
    }
    return colors.secondary
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Загрузка...
          </Text>
        </View>
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
            onRefresh={() => loadLowStockMedicines(true)}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Заканчиваются
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {medicines.length} {medicines.length === 1 ? 'лекарство' : 'лекарств'} с низким запасом
          </Text>
        </View>

        {medicines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Все хорошо!
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Нет лекарств с низким запасом
            </Text>
          </View>
        ) : (
          <View style={styles.medicinesList}>
            {medicines.map(medicine => {
              const stockColor = getStockColor(medicine.stock.quantity)

              return (
                <TouchableOpacity
                  key={medicine.id}
                  style={[styles.medicineCard, { borderColor: colors.border }]}
                  onPress={() => navigation.navigate('Medicine', { medicineId: medicine.id, mode: 'edit' })}
                >
                  <View style={styles.medicineHeader}>
                    <View style={[styles.stockBadge, { backgroundColor: stockColor }]}>
                      <Text style={styles.stockText}>
                        📦 Осталось {medicine.stock.quantity} {medicine.stock.unit}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.medicineBody}>
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

                  {medicine.stock.expiryDate && (
                    <View style={styles.medicineFooter}>
                      <Text style={[styles.expiryDate, { color: colors.textSecondary }]}>
                        Срок годности: {medicine.stock.expiryDate.toLocaleDateString('ru-RU')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
  },
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.heading,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
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
    paddingBottom: SPACING.md,
  },
  medicineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  medicineHeader: {
    marginBottom: SPACING.sm,
  },
  stockBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  stockText: {
    color: 'white',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  medicineBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  medicinePhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: SPACING.md,
    backgroundColor: '#f0f0f0',
  },
  medicinePhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: SPACING.md,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicinePhotoIcon: {
    fontSize: 32,
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
    marginBottom: SPACING.sm,
  },
  medicineFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: SPACING.sm,
  },
  expiryDate: {
    fontSize: FONT_SIZE.sm,
  },
})


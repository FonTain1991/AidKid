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

interface ExpiringMedicine extends Medicine {
  stock: MedicineStock
  kitName: string
  daysUntilExpiry: number
}

export function ExpiringMedicinesScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [medicines, setMedicines] = useState<ExpiringMedicine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadExpiringMedicines()
  }, [])

  const loadExpiringMedicines = async (isRefresh = false) => {
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

      const expiring: ExpiringMedicine[] = []
      const now = new Date()

      for (const medicine of allMedicines) {
        try {
          const stock = await databaseService.getMedicineStock(medicine.id)
          if (stock?.expiryDate) {
            const daysUntilExpiry = Math.ceil((stock.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
              const kit = kitsMap.get(medicine.kitId)
              expiring.push({
                ...medicine,
                stock,
                kitName: kit?.name || 'Неизвестная аптечка',
                daysUntilExpiry
              })
            }
          }
        } catch (error) {
          console.warn(`Failed to load stock for medicine ${medicine.id}:`, error)
        }
      }

      // Сортируем по срочности
      expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

      setMedicines(expiring)
    } catch (error) {
      console.error('Failed to load expiring medicines:', error)
      Alert.alert('Ошибка', 'Не удалось загрузить лекарства')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const getUrgencyColor = (days: number) => {
    if (days <= 3) {
      return colors.error
    }
    if (days <= 7) {
      return '#FF6B00'
    }
    if (days <= 14) {
      return colors.warning
    }
    return colors.secondary
  }

  const getUrgencyLabel = (days: number) => {
    if (days === 0) {
      return 'Истекает сегодня!'
    }
    if (days === 1) {
      return 'Истекает завтра'
    }
    if (days <= 3) {
      return `${days} дня`
    }
    if (days <= 7) {
      return `${days} дней`
    }
    if (days <= 14) {
      return `${days} дней`
    }
    return `${days} дней`
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
            onRefresh={() => loadExpiringMedicines(true)}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Истекающие лекарства
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {medicines.length} {medicines.length === 1 ? 'лекарство' : 'лекарств'} требует внимания
          </Text>
        </View>

        {medicines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Все в порядке!
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Нет лекарств с истекающим сроком годности
            </Text>
          </View>
        ) : (
          <View style={styles.medicinesList}>
            {medicines.map(medicine => {
              const urgencyColor = getUrgencyColor(medicine.daysUntilExpiry)
              const urgencyLabel = getUrgencyLabel(medicine.daysUntilExpiry)

              return (
                <TouchableOpacity
                  key={medicine.id}
                  style={[styles.medicineCard, { borderColor: colors.border }]}
                  onPress={() => navigation.navigate('Medicine', { medicineId: medicine.id, mode: 'edit' })}
                >
                  <View style={styles.medicineHeader}>
                    <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
                      <Text style={styles.urgencyText}>⏰ {urgencyLabel}</Text>
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

                  <View style={styles.medicineFooter}>
                    <Text style={[styles.expiryDate, { color: colors.textSecondary }]}>
                      Срок годности:{' '}
                      <Text style={{ color: urgencyColor, fontWeight: '600' }}>
                        {medicine.stock.expiryDate?.toLocaleDateString('ru-RU')}
                      </Text>
                    </Text>
                  </View>
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
  urgencyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  urgencyText: {
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


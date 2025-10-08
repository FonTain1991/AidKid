import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService } from '@/shared/lib/database'
import { Medicine, MedicineStock } from '@/entities/medicine/model/types'
import { MedicineKit } from '@/entities/kit/model/types'

export function QuickIntakeScreen() {
  const { colors } = useTheme()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [stocks, setStocks] = useState<Map<string, MedicineStock>>(new Map())
  const [kits, setKits] = useState<Map<string, MedicineKit>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 Loading data for quick intake...')

      // Проверяем инициализацию базы данных
      console.log('🔧 Checking database initialization...')
      await databaseService.init()
      console.log('✅ Database initialized')

      // Загружаем все аптечки
      console.log('📦 Loading kits...')
      const allKits = await databaseService.getKits()
      console.log('📦 Kits loaded:', allKits.length)
      const kitsMap = new Map(allKits.map(kit => [kit.id, kit]))
      setKits(kitsMap)

      // Загружаем все лекарства
      console.log('💊 Loading medicines...')
      const allMedicines = await databaseService.getMedicines()
      console.log('💊 Medicines loaded:', allMedicines.length)
      setMedicines(allMedicines)

      // Загружаем запасы для каждого лекарства
      console.log('📋 Loading stocks...')
      const stocksMap = new Map<string, MedicineStock>()

      for (const medicine of allMedicines) {
        try {
          const stock = await databaseService.getMedicineStock(medicine.id)
          if (stock) {
            stocksMap.set(medicine.id, stock)
          }
        } catch (error) {
          console.warn(`Failed to load stock for medicine ${medicine.id}:`, error)
        }
      }

      console.log('📋 Stocks loaded:', stocksMap.size)
      setStocks(stocksMap)

      console.log('✅ Data loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load data:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      Alert.alert('Ошибка', `Не удалось загрузить данные: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIntake = async (medicine: Medicine) => {
    try {
      const stock = stocks.get(medicine.id)
      if (!stock) {
        Alert.alert('Ошибка', 'Не найден запас лекарства')
        return
      }

      if (stock.quantity <= 0) {
        Alert.alert('Внимание', 'Лекарство закончилось')
        return
      }

      // Уменьшаем количество на 1
      const updatedStock = {
        ...stock,
        quantity: stock.quantity - 1,
        updatedAt: new Date(),
      }

      await databaseService.updateMedicineStock(stock.id, {
        quantity: updatedStock.quantity,
        updatedAt: updatedStock.updatedAt,
      })

      // Обновляем локальное состояние
      setStocks(prev => new Map(prev.set(medicine.id, updatedStock)))

      Alert.alert(
        '✅ Прием отмечен',
        `${medicine.name} принят успешно!\n\nОсталось: ${updatedStock.quantity} ${stock.unit}`
      )
    } catch (error) {
      console.error('Failed to mark intake:', error)
      Alert.alert('Ошибка', 'Не удалось отметить прием')
    }
  }

  const getKitName = (kitId: string) => {
    return kits.get(kitId)?.name || 'Неизвестная аптечка'
  }

  const getStockInfo = (medicine: Medicine) => {
    const stock = stocks.get(medicine.id)
    if (!stock) {
      return { text: 'Нет в наличии', color: colors.error }
    }

    if (stock.quantity <= 0) {
      return { text: 'Закончилось', color: colors.error }
    }
    if (stock.quantity <= 5) {
      return { text: `${stock.quantity} ${stock.unit}`, color: colors.warning }
    }

    return { text: `${stock.quantity} ${stock.unit}`, color: colors.success }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Загрузка лекарств...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Фильтруем лекарства для быстрого приема
  const availableMedicines = medicines.filter(medicine => {
    const stock = stocks.get(medicine.id)
    // Показываем только лекарства с остатком > 0
    return stock && stock.quantity > 0
  })

  // Группируем по аптечкам для удобства
  const medicinesByKit = availableMedicines.reduce((acc, medicine) => {
    const { kitId } = medicine
    if (!acc[kitId]) {
      acc[kitId] = []
    }
    acc[kitId].push(medicine)
    return acc
  }, {} as Record<string, Medicine[]>)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Быстрый прием</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Выберите лекарство для отметки приема
          </Text>
        </View>

        {availableMedicines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Нет доступных лекарств
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Все лекарства закончились или не добавлены в аптечки
            </Text>
          </View>
        ) : (
          <View style={styles.medicinesList}>
            {Object.entries(medicinesByKit).map(([kitId, kitMedicines]) => {
              const kitName = getKitName(kitId)

              return (
                <View key={kitId} style={styles.kitSection}>
                  <Text style={[styles.kitTitle, { color: colors.text }]}>
                    📦 {kitName} ({kitMedicines.length})
                  </Text>

                  {kitMedicines.map(medicine => {
                    const stockInfo = getStockInfo(medicine)

                    return (
                      <TouchableOpacity
                        key={medicine.id}
                        style={[styles.medicineCard, { borderColor: colors.border }]}
                        onPress={() => handleIntake(medicine)}
                      >
                        <View style={styles.medicineContent}>
                          <View style={styles.medicineInfo}>
                            <Text style={[styles.medicineName, { color: colors.text }]}>
                              {medicine.name}
                            </Text>
                            <Text style={[styles.medicineForm, { color: colors.textSecondary }]}>
                              {medicine.form}
                            </Text>
                          </View>

                          <View style={styles.medicineRight}>
                            <View style={[styles.stockBadge, { backgroundColor: stockInfo.color }]}>
                              <Text style={styles.stockText}>{stockInfo.text}</Text>
                            </View>
                            <Text style={[styles.intakeButton, { color: colors.primary }]}>
                              Принять
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )
            })}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>О быстром приеме</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Нажмите на лекарство чтобы отметить прием{'\n'}
            • Количество автоматически уменьшится{'\n'}
            • Проверьте остаток перед приемом
          </Text>
        </View>
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
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  medicinesList: {
    paddingHorizontal: SPACING.md,
  },
  kitSection: {
    marginBottom: SPACING.lg,
  },
  kitTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  medicineCard: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: SPACING.md,
    backgroundColor: 'white',
  },
  medicineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: FONT_SIZE.lg,
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
  medicineRight: {
    alignItems: 'flex-end',
  },
  stockBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  stockText: {
    color: 'white',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  intakeButton: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
})

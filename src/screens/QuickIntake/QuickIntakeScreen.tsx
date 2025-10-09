import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { useTheme } from '@/app/providers/theme'
import { useQuickIntakeStyles } from '@/shared/hooks/useQuickIntakeStyles'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService } from '@/shared/lib/database'
import { getMedicinePhotoUri } from '@/shared/lib'
import { Medicine, MedicineStock } from '@/entities/medicine/model/types'
import { MedicineKit } from '@/entities/kit/model/types'

export function QuickIntakeScreen() {
  const { colors } = useTheme()
  const styles = useQuickIntakeStyles()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [stocks, setStocks] = useState<Map<string, MedicineStock>>(new Map())
  const [kits, setKits] = useState<Map<string, MedicineKit>>(new Map())
  const [selectedMedicines, setSelectedMedicines] = useState<Set<string>>(new Set())
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
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      Alert.alert('Ошибка', `Не удалось загрузить данные: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMedicineSelection = (medicineId: string) => {
    setSelectedMedicines(prev => {
      const newSet = new Set(prev)
      if (newSet.has(medicineId)) {
        newSet.delete(medicineId)
      } else {
        newSet.add(medicineId)
      }
      return newSet
    })
  }

  const handleBatchIntake = async () => {
    if (selectedMedicines.size === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы одно лекарство')
      return
    }

    try {
      let successCount = 0
      let outOfStockCount = 0
      const results: string[] = []

      for (const medicineId of selectedMedicines) {
        const medicine = medicines.find(m => m.id === medicineId)
        if (!medicine) {
          continue
        }

        const stock = stocks.get(medicineId)

        // Создаем запись в истории
        await databaseService.createMedicineUsage({
          medicineId,
          quantityUsed: 1,
          usageDate: new Date(),
          notes: 'Быстрый прием (множественный)'
        })

        // Если есть запас, уменьшаем количество
        if (stock && stock.quantity > 0) {
          const updatedStock = {
            ...stock,
            quantity: stock.quantity - 1,
            updatedAt: new Date(),
          }

          await databaseService.updateMedicineStock(stock.id, {
            quantity: updatedStock.quantity,
            updatedAt: updatedStock.updatedAt,
          })

          setStocks(prev => new Map(prev.set(medicineId, updatedStock)))
          results.push(`✅ ${medicine.name}: ${updatedStock.quantity} ${stock.unit}`)
          successCount++
        } else {
          results.push(`⚠️ ${medicine.name}: закончилось`)
          outOfStockCount++
        }
      }

      // Очищаем выбор
      setSelectedMedicines(new Set())

      Alert.alert(
        '✅ Прием отмечен',
        `Принято лекарств: ${successCount}\n${outOfStockCount > 0 ? `Закончилось: ${outOfStockCount}\n` : ''}\n${results.join('\n')}`
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      console.error('Failed to record batch intake:', error)
      Alert.alert('Ошибка', `Не удалось отметить прием: ${errorMessage}`)
    }
  }

  const handleIntake = async (medicine: Medicine) => {
    try {
      const stock = stocks.get(medicine.id)

      // Создаем запись в истории
      await databaseService.createMedicineUsage({
        medicineId: medicine.id,
        quantityUsed: 1,
        usageDate: new Date(),
        notes: 'Быстрый прием'
      })

      // Если есть запас, уменьшаем количество
      if (stock && stock.quantity > 0) {
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
      } else {
        // Просто отмечаем прием без изменения остатка
        Alert.alert(
          '✅ Прием отмечен',
          `${medicine.name} принят успешно!${!stock || stock.quantity === 0 ? '\n\n⚠️ Запас закончился' : ''}`
        )
      }
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

  // Показываем все лекарства (даже без остатка)
  const availableMedicines = medicines

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
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
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
              Нет лекарств
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Добавьте лекарства в аптечки
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
                    const stock = stocks.get(medicine.id)
                    const isOutOfStock = !stock || stock.quantity === 0
                    const isSelected = selectedMedicines.has(medicine.id)

                    return (
                      <TouchableOpacity
                        key={medicine.id}
                        style={[
                          styles.medicineCard,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderWidth: isSelected ? 2 : 1,
                            opacity: isOutOfStock ? 0.5 : 1,
                            backgroundColor: isOutOfStock ? '#f5f5f5' : isSelected ? colors.primary + '10' : 'white'
                          }
                        ]}
                        onPress={() => (isOutOfStock ? null : toggleMedicineSelection(medicine.id))}
                        onLongPress={() => !isOutOfStock && handleIntake(medicine)}
                        disabled={isOutOfStock}
                      >
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
                          </View>

                          <View style={styles.medicineRight}>
                            <View style={[styles.stockBadge, { backgroundColor: stockInfo.color }]}>
                              <Text style={styles.stockText}>{stockInfo.text}</Text>
                            </View>
                            {isSelected && !isOutOfStock && (
                              <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                                <Text style={styles.checkmarkText}>✓</Text>
                              </View>
                            )}
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
            • Нажмите чтобы выбрать лекарство{'\n'}
            • Долгое нажатие - мгновенный прием{'\n'}
            • Выберите несколько и нажмите кнопку внизу
          </Text>
        </View>
      </ScrollView>

      {/* Плавающая кнопка множественного приема */}
      {selectedMedicines.size > 0 && (
        <View style={[styles.floatingButton, { backgroundColor: colors.primary }]}>
          <TouchableOpacity
            style={styles.floatingButtonContent}
            onPress={handleBatchIntake}
          >
            <Text style={styles.floatingButtonText}>
              Принять выбранные ({selectedMedicines.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

// Styles теперь в useQuickIntakeStyles hook


import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService } from '@/shared/lib/database'
import { notificationService } from '@/shared/lib/notifications'
import { Medicine, MedicineStock } from '@/entities/medicine/model/types'
import { MedicineKit } from '@/entities/kit/model/types'
import { DatePicker } from '@/shared/ui/DatePicker'

interface ReminderData {
  medicineId: string
  title: string
  time: Date
  frequency: 'once' | 'daily' | 'weekly'
  quantity: number
  isEnabled: boolean
}

export function AddReminderScreen() {
  const { colors } = useTheme()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [stocks, setStocks] = useState<Map<string, MedicineStock>>(new Map())
  const [kits, setKits] = useState<Map<string, MedicineKit>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderTime, setReminderTime] = useState(new Date())
  const [reminderTimes, setReminderTimes] = useState<Date[]>([new Date(), new Date(), new Date()])
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'weekly'>('daily')
  const [quantity, setQuantity] = useState(1)
  const [isEnabled, setIsEnabled] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  // Инициализируем время по умолчанию для разных приемов
  useEffect(() => {
    const defaultTimes = []
    const baseTime = new Date()

    // Устанавливаем разное время для каждого приема
    // 1-й прием: 09:00, 2-й: 14:00, 3-й: 20:00, и т.д.
    const defaultHours = [9, 14, 20, 12, 16, 22, 10, 15, 18, 21]

    for (let i = 0; i < 10; i++) {
      const time = new Date()
      time.setHours(defaultHours[i] || 9 + i * 2, 0, 0, 0)
      defaultTimes.push(time)
    }

    setReminderTimes(defaultTimes)
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 Loading data for reminders...')

      await databaseService.init()

      const allKits = await databaseService.getKits()
      const kitsMap = new Map(allKits.map(kit => [kit.id, kit]))
      setKits(kitsMap)

      const allMedicines = await databaseService.getMedicines()
      setMedicines(allMedicines)

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

      setStocks(stocksMap)
      console.log('✅ Data loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load data:', error)
      Alert.alert('Ошибка', `Не удалось загрузить данные: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const availableMedicines = medicines.filter(medicine => {
    const stock = stocks.get(medicine.id)
    return stock && stock.quantity > 0
  })

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

  const scheduleReminderNotifications = async (
    medicine: Medicine,
    title: string,
    times: Date[],
    frequency: 'once' | 'daily' | 'weekly',
    quantity: number
  ) => {
    const now = new Date()

    if (frequency === 'once') {
      // Одноразовое напоминание - всегда 1 уведомление
      const notificationTime = new Date(times[0])
      notificationTime.setFullYear(now.getFullYear())
      notificationTime.setMonth(now.getMonth())
      notificationTime.setDate(now.getDate())

      // Если время уже прошло сегодня, планируем на завтра
      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1)
      }

      const notificationId = `reminder-once-${medicine.id}-${Date.now()}`
      await notificationService.scheduleNotification(notificationId, {
        title,
        body: `Время принять ${medicine.name}`,
        notificationDate: notificationTime,
        data: {
          type: 'reminder',
          medicineId: medicine.id,
          frequency: 'once',
        },
        kitId: medicine.kitId,
        critical: false,
      })
      console.log(`✅ Запланировано одноразовое напоминание на ${notificationTime.toLocaleString('ru-RU')}`)
    } else if (frequency === 'daily') {
      // Ежедневные напоминания: создаем quantity уведомлений в день на 30 дней
      let notificationCount = 0

      for (let day = 0; day < 30; day++) {
        for (let intake = 0; intake < quantity; intake++) {
          const intakeTime = times[intake]
          const notificationTime = new Date(intakeTime)
          notificationTime.setFullYear(now.getFullYear())
          notificationTime.setMonth(now.getMonth())
          notificationTime.setDate(now.getDate() + day)

          // Пропускаем уведомления в прошлом
          if (notificationTime <= now) {
            continue
          }

          const intakeNumber = intake + 1
          const notificationId = `reminder-daily-${medicine.id}-day${day}-intake${intake}`

          await notificationService.scheduleNotification(notificationId, {
            title,
            body: `Время принять ${medicine.name} (прием ${intakeNumber} из ${quantity})`,
            notificationDate: notificationTime,
            data: {
              type: 'reminder',
              medicineId: medicine.id,
              frequency: 'daily',
              day,
              intake: intakeNumber,
              totalIntakes: quantity,
            },
            kitId: medicine.kitId,
            critical: false,
          })
          notificationCount++
        }
      }
      console.log(`✅ Запланировано ${notificationCount} ежедневных напоминаний (${quantity} раз в день на 30 дней)`)
    } else if (frequency === 'weekly') {
      // Еженедельные напоминания: создаем quantity уведомлений в неделю на 12 недель
      let notificationCount = 0

      for (let week = 0; week < 12; week++) {
        for (let intake = 0; intake < quantity; intake++) {
          const intakeTime = times[intake]
          const notificationTime = new Date(intakeTime)
          notificationTime.setFullYear(now.getFullYear())
          notificationTime.setMonth(now.getMonth())
          // Распределяем приемы равномерно в течение недели
          notificationTime.setDate(now.getDate() + (week * 7) + Math.floor((intake * 7) / quantity))

          // Пропускаем уведомления в прошлом
          if (notificationTime <= now) {
            continue
          }

          const intakeNumber = intake + 1
          const notificationId = `reminder-weekly-${medicine.id}-week${week}-intake${intake}`

          await notificationService.scheduleNotification(notificationId, {
            title,
            body: `Время принять ${medicine.name} (прием ${intakeNumber} из ${quantity} в неделю)`,
            notificationDate: notificationTime,
            data: {
              type: 'reminder',
              medicineId: medicine.id,
              frequency: 'weekly',
              week,
              intake: intakeNumber,
              totalIntakes: quantity,
            },
            kitId: medicine.kitId,
            critical: false,
          })
          notificationCount++
        }
      }
      console.log(`✅ Запланировано ${notificationCount} еженедельных напоминаний (${quantity} раз в неделю на 12 недель)`)
    }
  }

  const handleCreateReminder = async () => {
    if (!selectedMedicine) {
      Alert.alert('Ошибка', 'Выберите лекарство')
      return
    }

    // Если название не введено, используем название по умолчанию
    const title = reminderTitle.trim() || `Принять ${selectedMedicine.name}`

    try {
      // TODO: Создать напоминание в базе данных
      // const reminder = await databaseService.createReminder({
      //   medicineId: selectedMedicine.id,
      //   title,
      //   time: reminderTime,
      //   frequency,
      //   quantity: frequency === 'once' ? 1 : quantity,
      //   isEnabled,
      // })

      // Запланировать уведомления
      const timesToUse = frequency === 'once' ? [reminderTime] : reminderTimes.slice(0, quantity)
      await scheduleReminderNotifications(
        selectedMedicine,
        title,
        timesToUse,
        frequency,
        frequency === 'once' ? 1 : quantity
      )

      const frequencyText = frequency === 'once' ? 'один раз' : frequency === 'daily' ? 'ежедневно' : 'еженедельно'

      let message = `Напоминание "${title}" для ${selectedMedicine.name} создано!\n\n`
      message += `Частота: ${frequencyText}\n`

      if (frequency === 'once') {
        const timeStr = reminderTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        message += `Время: ${timeStr}`
      } else {
        message += `Приемов в ${frequency === 'daily' ? 'день' : 'неделю'}: ${quantity}\n`
        message += 'Время приемов:\n'
        for (let i = 0; i < quantity; i++) {
          const timeStr = reminderTimes[i].toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          message += `  ${i + 1}. ${timeStr}\n`
        }
      }

      Alert.alert('✅ Напоминание создано', message)
    } catch (error) {
      console.error('Failed to create reminder:', error)
      Alert.alert('Ошибка', 'Не удалось создать напоминание')
    }
  }

  const frequencyOptions = [
    { value: 'once', label: 'Один раз', icon: '📅' },
    { value: 'daily', label: 'Ежедневно', icon: '🔄' },
    { value: 'weekly', label: 'Еженедельно', icon: '📆' },
  ] as const

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Добавить напоминание</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Настройте напоминание о приеме лекарства
          </Text>
        </View>

        {/* Выбор лекарства */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Лекарство</Text>

          {availableMedicines.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Нет доступных лекарств
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.medicinesScroll}>
              {availableMedicines.map((medicine) => {
                const stockInfo = getStockInfo(medicine)
                const kitName = getKitName(medicine.kitId)
                const isSelected = selectedMedicine?.id === medicine.id

                return (
                  <TouchableOpacity
                    key={medicine.id}
                    style={[
                      styles.medicineCard,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary + '10' : 'white'
                      }
                    ]}
                    onPress={() => setSelectedMedicine(medicine)}
                  >
                    <Text style={[styles.medicineName, { color: colors.text }]}>
                      {medicine.name}
                    </Text>
                    <Text style={[styles.medicineForm, { color: colors.textSecondary }]}>
                      {medicine.form}
                    </Text>
                    <Text style={[styles.medicineKit, { color: colors.textSecondary }]}>
                      📦 {kitName}
                    </Text>
                    <View style={[styles.stockBadge, { backgroundColor: stockInfo.color }]}>
                      <Text style={styles.stockText}>{stockInfo.text}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}
        </View>

        {/* Настройки напоминания */}
        {selectedMedicine && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Настройки</Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Название</Text>
                <View style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                  <Text style={[styles.textInputText, { color: colors.text }]}>
                    {reminderTitle || `Принять ${selectedMedicine.name}`}
                  </Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Частота</Text>
                <View style={styles.frequencyContainer}>
                  {frequencyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.frequencyOption,
                        {
                          borderColor: frequency === option.value ? colors.primary : colors.border,
                          backgroundColor: frequency === option.value ? colors.primary + '10' : 'white'
                        }
                      ]}
                      onPress={() => setFrequency(option.value)}
                    >
                      <Text style={styles.frequencyIcon}>{option.icon}</Text>
                      <Text style={[styles.frequencyLabel, { color: colors.text }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {frequency !== 'once' && (
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Количество приемов</Text>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={[styles.quantityButton, { borderColor: colors.border }]}
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Text style={[styles.quantityButtonText, { color: colors.text }]}>−</Text>
                    </TouchableOpacity>

                    <View style={[styles.quantityDisplay, { borderColor: colors.border }]}>
                      <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.quantityButton, { borderColor: colors.border }]}
                      onPress={() => setQuantity(Math.min(10, quantity + 1))}
                    >
                      <Text style={[styles.quantityButtonText, { color: colors.text }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {frequency === 'once' ? (
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Время</Text>
                  <DatePicker
                    value={reminderTime}
                    onChange={setReminderTime}
                    mode="time"
                    style={styles.timePicker}
                  />
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Время приемов</Text>
                  {Array.from({ length: quantity }).map((_, index) => (
                    <View key={index} style={styles.timePickerContainer}>
                      <Text style={[styles.timePickerLabel, { color: colors.text }]}>
                        {index + 1}. Прием
                      </Text>
                      <DatePicker
                        value={reminderTimes[index]}
                        onChange={(newTime) => {
                          const newTimes = [...reminderTimes]
                          newTimes[index] = newTime
                          setReminderTimes(newTimes)
                        }}
                        mode="time"
                        style={styles.timePicker}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Кнопка создания */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateReminder}
              >
                <Text style={styles.createButtonText}>Создать напоминание</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>О напоминаниях</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Напоминания будут приходить в указанное время{'\n'}
            • Для повторяющихся напоминаний можно указать количество{'\n'}
            • Ежедневные напоминания повторяются каждый день{'\n'}
            • Еженедельные напоминания повторяются каждую неделю{'\n'}
            • Можно отключить или изменить в любой момент
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
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
  },
  medicinesScroll: {
    marginHorizontal: -SPACING.md,
  },
  medicineCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: SPACING.sm,
    minWidth: 140,
    backgroundColor: 'white',
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
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  stockText: {
    color: 'white',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
  },
  textInputText: {
    fontSize: FONT_SIZE.md,
  },
  timePicker: {
    marginVertical: SPACING.sm,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  frequencyOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  frequencyIcon: {
    fontSize: FONT_SIZE.xl,
    marginBottom: SPACING.xs,
  },
  frequencyLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  quantityDisplay: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  timePickerContainer: {
    marginBottom: SPACING.md,
    paddingLeft: SPACING.sm,
  },
  timePickerLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  createButton: {
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.lg,
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


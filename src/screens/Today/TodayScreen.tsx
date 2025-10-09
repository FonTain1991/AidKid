import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService } from '@/shared/lib/database'
import { notificationService } from '@/shared/lib/notifications'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { Medicine, MedicineStock } from '@/entities/medicine/model/types'
import { FamilyMember } from '@/entities/family-member/model/types'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface TodayIntake {
  medicineId: string
  medicineName: string
  medicineForm: string
  time: string
  timestamp: Date
  taken: boolean
  stock?: MedicineStock
  familyMemberId?: string
  familyMemberName?: string
  familyMemberAvatar?: string
}

export function TodayScreen() {
  const { colors } = useTheme()
  const [todayIntakes, setTodayIntakes] = useState<TodayIntake[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [medicines, setMedicines] = useState<Map<string, Medicine>>(new Map())
  const [stocks, setStocks] = useState<Map<string, MedicineStock>>(new Map())

  useEffect(() => {
    loadTodayIntakes()
  }, [])

  const loadTodayIntakes = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 Loading today intakes...')

      // Загружаем все лекарства
      await databaseService.init()
      const allMedicines = await databaseService.getMedicines()
      const medicinesMap = new Map(allMedicines.map(m => [m.id, m]))

      // Загружаем членов семьи
      const allFamilyMembers = await databaseService.getFamilyMembers()
      const familyMembersMap = new Map(allFamilyMembers.map(m => [m.id, m]))
      setMedicines(medicinesMap)

      // Загружаем запасы
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

      // Загружаем все запланированные уведомления
      const notifications = await notificationService.getTriggerNotifications()
      console.log(`📋 Found ${notifications.length} scheduled notifications`)

      // Фильтруем уведомления на сегодня
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const intakes: TodayIntake[] = []

      for (const item of notifications) {
        const { notification } = item
        const data = notification.data as any

        // Только напоминания о приеме
        if (data?.type !== 'reminder') {
          continue
        }

        const trigger = item.trigger as any
        const notificationTime = trigger?.timestamp ? new Date(trigger.timestamp) : null

        // Проверяем что уведомление на сегодня
        if (!notificationTime || notificationTime < today || notificationTime >= tomorrow) {
          continue
        }

        const { medicineId, familyMemberId } = data
        const medicine = medicinesMap.get(medicineId)

        if (!medicine) {
          continue
        }

        const stock = stocksMap.get(medicineId)
        const familyMember = familyMemberId ? familyMembersMap.get(familyMemberId) : null

        intakes.push({
          medicineId,
          medicineName: medicine.name,
          medicineForm: medicine.form,
          time: notificationTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          timestamp: notificationTime,
          taken: false, // TODO: проверять историю приема
          stock,
          familyMemberId,
          familyMemberName: familyMember?.name,
          familyMemberAvatar: familyMember?.avatar,
        })
      }

      // Сортируем по времени
      intakes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      setTodayIntakes(intakes)
      console.log(`✅ Loaded ${intakes.length} intakes for today`)
    } catch (error) {
      console.error('❌ Failed to load today intakes:', error)
      Alert.alert('Ошибка', 'Не удалось загрузить приемы на сегодня')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkTaken = async (intake: TodayIntake) => {
    Alert.alert(
      'Отметить прием?',
      `${intake.medicineName} в ${intake.time}${!intake.stock || intake.stock.quantity === 0 ? '\n\n⚠️ Запас закончился' : ''}`,
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Принял',
          onPress: async () => {
            try {
              // Создаем запись в истории
              await databaseService.createMedicineUsage({
                medicineId: intake.medicineId,
                familyMemberId: intake.familyMemberId,
                quantityUsed: 1,
                usageDate: new Date(),
                notes: `Запланированный прием в ${intake.time}`
              })

              // Если есть запас, уменьшаем количество
              if (intake.stock && intake.stock.quantity > 0) {
                await databaseService.updateMedicineStock(intake.stock.id, {
                  quantity: intake.stock.quantity - 1,
                  updatedAt: new Date(),
                })
              }

              // Обновляем локальное состояние
              setTodayIntakes(prev =>
                prev.map(i =>
                  i.medicineId === intake.medicineId && i.time === intake.time
                    ? { ...i, taken: true }
                    : i
                )
              )

              const message = `${intake.medicineName} принят успешно!${!intake.stock || intake.stock.quantity === 0 ? '\n\n⚠️ Не забудьте пополнить запас' : ''}`
              Alert.alert('✅ Прием отмечен', message)

              // Перезагружаем данные
              loadTodayIntakes()
            } catch (error) {
              console.error('Failed to mark intake:', error)
              Alert.alert('Ошибка', 'Не удалось отметить прием')
            }
          },
        },
      ]
    )
  }

  const getStockStatus = (intake: TodayIntake) => {
    if (!intake.stock) {
      return { text: 'Нет в наличии', color: colors.error }
    }

    if (intake.stock.quantity <= 0) {
      return { text: 'Закончилось', color: colors.error }
    }
    if (intake.stock.quantity <= 5) {
      return { text: `Осталось ${intake.stock.quantity}`, color: colors.warning }
    }

    return { text: `В наличии ${intake.stock.quantity}`, color: colors.success }
  }

  const getTimeStatus = (timestamp: Date) => {
    const now = new Date()
    if (timestamp <= now) {
      return { text: 'Время приема', color: colors.primary }
    }
    const hoursUntil = Math.floor((timestamp.getTime() - now.getTime()) / (1000 * 60 * 60))
    const minutesUntil = Math.floor((timestamp.getTime() - now.getTime()) / (1000 * 60)) % 60

    if (hoursUntil === 0) {
      return { text: `Через ${minutesUntil} мин`, color: colors.textSecondary }
    }
    return { text: `Через ${hoursUntil}ч ${minutesUntil}м`, color: colors.textSecondary }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Загрузка приемов на сегодня...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Сегодня</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </Text>
        </View>

        {todayIntakes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Нет запланированных приемов
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              На сегодня не запланировано ни одного приема лекарств
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
                <Text style={styles.statNumber}>{todayIntakes.length}</Text>
                <Text style={styles.statLabel}>Всего приемов</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.success }]}>
                <Text style={styles.statNumber}>
                  {todayIntakes.filter(i => i.taken).length}
                </Text>
                <Text style={styles.statLabel}>Принято</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.warning }]}>
                <Text style={styles.statNumber}>
                  {todayIntakes.filter(i => !i.taken).length}
                </Text>
                <Text style={styles.statLabel}>Осталось</Text>
              </View>
            </View>

            <View style={styles.intakesList}>
              {todayIntakes.map((intake, index) => {
                const stockStatus = getStockStatus(intake)
                const timeStatus = getTimeStatus(intake.timestamp)
                const isPast = intake.timestamp <= new Date()

                return (
                  <TouchableOpacity
                    key={`${intake.medicineId}-${intake.time}-${index}`}
                    style={[
                      styles.intakeCard,
                      {
                        backgroundColor: intake.taken ? colors.background : 'white',
                        borderColor: intake.taken ? colors.success : colors.border,
                        opacity: intake.taken ? 0.7 : 1,
                      }
                    ]}
                    onPress={() => !intake.taken && handleMarkTaken(intake)}
                    disabled={intake.taken}
                  >
                    <View style={styles.intakeCardContent}>
                      <View style={styles.intakeLeft}>
                        <View style={[styles.timeCircle, {
                          backgroundColor: isPast ? colors.primary : colors.background,
                          borderColor: isPast ? colors.primary : colors.border
                        }]}>
                          <Text style={[styles.timeText, { color: isPast ? 'white' : colors.text }]}>
                            {intake.time}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.intakeCenter}>
                        <View style={styles.intakeHeader}>
                          <Text style={[styles.intakeMedicine, { color: colors.text }]}>
                            {intake.medicineName}
                          </Text>
                          {intake.taken && (
                            <View style={[styles.takenBadge, { backgroundColor: colors.success }]}>
                              <Text style={styles.takenText}>✓</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.intakeForm, { color: colors.textSecondary }]}>
                          {intake.medicineForm}
                        </Text>
                        {intake.familyMemberName && (
                          <View style={styles.familyMemberBadge}>
                            <Text style={styles.familyMemberIcon}>{intake.familyMemberAvatar || '👤'}</Text>
                            <Text style={[styles.familyMemberText, { color: colors.textSecondary }]}>
                              {intake.familyMemberName}
                            </Text>
                          </View>
                        )}
                        <View style={styles.intakeStatus}>
                          <Text style={[styles.timeStatusText, { color: timeStatus.color }]}>
                            {timeStatus.text}
                          </Text>
                          <Text style={{ color: colors.textSecondary }}> • </Text>
                          <Text style={[styles.stockStatusText, { color: stockStatus.color }]}>
                            {stockStatus.text}
                          </Text>
                        </View>
                      </View>

                      {!intake.taken && (
                        <View style={styles.intakeRight}>
                          <View style={[styles.checkButton, { backgroundColor: colors.primary }]}>
                            <Text style={styles.checkButtonText}>✓</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>О разделе "Сегодня"</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Здесь отображаются все запланированные приемы на сегодня{'\n'}
            • Нажмите на прием, чтобы отметить его выполненным{'\n'}
            • Количество лекарства автоматически уменьшится{'\n'}
            • Приемы показываются на основе настроенных напоминаний
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
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    textTransform: 'capitalize',
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: 'white',
    opacity: 0.9,
  },
  intakesList: {
    paddingHorizontal: SPACING.md,
  },
  intakeCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  intakeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  intakeLeft: {
    marginRight: SPACING.md,
  },
  timeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: 'bold',
  },
  intakeCenter: {
    flex: 1,
  },
  intakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  intakeMedicine: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    flex: 1,
  },
  takenBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  takenText: {
    color: 'white',
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  intakeForm: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  familyMemberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  familyMemberIcon: {
    fontSize: FONT_SIZE.md,
    marginRight: SPACING.xs,
  },
  familyMemberText: {
    fontSize: FONT_SIZE.sm,
  },
  intakeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeStatusText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  stockStatusText: {
    fontSize: FONT_SIZE.sm,
  },
  intakeRight: {
    marginLeft: SPACING.md,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
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


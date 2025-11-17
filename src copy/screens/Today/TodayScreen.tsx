import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService, getMedicinePhotoUri, notificationService } from '@/shared/lib'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { MedicineStock } from '@/entities/medicine/model/types'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface Medicine {
  id: string
  name: string
  form: string
  photo_path?: string
}

interface TodayIntake {
  id: string
  reminderId: string
  medicines: Medicine[]
  time: string
  isTaken: boolean
  takenAt?: Date
  familyMemberName?: string
  familyMemberAvatar?: string
  familyMemberColor?: string
  title: string
}

export function TodayScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [intakes, setIntakes] = useState<TodayIntake[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stocks, setStocks] = useState<Map<string, MedicineStock>>(new Map())

  useEffect(() => {
    loadTodayIntakes()
  }, [])

  // Перезагружаем при фокусе экрана
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTodayIntakes()
    })
    return unsubscribe
  }, [navigation])

  const loadTodayIntakes = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      await databaseService.init()

      // Загружаем запасы для всех лекарств
      const allMedicines = await databaseService.getMedicines()
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

      // Загружаем запланированные приемы на сегодня из БД
      const reminderIntakes = await databaseService.getTodayReminderIntakes()

      const todayIntakes: TodayIntake[] = reminderIntakes.map(intake => ({
        id: intake.id,
        reminderId: intake.reminder_id,
        medicines: intake.medicines || [],
        time: intake.scheduled_time,
        isTaken: intake.is_taken === 1,
        takenAt: intake.taken_at ? new Date(intake.taken_at) : undefined,
        familyMemberName: intake.family_member_name,
        familyMemberAvatar: intake.family_member_avatar,
        familyMemberColor: intake.family_member_color,
        title: intake.title
      }))

      setIntakes(todayIntakes)
    } catch (error) {
      console.error('❌ Failed to load today intakes:', error)
      Alert.alert('Ошибка', 'Не удалось загрузить приемы на сегодня')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleMarkTaken = async (intake: TodayIntake) => {
    const medicineNames = intake.medicines.map(m => m.name).join(', ')

    Alert.alert(
      'Отметить прием?',
      `${medicineNames} в ${intake.time}`,
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Принял',
          onPress: async () => {
            try {
              let firstUsageId: string | null = null

              // Создаем записи в истории для каждого лекарства
              for (const medicine of intake.medicines) {
                const usage = await databaseService.createMedicineUsage({
                  medicineId: medicine.id,
                  quantityUsed: 1,
                  usageDate: new Date(),
                  notes: `Запланированный прием в ${intake.time}`
                })

                if (!firstUsageId) {
                  firstUsageId = usage.id
                }

                // Уменьшаем запас если есть
                const stock = stocks.get(medicine.id)
                if (stock && stock.quantity > 0) {
                  await databaseService.updateMedicineStock(stock.id, {
                    quantity: stock.quantity - 1,
                    updatedAt: new Date(),
                  })
                }
              }

              // Отмечаем напоминание как выполненное
              if (firstUsageId) {
                await databaseService.markReminderIntakeAsTaken(intake.id, firstUsageId)
              }

              // Удаляем пуш-уведомление для этого напоминания
              await notificationService.cancelTodayReminderNotification(intake.reminderId, intake.time)

              // Обновляем локальное состояние
              setIntakes(prev => prev.map(i => (i.id === intake.id
                ? { ...i, isTaken: true, takenAt: new Date() }
                : i)))

              const message = `${medicineNames} принято успешно!`
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
    // Проверяем запасы всех лекарств
    const allStocks = intake.medicines.map(m => stocks.get(m.id))
    const hasNoStock = allStocks.some(s => !s)
    const hasZeroStock = allStocks.some(s => s && s.quantity <= 0)
    const hasLowStock = allStocks.some(s => s && s.quantity > 0 && s.quantity <= 5)

    if (hasNoStock) {
      return { text: 'Нет в наличии', color: colors.error }
    }
    if (hasZeroStock) {
      return { text: 'Закончилось', color: colors.error }
    }
    if (hasLowStock) {
      return { text: 'Мало', color: colors.warning }
    }
    return { text: 'В наличии', color: colors.success }
  }

  const getTimeStatus = (timeStr: string) => {
    const now = new Date()
    const [hours, minutes] = timeStr.split(':').map(Number)
    const timestamp = new Date()
    timestamp.setHours(hours, minutes, 0, 0)

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
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Загрузка приемов на сегодня...
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
            onRefresh={() => loadTodayIntakes(true)}
            tintColor={colors.primary}
          />
        }
      >
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

        {intakes.filter(i => !i.isTaken).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{intakes.length > 0 ? '✅' : '📅'}</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {intakes.length > 0 ? 'Все выполнено!' : 'Нет запланированных приемов'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {intakes.length > 0
                ? `Вы выполнили все ${intakes.length} ${intakes.length === 1 ? 'прием' : 'приема'} на сегодня`
                : 'На сегодня не запланировано ни одного приема лекарств'
              }
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
                <Text style={styles.statNumber}>{intakes.length}</Text>
                <Text style={styles.statLabel}>Всего приемов</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.success }]}>
                <Text style={styles.statNumber}>
                  {intakes.filter(i => i.isTaken).length}
                </Text>
                <Text style={styles.statLabel}>Принято</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.warning }]}>
                <Text style={styles.statNumber}>
                  {intakes.filter(i => !i.isTaken).length}
                </Text>
                <Text style={styles.statLabel}>Осталось</Text>
              </View>
            </View>

            <View style={styles.intakesList}>
              {intakes.filter(i => !i.isTaken).map((intake, index) => {
                const stockStatus = getStockStatus(intake)
                const timeStatus = getTimeStatus(intake.time)

                // Вычисляем isPast из времени
                const [hours, minutes] = intake.time.split(':').map(Number)
                const timestamp = new Date()
                timestamp.setHours(hours, minutes, 0, 0)
                const isPast = timestamp <= new Date()

                return (
                  <TouchableOpacity
                    key={`${intake.medicineId}-${intake.time}-${index}`}
                    style={[
                      styles.intakeCard,
                      {
                        backgroundColor: intake.isTaken ? colors.background : 'white',
                        borderColor: intake.isTaken ? colors.success : colors.border,
                        opacity: intake.isTaken ? 0.7 : 1,
                      }
                    ]}
                    onPress={() => !intake.isTaken && handleMarkTaken(intake)}
                    disabled={intake.isTaken}
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
                            {intake.title}
                          </Text>
                          {intake.isTaken && (
                            <View style={[styles.takenBadge, { backgroundColor: colors.success }]}>
                              <Text style={styles.takenText}>✓</Text>
                            </View>
                          )}
                        </View>

                        {/* Список лекарств */}
                        <View style={styles.medicinesList}>
                          {intake.medicines.map((medicine, idx) => (
                            <View key={medicine.id} style={styles.medicineItem}>
                              {medicine.photo_path ? (
                                <Image
                                  source={{ uri: getMedicinePhotoUri(medicine.photo_path) || undefined }}
                                  style={styles.medicinePhotoSmall}
                                />
                              ) : (
                                <View style={[styles.medicinePhotoSmallPlaceholder, { backgroundColor: colors.border }]}>
                                  <Text style={styles.medicinePhotoSmallIcon}>💊</Text>
                                </View>
                              )}
                              <Text style={[styles.medicineItemText, { color: colors.textSecondary }]}>
                                {medicine.name}
                              </Text>
                            </View>
                          ))}
                        </View>
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

                      {!intake.isTaken && (
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
  medicinePhoto: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  medicinePhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicinePhotoIcon: {
    fontSize: 28,
  },
  medicinesList: {
    marginTop: SPACING.xs,
  },
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs / 2,
  },
  medicinePhotoSmall: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  medicinePhotoSmallPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicinePhotoSmallIcon: {
    fontSize: 14,
  },
  medicineItemText: {
    fontSize: FONT_SIZE.sm,
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


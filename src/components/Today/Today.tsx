import { memo, useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useAppStore } from '@/store'
import { Text } from '../Text'
import { Flex, PaddingHorizontal } from '../Layout'
import { useTheme } from '@/providers/theme'
import { RADIUS, SPACING } from '@/constants'
import { FONT_SIZE, FONT_WEIGHT } from '@/constants/font'
import { useMedicine } from '@/hooks/useMedicine'
import { useMedicineUsage } from '@/hooks/useMedicineUsage'

interface TodayReminder {
  id: string
  reminderId: number
  time: string
  reminderTitle: string
  medicineNames: string
  notificationDate: Date
  dosage: string
  medicineIds: number[]
}

export const Today = memo(() => {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { reminders, reminderMedicines, medicines } = useAppStore(state => state)
  const { updateMedicine } = useMedicine()
  const { getTodayMedicineUsages, createMedicineUsage } = useMedicineUsage()
  const [takenReminders, setTakenReminders] = useState<Set<string>>(new Set())
  const [medicineUsages, setMedicineUsages] = useState<any[]>([])

  // Загружаем записи о приемах за сегодня
  useEffect(() => {
    const loadTodayUsages = async () => {
      const todayUsages = await getTodayMedicineUsages()
      setMedicineUsages(todayUsages)
    }
    loadTodayUsages()
  }, [getTodayMedicineUsages, reminders, reminderMedicines, medicines])

  const todayReminders: TodayReminder[] = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDayOfWeek = today.getDay() // 0 = воскресенье, 1 = понедельник, и т.д.

    const result: TodayReminder[] = []

    // Фильтруем только активные напоминания
    const activeReminders = reminders.filter(r => r.isActive)

    for (const reminder of activeReminders) {
      // Проверяем, должно ли это напоминание быть сегодня
      let shouldShowToday = false

      if (reminder.frequency === 'daily') {
        // Ежедневные напоминания всегда показываются
        shouldShowToday = true
      } else if (reminder.frequency === 'weekly') {
        // Для еженедельных проверяем день недели
        // Если напоминание было создано сегодня или в тот же день недели
        if (reminder.createdAt) {
          const createdDate = new Date(reminder.createdAt)
          const createdDayOfWeek = createdDate.getDay()
          shouldShowToday = createdDayOfWeek === todayDayOfWeek
        } else {
          // Если нет даты создания, показываем всегда
          shouldShowToday = true
        }
      } else if (reminder.frequency === 'once') {
        // Одноразовые показываются только если созданы сегодня
        if (reminder.createdAt) {
          const createdDate = new Date(reminder.createdAt)
          createdDate.setHours(0, 0, 0, 0)
          shouldShowToday = createdDate.getTime() === today.getTime()
        }
      }

      if (shouldShowToday) {
        // Парсим время из JSON строки
        let times: Array<{ hour: number; minute: number }> = []
        try {
          times = JSON.parse(reminder.time || '[]')
        } catch (error) {
          console.error('Failed to parse reminder time:', error)
        }

        if (times.length > 0) {
          // Находим лекарства для этого напоминания
          const relatedReminderMedicines = reminderMedicines.filter(rm => rm.reminderId === reminder.id)

          const medicineNames = relatedReminderMedicines
            .map(rm => {
              const medicine = medicines.find(m => m.id === rm.medicineId)
              return medicine?.name
            })
            .filter((name): name is string => name !== undefined)
            .join(', ') || reminder.title

          const medicineIds = relatedReminderMedicines
            .map(rm => rm.medicineId)
            .filter((id): id is number => id !== null && id !== undefined)

          // Создаем отдельный элемент для каждого времени приема
          for (const timeObj of times) {
            const notificationDate = new Date(today)
            notificationDate.setHours(timeObj.hour, timeObj.minute, 0, 0)

            const hours = String(timeObj.hour).padStart(2, '0')
            const minutes = String(timeObj.minute).padStart(2, '0')
            const time = `${hours}:${minutes}`

            result.push({
              id: `${reminder.id}-${timeObj.hour}-${timeObj.minute}`,
              reminderId: reminder.id!,
              time,
              reminderTitle: reminder.title,
              medicineNames,
              notificationDate,
              dosage: reminder.dosage || '1',
              medicineIds,
            })
          }
        }
      }
    }

    // Сортируем по времени
    return result.sort((a, b) => a.notificationDate.getTime() - b.notificationDate.getTime())
  }, [reminders, reminderMedicines, medicines])

  // Проверяем, какие напоминания уже приняты сегодня
  const checkTakenReminders = useMemo(() => {
    const taken = new Set<string>()

    for (const reminder of todayReminders) {
      // Проверяем, были ли приняты все лекарства из этого напоминания сегодня
      // Ищем записи о приеме, которые содержат время приема в notes
      const reminderTime = reminder.time
      const scheduledNote = t('today.scheduledIntakeAt', { time: reminderTime })
      const allMedicinesTaken = reminder.medicineIds.every(medicineId => {
        return medicineUsages.some(usage => {
          if (usage.medicineId !== medicineId) return false
          if (usage.notes && (
            usage.notes.includes(scheduledNote) ||
            usage.notes.includes(`Запланированный прием в ${reminderTime}`) ||
            usage.notes.includes(`Scheduled intake at ${reminderTime}`)
          )) {
            return true
          }
          return false
        })
      })

      if (allMedicinesTaken && reminder.medicineIds.length > 0) {
        taken.add(reminder.id)
      }
    }

    return taken
  }, [todayReminders, medicineUsages, t])

  // Объединяем проверенные и новые принятые напоминания
  useEffect(() => {
    setTakenReminders(prev => {
      const combined = new Set(prev)
      checkTakenReminders.forEach(id => combined.add(id))
      return combined
    })
  }, [checkTakenReminders])

  const styles = useStyles(colors)

  const handleTakeMedicine = (reminder: TodayReminder) => {
    if (takenReminders.has(reminder.id)) {
      return
    }

    Alert.alert(
      t('today.markIntake'),
      `${reminder.medicineNames}\n${t('today.time')}: ${reminder.time}\n${t('today.dosage')}: ${reminder.dosage}`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('reminder.took'),
          onPress: async () => {
            try {
              const dosage = Number(reminder.dosage) || 1

              // Обновляем количество для каждого лекарства и создаем записи о приеме
              await Promise.all(reminder.medicineIds.map(async medicineId => {
                const medicine = medicines.find(m => m.id === medicineId)
                if (medicine && medicine.quantity !== null && medicine.quantity !== undefined) {
                  const newQuantity = Math.max(0, medicine.quantity - dosage)
                  await updateMedicine({
                    id: medicineId,
                    quantity: newQuantity,
                  })
                }

                // Создаем запись о приеме
                await createMedicineUsage({
                  medicineId,
                  quantityUsed: dosage,
                  usageDate: new Date().toISOString(),
                  notes: t('today.scheduledIntakeAt', { time: reminder.time }),
                  familyMemberId: null,
                })
              }))

              // Отмечаем напоминание как принятое
              setTakenReminders(prev => new Set(prev).add(reminder.id))

              // Перезагружаем записи о приемах
              const todayUsages = await getTodayMedicineUsages()
              setMedicineUsages(todayUsages)

              Alert.alert(t('today.intakeMarked'), t('today.intakeMarkedSuccess', { names: reminder.medicineNames }))
            } catch (error) {
              console.error('Failed to mark reminder as taken:', error)
              Alert.alert(t('today.error'), t('today.failedToMark'))
            }
          },
        },
      ]
    )
  }

  const getTimeStatus = (notificationDate: Date) => {
    const now = new Date()
    const diff = notificationDate.getTime() - now.getTime()

    if (diff <= 0) {
      return { text: t('today.intakeTime'), color: colors.primary, isPast: true }
    }

    const hoursUntil = Math.floor(diff / (1000 * 60 * 60))
    const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hoursUntil === 0) {
      return { text: t('today.inMinutes', { count: minutesUntil }), color: colors.muted, isPast: false }
    }
    return { text: t('today.inHours', { hours: hoursUntil, minutes: minutesUntil }), color: colors.muted, isPast: false }
  }

  // Фильтруем принятые напоминания
  const visibleReminders = todayReminders.filter(reminder => !takenReminders.has(reminder.id))

  if (visibleReminders.length === 0) {
    return (
      <PaddingHorizontal>
        <Flex style={{ justifyContent: 'center', alignItems: 'center' }}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {todayReminders.length > 0 ? t('today.allDone') : t('today.noRemindersToday')}
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {todayReminders.length > 0
                ? t('today.completedAll', {
                    count: todayReminders.length,
                    intake: todayReminders.length === 1 ? t('history.intake_one') : t('history.intake_few'),
                  })
                : t('today.noPlanned')}
            </Text>
          </View>
        </Flex>
      </PaddingHorizontal>
    )
  }

  return (
    <PaddingHorizontal>
      <View style={styles.container}>
        {visibleReminders.map(reminder => {
          const timeStatus = getTimeStatus(reminder.notificationDate)

          return (
            <View
              key={reminder.id}
              style={[
                styles.reminderCard,
                {
                  backgroundColor: colors.card,
                  borderColor: timeStatus.isPast ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.reminderContent}>
                <View style={[
                  styles.timeCircle,
                  {
                    backgroundColor: timeStatus.isPast ? colors.primary : colors.background,
                    borderColor: timeStatus.isPast ? colors.primary : colors.border,
                  },
                ]}>
                  <Text style={[
                    styles.timeText,
                    { color: timeStatus.isPast ? colors.headerColor : colors.text },
                  ]}>
                    {reminder.time}
                  </Text>
                </View>

                <View style={styles.reminderInfo}>
                  <Text style={[styles.reminderTitle, { color: colors.text }]}>
                    {reminder.medicineNames}
                  </Text>
                  {reminder.dosage && (
                    <Text style={[styles.dosageText, { color: colors.muted }]}>
                      {t('today.dosage')}: {reminder.dosage}
                    </Text>
                  )}
                  <Text style={[styles.timeStatus, { color: timeStatus.color }]}>
                    {timeStatus.text}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.takeButton, { backgroundColor: colors.primary }]}
                onPress={() => handleTakeMedicine(reminder)}
              >
                <Text style={[styles.takeButtonText, { color: colors.headerColor }]}>
                  {t('reminder.took')}
                </Text>
              </TouchableOpacity>
            </View>
          )
        })}
      </View>
    </PaddingHorizontal>
  )
})

const useStyles = (_colors: any) => StyleSheet.create({
  container: {
    gap: SPACING.md
  },
  emptyContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: FONT_SIZE.heading * 2,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  reminderCard: {
    borderRadius: RADIUS.md,
    borderWidth: 2,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
    gap: SPACING.md,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
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
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  reminderInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reminderTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    flex: 1,
  },
  takenBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  takenText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  dosageText: {
    fontSize: FONT_SIZE.sm,
  },
  timeStatus: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  takeButton: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
})
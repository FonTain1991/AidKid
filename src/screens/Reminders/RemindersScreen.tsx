import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { notificationService } from '@/shared/lib/notifications'
import { databaseService } from '@/shared/lib/database'
import { Medicine } from '@/entities/medicine/model/types'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

interface ReminderGroup {
  medicineId: string
  medicineName: string
  frequency: 'once' | 'daily' | 'weekly'
  times: string[]
  totalCount: number
  nextNotification: Date | null
}

export function RemindersScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [reminders, setReminders] = useState<ReminderGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadReminders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      // Загружаем все запланированные уведомления
      const notifications = await notificationService.getTriggerNotifications()

      // Загружаем данные о лекарствах
      await databaseService.init()
      const medicines = await databaseService.getMedicines()
      const medicinesMap = new Map(medicines.map(m => [m.id, m]))

      // Группируем уведомления по лекарствам
      const groupedReminders = new Map<string, ReminderGroup>()

      for (const item of notifications) {
        const { notification } = item
        const data = notification.data as any

        // Пропускаем не-напоминания (например, уведомления о сроке годности)
        if (data?.type !== 'reminder') {
          continue
        }

        // Парсим medicineIds (новый формат) или используем medicineId (старый формат)
        let medicineIds: string[] = []
        if (data.medicineIds) {
          try {
            medicineIds = JSON.parse(data.medicineIds)
          } catch (error) {
            console.error('Failed to parse medicineIds:', error)
            continue
          }
        } else if (data.medicineId) {
          medicineIds = [data.medicineId]
        } else {
          continue
        }

        // Получаем названия всех лекарств для этого напоминания
        const medicines = medicineIds
          .map(id => medicinesMap.get(id))
          .filter(m => m !== undefined) as Medicine[]

        if (medicines.length === 0) {
          continue
        }

        // Используем первый medicineId как ключ группировки для напоминания
        const groupKey = medicineIds.join('-')
        const medicineName = medicines.map(m => m.name).join(', ')

        const trigger = item.trigger as any
        const notificationTime = trigger?.timestamp ? new Date(trigger.timestamp) : null

        if (!groupedReminders.has(groupKey)) {
          groupedReminders.set(groupKey, {
            medicineId: groupKey,
            medicineName,
            frequency: data.frequency || 'daily',
            times: [],
            totalCount: 0,
            nextNotification: notificationTime,
          })
        }

        const group = groupedReminders.get(groupKey)!
        group.totalCount++

        // Обновляем ближайшее уведомление
        if (notificationTime && (!group.nextNotification || notificationTime < group.nextNotification)) {
          group.nextNotification = notificationTime
        }

        // Собираем уникальные времена
        if (notificationTime) {
          const timeStr = notificationTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          if (!group.times.includes(timeStr)) {
            group.times.push(timeStr)
          }
        }
      }

      // Сортируем времена
      groupedReminders.forEach(group => {
        group.times.sort()
      })

      const remindersArray = Array.from(groupedReminders.values())
      // Сортируем по ближайшему уведомлению
      remindersArray.sort((a, b) => {
        if (!a.nextNotification) {
          return 1
        }
        if (!b.nextNotification) {
          return -1
        }
        return a.nextNotification.getTime() - b.nextNotification.getTime()
      })

      setReminders(remindersArray)
    } catch (error) {
      console.error('Failed to load reminders:', error)
      if (!isRefresh) {
        Alert.alert('Ошибка', 'Не удалось загрузить напоминания')
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Загружаем напоминания при каждом фокусе на экране
  useFocusEffect(useCallback(() => {
    loadReminders()
  }, [loadReminders]))

  const handleRefresh = useCallback(() => {
    loadReminders(true)
  }, [loadReminders])

  const handleDeleteReminder = async (medicineId: string, medicineName: string) => {
    Alert.alert(
      'Удалить напоминание?',
      `Вы уверены, что хотите удалить все напоминания для ${medicineName}?`,
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              // Получаем все уведомления
              const notifications = await notificationService.getTriggerNotifications()

              // Удаляем все уведомления для этого лекарства/группы
              for (const item of notifications) {
                const data = item.notification.data as any
                if (data?.type === 'reminder') {
                  // Проверяем новый формат (medicineIds)
                  if (data.medicineIds) {
                    try {
                      const medicineIds = JSON.parse(data.medicineIds)
                      const groupKey = medicineIds.join('-')
                      if (groupKey === medicineId) {
                        if (item.notification.id) {
                          await notificationService.cancelNotification(item.notification.id)
                        }
                      }
                    } catch (error) {
                      console.error('Failed to parse medicineIds:', error)
                    }
                  }
                  // Проверяем старый формат (medicineId)
                  else if (data?.medicineId === medicineId) {
                    if (item.notification.id) {
                      await notificationService.cancelNotification(item.notification.id)
                    }
                  }
                }
              }

              Alert.alert('✅ Удалено', `Напоминания для ${medicineName} удалены`)
              loadReminders() // Перезагружаем список
            } catch (error) {
              console.error('Failed to delete reminder:', error)
              Alert.alert('Ошибка', 'Не удалось удалить напоминание')
            }
          },
        },
      ]
    )
  }

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'once':
        return 'Один раз'
      case 'daily':
        return 'Ежедневно'
      case 'weekly':
        return 'Еженедельно'
      default:
        return frequency
    }
  }

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'once':
        return '📅'
      case 'daily':
        return '🔄'
      case 'weekly':
        return '📆'
      default:
        return '⏰'
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Загрузка напоминаний...
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
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Напоминания</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Активных напоминаний: {reminders.length}
          </Text>
        </View>

        {reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⏰</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Нет активных напоминаний
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Создайте напоминание о приеме лекарств
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AddReminder')}
            >
              <Text style={styles.addButtonText}>➕ Добавить напоминание</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.remindersList}>
              {reminders.map(reminder => (
                <View
                  key={reminder.medicineId}
                  style={[styles.reminderCard, { backgroundColor: 'white', borderColor: colors.border }]}
                >
                  <View style={styles.reminderHeader}>
                    <View style={styles.reminderTitleContainer}>
                      <Text style={styles.reminderIcon}>💊</Text>
                      <View style={styles.reminderTitleText}>
                        <Text style={[styles.reminderMedicine, { color: colors.text }]}>
                          {reminder.medicineName}
                        </Text>
                        <View style={styles.reminderFrequencyContainer}>
                          <Text style={styles.frequencyIcon}>{getFrequencyIcon(reminder.frequency)}</Text>
                          <Text style={[styles.reminderFrequency, { color: colors.textSecondary }]}>
                            {getFrequencyText(reminder.frequency)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteReminder(reminder.medicineId, reminder.medicineName)}
                    >
                      <Text style={[styles.deleteButtonText, { color: colors.error }]}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.reminderDetails}>
                    <View style={styles.reminderTimesContainer}>
                      <Text style={[styles.reminderTimesLabel, { color: colors.textSecondary }]}>
                        Время приемов:
                      </Text>
                      <View style={styles.timesList}>
                        {reminder.times.map((time, index) => (
                          <View
                            key={index}
                            style={[styles.timeChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                          >
                            <Text style={[styles.timeChipText, { color: colors.primary }]}>
                              {time}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {reminder.nextNotification && (
                      <View style={styles.nextNotificationContainer}>
                        <Text style={[styles.nextNotificationLabel, { color: colors.textSecondary }]}>
                          Следующее:
                        </Text>
                        <Text style={[styles.nextNotificationTime, { color: colors.text }]}>
                          {reminder.nextNotification.toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    )}

                    <Text style={[styles.reminderCount, { color: colors.textSecondary }]}>
                      Всего запланировано: {reminder.totalCount}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.addButtonContainer}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('AddReminder')}
              >
                <Text style={styles.addButtonText}>➕ Добавить напоминание</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>О напоминаниях</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Напоминания приходят в указанное время{'\n'}
            • Для надежной работы отключите оптимизацию батареи{'\n'}
            • Можно удалить напоминание, нажав на ✕{'\n'}
            • Ежедневные напоминания планируются на 30 дней{'\n'}
            • Еженедельные напоминания планируются на 12 недель
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
    marginBottom: SPACING.xl,
  },
  remindersList: {
    paddingHorizontal: SPACING.md,
  },
  reminderCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  reminderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderIcon: {
    fontSize: FONT_SIZE.xl,
    marginRight: SPACING.sm,
  },
  reminderTitleText: {
    flex: 1,
  },
  reminderMedicine: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  reminderFrequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyIcon: {
    fontSize: FONT_SIZE.md,
    marginRight: SPACING.xs,
  },
  reminderFrequency: {
    fontSize: FONT_SIZE.sm,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee',
  },
  deleteButtonText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  reminderDetails: {
    gap: SPACING.md,
  },
  reminderTimesContainer: {
    gap: SPACING.sm,
  },
  reminderTimesLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timeChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  nextNotificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  nextNotificationLabel: {
    fontSize: FONT_SIZE.sm,
  },
  nextNotificationTime: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  reminderCount: {
    fontSize: FONT_SIZE.sm,
    fontStyle: 'italic',
  },
  addButtonContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md
  },
  addButton: {
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%'
  },
  addButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.md,
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


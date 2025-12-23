import { getFrequencyIcon, getFrequencyText } from '@/constants'
import { useMyNavigation, useReminder, useReminderMedicine } from '@/hooks'
import { notificationService } from '@/lib'
import { Reminder } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useEffect, useMemo, useState } from 'react'
import { Alert, TouchableOpacity, View } from 'react-native'
import { PaddingHorizontal } from '../Layout'
import { Text } from '../Text'
import { useStyles } from './useStyles'
import { Button } from '../Button'

interface ReminderList extends Reminder {
  medicineNames: string
  totalCount: number
  nextNotification: Date | null
}
export const Reminders = memo(() => {
  const { navigate } = useMyNavigation()
  const { reminders, reminderMedicines, medicines } = useAppStore(state => state)
  const { deleteReminder } = useReminder()
  const { deleteReminderMedicine } = useReminderMedicine()

  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    notificationService.getTriggerNotifications().then(setNotifications)
  }, [])


  const dataSource: ReminderList[] = useMemo(() => {
    // Создаем карту уведомлений по reminderId
    const notificationsMap = new Map<number, any[]>()
    for (const item of notifications) {
      const notificationData = item.notification.data as any
      if (notificationData?.type === 'reminder' && notificationData?.reminderId) {
        const reminderId = Number(notificationData.reminderId)
        if (!isNaN(reminderId)) {
          if (!notificationsMap.has(reminderId)) {
            notificationsMap.set(reminderId, [])
          }
          notificationsMap.get(reminderId)!.push(item)
        }
      }
    }

    return reminders.map(reminder => {
      // Находим все лекарства для этого напоминания
      const relatedReminderMedicines = reminderMedicines.filter(rm => rm.reminderId === reminder.id)

      const medicineNames = relatedReminderMedicines
        .map(rm => {
          const medicine = medicines.find(m => m.id === rm.medicineId)
          return medicine?.name
        })
        .filter((name): name is string => name !== undefined)
        .join(', ')

      // Получаем информацию о уведомлениях для этого напоминания
      const reminderNotifications = reminder.id
        ? notificationsMap.get(reminder.id) || []
        : []

      let nextNotification: Date | null = null
      let totalCount = 0

      for (const item of reminderNotifications) {
        const trigger = item.trigger as any
        const notificationTime = trigger?.timestamp ? new Date(trigger.timestamp) : null

        if (notificationTime) {
          totalCount++
          if (!nextNotification || notificationTime < nextNotification) {
            nextNotification = notificationTime
          }
        }
      }

      return {
        ...reminder,
        medicineNames: medicineNames || '',
        totalCount,
        nextNotification
      }
    })
  }, [reminderMedicines, reminders, medicines, notifications])

  const handleDeleteReminder = (reminderId: number) => {
    // Находим напоминание в списке
    const reminder = dataSource.find(r => r.id === reminderId)
    if (!reminder) {
      Alert.alert('Ошибка', 'Напоминание не найдено')
      return
    }

    Alert.alert(
      'Удалить напоминание?',
      `Вы уверены, что хотите удалить напоминание "${reminder.medicineNames || reminder.title}"?`,
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
              // Удаляем все уведомления для этого напоминания
              const allNotifications = await notificationService.getTriggerNotifications()
              const notificationsToCancel = allNotifications
                .filter(item => {
                  const notificationData = item.notification.data as any
                  // Сравниваем как числа, так как reminderId передается как число
                  const notificationReminderId = Number(notificationData?.reminderId)
                  return notificationData?.type === 'reminder' && !isNaN(notificationReminderId) && notificationReminderId === reminderId && item.notification.id
                })
                .map(item => item.notification.id!)

              await Promise.all(notificationsToCancel.map(id => notificationService.cancelNotification(id)))

              // Удаляем все связанные reminderMedicines
              const relatedReminderMedicines = reminderMedicines.filter(rm => rm.reminderId === reminderId && rm.id)
              await Promise.all(relatedReminderMedicines.map(rm => deleteReminderMedicine(rm.id!)))

              // Удаляем само напоминание
              await deleteReminder(reminderId)
            } catch (error) {
              console.error('Failed to delete reminder:', error)
              Alert.alert('Ошибка', 'Не удалось удалить напоминание')
            }
          },
        },
      ]
    )
  }

  const styles = useStyles()

  if (!dataSource.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>⏰</Text>
        <Text style={styles.emptyTitle}>
          Нет активных напоминаний
        </Text>
        <Text style={styles.emptyText}>
          Создайте напоминание о приеме лекарств
        </Text>
        <Button
          title='Добавить напоминание'
          onPress={() => navigate('addReminder')}
        />
      </View>
    )
  }

  return (
    <>
      <PaddingHorizontal>
        {dataSource.map((reminder, index) => {
          const times = JSON.parse(reminder?.time ?? '[]')
          return (
            <View
              key={`reminder-${reminder.id}-${index}`}
              style={styles.reminderCard}
            >
              <View style={styles.reminderHeader}>
                <View style={styles.reminderTitleContainer}>
                  <View style={styles.reminderTitleText}>
                    <Text style={styles.reminderMedicine}>
                      {reminder.medicineNames}
                    </Text>
                    <View style={styles.reminderFrequencyContainer}>
                      <Text style={styles.frequencyIcon}>{getFrequencyIcon(reminder.frequency)}</Text>
                      <Text style={styles.reminderFrequency}>
                        {getFrequencyText(reminder.frequency)}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => reminder.id && handleDeleteReminder(reminder.id)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reminderDetails}>
                {reminder.description && (
                  <Text style={styles.reminderDescription}>
                    {reminder.description}
                  </Text>
                )}
                <View style={styles.reminderTimesContainer}>
                  <Text style={styles.reminderTimesLabel}>
                    Время приемов:
                  </Text>
                  <View style={styles.timesList}>
                    {times?.map((val: any, idx: number) => (
                      <View
                        key={`time-${reminder.id}-${idx}`}
                        style={styles.timeChip}
                      >
                        <Text style={styles.timeChipText}>
                          {String(val.hour).padStart(2, '0')}:{String(val.minute).padStart(2, '0')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {reminder.nextNotification && (
                  <View style={styles.nextNotificationContainer}>
                    <Text style={styles.nextNotificationLabel}>
                      Следующее:
                    </Text>
                    <Text style={styles.nextNotificationTime}>
                      {reminder.nextNotification.toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                )}

                <Text style={styles.reminderCount}>
                  Всего запланировано: {reminder.totalCount}
                </Text>
              </View>
            </View>
          )
        })}
      </PaddingHorizontal>
    </>
  )
})
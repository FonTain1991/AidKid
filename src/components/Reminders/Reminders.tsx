import { getFrequencyIcon } from '@/constants'
import { useMyNavigation, useReminder, useReminderMedicine } from '@/hooks'
import { cancelReminderNotifications, notificationService } from '@/lib'
import { Reminder } from '@/services/models'
import { useAppStore } from '@/store'
import { memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, TouchableOpacity, View } from 'react-native'
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
  const { t } = useTranslation()
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

  const handleEditReminder = (reminderId: number) => {
    navigate('addReminder', { reminderId })
  }

  const handleDeleteReminder = (reminderId: number) => {
    // Находим напоминание в списке
    const reminder = dataSource.find(r => r.id === reminderId)
    if (!reminder) {
      Alert.alert(t('support.error'), t('reminders.notFound'))
      return
    }

    Alert.alert(
      t('reminders.deleteTitle'),
      t('reminders.deleteConfirm', { name: reminder.medicineNames || reminder.title }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReminderNotifications(reminderId)

              // Удаляем все связанные reminderMedicines
              const relatedReminderMedicines = reminderMedicines.filter(rm => rm.reminderId === reminderId && rm.id)
              await Promise.all(relatedReminderMedicines.map(rm => deleteReminderMedicine(rm.id!)))

              // Удаляем само напоминание
              await deleteReminder(reminderId)
            } catch (error) {
              console.error('Failed to delete reminder:', error)
              Alert.alert(t('support.error'), t('reminders.failedToDelete'))
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
          {t('reminders.noActive')}
        </Text>
        <Text style={styles.emptyText}>
          {t('reminders.createReminder')}
        </Text>
        <Button
          title={t('reminders.addReminder')}
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
            <Pressable
              key={`reminder-${reminder.id}-${index}`}
              style={styles.reminderCard}
              onPress={() => reminder.id && handleEditReminder(reminder.id)}
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
                        {t(`reminder.${reminder.frequency}`)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => reminder.id && handleEditReminder(reminder.id)}
                  >
                    <Text style={styles.editButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => reminder.id && handleDeleteReminder(reminder.id)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.reminderDetails}>
                {reminder.description && (
                  <Text style={styles.reminderDescription}>
                    {reminder.description}
                  </Text>
                )}
                <View style={styles.reminderTimesContainer}>
                  <Text style={styles.reminderTimesLabel}>
                    {t('reminders.intakeTimes')}
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
                      {t('reminders.next')}
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
                  {t('reminders.totalScheduled')} {reminder.totalCount}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </PaddingHorizontal>
    </>
  )
})
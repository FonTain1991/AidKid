import { notificationService } from './notifications'

export async function cancelReminderNotifications(reminderId: number): Promise<void> {
  const allNotifications = await notificationService.getTriggerNotifications()
  const notificationsToCancel = allNotifications
    .filter(item => {
      const notificationData = item.notification.data as Record<string, unknown> | undefined
      const notificationReminderId = Number(notificationData?.reminderId)
      return notificationData?.type === 'reminder'
        && !isNaN(notificationReminderId)
        && notificationReminderId === reminderId
        && item.notification.id
    })
    .map(item => item.notification.id!)

  await Promise.all(notificationsToCancel.map(id => notificationService.cancelNotification(id)))
}

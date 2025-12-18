import RNFS from 'react-native-fs'
import { zip, unzip } from 'react-native-zip-archive'
import { notificationService } from './notifications'
import { scheduleMedicineExpiryNotifications } from './medicineNotifications'
import { databaseService } from '@/services'

export interface BackupData {
  version: string
  exportDate: string
  data: {
    medicineKits: any[]
    medicines: any[]
    medicineUsage: any[]
    familyMembers: any[]
    reminders: any[]
    reminderMedicines: any[]
    shoppingList: any[]
  }
  photoFiles: string[] // Список путей к фотографиям
}

class BackupService {
  private backupDir = `${RNFS.DocumentDirectoryPath}/backups`

  private tempDir = `${RNFS.CachesDirectoryPath}/backup_temp`

  // Инициализация директорий
  async init(): Promise<void> {
    try {
      const backupExists = await RNFS.exists(this.backupDir)
      if (!backupExists) {
        await RNFS.mkdir(this.backupDir)
      }

      const tempExists = await RNFS.exists(this.tempDir)
      if (!tempExists) {
        await RNFS.mkdir(this.tempDir)
      }
    } catch (error) {
      console.error('Failed to initialize backup directories:', error)
      throw error
    }
  }

  // Экспорт всех данных из базы
  private async exportDatabaseData(): Promise<BackupData['data']> {
    const db = databaseService.getDb()

    // Экспортируем все таблицы
    const [kitsResult] = await db.executeSql('SELECT * FROM medicine_kits')
    const [medicinesResult] = await db.executeSql('SELECT * FROM medicines')
    const [usageResult] = await db.executeSql('SELECT * FROM medicine_usage')
    const [familyResult] = await db.executeSql('SELECT * FROM family_members')
    const [remindersResult] = await db.executeSql('SELECT * FROM reminders')
    const [reminderMedicinesResult] = await db.executeSql('SELECT * FROM reminder_medicines')
    const [shoppingResult] = await db.executeSql('SELECT * FROM shopping_list')

    // Конвертируем результаты в массивы
    const toArray = (result: any) => {
      const items = []
      for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows.item(i))
      }
      return items
    }

    return {
      medicineKits: toArray(kitsResult),
      medicines: toArray(medicinesResult),
      medicineUsage: toArray(usageResult),
      familyMembers: toArray(familyResult),
      reminders: toArray(remindersResult),
      reminderMedicines: toArray(reminderMedicinesResult),
      shoppingList: toArray(shoppingResult),
    }
  }

  // Получить список всех фотографий лекарств
  private async getPhotoFiles(medicines: any[]): Promise<string[]> {
    const photoFiles: string[] = []

    for (const medicine of medicines) {
      // Поддерживаем оба варианта для обратной совместимости
      const photoPath = medicine.photoPath || medicine.photo_path
      if (photoPath) {
        const exists = await RNFS.exists(photoPath)
        if (exists) {
          photoFiles.push(photoPath)
        }
      }
    }

    return photoFiles
  }

  // Создать полный бэкап (данные + фотографии)
  async createBackup(): Promise<string> {
    try {
      await this.init()


      // Экспортируем данные
      const data = await this.exportDatabaseData()

      const photoFiles = await this.getPhotoFiles(data.medicines)

      const backup: BackupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data,
        photoFiles,
      }

      // Создаём временную директорию для бэкапа
      const timestamp = Date.now()
      const backupTempDir = `${this.tempDir}/${timestamp}`
      await RNFS.mkdir(backupTempDir)

      // Сохраняем JSON с данными
      const dataPath = `${backupTempDir}/data.json`
      await RNFS.writeFile(dataPath, JSON.stringify(backup, null, 2), 'utf8')

      // Копируем фотографии
      if (photoFiles.length > 0) {
        const photosDir = `${backupTempDir}/photos`
        await RNFS.mkdir(photosDir)

        for (const photoPath of photoFiles) {
          const fileName = photoPath.split('/').pop()
          const destPath = `${photosDir}/${fileName}`
          await RNFS.copyFile(photoPath, destPath)
        }
      }

      // Создаём ZIP-архив
      const zipPath = `${this.backupDir}/aidkit_backup_${timestamp}.zip`
      await zip(backupTempDir, zipPath)

      // Удаляем временную директорию
      await RNFS.unlink(backupTempDir)

      return zipPath
    } catch (error) {
      throw error
    }
  }

  // Восстановить данные из бэкапа
  async restoreBackup(zipPath: string): Promise<void> {
    try {
      await this.init()


      // Распаковываем архив
      const timestamp = Date.now()
      const restoreTempDir = `${this.tempDir}/restore_${timestamp}`
      await unzip(zipPath, restoreTempDir)

      // Читаем данные
      const dataPath = `${restoreTempDir}/data.json`
      const dataContent = await RNFS.readFile(dataPath, 'utf8')
      const backup: BackupData = JSON.parse(dataContent)


      // ВАЖНО: Удаляем ВСЕ старые уведомления ДО восстановления данных
      await notificationService.cancelAllNotifications()

      // Восстанавливаем данные в базу
      await this.importDatabaseData(backup.data)

      // Восстанавливаем фотографии
      const photosDir = `${restoreTempDir}/photos`
      const photosExist = await RNFS.exists(photosDir)
      if (photosExist) {
        await this.restorePhotos(photosDir, backup.data.medicines)
      }

      // Удаляем временную директорию
      await RNFS.unlink(restoreTempDir)

      // Пересоздаём все напоминания
      await this.recreateAllReminders()

    } catch (error) {
      throw error
    }
  }

  // Пересоздать все напоминания после восстановления
  private async recreateAllReminders(): Promise<void> {
    try {
      const db = databaseService.getDb()

      // Получаем все активные напоминания
      const [remindersResult] = await db.executeSql(`
        SELECT * FROM reminders WHERE isActive = 1
      `)

      // Удаляем дубликаты напоминаний (оставляем только первое по ID)
      const seenReminders = new Map()
      const uniqueReminders = []

      for (let i = 0; i < remindersResult.rows.length; i++) {
        const reminder = remindersResult.rows.item(i)
        // Поддерживаем оба варианта для обратной совместимости
        const familyMemberId = reminder.familyMemberId || reminder.family_member_id
        const key = `${reminder.title}-${familyMemberId || 'default'}`

        if (!seenReminders.has(key)) {
          seenReminders.set(key, true)
          uniqueReminders.push(reminder)
        } else {
          // Удаляем дубликат из базы
          await db.executeSql(`
            DELETE FROM reminders WHERE id = ?
          `, [reminder.id])
        }
      }

      if (uniqueReminders.length === 0) {
        return
      }

      for (let i = 0; i < uniqueReminders.length; i++) {
        const reminder = uniqueReminders[i]

        // Получаем лекарства для этого напоминания
        const [medicinesResult] = await db.executeSql(`
          SELECT m.* FROM medicines m
          JOIN reminder_medicines rm ON m.id = rm.medicineId
          WHERE rm.reminderId = ?
        `, [reminder.id])

        if (medicinesResult.rows.length > 0) {
          const medicines = []
          for (let j = 0; j < medicinesResult.rows.length; j++) {
            medicines.push(medicinesResult.rows.item(j))
          }

          const medicineNames = medicines.map((m: any) => m.name).join(', ')
          const medicineIds = medicines.map((m: any) => m.id)
          const now = new Date()

          // Парсим время напоминания
          const { hours, minutes } = this.parseReminderTime(reminder.time)

          // Поддерживаем оба варианта для обратной совместимости
          const timesPerDay = reminder.timesPerDay || reminder.times_per_day || 1
          const familyMemberId = reminder.familyMemberId || reminder.family_member_id

          const scheduleParams = {
            reminder,
            medicines,
            medicineNames,
            medicineIds,
            familyMemberId,
            timesPerDay,
            hours,
            minutes,
            now,
          }

          if (reminder.frequency === 'once') {
            await this.scheduleOnceReminder(scheduleParams)
          } else if (reminder.frequency === 'daily') {
            await this.scheduleDailyReminders(scheduleParams)
          } else if (reminder.frequency === 'weekly') {
            await this.scheduleWeeklyReminders(scheduleParams)
          }
        }
      }

      // Также пересоздаём уведомления о сроках годности
      await this.recreateExpiryNotifications()
    } catch (error) {
      console.error('Failed to recreate reminders:', error)
      // Не бросаем ошибку, чтобы не прерывать восстановление
    }
  }

  // Парсинг времени напоминания
  private parseReminderTime(timeStr: string): { hours: number; minutes: number } {
    try {
      if (typeof timeStr === 'string' && timeStr.startsWith('[')) {
        const timesArray = JSON.parse(timeStr)
        if (timesArray.length > 0) {
          return { hours: timesArray[0].hour, minutes: timesArray[0].minute }
        }
      } else if (typeof timeStr === 'string' && timeStr.includes(':')) {
        const parts = timeStr.split(':')
        return { hours: parseInt(parts[0], 10), minutes: parseInt(parts[1], 10) }
      }
    } catch (error) {
      // Игнорируем ошибки парсинга
    }
    return { hours: 12, minutes: 0 }
  }

  // Планирование одноразового напоминания
  private async scheduleOnceReminder(params: {
    reminder: any
    medicines: any[]
    medicineNames: string
    medicineIds: number[]
    familyMemberId: number | null
    hours: number
    minutes: number
  }): Promise<void> {
    const { reminder, medicines, medicineNames, medicineIds, familyMemberId, hours, minutes } = params
    const notificationTime = new Date()
    notificationTime.setDate(notificationTime.getDate() + 1)
    notificationTime.setHours(hours, minutes, 0, 0)

    const notificationId = `reminder-once-${reminder.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const medicineKitId = medicines[0].medicineKitId || medicines[0].kit_id || medicines[0].medicine_kit_id
    await notificationService.scheduleNotification(notificationId, {
      title: reminder.title,
      body: `Время принять: ${medicineNames}`,
      notificationDate: notificationTime,
      data: {
        type: 'reminder',
        reminderId: reminder.id,
        medicineIds: JSON.stringify(medicineIds),
        familyMemberId: familyMemberId || '',
        frequency: 'once',
      },
      medicineKitId: Number(medicineKitId),
      critical: false,
    })
  }

  // Планирование ежедневных напоминаний
  private async scheduleDailyReminders(params: {
    reminder: any
    medicines: any[]
    medicineNames: string
    medicineIds: number[]
    familyMemberId: number | null
    timesPerDay: number
    hours: number
    minutes: number
    now: Date
  }): Promise<void> {
    const { reminder, medicines, medicineNames, medicineIds, familyMemberId, timesPerDay, hours, minutes, now } = params
    const medicineKitId = medicines[0].medicineKitId || medicines[0].kit_id || medicines[0].medicine_kit_id
    const notifications = []

    for (let day = 0; day < 30; day++) {
      for (let intake = 0; intake < timesPerDay; intake++) {
        const notificationTime = new Date()
        notificationTime.setHours(hours, minutes, 0, 0)
        notificationTime.setDate(now.getDate() + day)

        if (notificationTime > now) {
          const notificationId = `reminder-daily-${reminder.id}-day${day}-intake${intake}`
          notifications.push(notificationService.scheduleNotification(notificationId, {
            title: reminder.title,
            body: `Время принять: ${medicineNames} (прием ${intake + 1} из ${timesPerDay})`,
            notificationDate: notificationTime,
            data: {
              type: 'reminder',
              reminderId: reminder.id,
              medicineIds: JSON.stringify(medicineIds),
              familyMemberId: familyMemberId || '',
              frequency: 'daily',
              day: String(day),
              intake: String(intake + 1),
              totalIntakes: String(timesPerDay),
            },
            medicineKitId: Number(medicineKitId),
            critical: false,
          }))
        }
      }
    }

    await Promise.all(notifications)
  }

  // Планирование еженедельных напоминаний
  private async scheduleWeeklyReminders(params: {
    reminder: any
    medicines: any[]
    medicineNames: string
    medicineIds: number[]
    familyMemberId: number | null
    timesPerDay: number
    hours: number
    minutes: number
    now: Date
  }): Promise<void> {
    const { reminder, medicines, medicineNames, medicineIds, familyMemberId, timesPerDay, hours, minutes, now } = params
    const medicineKitId = medicines[0].medicineKitId || medicines[0].kit_id || medicines[0].medicine_kit_id
    const notifications = []

    for (let week = 0; week < 12; week++) {
      for (let intake = 0; intake < timesPerDay; intake++) {
        const notificationTime = new Date()
        notificationTime.setHours(hours, minutes, 0, 0)
        notificationTime.setDate(now.getDate() + (week * 7) + Math.floor((intake * 7) / timesPerDay))

        if (notificationTime > now) {
          const notificationId = `reminder-weekly-${reminder.id}-week${week}-intake${intake}`
          notifications.push(notificationService.scheduleNotification(notificationId, {
            title: reminder.title,
            body: `Время принять: ${medicineNames} (прием ${intake + 1} из ${timesPerDay} в неделю)`,
            notificationDate: notificationTime,
            data: {
              type: 'reminder',
              reminderId: reminder.id,
              medicineIds: JSON.stringify(medicineIds),
              familyMemberId: familyMemberId || '',
              frequency: 'weekly',
              week: String(week),
              intake: String(intake + 1),
              totalIntakes: String(timesPerDay),
            },
            medicineKitId: Number(medicineKitId),
            critical: false,
          }))
        }
      }
    }

    await Promise.all(notifications)
  }

  // Пересоздать уведомления о сроках годности
  private async recreateExpiryNotifications(): Promise<void> {
    try {
      const db = databaseService.getDb()

      // Получаем все лекарства с сроками годности
      // В новой схеме expirationDate хранится в таблице medicines
      const [medicinesResult] = await db.executeSql(`
        SELECT * FROM medicines
        WHERE expirationDate IS NOT NULL AND expirationDate != ''
      `)

      const notifications = []
      for (let i = 0; i < medicinesResult.rows.length; i++) {
        const row = medicinesResult.rows.item(i)

        // Поддерживаем оба варианта для обратной совместимости
        const expirationDate = row.expirationDate || row.expiry_date
        if (expirationDate) {
          const medicine = {
            id: row.id,
            name: row.name,
            medicineKitId: row.medicineKitId || row.kit_id || row.medicine_kit_id,
            form: row.form,
            description: row.description,
            manufacturer: row.manufacturer,
            dosage: row.dosage,
            photoPath: row.photoPath || row.photo_path,
            barcode: row.barcode,
            unit: row.unit,
            quantity: row.quantity,
            unitForQuantity: row.unitForQuantity || row.unit_for_quantity,
            expirationDate: expirationDate,
            createdAt: row.createdAt || row.created_at,
            updatedAt: row.updatedAt || row.updated_at,
          }

          // Планируем уведомления о сроке годности
          notifications.push(scheduleMedicineExpiryNotifications(medicine))
        }
      }
      await Promise.all(notifications)
    } catch (error) {
      console.error('Failed to recreate expiry notifications:', error)
    }
  }

  // Импорт данных в базу
  private async importDatabaseData(data: BackupData['data']): Promise<void> {
    const db = databaseService.getDb()

    // Очищаем все таблицы (в обратном порядке из-за foreign keys)
    await db.executeSql('DELETE FROM reminder_medicines')
    await db.executeSql('DELETE FROM reminders')
    await db.executeSql('DELETE FROM medicine_usage')
    await db.executeSql('DELETE FROM medicines')
    await db.executeSql('DELETE FROM medicine_kits')
    await db.executeSql('DELETE FROM family_members')
    await db.executeSql('DELETE FROM shopping_list')

    // Вставляем данные обратно
    // Аптечки
    for (const kit of data.medicineKits) {
      // Поддерживаем оба варианта для обратной совместимости
      const parentId = kit.parentId || kit.parent_id || null
      const createdAt = kit.createdAt || kit.created_at
      const updatedAt = kit.updatedAt || kit.updated_at

      await db.executeSql(
        `INSERT INTO medicine_kits (id, name, description, color, parentId, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [kit.id, kit.name, kit.description || null, kit.color, parentId, createdAt, updatedAt]
      )
    }

    // Члены семьи
    for (const member of data.familyMembers) {
      const createdAt = member.createdAt || member.created_at
      const updatedAt = member.updatedAt || member.updated_at

      await db.executeSql(
        `INSERT INTO family_members (id, name, avatar, color, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [member.id, member.name, member.avatar || null, member.color || null, createdAt, updatedAt]
      )
    }

    // Лекарства
    for (const medicine of data.medicines) {
      // Поддерживаем оба варианта для обратной совместимости
      const medicineKitId = medicine.medicineKitId || medicine.kit_id || medicine.medicine_kit_id
      const photoPath = medicine.photoPath || medicine.photo_path || null
      const expirationDate = medicine.expirationDate || medicine.expiry_date || medicine.expiration_date
      const createdAt = medicine.createdAt || medicine.created_at
      const updatedAt = medicine.updatedAt || medicine.updated_at

      await db.executeSql(
        `INSERT INTO medicines (id, name, description, manufacturer, dosage, medicineKitId, photoPath, barcode, unit, quantity, unitForQuantity, expirationDate, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          medicine.id,
          medicine.name,
          medicine.description || null,
          medicine.manufacturer || null,
          medicine.dosage || null,
          medicineKitId,
          photoPath,
          medicine.barcode || null,
          medicine.unit || null,
          medicine.quantity || 0,
          medicine.unitForQuantity || medicine.unit_for_quantity || null,
          expirationDate,
          createdAt,
          updatedAt,
        ]
      )
    }

    // История приема
    for (const usage of data.medicineUsage) {
      const medicineId = usage.medicineId || usage.medicine_id
      const familyMemberId = usage.familyMemberId || usage.family_member_id || null
      const quantityUsed = usage.quantityUsed || usage.quantity_used
      const usageDate = usage.usageDate || usage.usage_date
      const createdAt = usage.createdAt || usage.created_at

      await db.executeSql(
        `INSERT INTO medicine_usage (id, medicineId, familyMemberId, quantityUsed, usageDate, notes, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [usage.id, medicineId, familyMemberId, quantityUsed, usageDate, usage.notes || null, createdAt]
      )
    }

    // Напоминания
    for (const reminder of data.reminders) {
      const familyMemberId = reminder.familyMemberId || reminder.family_member_id || null
      const timesPerDay = reminder.timesPerDay || reminder.times_per_day || 1
      const isActive = reminder.isActive !== undefined ? reminder.isActive : (reminder.is_active !== undefined ? reminder.is_active : 1)
      const createdAt = reminder.createdAt || reminder.created_at

      await db.executeSql(
        `INSERT INTO reminders (id, familyMemberId, title, frequency, timesPerDay, time, isActive, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reminder.id,
          familyMemberId,
          reminder.title,
          reminder.frequency,
          timesPerDay,
          reminder.time,
          isActive ? 1 : 0,
          createdAt,
        ]
      )
    }

    // Связи напоминаний и лекарств
    for (const rm of data.reminderMedicines) {
      const reminderId = rm.reminderId || rm.reminder_id
      const medicineId = rm.medicineId || rm.medicine_id

      await db.executeSql(
        `INSERT INTO reminder_medicines (id, reminderId, medicineId) 
         VALUES (?, ?, ?)`,
        [rm.id, reminderId, medicineId]
      )
    }

    // Список покупок
    for (const item of data.shoppingList) {
      const medicineName = item.medicineName || item.medicine_name
      const isPurchased = item.isPurchased !== undefined ? item.isPurchased : (item.is_purchased !== undefined ? item.is_purchased : 0)
      const reminderDate = item.reminderDate || item.reminder_date || null
      const createdAt = item.createdAt || item.created_at
      const updatedAt = item.updatedAt || item.updated_at

      await db.executeSql(
        `INSERT INTO shopping_list (id, medicineName, description, isPurchased, reminderDate, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          medicineName,
          item.description || null,
          isPurchased ? 1 : 0,
          reminderDate,
          createdAt,
          updatedAt,
        ]
      )
    }
  }

  // Восстановление фотографий
  private async restorePhotos(photosDir: string, _medicines: any[]): Promise<void> {
    const photosDestDir = `${RNFS.DocumentDirectoryPath}/medicine_photos`

    // Создаём директорию для фотографий если её нет
    const exists = await RNFS.exists(photosDestDir)
    if (!exists) {
      await RNFS.mkdir(photosDestDir)
    }

    // Копируем все фотографии
    const files = await RNFS.readDir(photosDir)
    for (const file of files) {
      if (file.isFile()) {
        const destPath = `${photosDestDir}/${file.name}`
        await RNFS.copyFile(file.path, destPath)
      }
    }

  }

  // Получить список всех бэкапов
  async getBackupList(): Promise<Array<{ path: string; name: string; date: Date; size: number }>> {
    try {
      await this.init()

      const exists = await RNFS.exists(this.backupDir)
      if (!exists) {
        return []
      }

      const files = await RNFS.readDir(this.backupDir)
      const backups = files
        .filter(file => file.isFile() && file.name.endsWith('.zip'))
        .map(file => {
          const timestamp = parseInt(file.name.match(/\d+/)?.[0] || '0', 10)
          return {
            path: file.path,
            name: file.name,
            date: new Date(timestamp),
            size: file.size,
          }
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime())

      return backups
    } catch (error) {
      console.error('Failed to get backup list:', error)
      return []
    }
  }

  // Удалить бэкап
  async deleteBackup(path: string): Promise<void> {
    try {
      await RNFS.unlink(path)
    } catch (error) {
      throw error
    }
  }

  // Получить путь к директории бэкапов
  getBackupDirectory(): string {
    return this.backupDir
  }
}

export const backupService = new BackupService()


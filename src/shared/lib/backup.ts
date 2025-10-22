import RNFS from 'react-native-fs'
import { zip, unzip } from 'react-native-zip-archive'
import { databaseService } from './database'
import { notificationService } from './notifications'
import { scheduleMedicineExpiryNotifications } from './medicineNotifications'

export interface BackupData {
  version: string
  exportDate: string
  data: {
    medicineKits: any[]
    medicines: any[]
    medicineStock: any[]
    medicineUsage: any[]
    familyMembers: any[]
    reminders: any[]
    reminderMedicines: any[]
    reminderIntakes: any[]
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
    const db = databaseService as any

    // Экспортируем все таблицы
    const [kitsResult] = await db.db.executeSql('SELECT * FROM medicine_kits')
    const [medicinesResult] = await db.db.executeSql('SELECT * FROM medicines')
    const [stockResult] = await db.db.executeSql('SELECT * FROM medicine_stock')
    const [usageResult] = await db.db.executeSql('SELECT * FROM medicine_usage')
    const [familyResult] = await db.db.executeSql('SELECT * FROM family_members')
    const [remindersResult] = await db.db.executeSql('SELECT * FROM reminders')
    const [reminderMedicinesResult] = await db.db.executeSql('SELECT * FROM reminder_medicines')
    const [reminderIntakesResult] = await db.db.executeSql('SELECT * FROM reminder_intakes')
    const [shoppingResult] = await db.db.executeSql('SELECT * FROM shopping_list')

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
      medicineStock: toArray(stockResult),
      medicineUsage: toArray(usageResult),
      familyMembers: toArray(familyResult),
      reminders: toArray(remindersResult),
      reminderMedicines: toArray(reminderMedicinesResult),
      reminderIntakes: toArray(reminderIntakesResult),
      shoppingList: toArray(shoppingResult),
    }
  }

  // Получить список всех фотографий лекарств
  private async getPhotoFiles(medicines: any[]): Promise<string[]> {
    const photoFiles: string[] = []

    for (const medicine of medicines) {
      if (medicine.photo_path) {
        const exists = await RNFS.exists(medicine.photo_path)
        if (exists) {
          photoFiles.push(medicine.photo_path)
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

      const db = databaseService as any

      // Получаем все активные напоминания
      const [remindersResult] = await db.db.executeSql(`
          SELECT * FROM reminders WHERE is_active = 1
        `)

      // Удаляем дубликаты напоминаний (оставляем только первое по ID)
      const seenReminders = new Map()
      const uniqueReminders = []

      for (let i = 0; i < remindersResult.rows.length; i++) {
        const reminder = remindersResult.rows.item(i)
        const key = `${reminder.title}-${reminder.family_member_id || 'default'}`

        if (!seenReminders.has(key)) {
          seenReminders.set(key, true)
          uniqueReminders.push(reminder)
        } else {
          // Удаляем дубликат из базы
          await db.db.executeSql(`
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
        const [medicinesResult] = await db.db.executeSql(`
          SELECT m.* FROM medicines m
          JOIN reminder_medicines rm ON m.id = rm.medicine_id
          WHERE rm.reminder_id = ?
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
          const timeStr = reminder.time

          // Проверяем формат времени
          let hours = 0
          let minutes = 0

          try {
            // Время может быть в двух форматах:
            // 1. JSON массив: [{"hour":9,"minute":48}]
            // 2. Простая строка: "09:48"

            if (typeof timeStr === 'string' && timeStr.startsWith('[')) {
              // JSON формат
              const timesArray = JSON.parse(timeStr)
              if (timesArray.length > 0) {
                hours = timesArray[0].hour
                minutes = timesArray[0].minute
              }
            } else if (typeof timeStr === 'string' && timeStr.includes(':')) {
              // Простой строковый формат
              const parts = timeStr.split(':')
              hours = parseInt(parts[0], 10)
              minutes = parseInt(parts[1], 10)
            } else {
              hours = 12
              minutes = 0
            }
          } catch (error) {
            hours = 12
            minutes = 0
          }

          if (reminder.frequency === 'once') {
            // Одноразовое - планируем на ЗАВТРА в указанное время
            // (т.к. оригинальное время скорее всего уже в прошлом)
            const notificationTime = new Date()
            notificationTime.setDate(notificationTime.getDate() + 1) // Всегда завтра
            notificationTime.setHours(hours, minutes, 0, 0)

            const notificationId = `reminder-once-${reminder.id}-${Date.now()}`
            await notificationService.scheduleNotification(notificationId, {
              title: reminder.title,
              body: `Время принять: ${medicineNames}`,
              notificationDate: notificationTime,
              data: {
                type: 'reminder',
                reminderId: reminder.id,
                medicineIds: JSON.stringify(medicineIds),
                familyMemberId: reminder.family_member_id || '',
                frequency: 'once',
              },
              kitId: medicines[0].kit_id,
              critical: false,
            })
          } else if (reminder.frequency === 'daily') {
            // Ежедневные - создаём на 30 дней
            const timesPerDay = reminder.times_per_day || 1

            for (let day = 0; day < 30; day++) {
              for (let intake = 0; intake < timesPerDay; intake++) {
                const notificationTime = new Date()
                notificationTime.setHours(hours, minutes, 0, 0)
                notificationTime.setDate(now.getDate() + day)

                if (notificationTime <= now) {
                  continue
                }

                const notificationId = `reminder-daily-${reminder.id}-day${day}-intake${intake}`
                await notificationService.scheduleNotification(notificationId, {
                  title: reminder.title,
                  body: `Время принять: ${medicineNames} (прием ${intake + 1} из ${timesPerDay})`,
                  notificationDate: notificationTime,
                  data: {
                    type: 'reminder',
                    reminderId: reminder.id,
                    medicineIds: JSON.stringify(medicineIds),
                    familyMemberId: reminder.family_member_id || '',
                    frequency: 'daily',
                    day: String(day),
                    intake: String(intake + 1),
                    totalIntakes: String(timesPerDay),
                  },
                  kitId: medicines[0].kit_id,
                  critical: false,
                })
              }
            }
          } else if (reminder.frequency === 'weekly') {
            // Еженедельные - создаём на 12 недель
            const timesPerWeek = reminder.times_per_day || 1

            for (let week = 0; week < 12; week++) {
              for (let intake = 0; intake < timesPerWeek; intake++) {
                const notificationTime = new Date()
                notificationTime.setHours(hours, minutes, 0, 0)
                notificationTime.setDate(now.getDate() + (week * 7) + Math.floor((intake * 7) / timesPerWeek))

                if (notificationTime <= now) {
                  continue
                }

                const notificationId = `reminder-weekly-${reminder.id}-week${week}-intake${intake}`
                await notificationService.scheduleNotification(notificationId, {
                  title: reminder.title,
                  body: `Время принять: ${medicineNames} (прием ${intake + 1} из ${timesPerWeek} в неделю)`,
                  notificationDate: notificationTime,
                  data: {
                    type: 'reminder',
                    reminderId: reminder.id,
                    medicineIds: JSON.stringify(medicineIds),
                    familyMemberId: reminder.family_member_id || '',
                    frequency: 'weekly',
                    week: String(week),
                    intake: String(intake + 1),
                    totalIntakes: String(timesPerWeek),
                  },
                  kitId: medicines[0].kit_id,
                  critical: false,
                })
              }
            }
          }
        }
      }

      // Также пересоздаём уведомления о сроках годности
      await this.recreateExpiryNotifications()
    } catch (error) {
      // Не бросаем ошибку, чтобы не прерывать восстановление
    }
  }

  // Пересоздать уведомления о сроках годности
  private async recreateExpiryNotifications(): Promise<void> {
    try {

      const db = databaseService as any

      // Получаем все лекарства с запасами и сроками годности
      const [stocksResult] = await db.db.executeSql(`
        SELECT 
          s.*,
          m.id as medicine_id,
          m.name as medicine_name,
          m.kit_id,
          m.form,
          m.description,
          m.manufacturer,
          m.dosage,
          m.prescription_required,
          m.photo_path,
          m.barcode,
          m.created_at as medicine_created_at,
          m.updated_at as medicine_updated_at
        FROM medicine_stock s
        JOIN medicines m ON s.medicine_id = m.id
        WHERE s.expiry_date IS NOT NULL
      `)


      for (let i = 0; i < stocksResult.rows.length; i++) {
        const row = stocksResult.rows.item(i)

        const medicine = {
          id: row.medicine_id,
          name: row.medicine_name,
          kitId: row.kit_id,
          form: row.form,
          description: row.description,
          manufacturer: row.manufacturer,
          dosage: row.dosage,
          prescriptionRequired: row.prescription_required === 1,
          photoPath: row.photo_path,
          barcode: row.barcode,
          createdAt: new Date(row.medicine_created_at),
          updatedAt: new Date(row.medicine_updated_at),
        }

        const stock = {
          id: row.id,
          medicineId: row.medicine_id,
          quantity: row.quantity,
          unit: row.unit,
          expiryDate: row.expiry_date ? new Date(row.expiry_date) : undefined,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }

        // Планируем уведомления о сроке годности
        await scheduleMedicineExpiryNotifications(medicine, stock)
      }

    } catch (error) {
    }
  }

  // Импорт данных в базу
  private async importDatabaseData(data: BackupData['data']): Promise<void> {
    const db = databaseService as any

    // Очищаем все таблицы (в обратном порядке из-за foreign keys)
    await db.db.executeSql('DELETE FROM reminder_intakes')
    await db.db.executeSql('DELETE FROM reminder_medicines')
    await db.db.executeSql('DELETE FROM reminders')
    await db.db.executeSql('DELETE FROM medicine_usage')
    await db.db.executeSql('DELETE FROM medicine_stock')
    await db.db.executeSql('DELETE FROM medicines')
    await db.db.executeSql('DELETE FROM medicine_kits')
    await db.db.executeSql('DELETE FROM family_members')
    await db.db.executeSql('DELETE FROM shopping_list')

    // Вставляем данные обратно
    // Аптечки
    for (const kit of data.medicineKits) {
      await db.db.executeSql(
        `INSERT INTO medicine_kits (id, name, description, color, parent_id, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [kit.id, kit.name, kit.description, kit.color, kit.parent_id, kit.created_at, kit.updated_at]
      )
    }

    // Члены семьи
    for (const member of data.familyMembers) {
      await db.db.executeSql(
        `INSERT INTO family_members (id, name, avatar, color, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [member.id, member.name, member.avatar, member.color, member.created_at, member.updated_at]
      )
    }

    // Лекарства
    for (const medicine of data.medicines) {
      await db.db.executeSql(
        `INSERT INTO medicines (id, name, description, manufacturer, dosage, form, prescription_required, kit_id, photo_path, barcode, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          medicine.id,
          medicine.name,
          medicine.description,
          medicine.manufacturer,
          medicine.dosage,
          medicine.form,
          medicine.prescription_required,
          medicine.kit_id,
          medicine.photo_path,
          medicine.barcode,
          medicine.created_at,
          medicine.updated_at,
        ]
      )
    }

    // Запасы
    for (const stock of data.medicineStock) {
      await db.db.executeSql(
        `INSERT INTO medicine_stock (id, medicine_id, quantity, unit, expiry_date, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [stock.id, stock.medicine_id, stock.quantity, stock.unit, stock.expiry_date, stock.created_at, stock.updated_at]
      )
    }

    // История приема
    for (const usage of data.medicineUsage) {
      await db.db.executeSql(
        `INSERT INTO medicine_usage (id, medicine_id, family_member_id, quantity_used, usage_date, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [usage.id, usage.medicine_id, usage.family_member_id, usage.quantity_used, usage.usage_date, usage.notes, usage.created_at]
      )
    }

    // Напоминания
    for (const reminder of data.reminders) {
      await db.db.executeSql(
        `INSERT INTO reminders (id, family_member_id, title, frequency, times_per_day, time, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reminder.id,
          reminder.family_member_id,
          reminder.title,
          reminder.frequency,
          reminder.times_per_day,
          reminder.time,
          reminder.is_active,
          reminder.created_at,
        ]
      )
    }

    // Связи напоминаний и лекарств
    for (const rm of data.reminderMedicines) {
      await db.db.executeSql(
        `INSERT INTO reminder_medicines (id, reminder_id, medicine_id, created_at) 
         VALUES (?, ?, ?, ?)`,
        [rm.id, rm.reminder_id, rm.medicine_id, rm.created_at]
      )
    }

    // Приемы по напоминаниям
    for (const intake of data.reminderIntakes) {
      await db.db.executeSql(
        `INSERT INTO reminder_intakes (id, reminder_id, scheduled_date, scheduled_time, is_taken, taken_at, usage_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          intake.id,
          intake.reminder_id,
          intake.scheduled_date,
          intake.scheduled_time,
          intake.is_taken,
          intake.taken_at,
          intake.usage_id,
          intake.created_at,
        ]
      )
    }

    // Список покупок
    for (const item of data.shoppingList) {
      await db.db.executeSql(
        `INSERT INTO shopping_list (id, medicine_name, description, is_purchased, reminder_date, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.medicine_name,
          item.description,
          item.is_purchased,
          item.reminder_date,
          item.created_at,
          item.updated_at,
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


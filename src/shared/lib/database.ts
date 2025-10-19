import SQLite from 'react-native-sqlite-storage'
import { MedicineKit } from '@/entities/kit/model/types'
import {
  Medicine,
  MedicineStock,
  MedicineUsage
} from '@/entities/medicine/model/types'
import { FamilyMember } from '@/entities/family-member/model/types'
import { DATABASE_CONFIG } from '../config/database'

// Конфигурация SQLite
SQLite.DEBUG = __DEV__
SQLite.enablePromise(true)

const { name: DATABASE_NAME, version: DATABASE_VERSION, displayName: DATABASE_DISPLAYNAME, size: DATABASE_SIZE } = DATABASE_CONFIG

class DatabaseService {
  private db: any | null = null

  private initPromise: Promise<void> | null = null

  init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._init()
    return this.initPromise
  }

  private async _init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: DATABASE_NAME,
        version: DATABASE_VERSION,
        displayName: DATABASE_DISPLAYNAME,
        size: DATABASE_SIZE,
      })

      await this.createTables()
      await this.migrateDatabase()
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Database initialization failed:', error)
      this.initPromise = null
      throw error
    }
  }


  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    // Таблица аптечек
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS medicine_kits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        parent_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES medicine_kits (id) ON DELETE CASCADE
      )
    `)

    // Таблица лекарств
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS medicines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        manufacturer TEXT,
        dosage TEXT,
        form TEXT NOT NULL,
        prescription_required BOOLEAN DEFAULT 0,
        kit_id TEXT NOT NULL,
        photo_path TEXT,
        barcode TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (kit_id) REFERENCES medicine_kits (id) ON DELETE CASCADE
      )
    `)

    // Таблица запасов лекарств
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS medicine_stock (
        id TEXT PRIMARY KEY,
        medicine_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        expiry_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE
      )
    `)

    // Таблица членов семьи
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS family_members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT,
        color TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

    // Таблица напоминаний (без medicine_id, так как может быть много лекарств)
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        family_member_id TEXT,
        title TEXT NOT NULL,
        frequency TEXT NOT NULL,
        times_per_day INTEGER DEFAULT 1,
        time TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (family_member_id) REFERENCES family_members (id) ON DELETE SET NULL
      )
    `)

    // Связующая таблица напоминание <-> лекарства (many-to-many)
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS reminder_medicines (
        id TEXT PRIMARY KEY,
        reminder_id TEXT NOT NULL,
        medicine_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (reminder_id) REFERENCES reminders (id) ON DELETE CASCADE,
        FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE
      )
    `)

    // Таблица приемов по напоминаниям (для отслеживания выполнения)
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS reminder_intakes (
        id TEXT PRIMARY KEY,
        reminder_id TEXT NOT NULL,
        scheduled_date TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        is_taken BOOLEAN DEFAULT 0,
        taken_at TEXT,
        usage_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (reminder_id) REFERENCES reminders (id) ON DELETE CASCADE,
        FOREIGN KEY (usage_id) REFERENCES medicine_usage (id) ON DELETE SET NULL
      )
    `)

    // Таблица использования лекарств
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS medicine_usage (
        id TEXT PRIMARY KEY,
        medicine_id TEXT NOT NULL,
        family_member_id TEXT,
        quantity_used INTEGER NOT NULL,
        usage_date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE,
        FOREIGN KEY (family_member_id) REFERENCES family_members (id) ON DELETE SET NULL
      )
    `)

    // Справочная таблица форм выпуска
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS medicine_forms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        icon TEXT
      )
    `)

    // Справочная таблица единиц измерения
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS measurement_units (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        symbol TEXT NOT NULL
      )
    `)

    // Таблица списка покупок
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS shopping_list (
        id TEXT PRIMARY KEY,
        medicine_name TEXT NOT NULL,
        description TEXT,
        is_purchased BOOLEAN DEFAULT 0,
        reminder_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

  }

  private async migrateDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    try {
      // Проверяем структуру таблицы medicine_kits
      const [kitsResult] = await this.db.executeSql(`
        PRAGMA table_info(medicine_kits)
      `)

      let hasParentId = false
      for (let i = 0; i < kitsResult.rows.length; i++) {
        const column = kitsResult.rows.item(i)
        if (column.name === 'parent_id') {
          hasParentId = true
        }
      }

      // Если колонки parent_id нет, добавляем её
      if (!hasParentId) {
        console.log('SQLite - Adding parent_id column to medicine_kits table')
        await this.db.executeSql(`
          ALTER TABLE medicine_kits ADD COLUMN parent_id TEXT
        `)
      }

      // Проверяем структуру таблицы medicine_usage
      const [usageResult] = await this.db.executeSql(`
        PRAGMA table_info(medicine_usage)
      `)

      let hasFamilyMemberId = false
      for (let i = 0; i < usageResult.rows.length; i++) {
        const column = usageResult.rows.item(i)
        if (column.name === 'family_member_id') {
          hasFamilyMemberId = true
        }
      }

      // Если колонки family_member_id нет, добавляем её
      if (!hasFamilyMemberId) {
        console.log('SQLite - Adding family_member_id column to medicine_usage table')
        await this.db.executeSql(`
          ALTER TABLE medicine_usage ADD COLUMN family_member_id TEXT
        `)
      }

      // Проверяем структуру таблицы medicines
      const [medicinesResult] = await this.db.executeSql(`
        PRAGMA table_info(medicines)
      `)

      let hasPhotoPath = false
      for (let i = 0; i < medicinesResult.rows.length; i++) {
        const column = medicinesResult.rows.item(i)
        if (column.name === 'photo_path') {
          hasPhotoPath = true
        }
      }

      // Если колонки photo_path нет, добавляем её
      if (!hasPhotoPath) {
        console.log('SQLite - Adding photo_path column to medicines table')
        await this.db.executeSql(`
          ALTER TABLE medicines ADD COLUMN photo_path TEXT
        `)
      }

      // Проверяем наличие колонки barcode
      let hasBarcode = false
      for (let i = 0; i < medicinesResult.rows.length; i++) {
        const column = medicinesResult.rows.item(i)
        if (column.name === 'barcode') {
          hasBarcode = true
        }
      }

      // Если колонки barcode нет, добавляем её
      if (!hasBarcode) {
        console.log('SQLite - Adding barcode column to medicines table')
        await this.db.executeSql(`
          ALTER TABLE medicines ADD COLUMN barcode TEXT
        `)
      }

      // Проверяем наличие таблицы reminders
      const [remindersTable] = await this.db.executeSql(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='reminders'
      `)

      if (remindersTable.rows.length === 0) {
        console.log('SQLite - Creating reminders table')
        await this.db.executeSql(`
          CREATE TABLE IF NOT EXISTS reminders (
            id TEXT PRIMARY KEY,
            family_member_id TEXT,
            title TEXT NOT NULL,
            frequency TEXT NOT NULL,
            times_per_day INTEGER DEFAULT 1,
            time TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at TEXT NOT NULL,
            FOREIGN KEY (family_member_id) REFERENCES family_members (id) ON DELETE SET NULL
          )
        `)

        await this.db.executeSql(`
          CREATE TABLE IF NOT EXISTS reminder_medicines (
            id TEXT PRIMARY KEY,
            reminder_id TEXT NOT NULL,
            medicine_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (reminder_id) REFERENCES reminders (id) ON DELETE CASCADE,
            FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE
          )
        `)
      } else {
        // Таблица существует - проверяем её структуру
        const [tableInfo] = await this.db.executeSql(`
          PRAGMA table_info(reminders)
        `)

        let hasMedicineId = false
        for (let i = 0; i < tableInfo.rows.length; i++) {
          const column = tableInfo.rows.item(i)
          if (column.name === 'medicine_id') {
            hasMedicineId = true
            break
          }
        }

        // Если есть старая структура с medicine_id - пересоздаем таблицу
        if (hasMedicineId) {
          console.log('SQLite - Migrating reminders table to new structure')

          // Сохраняем старые данные
          const [oldReminders] = await this.db.executeSql(`
            SELECT * FROM reminders
          `)

          // Удаляем старую таблицу
          await this.db.executeSql('DROP TABLE IF EXISTS reminders')
          await this.db.executeSql('DROP TABLE IF EXISTS reminder_intakes')

          // Создаем новые таблицы
          await this.db.executeSql(`
            CREATE TABLE reminders (
              id TEXT PRIMARY KEY,
              family_member_id TEXT,
              title TEXT NOT NULL,
              frequency TEXT NOT NULL,
              times_per_day INTEGER DEFAULT 1,
              time TEXT NOT NULL,
              is_active BOOLEAN DEFAULT 1,
              created_at TEXT NOT NULL,
              FOREIGN KEY (family_member_id) REFERENCES family_members (id) ON DELETE SET NULL
            )
          `)

          await this.db.executeSql(`
            CREATE TABLE reminder_medicines (
              id TEXT PRIMARY KEY,
              reminder_id TEXT NOT NULL,
              medicine_id TEXT NOT NULL,
              created_at TEXT NOT NULL,
              FOREIGN KEY (reminder_id) REFERENCES reminders (id) ON DELETE CASCADE,
              FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE
            )
          `)

          await this.db.executeSql(`
            CREATE TABLE reminder_intakes (
              id TEXT PRIMARY KEY,
              reminder_id TEXT NOT NULL,
              scheduled_date TEXT NOT NULL,
              scheduled_time TEXT NOT NULL,
              is_taken BOOLEAN DEFAULT 0,
              taken_at TEXT,
              usage_id TEXT,
              created_at TEXT NOT NULL,
              FOREIGN KEY (reminder_id) REFERENCES reminders (id) ON DELETE CASCADE,
              FOREIGN KEY (usage_id) REFERENCES medicine_usage (id) ON DELETE SET NULL
            )
          `)

          console.log('SQLite - Reminders table migrated successfully')
        }
      }

      // Проверяем наличие таблицы reminder_intakes
      const [reminderIntakesTable] = await this.db.executeSql(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='reminder_intakes'
      `)

      if (reminderIntakesTable.rows.length === 0) {
        console.log('SQLite - Creating reminder_intakes table')
        await this.db.executeSql(`
          CREATE TABLE IF NOT EXISTS reminder_intakes (
            id TEXT PRIMARY KEY,
            reminder_id TEXT NOT NULL,
            scheduled_date TEXT NOT NULL,
            scheduled_time TEXT NOT NULL,
            is_taken BOOLEAN DEFAULT 0,
            taken_at TEXT,
            usage_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (reminder_id) REFERENCES reminders (id) ON DELETE CASCADE,
            FOREIGN KEY (usage_id) REFERENCES medicine_usage (id) ON DELETE SET NULL
          )
        `)
      }

      // Проверяем наличие таблицы shopping_list и мигрируем её
      const [shoppingListTable] = await this.db.executeSql(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='shopping_list'
      `)

      if (shoppingListTable.rows.length > 0) {
        // Проверяем структуру таблицы shopping_list
        const [tableInfo] = await this.db.executeSql(`
          PRAGMA table_info(shopping_list)
        `)

        let hasQuantity = false
        let hasUnit = false
        let hasReminderDate = false
        for (let i = 0; i < tableInfo.rows.length; i++) {
          const column = tableInfo.rows.item(i)
          if (column.name === 'quantity') {
            hasQuantity = true
          }
          if (column.name === 'unit') {
            hasUnit = true
          }
          if (column.name === 'reminder_date') {
            hasReminderDate = true
          }
        }

        // Если есть лишние столбцы, пересоздаем таблицу
        if (hasQuantity || hasUnit) {
          console.log('SQLite - Migrating shopping_list table to remove quantity and unit columns')

          // Сохраняем старые данные
          const [oldData] = await this.db.executeSql(`
            SELECT id, medicine_name, description, is_purchased, created_at, updated_at FROM shopping_list
          `)

          // Удаляем старую таблицу
          await this.db.executeSql('DROP TABLE IF EXISTS shopping_list')

          // Создаем новую таблицу
          await this.db.executeSql(`
            CREATE TABLE shopping_list (
              id TEXT PRIMARY KEY,
              medicine_name TEXT NOT NULL,
              description TEXT,
              is_purchased BOOLEAN DEFAULT 0,
              reminder_date TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          `)

          // Восстанавливаем данные
          for (let i = 0; i < oldData.rows.length; i++) {
            const row = oldData.rows.item(i)
            await this.db.executeSql(`
              INSERT INTO shopping_list (
                id, medicine_name, description, is_purchased, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
              row.id,
              row.medicine_name,
              row.description,
              row.is_purchased,
              row.created_at,
              row.updated_at
            ])
          }

          console.log('SQLite - Shopping list table migrated successfully')
        } else if (!hasReminderDate) {
          // Добавляем колонку reminder_date если её нет
          console.log('SQLite - Adding reminder_date column to shopping_list table')
          await this.db.executeSql(`
            ALTER TABLE shopping_list ADD COLUMN reminder_date TEXT
          `)
        }
      }

    } catch (error) {
      console.error('SQLite - Migration error:', error)
    }
  }


  // CRUD операции для аптечек
  async createKit(kit: Omit<MedicineKit, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicineKit> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const id = Date.now().toString()
    const now = new Date().toISOString()

    const newKit: MedicineKit = {
      ...kit,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    }

    await this.db.executeSql(`
      INSERT INTO medicine_kits (
        id, name, description, color, parent_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      newKit.id,
      newKit.name,
      newKit.description || null,
      newKit.color,
      newKit.parent_id || null,
      newKit.createdAt.toISOString(),
      newKit.updatedAt.toISOString()
    ])

    return newKit
  }

  async getKits(): Promise<MedicineKit[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicine_kits ORDER BY name ASC
    `)

    const kits: MedicineKit[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      const kit = {
        id: row.id,
        name: row.name,
        description: row.description,
        color: row.color,
        parent_id: row.parent_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }
      kits.push(kit)
    }

    return kits
  }

  async getKitById(id: string): Promise<MedicineKit | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicine_kits WHERE id = ?
    `, [id])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    const kit: MedicineKit = {
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      parent_id: row.parent_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }

    return kit
  }

  async updateKit(id: string, updates: Partial<MedicineKit>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const allowedFields = ['name', 'description', 'color', 'parent_id']
    const filteredUpdates = Object.entries(updates)
      .filter(([key]) => key !== 'id' && key !== 'createdAt' && allowedFields.includes(key))

    if (filteredUpdates.length === 0) {
      return
    }

    const setClause = filteredUpdates
      .map(([key]) => `${key} = ?`)
      .join(', ')

    const values = filteredUpdates.map(([_key, value]) => value)
    values.push(new Date().toISOString(), id)

    await this.db.executeSql(`
      UPDATE medicine_kits 
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `, values)
  }

  async deleteKit(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM medicine_kits WHERE id = ?
    `, [id])
  }

  async clearDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    try {
      // Удаляем все данные из таблицы аптечек
      await this.db.executeSql('DELETE FROM medicine_kits')

      // Сбрасываем автоинкремент
      await this.db.executeSql('DELETE FROM sqlite_sequence WHERE name = "medicine_kits"')

    } catch (error) {
      console.error('Ошибка очистки базы данных:', error)
      throw error
    }
  }

  // CRUD операции для лекарств
  async createMedicine(medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medicine> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const id = Date.now().toString()
    const now = new Date().toISOString()

    const newMedicine: Medicine = {
      ...medicine,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    }

    await this.db.executeSql(`
      INSERT INTO medicines (
        id, name, description, manufacturer, dosage, form, prescription_required, kit_id, photo_path, barcode, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newMedicine.id,
      newMedicine.name,
      newMedicine.description || null,
      newMedicine.manufacturer || null,
      newMedicine.dosage || null,
      newMedicine.form,
      newMedicine.prescriptionRequired ? 1 : 0,
      newMedicine.kitId,
      newMedicine.photoPath || null,
      newMedicine.barcode || null,
      newMedicine.createdAt.toISOString(),
      newMedicine.updatedAt.toISOString()
    ])

    return newMedicine
  }

  async getMedicines(): Promise<Medicine[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicines ORDER BY name ASC
    `)

    const medicines: Medicine[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      const medicine: Medicine = {
        id: row.id,
        name: row.name,
        description: row.description,
        manufacturer: row.manufacturer,
        dosage: row.dosage,
        form: row.form,
        prescriptionRequired: row.prescription_required === 1,
        kitId: row.kit_id,
        photoPath: row.photo_path,
        barcode: row.barcode,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }
      medicines.push(medicine)
      console.log('SQLite - Loaded medicine:', medicine)
    }

    console.log('SQLite - Total medicines loaded:', medicines.length)
    return medicines
  }

  async getMedicinesByKitId(kitId: string): Promise<Medicine[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicines WHERE kit_id = ? ORDER BY name ASC
    `, [kitId])

    const medicines: Medicine[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      const medicine: Medicine = {
        id: row.id,
        name: row.name,
        description: row.description,
        manufacturer: row.manufacturer,
        dosage: row.dosage,
        form: row.form,
        prescriptionRequired: row.prescription_required === 1,
        kitId: row.kit_id,
        photoPath: row.photo_path,
        barcode: row.barcode,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }
      medicines.push(medicine)
    }

    return medicines
  }

  async getMedicineById(id: string): Promise<Medicine | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicines WHERE id = ?
    `, [id])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    const medicine: Medicine = {
      id: row.id,
      name: row.name,
      description: row.description,
      manufacturer: row.manufacturer,
      dosage: row.dosage,
      form: row.form,
      prescriptionRequired: row.prescription_required === 1,
      kitId: row.kit_id,
      photoPath: row.photo_path,
      barcode: row.barcode,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }

    console.log('SQLite - Loaded medicine by ID:', medicine)
    return medicine
  }

  async getMedicineByBarcode(barcode: string): Promise<Medicine | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicines WHERE barcode = ?
    `, [barcode])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    const medicine: Medicine = {
      id: row.id,
      name: row.name,
      description: row.description,
      manufacturer: row.manufacturer,
      dosage: row.dosage,
      form: row.form,
      prescriptionRequired: row.prescription_required === 1,
      kitId: row.kit_id,
      photoPath: row.photo_path,
      barcode: row.barcode,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }

    console.log('SQLite - Loaded medicine by barcode:', medicine)
    return medicine
  }

  async updateMedicine(id: string, updates: Partial<Medicine>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const allowedFields = ['name', 'description', 'manufacturer', 'dosage', 'form', 'prescription_required', 'photoPath', 'barcode']
    const filteredUpdates = Object.entries(updates)
      .filter(([key]) => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && allowedFields.includes(key))

    if (filteredUpdates.length === 0) {
      return
    }

    const setClause = filteredUpdates.map(([key]) => {
      // Маппинг camelCase в snake_case
      const dbField = key === 'photoPath' ? 'photo_path' : key === 'barcode' ? 'barcode' : key
      return `${dbField} = ?`
    }).join(', ')
    const values = filteredUpdates.map(([_, value]) => value)

    await this.db.executeSql(`
      UPDATE medicines
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `, [...values, new Date().toISOString(), id])
  }

  async deleteMedicine(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM medicines WHERE id = ?
    `, [id])
  }

  // CRUD операции для запасов лекарств
  async createMedicineStock(stock: Omit<MedicineStock, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicineStock> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const id = Date.now().toString()
    const now = new Date().toISOString()

    const newStock: MedicineStock = {
      ...stock,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    }

    await this.db.executeSql(`
      INSERT INTO medicine_stock (
        id, medicine_id, quantity, unit, expiry_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      newStock.id,
      newStock.medicineId,
      newStock.quantity,
      newStock.unit,
      newStock.expiryDate?.toISOString() || null,
      newStock.createdAt.toISOString(),
      newStock.updatedAt.toISOString()
    ])

    return newStock
  }

  async getMedicineStock(medicineId: string): Promise<MedicineStock | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicine_stock WHERE medicine_id = ?
    `, [medicineId])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    const stock: MedicineStock = {
      id: row.id,
      medicineId: row.medicine_id,
      quantity: row.quantity,
      unit: row.unit,
      expiryDate: row.expiry_date ? new Date(row.expiry_date) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }

    return stock
  }

  async updateMedicineStock(id: string, updates: Partial<MedicineStock>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    console.log('updateMedicineStock called with:', { id, updates })
    const allowedFields = ['quantity', 'unit', 'expiryDate']
    const filteredUpdates = Object.entries(updates)
      .filter(([key]) => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && allowedFields.includes(key))

    console.log('filteredUpdates:', filteredUpdates)

    if (filteredUpdates.length === 0) {
      return
    }

    const setClause = filteredUpdates.map(([key]) => {
      // Маппинг camelCase полей в snake_case для базы данных
      const dbField = key === 'expiryDate' ? 'expiry_date' : key
      return `${dbField} = ?`
    }).join(', ')
    const values = filteredUpdates.map(([_, value]) => {
      if (value instanceof Date) {
        return value.toISOString()
      }
      return value
    })

    await this.db.executeSql(`
      UPDATE medicine_stock
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `, [...values, new Date().toISOString(), id])
  }

  async deleteMedicineStock(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM medicine_stock WHERE id = ?
    `, [id])
  }

  // CRUD операции для использования лекарств
  async createMedicineUsage(usage: Omit<MedicineUsage, 'id' | 'createdAt'>): Promise<MedicineUsage> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const id = Date.now().toString()
    const now = new Date().toISOString()

    const newUsage: MedicineUsage = {
      ...usage,
      id,
      createdAt: new Date(now)
    }

    await this.db.executeSql(`
      INSERT INTO medicine_usage (
        id, medicine_id, family_member_id, quantity_used, usage_date, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      newUsage.id,
      newUsage.medicineId,
      newUsage.familyMemberId || null,
      newUsage.quantityUsed,
      newUsage.usageDate.toISOString(),
      newUsage.notes || null,
      newUsage.createdAt.toISOString()
    ])

    // Автоматически отмечаем связанные напоминания как выполненные
    await this.markTodayRemindersAsTaken(newUsage.medicineId, newUsage.usageDate, newUsage.id)

    return newUsage
  }

  // Отмечаем напоминания на сегодня как выполненные
  async markTodayRemindersAsTaken(medicineId: string, usageDate: Date, usageId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const today = new Date(usageDate)
    today.setHours(0, 0, 0, 0)
    // Используем локальную дату без UTC
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    // Находим невыполненные приемы по напоминаниям для этого лекарства на сегодня
    const [results] = await this.db.executeSql(`
      SELECT DISTINCT ri.id, ri.reminder_id, ri.scheduled_time, r.id as reminder_id_check
      FROM reminder_intakes ri
      JOIN reminders r ON ri.reminder_id = r.id
      JOIN reminder_medicines rm ON r.id = rm.reminder_id
      WHERE rm.medicine_id = ?
        AND ri.scheduled_date = ?
        AND ri.is_taken = 0
      ORDER BY ri.scheduled_time ASC
      LIMIT 1
    `, [medicineId, todayStr])

    if (results.rows.length > 0) {
      const intake = results.rows.item(0)
      const reminderId = intake.reminder_id

      // Проверяем: приняты ли ВСЕ лекарства из этого напоминания сегодня?
      const [medicinesInReminder] = await this.db.executeSql(`
        SELECT medicine_id FROM reminder_medicines WHERE reminder_id = ?
      `, [reminderId])

      // Получаем все приемы лекарств на сегодня (используем локальную дату)
      const [usagesToday] = await this.db.executeSql(`
        SELECT DISTINCT medicine_id 
        FROM medicine_usage 
        WHERE strftime('%Y-%m-%d', usage_date) = ?
      `, [todayStr])

      const takenMedicineIds = new Set()
      for (let i = 0; i < usagesToday.rows.length; i++) {
        takenMedicineIds.add(usagesToday.rows.item(i).medicine_id)
      }

      let allTaken = true
      for (let i = 0; i < medicinesInReminder.rows.length; i++) {
        const medId = medicinesInReminder.rows.item(i).medicine_id
        if (!takenMedicineIds.has(medId)) {
          allTaken = false
          break
        }
      }

      // Отмечаем напоминание как выполненное только если приняты ВСЕ лекарства
      if (allTaken) {
        await this.db.executeSql(`
          UPDATE reminder_intakes
          SET is_taken = 1, taken_at = ?, usage_id = ?
          WHERE id = ?
        `, [new Date().toISOString(), usageId, intake.id])

        // Удаляем пуш-уведомление для этого напоминания
        const { notificationService } = require('./notifications')
        await notificationService.cancelTodayReminderNotification(reminderId, intake.scheduled_time)
      }
    }
  }

  async getMedicineUsage(medicineId: string): Promise<MedicineUsage[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM medicine_usage WHERE medicine_id = ? ORDER BY usage_date DESC
    `, [medicineId])

    const usages: MedicineUsage[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      const usage: MedicineUsage = {
        id: row.id,
        medicineId: row.medicine_id,
        familyMemberId: row.family_member_id,
        quantityUsed: row.quantity_used,
        usageDate: new Date(row.usage_date),
        notes: row.notes,
        createdAt: new Date(row.created_at)
      }
      usages.push(usage)
    }

    return usages
  }

  // CRUD операции для членов семьи
  async createFamilyMember(member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<FamilyMember> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const id = Date.now().toString()
    const now = new Date().toISOString()

    const newMember: FamilyMember = {
      ...member,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    }

    await this.db.executeSql(`
      INSERT INTO family_members (
        id, name, avatar, color, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      newMember.id,
      newMember.name,
      newMember.avatar || null,
      newMember.color || null,
      newMember.createdAt.toISOString(),
      newMember.updatedAt.toISOString()
    ])

    console.log('SQLite - Created family member:', newMember)
    return newMember
  }

  async getFamilyMembers(): Promise<FamilyMember[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM family_members ORDER BY name ASC
    `)

    const members: FamilyMember[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      const member: FamilyMember = {
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        color: row.color,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }
      members.push(member)
    }

    return members
  }

  async getFamilyMemberById(id: string): Promise<FamilyMember | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM family_members WHERE id = ?
    `, [id])

    if (results.rows.length === 0) {
      return null
    }

    const row = results.rows.item(0)
    return {
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      color: row.color,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  async updateFamilyMember(id: string, updates: Partial<FamilyMember>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const updateFields: string[] = []
    const updateValues: any[] = []

    if (updates.name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(updates.name)
    }
    if (updates.avatar !== undefined) {
      updateFields.push('avatar = ?')
      updateValues.push(updates.avatar)
    }
    if (updates.color !== undefined) {
      updateFields.push('color = ?')
      updateValues.push(updates.color)
    }

    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())
    updateValues.push(id)

    await this.db.executeSql(`
      UPDATE family_members SET ${updateFields.join(', ')} WHERE id = ?
    `, updateValues)

    console.log('SQLite - Updated family member:', id)
  }

  async deleteFamilyMember(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM family_members WHERE id = ?
    `, [id])

    console.log('SQLite - Deleted family member:', id)
  }

  async deleteMedicineUsage(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM medicine_usage WHERE id = ?
    `, [id])

    console.log('SQLite - Deleted medicine usage:', id)
  }

  // CRUD для напоминаний
  async createReminder(data: {
    medicineIds: string[]
    familyMemberId?: string
    title: string
    frequency: 'once' | 'daily' | 'weekly'
    timesPerDay: number
    time: string
  }): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const id = Date.now().toString()
    const now = new Date().toISOString()

    // Создаем напоминание
    await this.db.executeSql(`
      INSERT INTO reminders (
        id, family_member_id, title, frequency, times_per_day, time, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `, [
      id,
      data.familyMemberId || null,
      data.title,
      data.frequency,
      data.timesPerDay,
      data.time,
      now
    ])

    // Связываем с лекарствами
    for (const medicineId of data.medicineIds) {
      const linkId = `${id}_${medicineId}`
      await this.db.executeSql(`
        INSERT INTO reminder_medicines (
          id, reminder_id, medicine_id, created_at
        ) VALUES (?, ?, ?, ?)
      `, [linkId, id, medicineId, now])
    }

    return id
  }

  async createReminderIntake(data: {
    reminderId: string
    scheduledDate: string
    scheduledTime: string
  }): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const id = Date.now().toString() + Math.random()
    const now = new Date().toISOString()

    await this.db.executeSql(`
      INSERT INTO reminder_intakes (
        id, reminder_id, scheduled_date, scheduled_time, is_taken, created_at
      ) VALUES (?, ?, ?, ?, 0, ?)
    `, [id, data.reminderId, data.scheduledDate, data.scheduledTime, now])
  }

  async getTodayReminderIntakes(): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Используем локальную дату без UTC
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    const [results] = await this.db.executeSql(`
      SELECT 
        ri.id,
        ri.reminder_id,
        ri.scheduled_time,
        ri.is_taken,
        ri.taken_at,
        r.title,
        r.family_member_id,
        fm.name as family_member_name,
        fm.avatar as family_member_avatar,
        fm.color as family_member_color
      FROM reminder_intakes ri
      JOIN reminders r ON ri.reminder_id = r.id
      LEFT JOIN family_members fm ON r.family_member_id = fm.id
      WHERE ri.scheduled_date = ?
        AND r.is_active = 1
      ORDER BY ri.scheduled_time ASC, ri.is_taken ASC
    `, [todayStr])

    const intakes = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)

      // Загружаем все лекарства для этого напоминания
      const [medicinesResult] = await this.db.executeSql(`
        SELECT 
          m.id,
          m.name,
          m.form,
          m.photo_path
        FROM reminder_medicines rm
        JOIN medicines m ON rm.medicine_id = m.id
        WHERE rm.reminder_id = ?
      `, [row.reminder_id])

      const medicines = []
      for (let j = 0; j < medicinesResult.rows.length; j++) {
        medicines.push(medicinesResult.rows.item(j))
      }

      intakes.push({
        ...row,
        medicines
      })
    }

    return intakes
  }

  async markReminderIntakeAsTaken(intakeId: string, usageId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      UPDATE reminder_intakes
      SET is_taken = 1, taken_at = ?, usage_id = ?
      WHERE id = ?
    `, [new Date().toISOString(), usageId, intakeId])
  }

  // Справочные данные (заглушки для будущей реализации)
  getMedicineForms(): any[] {
    // Пока возвращаем статичные данные
    return [
      { id: '1', name: 'Таблетки', icon: '💊' },
      { id: '2', name: 'Капли', icon: '💧' },
      { id: '3', name: 'Мазь', icon: '🧴' },
      { id: '4', name: 'Сироп', icon: '🍯' },
      { id: '5', name: 'Инъекции', icon: '💉' }
    ]
  }

  getMeasurementUnits(): any[] {
    // Пока возвращаем статичные данные
    return [
      { id: '1', name: 'Штука', symbol: 'шт' },
      { id: '2', name: 'Миллилитр', symbol: 'мл' },
      { id: '3', name: 'Грамм', symbol: 'г' },
      { id: '4', name: 'Миллиграмм', symbol: 'мг' },
      { id: '5', name: 'Таблетка', symbol: 'таб' }
    ]
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
    }
  }

  // CRUD операции для списка покупок
  async createShoppingItem(item: {
    medicineName: string
    description?: string
    reminderDate?: Date
  }): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const id = Date.now().toString()
    const now = new Date().toISOString()

    await this.db.executeSql(`
      INSERT INTO shopping_list (
        id, medicine_name, description, is_purchased, reminder_date, created_at, updated_at
      ) VALUES (?, ?, ?, 0, ?, ?, ?)
    `, [
      id,
      item.medicineName,
      item.description || null,
      item.reminderDate ? item.reminderDate.toISOString() : null,
      now,
      now
    ])

    return {
      id,
      medicineName: item.medicineName,
      description: item.description,
      isPurchased: false,
      reminderDate: item.reminderDate,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    }
  }

  async getShoppingItems(): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`
      SELECT * FROM shopping_list ORDER BY is_purchased ASC, created_at DESC
    `)

    const items: any[] = []
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i)
      items.push({
        id: row.id,
        medicineName: row.medicine_name,
        description: row.description,
        isPurchased: row.is_purchased === 1,
        reminderDate: row.reminder_date ? new Date(row.reminder_date) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      })
    }

    return items
  }

  async updateShoppingItem(id: string, updates: {
    medicineName?: string
    description?: string
    isPurchased?: boolean
    reminderDate?: Date | null
  }): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const updateFields: string[] = []
    const updateValues: any[] = []

    if (updates.medicineName !== undefined) {
      updateFields.push('medicine_name = ?')
      updateValues.push(updates.medicineName)
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(updates.description)
    }
    if (updates.isPurchased !== undefined) {
      updateFields.push('is_purchased = ?')
      updateValues.push(updates.isPurchased ? 1 : 0)
    }
    if (updates.reminderDate !== undefined) {
      updateFields.push('reminder_date = ?')
      updateValues.push(updates.reminderDate ? updates.reminderDate.toISOString() : null)
    }

    if (updateFields.length === 0) {
      return
    }

    updateFields.push('updated_at = ?')
    updateValues.push(new Date().toISOString())
    updateValues.push(id)

    await this.db.executeSql(`
      UPDATE shopping_list SET ${updateFields.join(', ')} WHERE id = ?
    `, updateValues)
  }

  async deleteShoppingItem(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM shopping_list WHERE id = ?
    `, [id])
  }

  async clearPurchasedItems(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    await this.db.executeSql(`
      DELETE FROM shopping_list WHERE is_purchased = 1
    `)
  }
}

export const databaseService = new DatabaseService()

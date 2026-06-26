import SQLite from 'react-native-sqlite-storage'
import { DATABASE_CONFIG } from '../../config/database'

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
      await this.migrateTables()
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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        parentId INTEGER,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (parentId) REFERENCES medicine_kits (id) ON DELETE CASCADE
      )
    `)

    // Таблица лекарств
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        manufacturer TEXT,
        dosage TEXT,
        medicineKitId INTEGER NOT NULL,
        photoPath TEXT,
        barcode TEXT,
        unit TEXT,
        quantity INTEGER NOT NULL,
        unitForQuantity TEXT,
        expirationDate TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (medicineKitId) REFERENCES medicine_kits (id) ON DELETE CASCADE
      )
    `)

    // Таблица членов семьи
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS family_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        avatar TEXT,
        color TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `)

    // Таблица напоминаний
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        familyMemberId INTEGER,
        title TEXT NOT NULL,
        frequency TEXT NOT NULL,
        timesPerDay INTEGER DEFAULT 1,
        time TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        daysCount INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt INTEGER,
        description TEXT,
        dosage TEXT,
        FOREIGN KEY (familyMemberId) REFERENCES family_members (id) ON DELETE SET NULL
      )
    `)

    // Связующая таблица напоминание <-> лекарства (many-to-many)
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS reminder_medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reminderId INTEGER NOT NULL,
        medicineId INTEGER NOT NULL,
        FOREIGN KEY (reminderId) REFERENCES reminders (id) ON DELETE CASCADE,
        FOREIGN KEY (medicineId) REFERENCES medicines (id) ON DELETE CASCADE
      )
    `)

    // Таблица использования лекарств
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS medicine_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicineId INTEGER NOT NULL,
        familyMemberId INTEGER,
        quantityUsed INTEGER NOT NULL,
        usageDate TEXT NOT NULL,
        notes TEXT,
        createdAt INTEGER NOT NULL,
        medicineName TEXT,
        kitName TEXT,
        unitForQuantity TEXT,
        FOREIGN KEY (medicineId) REFERENCES medicines (id),
        FOREIGN KEY (familyMemberId) REFERENCES family_members (id) ON DELETE SET NULL
      )
    `)

    // Таблица списка покупок
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS shopping_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicineName TEXT NOT NULL,
        description TEXT,
        isPurchased BOOLEAN DEFAULT 0,
        reminderDate TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )
    `)
  }

  private async getTableColumns(table: string): Promise<string[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const [results] = await this.db.executeSql(`PRAGMA table_info(${table})`)
    const columns: string[] = []

    for (let i = 0; i < results.rows.length; i++) {
      columns.push(results.rows.item(i).name)
    }

    return columns
  }

  private async migrateTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const reminderColumns = await this.getTableColumns('reminders')
    if (!reminderColumns.includes('updatedAt')) {
      await this.db.executeSql('ALTER TABLE reminders ADD COLUMN updatedAt INTEGER')
    }
    if (!reminderColumns.includes('daysCount')) {
      await this.db.executeSql('ALTER TABLE reminders ADD COLUMN daysCount INTEGER')
    }

    await this.migrateMedicineUsageSnapshot()
  }

  private async migrateMedicineUsageSnapshot(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const usageColumns = await this.getTableColumns('medicine_usage')

    if (!usageColumns.includes('medicineName')) {
      await this.db.executeSql('ALTER TABLE medicine_usage ADD COLUMN medicineName TEXT')
    }
    if (!usageColumns.includes('kitName')) {
      await this.db.executeSql('ALTER TABLE medicine_usage ADD COLUMN kitName TEXT')
    }
    if (!usageColumns.includes('unitForQuantity')) {
      await this.db.executeSql('ALTER TABLE medicine_usage ADD COLUMN unitForQuantity TEXT')
    }

    await this.db.executeSql(`
      UPDATE medicine_usage
      SET medicineName = (
        SELECT name FROM medicines WHERE medicines.id = medicine_usage.medicineId
      )
      WHERE medicineName IS NULL AND EXISTS (
        SELECT 1 FROM medicines WHERE medicines.id = medicine_usage.medicineId
      )
    `)

    await this.db.executeSql(`
      UPDATE medicine_usage
      SET kitName = (
        SELECT mk.name
        FROM medicines m
        JOIN medicine_kits mk ON mk.id = m.medicineKitId
        WHERE m.id = medicine_usage.medicineId
      )
      WHERE kitName IS NULL AND EXISTS (
        SELECT 1 FROM medicines WHERE medicines.id = medicine_usage.medicineId
      )
    `)

    await this.db.executeSql(`
      UPDATE medicine_usage
      SET unitForQuantity = COALESCE(
        (SELECT unitForQuantity FROM medicines WHERE medicines.id = medicine_usage.medicineId),
        (SELECT unit FROM medicines WHERE medicines.id = medicine_usage.medicineId),
        'pcs'
      )
      WHERE unitForQuantity IS NULL AND EXISTS (
        SELECT 1 FROM medicines WHERE medicines.id = medicine_usage.medicineId
      )
    `)
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.')
    }
    return this.db
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
    }
  }
}

export const databaseService = new DatabaseService()


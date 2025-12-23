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
        createdAt TEXT NOT NULL,
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
        FOREIGN KEY (medicineId) REFERENCES medicines (id) ON DELETE CASCADE,
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


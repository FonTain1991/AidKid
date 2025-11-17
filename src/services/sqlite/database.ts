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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        avatar TEXT,
        color TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    // Таблица напоминаний
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

    // Таблица приемов по напоминаниям
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


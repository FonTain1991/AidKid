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

    return newUsage
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
}

export const databaseService = new DatabaseService()

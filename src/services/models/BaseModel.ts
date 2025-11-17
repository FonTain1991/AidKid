import { databaseService } from '../sqlite/database'

/**
 * Базовый класс для всех моделей
 * Предоставляет доступ к databaseService
 */
export abstract class BaseModel {
  protected get db() {
    return databaseService.getDb()
  }
}


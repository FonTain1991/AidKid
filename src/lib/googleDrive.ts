import { GoogleSignin } from '@react-native-google-signin/google-signin'
import RNFS from 'react-native-fs'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Конфигурация Google Drive
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3'
const GOOGLE_DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

export interface DriveFile {
  id: string
  name: string
  createdTime: string
  modifiedTime: string
  size: string
}

export interface FamilyGroup {
  id: string
  name: string
  ownerEmail: string
  members: FamilyMember[]
  createdTime: string
}

export interface FamilyMember {
  email: string
  name: string
  role: 'owner' | 'parent' | 'child'
  joinedTime: string
  isActive: boolean
}

class GoogleDriveService {
  private accessToken: string | null = null

  private readonly TOKEN_KEY = 'google_drive_access_token'

  // Инициализация Google Sign-In
  configure(webClientId: string): void {
    GoogleSignin.configure({
      scopes: [GOOGLE_DRIVE_SCOPE],
      webClientId,
      offlineAccess: true,
    })
  }

  // Инициализация сервиса (загрузка сохраненного токена)
  async initialize(): Promise<void> {
    const savedToken = await this.loadToken()
    if (savedToken) {
      this.accessToken = savedToken
    }
  }

  // Сохранить токен в AsyncStorage
  private async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TOKEN_KEY, token)
    } catch (error) {
      // Игнорируем ошибки сохранения токена
    }
  }

  // Загрузить токен из AsyncStorage
  private async loadToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY)
    } catch (error) {
      return null
    }
  }

  // Удалить токен из AsyncStorage
  private async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TOKEN_KEY)
    } catch (error) {
      // Игнорируем ошибки удаления токена
    }
  }

  // Проверка, авторизован ли пользователь
  async isSignedIn(): Promise<boolean> {
    try {
      // Сначала проверяем сохраненный токен
      const savedToken = await this.loadToken()
      if (savedToken) {
        this.accessToken = savedToken
        return true
      }

      // Если нет сохраненного токена, пробуем тихий вход
      await GoogleSignin.signInSilently()
      const tokens = await GoogleSignin.getTokens()
      this.accessToken = tokens.accessToken
      await this.saveToken(tokens.accessToken)
      return true
    } catch {
      return false
    }
  }

  // Вход в Google аккаунт
  async signIn(): Promise<void> {
    try {
      await GoogleSignin.hasPlayServices()
      await GoogleSignin.signIn()
      const tokens = await GoogleSignin.getTokens()
      this.accessToken = tokens.accessToken
      await this.saveToken(tokens.accessToken)
    } catch (error: any) {
      throw error
    }
  }

  // Выход из Google аккаунта
  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut()
      this.accessToken = null
      await this.clearToken()
    } catch (error) {
      throw error
    }
  }

  // Получить информацию о текущем пользователе
  async getCurrentUser(): Promise<any> {
    try {
      const userInfo = await GoogleSignin.getCurrentUser()
      if (userInfo?.user) {
        return {
          email: userInfo.user.email,
          name: userInfo.user.name,
          photo: userInfo.user.photo,
          id: userInfo.user.id,
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  // Обновить access token
  private async refreshToken(): Promise<void> {
    try {
      const tokens = await GoogleSignin.getTokens()
      this.accessToken = tokens.accessToken
      await this.saveToken(tokens.accessToken)
    } catch (error) {
      throw error
    }
  }

  // Загрузить файл на Google Drive (в appDataFolder)
  async uploadFile(filePath: string, fileName: string): Promise<string> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      console.log('Uploading file to Google Drive:', fileName)

      // Читаем файл как base64
      const fileContent = await RNFS.readFile(filePath, 'base64')

      // Конвертируем base64 в binary
      const binaryString = atob(fileContent)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Создаём метаданные файла
      const metadata = {
        name: fileName,
        parents: ['appDataFolder'],
        mimeType: 'application/zip',
      }

      console.log('Uploading with metadata:', metadata)

      // Используем правильный upload endpoint с multipart
      const boundary = '----AidKitBoundary' + Date.now()

      // Формируем multipart body правильно
      const metadataPart =
        `--${boundary}\r\n` +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) + '\r\n'

      const mediaPart =
        `--${boundary}\r\n` +
        'Content-Type: application/zip\r\n\r\n'

      const endBoundary = `\r\n--${boundary}--`

      // Собираем весь body
      const metadataBytes = new TextEncoder().encode(metadataPart + mediaPart)
      const endBytes = new TextEncoder().encode(endBoundary)

      // Объединяем все части
      const totalLength = metadataBytes.length + bytes.length + endBytes.length
      const fullBody = new Uint8Array(totalLength)
      fullBody.set(metadataBytes, 0)
      fullBody.set(bytes, metadataBytes.length)
      fullBody.set(endBytes, metadataBytes.length + bytes.length)

      const createResponse = await fetch(
        `${GOOGLE_DRIVE_UPLOAD_API}/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: fullBody,
        }
      )

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error('Upload failed:', errorText)
        throw new Error(`Upload failed: ${createResponse.status}`)
      }

      const fileData = await createResponse.json()
      console.log('File uploaded successfully:', fileData.id)
      return fileData.id
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw error
    }
  }

  // Получить список файлов из Google Drive (appDataFolder)
  async listFiles(): Promise<DriveFile[]> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files?spaces=appDataFolder&fields=files(id,name,createdTime,modifiedTime,size)&orderBy=modifiedTime desc`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.status}`)
      }

      const result = await response.json()
      return result.files || []
    } catch (error) {
      console.error('Failed to list files:', error)
      throw error
    }
  }

  // Скачать файл с Google Drive
  async downloadFile(fileId: string, destPath: string): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      console.log('Downloading file from Google Drive:', fileId)

      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files/${fileId}?alt=media`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`)
      }

      // Получаем бинарные данные
      const blob = await response.blob()
      const reader = new FileReader()

      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const resultStr = reader.result as string
            const [, base64Data] = resultStr.split(',')
            await RNFS.writeFile(destPath, base64Data, 'base64')
            console.log('File downloaded successfully:', destPath)
            resolve()
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Failed to download file:', error)
      throw error
    }
  }

  // Удалить файл с Google Drive
  async deleteFile(fileId: string): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      const response = await fetch(`${GOOGLE_DRIVE_API}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status}`)
      }

      console.log('File deleted successfully:', fileId)
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }

  // Получить информацию о файле
  async getFileInfo(fileId: string): Promise<DriveFile> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files/${fileId}?fields=id,name,createdTime,modifiedTime,size`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to get file info: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get file info:', error)
      throw error
    }
  }

  // === СЕМЕЙНЫЕ ГРУППЫ ===

  // Создать семейную группу
  async createFamilyGroup(groupName: string): Promise<FamilyGroup> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        throw new Error('Пользователь не авторизован')
      }

      console.log('createFamilyGroup: Creating group:', groupName)

      const familyGroup: FamilyGroup = {
        id: `family_${Date.now()}`,
        name: groupName,
        ownerEmail: currentUser.email,
        members: [{
          email: currentUser.email,
          name: currentUser.name || currentUser.email,
          role: 'owner',
          joinedTime: new Date().toISOString(),
          isActive: true
        }],
        createdTime: new Date().toISOString()
      }

      // Сохраняем информацию о семейной группе в Google Drive
      const groupData = {
        name: `AidKit_Family_${groupName}_${Date.now()}.json`,
        parents: ['appDataFolder'],
        mimeType: 'application/json'
      }

      console.log('createFamilyGroup: Uploading to Google Drive...')

      const response = await fetch(`${GOOGLE_DRIVE_API}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...groupData,
          description: JSON.stringify(familyGroup)
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log('createFamilyGroup: Upload failed:', response.status, errorText)
        throw new Error('Не удалось создать семейную группу')
      }

      const fileData = await response.json()
      familyGroup.id = fileData.id
      console.log('createFamilyGroup: Group created successfully:', fileData.id)

      return familyGroup
    } catch (error) {
      console.log('createFamilyGroup: Error:', error)
      throw error
    }
  }

  // Получить семейную группу пользователя
  async getFamilyGroup(): Promise<FamilyGroup | null> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        console.log('getFamilyGroup: No current user')
        return null
      }

      console.log('getFamilyGroup: Searching for family group files...')

      // Ищем файл семейной группы в appDataFolder
      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files?q=name contains 'AidKit_Family' and parents in 'appDataFolder'`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.log('getFamilyGroup: Failed to search files:', response.status, errorText)

        if (response.status === 403) {
          throw new Error('Нет доступа к Google Drive. Проверьте настройки в Google Cloud Console:\n\n1. Включен ли Google Drive API\n2. Правильно ли настроены OAuth клиенты\n3. Добавлены ли нужные разрешения')
        }

        return null
      }

      const data = await response.json()
      console.log('getFamilyGroup: Found files:', data.files?.length || 0)

      if (data.files && data.files.length > 0) {
        // Загружаем содержимое файла
        const fileResponse = await fetch(
          `${GOOGLE_DRIVE_API}/files/${data.files[0].id}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`
            }
          }
        )

        if (fileResponse.ok) {
          const groupData = await fileResponse.json()
          console.log('getFamilyGroup: Loaded group data:', groupData.name)
          return groupData
        }
        console.log('getFamilyGroup: Failed to load file content:', fileResponse.status)


      }

      console.log('getFamilyGroup: No family group found')
      return null
    } catch (error) {
      console.log('getFamilyGroup: Error:', error)
      return null
    }
  }

  // Пригласить участника в семейную группу
  async inviteFamilyMember(memberEmail: string, memberName: string, role: 'parent' | 'child' = 'parent'): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      const familyGroup = await this.getFamilyGroup()
      if (!familyGroup) {
        throw new Error('Семейная группа не найдена')
      }

      // Проверяем, не является ли пользователь уже участником
      const existingMember = familyGroup.members.find(m => m.email === memberEmail)
      if (existingMember) {
        throw new Error('Пользователь уже является участником группы')
      }

      // Добавляем нового участника
      const newMember: FamilyMember = {
        email: memberEmail,
        name: memberName,
        role,
        joinedTime: new Date().toISOString(),
        isActive: false // Будет активирован после принятия приглашения
      }

      familyGroup.members.push(newMember)

      // Обновляем файл семейной группы
      await this.updateFamilyGroup(familyGroup)

      // TODO: Отправить email приглашение через Gmail API
      // Пока просто сохраняем в группе
    } catch (error) {
      throw error
    }
  }

  // Обновить семейную группу
  private async updateFamilyGroup(familyGroup: FamilyGroup): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files/${familyGroup.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            description: JSON.stringify(familyGroup)
          })
        }
      )

      if (!response.ok) {
        throw new Error('Не удалось обновить семейную группу')
      }
    } catch (error) {
      throw error
    }
  }

  // Принять приглашение в семейную группу
  async acceptFamilyInvitation(): Promise<FamilyGroup | null> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        return null
      }

      // Ищем семейные группы, где пользователь является участником
      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files?q=name contains 'AidKit_Family' and parents in 'appDataFolder'`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        }
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      for (const file of data.files || []) {
        const fileResponse = await fetch(
          `${GOOGLE_DRIVE_API}/files/${file.id}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`
            }
          }
        )

        if (fileResponse.ok) {
          const groupData = await fileResponse.json()
          const member = groupData.members.find((m: FamilyMember) => m.email === currentUser.email)

          if (member && !member.isActive) {
            // Активируем участника
            member.isActive = true
            groupData.members = groupData.members.map((m: FamilyMember) => (m.email === currentUser.email ? member : m))

            // Обновляем группу
            await this.updateFamilyGroup(groupData)
            return groupData
          }
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  // === СИНХРОНИЗАЦИЯ СЕМЕЙНЫХ ДАННЫХ ===

  // Загрузить семейные данные из Google Drive
  async syncFamilyData(): Promise<any> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      const familyGroup = await this.getFamilyGroup()
      if (!familyGroup) {
        throw new Error('Семейная группа не найдена')
      }

      // Ищем файл с семейными данными
      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files?q=name contains 'AidKit_Family_Data' and parents in 'appDataFolder'`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        }
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      if (data.files && data.files.length > 0) {
        // Загружаем содержимое файла
        const fileResponse = await fetch(
          `${GOOGLE_DRIVE_API}/files/${data.files[0].id}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`
            }
          }
        )

        if (fileResponse.ok) {
          const familyData = await fileResponse.json()
          return {
            data: familyData,
            fileId: data.files[0].id,
            lastModified: data.files[0].modifiedTime
          }
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  // Загрузить семейные данные в Google Drive
  async uploadFamilyData(familyData: any): Promise<string> {
    try {
      if (!this.accessToken) {
        await this.refreshToken()
      }

      const familyGroup = await this.getFamilyGroup()
      if (!familyGroup) {
        throw new Error('Семейная группа не найдена')
      }

      // Проверяем, есть ли уже файл с семейными данными
      const existingData = await this.syncFamilyData()

      const fileName = `AidKit_Family_Data_${familyGroup.id}.json`
      const fileContent = JSON.stringify(familyData, null, 2)

      if (existingData) {
        // Обновляем существующий файл
        const response = await fetch(
          `${GOOGLE_DRIVE_API}/files/${existingData.fileId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              description: fileContent
            })
          }
        )

        if (!response.ok) {
          throw new Error('Не удалось обновить семейные данные')
        }

        return existingData.fileId
      }
      // Создаем новый файл
      const response = await fetch(`${GOOGLE_DRIVE_API}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fileName,
          parents: ['appDataFolder'],
          mimeType: 'application/json',
          description: fileContent
        })
      })

      if (!response.ok) {
        throw new Error('Не удалось загрузить семейные данные')
      }

      const fileData = await response.json()
      return fileData.id


    } catch (error) {
      throw error
    }
  }

  // Получить изменения в семейных данных
  async getFamilyDataChanges(): Promise<{ hasChanges: boolean; lastModified?: string }> {
    try {
      const familyData = await this.syncFamilyData()
      if (!familyData) {
        return { hasChanges: false }
      }

      // Получаем локальную дату последней синхронизации
      const lastSyncKey = 'family_data_last_sync'
      const lastSync = await AsyncStorage.getItem(lastSyncKey)

      if (!lastSync) {
        // Первая синхронизация
        await AsyncStorage.setItem(lastSyncKey, familyData.lastModified)
        return { hasChanges: true, lastModified: familyData.lastModified }
      }

      const hasChanges = new Date(familyData.lastModified) > new Date(lastSync)

      if (hasChanges) {
        await AsyncStorage.setItem(lastSyncKey, familyData.lastModified)
      }

      return {
        hasChanges,
        lastModified: familyData.lastModified
      }
    } catch (error) {
      return { hasChanges: false }
    }
  }

  // Синхронизировать данные с семейной группой
  async syncWithFamilyGroup(localData: any): Promise<any> {
    try {
      const familyGroup = await this.getFamilyGroup()
      if (!familyGroup) {
        return localData // Если нет семейной группы, возвращаем локальные данные
      }

      const changes = await this.getFamilyDataChanges()

      if (changes.hasChanges) {
        // Есть изменения в облаке, загружаем их
        const cloudData = await this.syncFamilyData()
        if (cloudData) {
          // Объединяем локальные и облачные данные
          return this.mergeFamilyData(localData, cloudData.data)
        }
      } else {
        // Нет изменений в облаке, загружаем локальные данные
        await this.uploadFamilyData(localData)
        return localData
      }

      return localData
    } catch (error) {
      return localData
    }
  }

  // Объединить локальные и облачные данные
  private mergeFamilyData(localData: any, cloudData: any): any {
    // Простая стратегия слияния: берем более новые данные
    const mergedData = { ...cloudData }

    // Объединяем аптечки
    if (localData.medicineKits && cloudData.medicineKits) {
      mergedData.medicineKits = this.mergeArrays(
        localData.medicineKits,
        cloudData.medicineKits,
        'id'
      )
    }

    // Объединяем лекарства
    if (localData.medicines && cloudData.medicines) {
      mergedData.medicines = this.mergeArrays(
        localData.medicines,
        cloudData.medicines,
        'id'
      )
    }

    // Объединяем напоминания
    if (localData.reminders && cloudData.reminders) {
      mergedData.reminders = this.mergeArrays(
        localData.reminders,
        cloudData.reminders,
        'id'
      )
    }

    // Объединяем членов семьи
    if (localData.familyMembers && cloudData.familyMembers) {
      mergedData.familyMembers = this.mergeArrays(
        localData.familyMembers,
        cloudData.familyMembers,
        'id'
      )
    }

    return mergedData
  }

  // Объединить два массива по ID, приоритет у более новых записей
  private mergeArrays(localArray: any[], cloudArray: any[], idField: string): any[] {
    const merged = [...cloudArray]

    for (const localItem of localArray) {
      const existingIndex = merged.findIndex(item => item[idField] === localItem[idField])

      if (existingIndex >= 0) {
        // Элемент существует, сравниваем даты
        const localDate = new Date(localItem.updated_at || localItem.created_at)
        const cloudDate = new Date(merged[existingIndex].updated_at || merged[existingIndex].created_at)

        if (localDate > cloudDate) {
          merged[existingIndex] = localItem
        }
      } else {
        // Новый элемент, добавляем
        merged.push(localItem)
      }
    }

    return merged
  }
}

export const googleDriveService = new GoogleDriveService()


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
}

export const googleDriveService = new GoogleDriveService()


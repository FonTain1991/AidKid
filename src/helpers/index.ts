import i18n from '@/i18n'
import { launchImageLibrary, launchCamera, ImagePickerResponse, Asset } from 'react-native-image-picker'
import { Platform, PermissionsAndroid, Alert } from 'react-native'
import RNFS from 'react-native-fs'

const PHOTOS_DIR = `${RNFS.DocumentDirectoryPath}/medicine_photos`

/**
 * Инициализация директории для фото
 */
export async function initPhotosDirectory(): Promise<void> {
  try {
    const exists = await RNFS.exists(PHOTOS_DIR)
    if (!exists) {
      await RNFS.mkdir(PHOTOS_DIR)
    }
  } catch (error) {
    console.error('Failed to create photos directory:', error)
  }
}

/**
 * Запрос разрешения на камеру (Android)
 */
async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: i18n.t('notifications.cameraPermission'),
        message: i18n.t('photoPicker.cameraPermissionMessage'),
        buttonNeutral: i18n.t('common.later'),
        buttonNegative: i18n.t('common.cancel'),
        buttonPositive: i18n.t('common.ok'),
      }
    )
    return granted === PermissionsAndroid.RESULTS.GRANTED
  } catch (err) {
    console.warn('Camera permission error:', err)
    return false
  }
}

/**
 * Выбор источника изображения
 */
export async function pickMedicinePhoto(): Promise<string | null> {
  return new Promise(resolve => {
    Alert.alert(
      i18n.t('photoPicker.addPhoto'),
      i18n.t('photoPicker.chooseSource'),
      [
        {
          text: i18n.t('notifications.camera'),
          onPress: async () => {
            const hasPermission = await requestCameraPermission()
            if (!hasPermission) {
              Alert.alert(i18n.t('support.error'), i18n.t('photoPicker.noCameraPermission'))
              resolve(null)
              return
            }
            const result = await takePhoto()
            resolve(result)
          }
        },
        {
          text: i18n.t('notifications.gallery'),
          onPress: async () => {
            const result = await pickFromGallery()
            resolve(result)
          }
        },
        {
          text: i18n.t('common.cancel'),
          style: 'cancel',
          onPress: () => resolve(null)
        }
      ]
    )
  })
}

/**
 * Сделать фото с камеры
 */
async function takePhoto(): Promise<string | null> {
  try {
    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      quality: 0.7,
      maxWidth: 1024,
      maxHeight: 1024,
    })

    return await processImageResult(result)
  } catch (error) {
    console.error('Take photo error:', error)
    return null
  }
}

/**
 * Выбрать фото из галереи
 */
async function pickFromGallery(): Promise<string | null> {
  try {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      maxWidth: 1024,
      maxHeight: 1024,
    })

    return await processImageResult(result)
  } catch (error) {
    console.error('Pick from gallery error:', error)
    return null
  }
}

/**
 * Обработка результата выбора изображения
 */
async function processImageResult(result: ImagePickerResponse): Promise<string | null> {
  if (result.didCancel) {
    return null
  }

  if (result.errorCode) {
    console.error('Image picker error:', result.errorCode, result.errorMessage)
    Alert.alert(i18n.t('support.error'), i18n.t('photoPicker.failedToLoad'))
    return null
  }

  const asset = result.assets?.[0]
  if (!asset?.uri) {
    return null
  }

  // Сохраняем файл в нашу директорию
  return await savePhotoToLocalStorage(asset)
}

/**
 * Сохранение фото в локальное хранилище
 */
async function savePhotoToLocalStorage(asset: Asset): Promise<string | null> {
  try {
    await initPhotosDirectory()

    const fileName = `medicine_${Date.now()}.jpg`
    const destPath = `${PHOTOS_DIR}/${fileName}`

    // Копируем файл
    await RNFS.copyFile(asset.uri!, destPath)
    return destPath
  } catch (error) {
    console.error('Failed to save photo:', error)
    Alert.alert(i18n.t('support.error'), i18n.t('photoPicker.failedToSave'))
    return null
  }
}

/**
 * Удаление фото лекарства
 */
export async function deleteMedicinePhoto(photoPath: string): Promise<void> {
  try {
    const exists = await RNFS.exists(photoPath)
    if (exists) {
      await RNFS.unlink(photoPath)
    }
  } catch (error) {
    console.error('Failed to delete photo:', error)
  }
}

/**
 * Получить URI фото для отображения
 */
export function getMedicinePhotoUri(photoPath?: string): string | null {
  if (!photoPath) {
    return null
  }

  // Для Android нужен префикс file://
  if (Platform.OS === 'android' && !photoPath.startsWith('file://')) {
    return `file://${photoPath}`
  }

  return photoPath
}

export const generateReactKey = (prefix: string = 'key'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const getValuesForList = (items: any[]) => {
  return items.map(item => ({
    label: item.name,
    value: item.id
  }))
}
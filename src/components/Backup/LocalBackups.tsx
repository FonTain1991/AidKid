import { useEvent } from '@/hooks'
import { backupService, googleDriveService } from '@/lib'
import { useTheme } from '@/providers/theme'
import { useAppStore } from '@/store'
import { memo, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, View } from 'react-native'
import { Text } from '../Text'
import { useStyles } from './hooks'

interface LocalBackup {
  path: string
  name: string
  date: Date
  size: number
}

export const LocalBackups = memo(() => {
  const { colors } = useTheme()
  const { googleDrive, localBackups } = useAppStore(state => state)
  const [localBackupsState, setLocalBackupsState] = useState<LocalBackup[]>([])
  const [loading, setLoading] = useState(false)
  const styles = useStyles()

  const loadData = useEvent(() => backupService.getBackupList().then(setLocalBackupsState))

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatDate = useEvent((date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  })

  const formatSize = useEvent((bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} Б`
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} КБ`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
  })


  const handleCreateBackup = () => {
    Alert.alert(
      'Создать резервную копию',
      'Будут сохранены все данные и фотографии лекарств',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Создать',
          onPress: async () => {
            setLoading(true)
            try {
              await backupService.createBackup()
              await loadData()
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось создать резервную копию')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleDeleteBackup = useEvent((backup: LocalBackup) => {
    Alert.alert('Удалить резервную копию', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await backupService.deleteBackup(backup.path)
            await loadData()
          } catch (error: any) {
            Alert.alert('Ошибка', error.message || 'Не удалось удалить резервную копию')
          }
        },
      },
    ])
  })

  // const handleShareBackup = useEvent(async (backup: LocalBackup) => {
  //   try {
  //     // Проверяем, что путь не пустой
  //     if (!backup.path) {
  //       Alert.alert('Ошибка', 'Путь к файлу не указан')
  //       return
  //     }

  //     // Проверяем, что файл существует
  //     const fileExists = await RNFS.exists(backup.path)
  //     if (!fileExists) {
  //       Alert.alert('Ошибка', 'Файл не найден')
  //       return
  //     }

  //     // Убираем file:// префикс, если он есть
  //     const cleanPath = backup.path.replace(/^file:\/\//, '')

  //     // Для Android используем filepath, для iOS - url с file://
  //     const shareOptions: any = {
  //       type: 'application/zip',
  //       title: 'Поделиться резервной копией',
  //       url: cleanPath,
  //     }

  //     // shareOptions.filepath = cleanPath

  //     await Share.open(shareOptions)
  //   } catch (error: any) {
  //     console.log(error)
  //     if (error.message !== 'User did not share') {
  //       Alert.alert('Ошибка', 'Не удалось поделиться файлом')
  //     }
  //   }
  // })

  const handleRestoreBackup = useEvent((backup: LocalBackup) => {
    Alert.alert(
      'Восстановить данные',
      'Все текущие данные будут заменены. Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Восстановить',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              await backupService.restoreBackup(backup.path)
              Alert.alert(
                '✅ Успешно',
                'Данные и напоминания восстановлены!\n\n' +
                '⚠️ ВАЖНО: Перезапустите приложение, чтобы все напоминания отобразились корректно.',
                [{ text: 'Понятно' }]
              )
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось восстановить данные')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  })

  const handleUploadToDrive = async (backup: LocalBackup) => {
    if (!googleDrive.isSignedIn) {
      Alert.alert('Ошибка', 'Необходимо войти в Google аккаунт')
      return
    }

    setLoading(true)
    try {
      await googleDriveService.uploadFile(backup.path, backup.name)
      googleDrive.setIsRefetching(true)
      Alert.alert('Успешно', 'Резервная копия загружена в Google Drive')
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить в Google Drive')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (localBackups.isRefetching) {
      loadData().finally(() => {
        localBackups.setIsRefetching(false)
      })
    }
  }, [localBackups.isRefetching, localBackups, loadData])

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Локальное резервное копирование</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={handleCreateBackup}
        >
          <Text style={styles.primaryButtonText}>
            📦 Создать резервную копию
          </Text>
        </Pressable>
      </View>
      {loading && !localBackupsState.length && <ActivityIndicator size='large' color={colors.primary} />}
      {localBackupsState.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Локальные копии ({localBackupsState.length})
          </Text>
          {loading && <ActivityIndicator size='large' color={colors.primary} />}
          {localBackupsState.map((backup, index) => (
            <View key={index} style={[styles.backupItem, { borderBottomColor: colors.border }]}>
              <View style={styles.backupInfo}>
                <Text style={[styles.backupName, { color: colors.text }]}>📄 {backup.name}</Text>
                <Text style={[styles.backupDate, { color: colors.muted }]}>
                  {formatDate(backup.date)}
                </Text>
                <Text style={[styles.backupSize, { color: colors.muted }]}>
                  {formatSize(backup.size)}
                </Text>
              </View>
              <View style={styles.backupActions}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleRestoreBackup(backup)}
                >
                  <Text style={styles.actionButtonText}>Восстановить</Text>
                </Pressable>
                {/* <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleShareBackup(backup)}
                >
                  <Text style={styles.actionButtonText}>Поделиться</Text>
                </Pressable> */}
                {googleDrive.isSignedIn && (
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: '#4285F4' }]}
                    onPress={() => handleUploadToDrive(backup)}
                  >
                    <Text style={styles.actionButtonText}>☁️ Загрузить</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.error }]}
                  onPress={() => handleDeleteBackup(backup)}
                >
                  <Text style={styles.actionButtonText}>Удалить</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  )
})
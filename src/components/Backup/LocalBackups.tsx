import { useEvent } from '@/hooks'
import { backupService, googleDriveService } from '@/lib'
import { useTheme } from '@/providers/theme'
import { useAppStore } from '@/store'
import { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      t('backup.createBackup'),
      t('backup.createBackupDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('backup.create'),
          onPress: async () => {
            setLoading(true)
            try {
              await backupService.createBackup()
              await loadData()
            } catch (error: any) {
              Alert.alert(t('support.error'), error.message || t('backup.failedToCreate'))
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleDeleteBackup = useEvent((backup: LocalBackup) => {
    Alert.alert(t('backup.deleteBackup'), t('backup.deleteBackupConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await backupService.deleteBackup(backup.path)
            await loadData()
          } catch (error: any) {
            Alert.alert(t('support.error'), error.message || t('backup.failedToDelete'))
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
      t('backup.restoreData'),
      t('backup.restoreDataDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('backup.restore'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              await backupService.restoreBackup(backup.path)
              Alert.alert(
                t('backup.success'),
                t('backup.dataRestored') + '\n\n' + t('backup.restartAppForReminders'),
                [{ text: t('common.gotIt') }]
              )
            } catch (error: any) {
              Alert.alert(t('support.error'), error.message || t('backup.failedToRestore'))
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
      Alert.alert(t('support.error'), t('backup.loginRequired'))
      return
    }

    setLoading(true)
    try {
      await googleDriveService.uploadFile(backup.path, backup.name)
      googleDrive.setIsRefetching(true)
      Alert.alert(t('backup.success'), t('backup.backupUploaded'))
    } catch (error: any) {
      Alert.alert(t('support.error'), error.message || t('backup.failedToUpload'))
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
        <Text style={styles.sectionTitle}>{t('backup.localBackup')}</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={handleCreateBackup}
        >
          <Text style={styles.primaryButtonText}>
            {t('backup.createBackupButton')}
          </Text>
        </Pressable>
      </View>
      {loading && !localBackupsState.length && <ActivityIndicator size='large' color={colors.primary} />}
      {localBackupsState.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('backup.localCopies', { count: localBackupsState.length })}
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
                  <Text style={styles.actionButtonText}>{t('backup.restore')}</Text>
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
                    <Text style={styles.actionButtonText}>{t('backup.upload')}</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.error }]}
                  onPress={() => handleDeleteBackup(backup)}
                >
                  <Text style={styles.actionButtonText}>{t('common.delete')}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  )
})
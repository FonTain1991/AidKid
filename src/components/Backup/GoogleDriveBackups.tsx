import { SPACING } from '@/constants'
import { useEvent } from '@/hooks'
import { backupService, DriveFile, googleDriveService } from '@/lib'
import { useTheme } from '@/providers/theme'
import { useAppStore } from '@/store'
import NetInfo from '@react-native-community/netinfo'
import { memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Pressable, View } from 'react-native'
import { Row } from '../Layout'
import { Text } from '../Text'
import { useStyles } from './hooks'

const WEB_CLIENT_ID = '464124582533-2ctqatjjbk7h1lgu4d1facpe017p167j.apps.googleusercontent.com'

export const GoogleDriveBackups = memo(() => {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { googleDrive, localBackups } = useAppStore(state => state)
  const [driveBackups, setDriveBackups] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingForUpdate, setLoadingForUpdate] = useState(false)
  const [loadingForDelete, setLoadingForDelete] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isOnline, setIsOnline] = useState(true)

  const styles = useStyles()

  const loadData = useEvent(() => googleDriveService.listFiles().then(setDriveBackups))

  const onSignedIn = useEvent(async () => {
    if (!isOnline) {
      return
    }
    const signedIn = await googleDriveService.isSignedIn()
    googleDrive.setIsSignedIn(signedIn)
    if (signedIn) {
      try {
        const user = await googleDriveService.getCurrentUser()
        if (user && user.email) {
          setUserEmail(user.email)
        } else {
          setUserEmail(t('backup.googleUser'))
        }
        // Загружаем бэкапы из Google Drive
        await loadData()
      } catch (error: any) {
        if (error.message?.includes('DEVELOPER_ERROR')) {
          Alert.alert(
            t('backup.googleDriveError'),
            t('backup.googleDriveErrorDesc')
          )
        }
      }
    }
  })

  useEffect(() => {
    onSignedIn()
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false)
    })

    return () => unsubscribe()
  }, [onSignedIn])

  useEffect(() => {
    if (googleDrive.isRefetching) {
      setLoadingForUpdate(true)
      loadData().then(() => {
        googleDrive.setIsRefetching(false)
      }).finally(() => {
        setLoadingForUpdate(false)
      })
    }
  }, [googleDrive.isRefetching, googleDrive, loadData])

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

  const handleDeleteFromDrive = useEvent((driveFile: DriveFile) => {
    Alert.alert(t('backup.deleteFromDrive'), t('backup.deleteBackupConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setLoadingForDelete(true)
          try {
            await googleDriveService.deleteFile(driveFile.id)
            await loadData()
          } catch (error: any) {
            Alert.alert(t('support.error'), error.message || t('backup.failedToDeleteFromDrive'))
          } finally {
            setLoadingForDelete(false)
          }
        },
      },
    ])
  })

  const handleDownloadFromDrive = async (driveFile: DriveFile) => {
    try {
      setLoadingForUpdate(true)
      const backupDir = backupService.getBackupDirectory()
      const destPath = `${backupDir}/${driveFile.name}`
      await googleDriveService.downloadFile(driveFile.id, destPath)
      // Alert.alert('Успешно', 'Резервная копия скачана из Google Drive')
      localBackups.setIsRefetching(true)
      await loadData()
    } catch (error: any) {
      Alert.alert(t('support.error'), error.message || t('backup.failedToDownload'))
    } finally {
      setLoadingForUpdate(false)
    }
  }

  const checkInternetConnection = async (): Promise<boolean> => {
    const netInfo = await NetInfo.fetch()
    return netInfo.isConnected ?? false
  }

  const handleGoogleSignOut = () => {
    Alert.alert(t('backup.signOutConfirm'), t('backup.signOutConfirmDesc'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('backup.signOut'),
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true)
            // Настраиваем Google Sign-In перед выходом
            googleDriveService.configure(WEB_CLIENT_ID)
            await googleDriveService.signOut()
            googleDrive.setIsSignedIn(false)
            setUserEmail('')
            setDriveBackups([])
          } catch (error: any) {
            console.error('Google Sign-Out error:', error)
            Alert.alert(t('support.error'), t('backup.failedToSignOut'))
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  const handleGoogleSignIn = async () => {
    // Проверяем интернет-соединение
    const hasInternet = await checkInternetConnection()
    if (!hasInternet) {
      Alert.alert(
        t('backup.noInternet'),
        t('backup.noInternetDesc')
      )
      return
    }

    setLoading(true)
    try {
      googleDriveService.configure(WEB_CLIENT_ID)
      await googleDriveService.signIn()
      await onSignedIn()
      await loadData()
    } catch (error: any) {
      console.error('Google Sign-In error:', error)
      Alert.alert(t('support.error'), t('backup.failedToLogin'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOnline) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Google Drive</Text>
        <Text style={[styles.offlineText, { color: colors.error }]}>
          ⚠️ {t('backup.noInternet')}
        </Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Google Drive</Text>
        <Text style={[styles.offlineText, { color: colors.error }]}>
          ⚠️ {t('backup.loading')}
        </Text>
      </View>
    )
  }

  if (!googleDrive.isSignedIn) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Google Drive</Text>
        <Pressable
          style={({ pressed }) => ([
            styles.googleButton,
            {
              backgroundColor: isOnline ? '#4285F4' : '#999',
              opacity: isOnline ? 1 : 0.6
            },
            pressed && {
              opacity: 0.7
            }
          ])}
          onPress={handleGoogleSignIn}
          disabled={loading || !isOnline}
        >
          <Text style={styles.googleButtonText}>
            {t('backup.signInToDrive')}
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Google Drive</Text>
      <View style={[styles.googleInfo, { backgroundColor: colors.card }]}>
        <Text style={[styles.googleEmail, { color: colors.text }]}>✅ {userEmail}</Text>
        <Pressable onPress={handleGoogleSignOut}>
          <Text style={[styles.googleSignOut, { color: colors.error }]}>{t('backup.signOut')}</Text>
        </Pressable>
      </View>
      {driveBackups.length > 0 && (
        <View style={styles.driveBackups}>
          <Text style={[styles.subsectionTitle, { color: colors.text }]}>
            {t('backup.cloudCopies', { count: driveBackups.length })}
          </Text>
          {driveBackups.map((driveFile, index) => (
            <View key={index} style={[styles.backupItem, { borderBottomColor: colors.border }]}>
              <View style={styles.backupInfo}>
                <Text style={[styles.backupName, { color: colors.text }]}>☁️ {driveFile.name}</Text>
                <Text style={[styles.backupDate, { color: colors.muted }]}>
                  {formatDate(new Date(driveFile.modifiedTime))}
                </Text>
                <Text style={[styles.backupSize, { color: colors.muted }]}>
                  {formatSize(parseInt(driveFile.size || '0', 10))}
                </Text>
              </View>
              <View style={styles.backupActions}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: '#4285F4' }]}
                  onPress={() => handleDownloadFromDrive(driveFile)}
                  disabled={loadingForUpdate || loadingForDelete}
                >
                  <Row itemsCenter style={{ gap: SPACING.sm }}>
                    {loadingForUpdate && <ActivityIndicator size='small' color={colors.headerColor} />}<Text style={styles.actionButtonText}>{t('backup.download')}</Text>
                  </Row>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.error }]}
                  onPress={() => handleDeleteFromDrive(driveFile)}
                  disabled={loadingForDelete || loadingForUpdate}
                >
                  <Row itemsCenter style={{ gap: SPACING.sm }}>
                    {loadingForDelete && <ActivityIndicator size='small' color={colors.headerColor} />}<Text style={styles.actionButtonText}>{t('common.delete')}</Text>
                  </Row>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
})
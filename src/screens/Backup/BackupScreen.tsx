import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { backupService } from '@/shared/lib/backup'
import { googleDriveService, DriveFile } from '@/shared/lib/googleDrive'
import Share from 'react-native-share'
import { useSubscription } from '@/shared/hooks/useSubscription'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
import { Button } from '@/shared/ui/Button'
import { useCallback } from 'react'

// Web Client ID для Google Drive API (из google-services.json)
const WEB_CLIENT_ID = '464124582533-2ctqatjjbk7h1lgu4d1facpe017p167j.apps.googleusercontent.com'

interface LocalBackup {
  path: string
  name: string
  date: Date
  size: number
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export function BackupScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const { isPremium, isLoading: subscriptionLoading, refreshStatus } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [localBackups, setLocalBackups] = useState<LocalBackup[]>([])
  const [driveBackups, setDriveBackups] = useState<DriveFile[]>([])
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isOnline, setIsOnline] = useState(true)

  // Обновляем статус подписки при возвращении на экран
  useFocusEffect(
    useCallback(() => {
      refreshStatus()
    }, [refreshStatus])
  )

  useEffect(() => {
    loadData()

    // Подписываемся на изменения состояния сети
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false)
    })

    return () => unsubscribe()
  }, [])

  // Проверка интернет-соединения
  const checkInternetConnection = async (): Promise<boolean> => {
    const netInfo = await NetInfo.fetch()
    return netInfo.isConnected ?? false
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Конфигурируем Google Sign-In
      googleDriveService.configure(WEB_CLIENT_ID)

      // Инициализируем Google Drive сервис
      await googleDriveService.initialize()

      // Загружаем локальные бэкапы
      const locals = await backupService.getBackupList()
      setLocalBackups(locals)

      // Проверяем авторизацию в Google только если есть интернет
      if (isOnline) {
        const signedIn = await googleDriveService.isSignedIn()
        setIsSignedIn(signedIn)

        if (signedIn) {
          try {
            const user = await googleDriveService.getCurrentUser()
            if (user && user.email) {
              setUserEmail(user.email)
            } else {
              setUserEmail('Пользователь Google')
            }
            // Загружаем бэкапы из Google Drive
            const drives = await googleDriveService.listFiles()
            setDriveBackups(drives)
          } catch (error: any) {
            console.error('Error loading Google Drive data:', error)
            if (error.message?.includes('DEVELOPER_ERROR')) {
              Alert.alert(
                'Ошибка конфигурации Google Drive',
                'Проверьте настройки Google Cloud Console:\n\n1. Включен ли Google Drive API\n2. Правильно ли настроены OAuth клиенты\n3. Добавлен ли Web Client ID'
              )
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

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
              Alert.alert('Успешно', 'Резервная копия создана')
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

  const handleRestoreBackup = (backup: LocalBackup) => {
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
  }

  const handleDeleteBackup = (backup: LocalBackup) => {
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
  }

  const handleShareBackup = async (backup: LocalBackup) => {
    try {
      await Share.open({
        url: `file://${backup.path}`,
        type: 'application/zip',
        title: 'Поделиться резервной копией',
      })
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        Alert.alert('Ошибка', 'Не удалось поделиться файлом')
      }
    }
  }

  const handleGoogleSignIn = async () => {
    // Проверяем интернет-соединение
    const hasInternet = await checkInternetConnection()
    if (!hasInternet) {
      Alert.alert(
        'Нет интернет-соединения',
        'Для авторизации в Google Drive необходимо подключение к интернету. Проверьте соединение и попробуйте снова.'
      )
      return
    }

    setLoading(true)
    try {
      const WEB_CLIENT_ID = '464124582533-2ctqatjjbk7h1lgu4d1facpe017p167j.apps.googleusercontent.com'
      googleDriveService.configure(WEB_CLIENT_ID)
      await googleDriveService.signIn()
      await loadData()
    } catch (error: any) {
      console.error('Google Sign-In error:', error)
      Alert.alert('Ошибка', 'Не удалось войти в Google аккаунт')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignOut = () => {
    Alert.alert('Выход из аккаунта', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          try {
            await googleDriveService.signOut()
            setIsSignedIn(false)
            setUserEmail('')
            setDriveBackups([])
          } catch (error: any) {
            Alert.alert('Ошибка', 'Не удалось выйти из аккаунта')
          }
        },
      },
    ])
  }

  const handleUploadToDrive = async (backup: LocalBackup) => {
    if (!isSignedIn) {
      Alert.alert('Ошибка', 'Необходимо войти в Google аккаунт')
      return
    }

    setLoading(true)
    try {
      await googleDriveService.uploadFile(backup.path, backup.name)
      Alert.alert('Успешно', 'Резервная копия загружена в Google Drive')
      await loadData()
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить в Google Drive')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFromDrive = async (driveFile: DriveFile) => {
    setLoading(true)
    try {
      const backupDir = backupService.getBackupDirectory()
      const destPath = `${backupDir}/${driveFile.name}`
      await googleDriveService.downloadFile(driveFile.id, destPath)
      Alert.alert('Успешно', 'Резервная копия скачана из Google Drive')
      await loadData()
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось скачать из Google Drive')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFromDrive = (driveFile: DriveFile) => {
    Alert.alert('Удалить из Google Drive', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          setLoading(true)
          try {
            await googleDriveService.deleteFile(driveFile.id)
            await loadData()
          } catch (error: any) {
            Alert.alert('Ошибка', error.message || 'Не удалось удалить из Google Drive')
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} Б`
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} КБ`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
  }

  // Показываем экран подписки, если пользователь не премиум
  if (subscriptionLoading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!isPremium) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.premiumRequiredContainer}>
            <Text style={styles.premiumIcon}>💎</Text>
            <Text style={[styles.premiumTitle, { color: colors.text }]}>
              Требуется премиум подписка
            </Text>
            <Text style={[styles.premiumDescription, { color: colors.textSecondary }]}>
              Резервное копирование доступно только для премиум пользователей.{'\n\n'}
              Оформите подписку, чтобы получить доступ к резервному копированию и синхронизации данных в Google Drive, а также другим премиум функциям.
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Облачное резервное копирование
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Синхронизация между устройствами
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Неограниченные аптечки и лекарства
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Семейный доступ
                </Text>
              </View>
            </View>

            <Button
              title='Оформить подписку'
              onPress={() => navigation.navigate('Subscription')}
              variant='primary'
              size='large'
              style={styles.subscribeButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Создание резервной копии */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Локальное резервное копирование</Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateBackup}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Создание...' : '📦 Создать резервную копию'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Локальные резервные копии */}
        {localBackups.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Локальные копии ({localBackups.length})
            </Text>
            {localBackups.map((backup, index) => (
              <View key={index} style={[styles.backupItem, { borderBottomColor: colors.border }]}>
                <View style={styles.backupInfo}>
                  <Text style={[styles.backupName, { color: colors.text }]}>📄 {backup.name}</Text>
                  <Text style={[styles.backupDate, { color: colors.textSecondary }]}>
                    {formatDate(backup.date)}
                  </Text>
                  <Text style={[styles.backupSize, { color: colors.textSecondary }]}>
                    {formatSize(backup.size)}
                  </Text>
                </View>
                <View style={styles.backupActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleRestoreBackup(backup)}
                  >
                    <Text style={styles.actionButtonText}>Восстановить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleShareBackup(backup)}
                  >
                    <Text style={styles.actionButtonText}>Поделиться</Text>
                  </TouchableOpacity>
                  {isSignedIn && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#4285F4' }]}
                      onPress={() => handleUploadToDrive(backup)}
                    >
                      <Text style={styles.actionButtonText}>☁️ Загрузить</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error }]}
                    onPress={() => handleDeleteBackup(backup)}
                  >
                    <Text style={styles.actionButtonText}>Удалить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Google Drive */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Google Drive</Text>
          {!isSignedIn ? (
            <View>
              {!isOnline && (
                <View style={[styles.offlineWarning, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
                  <Text style={[styles.offlineText, { color: colors.error }]}>
                    ⚠️ Нет интернет-соединения
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.googleButton,
                  {
                    backgroundColor: isOnline ? '#4285F4' : '#999',
                    opacity: isOnline ? 1 : 0.6
                  }
                ]}
                onPress={handleGoogleSignIn}
                disabled={loading || !isOnline}
              >
                <Text style={styles.googleButtonText}>
                  {isOnline ? '☁️ Войти в Google Drive' : '☁️ Нет интернета'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.googleInfo, { backgroundColor: colors.card }]}>
                <Text style={[styles.googleEmail, { color: colors.text }]}>✅ {userEmail}</Text>
                <TouchableOpacity onPress={handleGoogleSignOut}>
                  <Text style={[styles.googleSignOut, { color: colors.error }]}>Выйти</Text>
                </TouchableOpacity>
              </View>

              {driveBackups.length > 0 && (
                <View style={styles.driveBackups}>
                  <Text style={[styles.subsectionTitle, { color: colors.text }]}>
                    Копии в облаке ({driveBackups.length})
                  </Text>
                  {driveBackups.map((driveFile, index) => (
                    <View key={index} style={[styles.backupItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.backupInfo}>
                        <Text style={[styles.backupName, { color: colors.text }]}>☁️ {driveFile.name}</Text>
                        <Text style={[styles.backupDate, { color: colors.textSecondary }]}>
                          {formatDate(new Date(driveFile.modifiedTime))}
                        </Text>
                        <Text style={[styles.backupSize, { color: colors.textSecondary }]}>
                          {formatSize(parseInt(driveFile.size || '0', 10))}
                        </Text>
                      </View>
                      <View style={styles.backupActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: '#4285F4' }]}
                          onPress={() => handleDownloadFromDrive(driveFile)}
                        >
                          <Text style={styles.actionButtonText}>Скачать</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.error }]}
                          onPress={() => handleDeleteFromDrive(driveFile)}
                        >
                          <Text style={styles.actionButtonText}>Удалить</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Информация */}
        <View style={styles.section}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            💡 Резервные копии включают все ваши аптечки, лекарства, запасы, напоминания, историю приема и
            фотографии.
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            ☁️ Google Drive хранит данные в защищённой папке приложения, недоступной другим приложениям.
          </Text>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='large' color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  subsectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  primaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  backupItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  backupInfo: {
    marginBottom: SPACING.sm,
  },
  backupName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  backupDate: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  backupSize: {
    fontSize: FONT_SIZE.sm,
  },
  backupActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  googleButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  offlineWarning: {
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  offlineText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  googleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  googleEmail: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  googleSignOut: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  driveBackups: {
    marginTop: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    minHeight: 400,
  },
  premiumIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  premiumTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  premiumDescription: {
    fontSize: FONT_SIZE.md,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  featuresList: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
    color: '#4CAF50',
  },
  featureText: {
    fontSize: FONT_SIZE.md,
    flex: 1,
  },
  subscribeButton: {
    marginTop: SPACING.md,
    width: '100%',
  },
})


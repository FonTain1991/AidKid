import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { googleDriveService, FamilyGroup, FamilyMember } from '@/shared/lib/googleDrive'
import { familySyncService, SyncStatus } from '@/shared/lib/familySync'

export function FamilyAccessScreen() {
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isEnabled: false,
    lastSyncTime: null,
    isSyncing: false,
    hasChanges: false
  })

  useEffect(() => {
    loadFamilyGroup()
  }, [])

  const loadFamilyGroup = async () => {
    setLoading(true)
    try {
      const group = await googleDriveService.getFamilyGroup()
      setFamilyGroup(group)

      if (group) {
        const currentUser = await googleDriveService.getCurrentUser()
        setIsOwner(group.ownerEmail === currentUser?.email)
      }

      // Загружаем статус синхронизации
      const sync = await familySyncService.getSyncStatus()
      setSyncStatus(sync)
    } catch (error) {
      console.error('Failed to load family group:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFamilyGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Ошибка', 'Введите название семейной группы')
      return
    }

    setLoading(true)
    try {
      const group = await googleDriveService.createFamilyGroup(newGroupName.trim())
      setFamilyGroup(group)
      setIsOwner(true)
      setNewGroupName('')
      Alert.alert('Успешно', 'Семейная группа создана!')
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось создать семейную группу')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async () => {
    if (!newMemberEmail.trim() || !newMemberName.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля')
      return
    }

    setLoading(true)
    try {
      await googleDriveService.inviteFamilyMember(
        newMemberEmail.trim(),
        newMemberName.trim(),
        'parent'
      )
      setNewMemberEmail('')
      setNewMemberName('')
      await loadFamilyGroup()
      Alert.alert('Успешно', 'Приглашение отправлено!')
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отправить приглашение')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    setLoading(true)
    try {
      const group = await googleDriveService.acceptFamilyInvitation()
      if (group) {
        setFamilyGroup(group)
        Alert.alert('Успешно', 'Вы присоединились к семейной группе!')
      } else {
        Alert.alert('Информация', 'Нет активных приглашений')
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось принять приглашение')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSync = async () => {
    try {
      const newEnabled = !syncStatus.isEnabled
      await familySyncService.setSyncEnabled(newEnabled)
      setSyncStatus(prev => ({ ...prev, isEnabled: newEnabled }))

      if (newEnabled) {
        Alert.alert('Синхронизация включена', 'Данные будут автоматически синхронизироваться с семейной группой')
      } else {
        Alert.alert('Синхронизация отключена', 'Автоматическая синхронизация отключена')
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось изменить настройки синхронизации')
    }
  }

  const handleForceSync = async () => {
    setLoading(true)
    try {
      await familySyncService.forceSync()
      await loadFamilyGroup()
      Alert.alert('Успешно', 'Данные синхронизированы с семейной группой')
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось синхронизировать данные')
    } finally {
      setLoading(false)
    }
  }

  const handlePullData = async () => {
    setLoading(true)
    try {
      const success = await familySyncService.pullFamilyData()
      if (success) {
        await loadFamilyGroup()
        Alert.alert('Успешно', 'Данные загружены из семейной группы')
      } else {
        Alert.alert('Информация', 'Нет новых данных для загрузки')
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  const handleDebugInfo = async () => {
    try {
      const currentUser = await googleDriveService.getCurrentUser()
      const familyGroup = await googleDriveService.getFamilyGroup()
      const syncStatus = await familySyncService.getSyncStatus()

      const debugInfo = `
Пользователь: ${currentUser?.email || 'Не авторизован'}
Семейная группа: ${familyGroup?.name || 'Не найдена'}
Синхронизация: ${syncStatus.isEnabled ? 'Включена' : 'Отключена'}
Последняя синхронизация: ${syncStatus.lastSyncTime || 'Никогда'}
      `.trim()

      Alert.alert('Отладочная информация', debugInfo)
    } catch (error: any) {
      Alert.alert('Ошибка отладки', error.message)
    }
  }

  const handleReauthorize = async () => {
    try {
      setLoading(true)
      
      // Выходим из Google аккаунта
      await googleDriveService.signOut()
      
      // Очищаем локальные данные
      setFamilyGroup(null)
      setSyncStatus({
        isEnabled: false,
        lastSyncTime: null,
        isSyncing: false,
        hasChanges: false
      })
      
      Alert.alert(
        'Переавторизация', 
        'Выйдите из Google аккаунта и войдите заново для получения новых разрешений.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Перезагружаем данные
              loadFamilyGroup()
            }
          }
        ]
      )
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось выйти из аккаунта')
    } finally {
      setLoading(false)
    }
  }

  const handleShowBypassInstructions = () => {
    Alert.alert(
      'Обход предупреждения Google',
      'Если появилось предупреждение "Google hasn\'t verified this app":\n\n' +
      '1. Нажмите "Advanced" (Дополнительно)\n' +
      '2. Нажмите "Go to AidKit (unsafe)"\n' +
      '3. Нажмите "Allow"\n\n' +
      'Это безопасно для разработки!',
      [
        { text: 'Понятно', style: 'default' }
      ]
    )
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return '👑'
      case 'parent': return '👨‍👩‍👧‍👦'
      case 'child': return '👶'
      default: return '👤'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner': return 'Владелец'
      case 'parent': return 'Родитель'
      case 'child': return 'Ребенок'
      default: return 'Участник'
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Семейный доступ</Text>

        {!familyGroup ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Создать семейную группу
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Создайте семейную группу для синхронизации данных между устройствами
            </Text>

            <TextInput
              style={[styles.input, {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder="Название семейной группы"
              placeholderTextColor={colors.textSecondary}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateFamilyGroup}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>Создать группу</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>или</Text>
            </View>

            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: colors.secondary }]}
              onPress={handleAcceptInvitation}
              disabled={loading}
            >
              <Text style={styles.acceptButtonText}>Принять приглашение</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={[styles.groupInfo, { backgroundColor: colors.card }]}>
              <Text style={[styles.groupName, { color: colors.text }]}>
                👨‍👩‍👧‍👦 {familyGroup.name}
              </Text>
              <Text style={[styles.groupCreated, { color: colors.textSecondary }]}>
                Создана: {new Date(familyGroup.createdTime).toLocaleDateString()}
              </Text>
            </View>

            <Text style={[styles.membersTitle, { color: colors.text }]}>
              Участники ({familyGroup.members.length})
            </Text>

            {familyGroup.members.map((member, index) => (
              <View key={index} style={[styles.memberItem, { backgroundColor: colors.card }]}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberIcon}>{getRoleIcon(member.role)}</Text>
                  <View>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
                      {member.email}
                    </Text>
                    <Text style={[styles.memberRole, { color: colors.primary }]}>
                      {getRoleText(member.role)}
                    </Text>
                  </View>
                </View>
                <View style={styles.memberStatus}>
                  <Text style={[
                    styles.statusText,
                    { color: member.isActive ? colors.success : colors.warning }
                  ]}>
                    {member.isActive ? '✅ Активен' : '⏳ Ожидает'}
                  </Text>
                </View>
              </View>
            ))}

            {/* Синхронизация данных */}
            <View style={styles.syncSection}>
              <Text style={[styles.syncTitle, { color: colors.text }]}>
                Синхронизация данных
              </Text>

              {!syncStatus.isEnabled && (
                <View style={[styles.syncHint, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                  <Text style={[styles.syncHintText, { color: colors.warning }]}>
                    💡 Включите автоматическую синхронизацию для обмена данными с семьей
                  </Text>
                </View>
              )}

              <View style={[styles.syncStatus, { backgroundColor: colors.card }]}>
                <View style={styles.syncStatusRow}>
                  <Text style={[styles.syncStatusLabel, { color: colors.text }]}>
                    Автоматическая синхронизация:
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.syncToggle,
                      { backgroundColor: syncStatus.isEnabled ? colors.success : colors.border }
                    ]}
                    onPress={handleToggleSync}
                  >
                    <Text style={styles.syncToggleText}>
                      {syncStatus.isEnabled ? 'Включена' : 'Отключена'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {syncStatus.lastSyncTime && (
                  <Text style={[styles.syncLastTime, { color: colors.textSecondary }]}>
                    Последняя синхронизация: {new Date(syncStatus.lastSyncTime).toLocaleString()}
                  </Text>
                )}

                {syncStatus.hasChanges && (
                  <Text style={[styles.syncChanges, { color: colors.warning }]}>
                    ⚠️ Есть изменения для синхронизации
                  </Text>
                )}
              </View>

              <View style={styles.syncActions}>
                <TouchableOpacity
                  style={[styles.syncButton, { backgroundColor: colors.primary }]}
                  onPress={handleForceSync}
                  disabled={loading}
                >
                  <Text style={styles.syncButtonText}>🔄 Синхронизировать</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.syncButton, { backgroundColor: colors.secondary }]}
                  onPress={handlePullData}
                  disabled={loading}
                >
                  <Text style={styles.syncButtonText}>⬇️ Загрузить</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.debugActions}>
                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: colors.border }]}
                  onPress={handleDebugInfo}
                >
                  <Text style={[styles.debugButtonText, { color: colors.text }]}>
                    🔍 Отладочная информация
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: colors.warning }]}
                  onPress={handleReauthorize}
                  disabled={loading}
                >
                  <Text style={[styles.debugButtonText, { color: '#FFFFFF' }]}>
                    🔄 Переавторизация
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {isOwner && (
              <View style={styles.inviteSection}>
                <Text style={[styles.inviteTitle, { color: colors.text }]}>
                  Пригласить участника
                </Text>

                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border
                  }]}
                  placeholder="Имя участника"
                  placeholderTextColor={colors.textSecondary}
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                />

                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border
                  }]}
                  placeholder="Email участника"
                  placeholderTextColor={colors.textSecondary}
                  value={newMemberEmail}
                  onChangeText={setNewMemberEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={[styles.inviteButton, { backgroundColor: colors.primary }]}
                  onPress={handleInviteMember}
                  disabled={loading}
                >
                  <Text style={styles.inviteButtonText}>Отправить приглашение</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  sectionDescription: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.md,
  },
  createButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  acceptButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  divider: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerText: {
    fontSize: FONT_SIZE.md,
  },
  groupInfo: {
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  groupName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  groupCreated: {
    fontSize: FONT_SIZE.sm,
  },
  membersTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  memberName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  memberRole: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  memberStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  inviteSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inviteTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  inviteButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  syncSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  syncTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  syncStatus: {
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  syncStatusLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  syncToggle: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
  },
  syncToggleText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  syncLastTime: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  syncChanges: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  syncActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  syncButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  syncHint: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  syncHintText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  debugButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  debugButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  debugActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
})

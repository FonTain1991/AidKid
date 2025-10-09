import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService } from '@/shared/lib/database'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { FamilyMember } from '@/entities/family-member/model/types'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl } from 'react-native'

const AVATAR_OPTIONS = ['👤', '👨', '👩', '👦', '👧', '👶', '🧑', '👴', '👵', '🧒']
const COLOR_OPTIONS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']

export function FamilyMembersScreen() {
  const { colors } = useTheme()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0])
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0])

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      await databaseService.init()
      const allMembers = await databaseService.getFamilyMembers()
      setMembers(allMembers)
    } catch (error) {
      console.error('Failed to load family members:', error)
      Alert.alert('Ошибка', 'Не удалось загрузить членов семьи')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      Alert.alert('Ошибка', 'Введите имя')
      return
    }

    try {
      await databaseService.createFamilyMember({
        name: newMemberName.trim(),
        avatar: selectedAvatar,
        color: selectedColor
      })

      setNewMemberName('')
      setSelectedAvatar(AVATAR_OPTIONS[0])
      setSelectedColor(COLOR_OPTIONS[0])
      setIsAdding(false)
      loadMembers()
      Alert.alert('✅ Добавлено', `${newMemberName} добавлен в семью`)
    } catch (error) {
      console.error('Failed to create family member:', error)
      Alert.alert('Ошибка', 'Не удалось добавить члена семьи')
    }
  }

  const handleDeleteMember = async (member: FamilyMember) => {
    Alert.alert(
      'Удалить члена семьи?',
      `Вы уверены, что хотите удалить ${member.name}?`,
      [
        {
          text: 'Отмена',
          style: 'cancel'
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteFamilyMember(member.id)
              Alert.alert('✅ Удалено', `${member.name} удален`)
              loadMembers()
            } catch (error) {
              console.error('Failed to delete family member:', error)
              Alert.alert('Ошибка', 'Не удалось удалить')
            }
          }
        }
      ]
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Загрузка...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadMembers(true)}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Члены семьи</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Укажите кто принимает лекарства
          </Text>
        </View>

        {/* Список членов семьи */}
        {members.length > 0 && (
          <View style={styles.membersList}>
            {members.map(member => (
              <View
                key={member.id}
                style={[styles.memberCard, { borderColor: colors.border }]}
              >
                <View style={[styles.memberAvatar, { backgroundColor: member.color || colors.primary }]}>
                  <Text style={styles.memberAvatarText}>{member.avatar || '👤'}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.text }]}>
                    {member.name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteMember(member)}
                >
                  <Text style={[styles.deleteButtonText, { color: colors.error }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Форма добавления */}
        {!isAdding ? (
          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsAdding(true)}
            >
              <Text style={styles.addButtonText}>➕ Добавить члена семьи</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addForm}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Новый член семьи</Text>

            {/* Выбор аватара */}
            <Text style={[styles.formLabel, { color: colors.text }]}>Аватар</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
              {AVATAR_OPTIONS.map(avatar => (
                <TouchableOpacity
                  key={avatar}
                  style={[
                    styles.avatarOption,
                    {
                      borderColor: selectedAvatar === avatar ? colors.primary : colors.border,
                      backgroundColor: selectedAvatar === avatar ? colors.primary + '15' : 'white'
                    }
                  ]}
                  onPress={() => setSelectedAvatar(avatar)}
                >
                  <Text style={styles.avatarOptionText}>{avatar}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Выбор цвета */}
            <Text style={[styles.formLabel, { color: colors.text }]}>Цвет</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color,
                      borderColor: selectedColor === color ? colors.text : 'transparent',
                      borderWidth: selectedColor === color ? 3 : 0
                    }
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            {/* Имя */}
            <Text style={[styles.formLabel, { color: colors.text }]}>Имя</Text>
            <TextInput
              style={[styles.nameInput, { borderColor: colors.border, color: colors.text }]}
              placeholder='Например: Мама, Папа, Сын...'
              placeholderTextColor={colors.textSecondary}
              value={newMemberName}
              onChangeText={setNewMemberName}
            />

            {/* Кнопки */}
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setIsAdding(false)
                  setNewMemberName('')
                  setSelectedAvatar(AVATAR_OPTIONS[0])
                  setSelectedColor(COLOR_OPTIONS[0])
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddMember}
              >
                <Text style={styles.saveButtonText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>О членах семьи</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Добавьте всех членов семьи{'\n'}
            • При создании напоминания можно указать кто принимает{'\n'}
            • В истории будет видно кто принимал лекарство{'\n'}
            • Статистика будет доступна по каждому члену семьи
          </Text>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
  },
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.heading,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
  },
  membersList: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  memberAvatarText: {
    fontSize: 28,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee',
  },
  deleteButtonText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  addButtonContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  addButton: {
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  addForm: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  formTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  avatarScroll: {
    marginBottom: SPACING.sm,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarOptionText: {
    fontSize: 32,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.md,
  },
  formButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
})


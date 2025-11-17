import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService } from '@/shared/lib/database'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { Medicine, MedicineUsage } from '@/entities/medicine/model/types'
import { MedicineKit } from '@/entities/kit/model/types'
import { FamilyMember } from '@/entities/family-member/model/types'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native'

interface HistoryItem extends MedicineUsage {
  medicineName: string
  medicineForm: string
  kitName: string
  familyMemberName?: string
  familyMemberAvatar?: string
}

interface GroupedHistory {
  date: string
  items: HistoryItem[]
}

export function HistoryScreen() {
  const { colors } = useTheme()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      console.log('🔍 Loading intake history...')

      await databaseService.init()

      // Загружаем все лекарства
      const allMedicines = await databaseService.getMedicines()
      const medicinesMap = new Map(allMedicines.map(m => [m.id, m]))

      // Загружаем все аптечки
      const allKits = await databaseService.getKits()
      const kitsMap = new Map(allKits.map(k => [k.id, k]))

      // Загружаем членов семьи
      const allFamilyMembers = await databaseService.getFamilyMembers()
      const familyMembersMap = new Map(allFamilyMembers.map(m => [m.id, m]))

      // Загружаем историю для всех лекарств
      const allHistory: HistoryItem[] = []

      for (const medicine of allMedicines) {
        try {
          const usages = await databaseService.getMedicineUsage(medicine.id)
          const kit = kitsMap.get(medicine.kitId)

          for (const usage of usages) {
            const familyMember = usage.familyMemberId ? familyMembersMap.get(usage.familyMemberId) : null
            allHistory.push({
              ...usage,
              medicineName: medicine.name,
              medicineForm: medicine.form,
              kitName: kit?.name || 'Неизвестная аптечка',
              familyMemberName: familyMember?.name,
              familyMemberAvatar: familyMember?.avatar,
            })
          }
        } catch (error) {
          console.warn(`Failed to load usage for medicine ${medicine.id}:`, error)
        }
      }

      // Сортируем по дате (новые сначала)
      allHistory.sort((a, b) => b.usageDate.getTime() - a.usageDate.getTime())

      setHistory(allHistory)

      // Группируем по датам
      const grouped = groupByDate(allHistory)
      setGroupedHistory(grouped)

      console.log(`✅ Loaded ${allHistory.length} history items`)
    } catch (error) {
      console.error('❌ Failed to load history:', error)
      Alert.alert('Ошибка', 'Не удалось загрузить историю')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const groupByDate = (items: HistoryItem[]): GroupedHistory[] => {
    const groups = new Map<string, HistoryItem[]>()

    for (const item of items) {
      const dateKey = item.usageDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

      if (!groups.has(dateKey)) {
        groups.set(dateKey, [])
      }
      groups.get(dateKey)!.push(item)
    }

    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      items
    }))
  }

  const handleDeleteItem = async (item: HistoryItem) => {
    Alert.alert(
      'Удалить запись?',
      `Удалить запись о приеме ${item.medicineName}?`,
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteMedicineUsage(item.id)
              Alert.alert('✅ Удалено', 'Запись удалена')
              loadHistory()
            } catch (error) {
              console.error('Failed to delete usage:', error)
              Alert.alert('Ошибка', 'Не удалось удалить запись')
            }
          },
        },
      ]
    )
  }

  const getTodayStats = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayItems = history.filter(item => {
      const itemDate = new Date(item.usageDate)
      itemDate.setHours(0, 0, 0, 0)
      return itemDate.getTime() === today.getTime()
    })

    return {
      count: todayItems.length,
      total: history.length
    }
  }

  const getWeekStats = () => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const weekItems = history.filter(item => item.usageDate >= weekAgo)

    return weekItems.length
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Загрузка истории...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const stats = getTodayStats()
  const weekStats = getWeekStats()

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadHistory(true)}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>История приема</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Все записи о приеме лекарств
          </Text>
        </View>

        {history.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.statNumber}>{stats.count}</Text>
              <Text style={styles.statLabel}>Сегодня</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.secondary }]}>
              <Text style={styles.statNumber}>{weekStats}</Text>
              <Text style={styles.statLabel}>За неделю</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.success }]}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Всего</Text>
            </View>
          </View>
        )}

        {groupedHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              История пуста
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Здесь будут отображаться все записи о приеме лекарств
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {groupedHistory.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.dateGroup}>
                <Text style={[styles.dateHeader, { color: colors.text }]}>
                  {group.date}
                </Text>

                {group.items.map((item, itemIndex) => (
                  <View
                    key={item.id}
                    style={[styles.historyCard, { backgroundColor: 'white', borderColor: colors.border }]}
                  >
                    <View style={styles.historyCardContent}>
                      <View style={styles.historyLeft}>
                        <View style={[styles.timeCircle, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                          <Text style={[styles.timeText, { color: colors.primary }]}>
                            {item.usageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.historyCenter}>
                        <Text style={[styles.historyMedicine, { color: colors.text }]}>
                          {item.medicineName}
                        </Text>
                        <Text style={[styles.historyForm, { color: colors.textSecondary }]}>
                          {item.medicineForm}
                        </Text>
                        <Text style={[styles.historyKit, { color: colors.textSecondary }]}>
                          📦 {item.kitName}
                        </Text>
                        {item.familyMemberName && (
                          <View style={styles.familyMemberBadge}>
                            <Text style={styles.familyMemberIcon}>{item.familyMemberAvatar || '👤'}</Text>
                            <Text style={[styles.familyMemberText, { color: colors.textSecondary }]}>
                              {item.familyMemberName}
                            </Text>
                          </View>
                        )}
                        {item.quantityUsed && (
                          <Text style={[styles.historyQuantity, { color: colors.primary }]}>
                            Принято: {item.quantityUsed}
                          </Text>
                        )}
                        {item.notes && (
                          <Text style={[styles.historyNotes, { color: colors.textSecondary }]}>
                            💬 {item.notes}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteItem(item)}
                      >
                        <Text style={[styles.deleteButtonText, { color: colors.error }]}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>О разделе "История"</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Здесь отображаются все записи о приеме лекарств{'\n'}
            • История автоматически создается при отметке приема{'\n'}
            • Можно удалить запись, нажав на ✕{'\n'}
            • Потяните вниз, чтобы обновить список
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
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: 'white',
    opacity: 0.9,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  historyList: {
    paddingHorizontal: SPACING.md,
  },
  dateGroup: {
    marginBottom: SPACING.lg,
  },
  dateHeader: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  historyCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  historyLeft: {
    marginRight: SPACING.md,
  },
  timeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: 'bold',
  },
  historyCenter: {
    flex: 1,
  },
  historyMedicine: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  historyForm: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  historyKit: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  historyQuantity: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  familyMemberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  familyMemberIcon: {
    fontSize: FONT_SIZE.md,
    marginRight: SPACING.xs,
  },
  familyMemberText: {
    fontSize: FONT_SIZE.sm,
  },
  historyNotes: {
    fontSize: FONT_SIZE.sm,
    fontStyle: 'italic',
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


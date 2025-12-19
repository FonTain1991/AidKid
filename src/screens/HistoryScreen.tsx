import { Empty } from '@/components/Empty'
import { Background, Flex, PaddingHorizontal, SafeAreaView } from '@/components/Layout'
import { Text } from '@/components/Text'
import { SPACING, FREE_LIMITS } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useNavigationBarColor, useScreenProperties, useMyNavigation } from '@/hooks'
import { databaseService } from '@/services'
import { useAppStore } from '@/store'
import { useSubscription } from '@/components/Subscription/hooks/useSubscription'
import { useTheme } from '@/providers/theme'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View, Pressable } from 'react-native'
import dayjs from 'dayjs'

interface MedicineUsage {
  id: number
  medicineId: number
  familyMemberId: number | null
  quantityUsed: number
  usageDate: string
  notes: string | null
  createdAt: number
}

interface UsageWithDetails extends MedicineUsage {
  medicineName?: string
  kitName?: string
  familyMemberName?: string
}

export function HistoryScreen() {
  const { colors } = useTheme()
  const { medicines, medicineKits, familyMembers } = useAppStore(state => state)
  const { isPremium } = useSubscription()
  const { navigate } = useMyNavigation()

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [usageHistory, setUsageHistory] = useState<MedicineUsage[]>([])

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'История'
    }
  })

  useNavigationBarColor()

  const loadHistory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      await databaseService.init()
      const db = databaseService.getDb()
      const [results] = await db.executeSql('SELECT * FROM medicine_usage ORDER BY usageDate DESC')

      const usages: MedicineUsage[] = []
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i)
        usages.push({
          id: row.id,
          medicineId: row.medicineId,
          familyMemberId: row.familyMemberId,
          quantityUsed: row.quantityUsed,
          usageDate: row.usageDate,
          notes: row.notes,
          createdAt: row.createdAt,
        })
      }

      setUsageHistory(usages)
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Фильтруем историю по лимиту для бесплатных пользователей
  const filteredHistory = useMemo(() => {
    if (isPremium) {
      return usageHistory
    }

    // Для бесплатных пользователей показываем только последние N дней
    const limitDate = dayjs().subtract(FREE_LIMITS.HISTORY_DAYS, 'day').startOf('day')
    return usageHistory.filter(usage => {
      const usageDate = dayjs(usage.usageDate)
      return usageDate.isAfter(limitDate) || usageDate.isSame(limitDate, 'day')
    })
  }, [usageHistory, isPremium])

  // Обогащаем историю данными из store
  const usageWithDetails = useMemo<UsageWithDetails[]>(() => {
    return filteredHistory.map(usage => {
      const medicine = medicines.find(m => m.id === usage.medicineId)
      const kit = medicine ? medicineKits.find(k => k.id === medicine.medicineKitId) : undefined
      const familyMember = usage.familyMemberId ? familyMembers.find(fm => fm.id === usage.familyMemberId) : undefined

      return {
        ...usage,
        medicineName: medicine?.name,
        kitName: kit?.name,
        familyMemberName: familyMember?.name,
      }
    })
  }, [filteredHistory, medicines, medicineKits, familyMembers])

  // Группируем по датам
  const groupedHistory = useMemo(() => {
    const groups: Record<string, UsageWithDetails[]> = {}

    usageWithDetails.forEach(usage => {
      const dateKey = dayjs(usage.usageDate).format('YYYY-MM-DD')

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(usage)
    })

    return Object.entries(groups)
      .map(([dateKey, usages]) => ({
        dateKey,
        usages,
        isToday: dayjs(dateKey).isSame(dayjs(), 'day'),
        isYesterday: dayjs(dateKey).isSame(dayjs().subtract(1, 'day'), 'day'),
      }))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
  }, [usageWithDetails])

  if (isLoading) {
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Flex style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Загрузка истории...
            </Text>
          </Flex>
        </Background>
      </SafeAreaView>
    )
  }

  const hasLimitedHistory = !isPremium && usageHistory.length > filteredHistory.length

  if (usageHistory.length === 0) {
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Empty
            icon='clock'
            title='Нет истории'
            description='История приемов лекарств будет отображаться здесь'
          />
        </Background>
      </SafeAreaView>
    )
  }

  if (!isPremium && filteredHistory.length === 0 && usageHistory.length > 0) {
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Flex style={styles.limitContainer}>
            <Text style={[styles.limitIcon, { color: colors.primary }]}>💎</Text>
            <Text style={[styles.limitTitle, { color: colors.text }]}>
              Расширенная история
            </Text>
            <Text style={[styles.limitDescription, { color: colors.muted }]}>
              В бесплатной версии доступна история только за последние {FREE_LIMITS.HISTORY_DAYS} дней.
              {'\n\n'}
              Оформите премиум подписку, чтобы видеть полную историю приема лекарств.
            </Text>
            <Pressable
              style={[styles.premiumButton, { backgroundColor: colors.primary }]}
              onPress={() => navigate('subscription')}
            >
              <Text style={styles.premiumButtonText}>Оформить премиум</Text>
            </Pressable>
          </Flex>
        </Background>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']}>
      <Background>
        <Flex>
          <ScrollView
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadHistory(true)}
                tintColor={colors.primary}
              />
            }
          >
            <PaddingHorizontal>
              <View style={styles.header}>
                <Text style={[styles.headerText, { color: colors.muted }]}>
                  {hasLimitedHistory
                    ? `Показано: ${filteredHistory.length} из ${usageHistory.length} записей (последние ${FREE_LIMITS.HISTORY_DAYS} дней)`
                    : `Всего записей: ${usageHistory.length}`
                  }
                </Text>
                {hasLimitedHistory && (
                  <Pressable
                    style={[styles.upgradeButton, { borderColor: colors.primary }]}
                    onPress={() => navigate('subscription')}
                  >
                    <Text style={[styles.upgradeButtonText, { color: colors.primary }]}>
                      💎 Получить полную историю
                    </Text>
                  </Pressable>
                )}
              </View>
            </PaddingHorizontal>

            {groupedHistory.map(({ dateKey, usages, isToday, isYesterday }) => (
              <View key={dateKey} style={styles.dateGroup}>
                <PaddingHorizontal>
                  <View style={styles.dateHeader}>
                    <Text style={[styles.dateLabel, { color: colors.text }]}>
                      {isToday ? 'Сегодня' : isYesterday ? 'Вчера' : dayjs(dateKey).format('DD.MM.YYYY')}
                    </Text>
                    <Text style={[styles.dateCount, { color: colors.muted }]}>
                      {usages.length} {usages.length === 1 ? 'прием' : usages.length < 5 ? 'приема' : 'приемов'}
                    </Text>
                  </View>
                </PaddingHorizontal>

                <View style={styles.historyList}>
                  {usages.map(usage => (
                    <View
                      key={usage.id}
                      style={[
                        styles.historyItem,
                        { backgroundColor: colors.card, borderColor: colors.border }
                      ]}
                    >
                      <View style={styles.historyContent}>
                        <View style={styles.historyHeader}>
                          <Text style={[styles.historyTime, { color: colors.text }]}>
                            {dayjs(usage.usageDate).format('HH:mm')}
                          </Text>
                          {usage.medicineName && (
                            <Text style={[styles.historyMedicine, { color: colors.text }]}>
                              {usage.medicineName}
                            </Text>
                          )}
                        </View>
                        <View style={styles.historyMeta}>
                          {usage.kitName && (
                            <Text style={[styles.historyMetaText, { color: colors.muted }]}>
                              📦 {usage.kitName}
                            </Text>
                          )}
                          {usage.familyMemberName && (
                            <Text style={[styles.historyMetaText, { color: colors.muted }]}>
                              👤 {usage.familyMemberName}
                            </Text>
                          )}
                        </View>
                        {usage.notes && (
                          <Text style={[styles.historyNotes, { color: colors.muted }]}>
                            {usage.notes}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.historyQuantity, { color: colors.primary }]}>
                        {usage.quantityUsed} шт.
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </Flex>
      </Background>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: SPACING.md,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  headerText: {
    fontSize: FONT_SIZE.md,
  },
  dateGroup: {
    marginBottom: SPACING.xl,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dateLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  dateCount: {
    fontSize: FONT_SIZE.sm,
  },
  historyList: {
    gap: SPACING.sm,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: SPACING.md,
    borderWidth: 1,
    marginHorizontal: SPACING.md,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs / 2,
  },
  historyTime: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  historyMedicine: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    flex: 1,
  },
  historyMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xs / 2,
  },
  historyMetaText: {
    fontSize: FONT_SIZE.sm,
  },
  historyNotes: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs / 2,
    fontStyle: 'italic',
  },
  historyQuantity: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  limitContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  limitIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  limitTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  limitDescription: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  premiumButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: SPACING.md,
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  upgradeButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: SPACING.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
})


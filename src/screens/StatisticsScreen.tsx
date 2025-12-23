import { Empty } from '@/components/Empty'
import { Background, Flex, PaddingHorizontal, SafeAreaView } from '@/components/Layout'
import { Text } from '@/components/Text'
import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
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

interface PeriodStats {
  today: number
  yesterday: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
  total: number
  averagePerDay: number
}

interface UsageWithDetails extends MedicineUsage {
  medicineName?: string
  kitName?: string
  familyMemberName?: string
}

type Period = 'week' | 'month' | 'all'

export function StatisticsScreen() {
  const { colors } = useTheme()
  const { isPremium } = useSubscription()
  const { medicines, medicineKits, familyMembers } = useAppStore(state => state)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [usageHistory, setUsageHistory] = useState<MedicineUsage[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week')
  const [stats, setStats] = useState<PeriodStats>({
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    total: 0,
    averagePerDay: 0,
  })

  useScreenProperties({
    navigationOptions: {
      headerShown: true,
      title: 'Статистика'
    }
  })

  useNavigationBarColor()

  const loadStatistics = useCallback(async (isRefresh = false) => {
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

      // Вычисляем статистику
      const now = dayjs()
      const todayStart = now.startOf('day')
      const yesterdayStart = now.subtract(1, 'day').startOf('day')
      const weekStart = now.startOf('week')
      const lastWeekStart = now.subtract(1, 'week').startOf('week')
      const monthStart = now.startOf('month')
      const lastMonthStart = now.subtract(1, 'month').startOf('month')

      const today = usages.filter(u => dayjs(u.usageDate).isAfter(todayStart)).length
      const yesterday = usages.filter(u => {
        const date = dayjs(u.usageDate)
        return date.isAfter(yesterdayStart) && date.isBefore(todayStart)
      }).length
      const thisWeek = usages.filter(u => dayjs(u.usageDate).isAfter(weekStart)).length
      const lastWeek = usages.filter(u => {
        const date = dayjs(u.usageDate)
        return date.isAfter(lastWeekStart) && date.isBefore(weekStart)
      }).length
      const thisMonth = usages.filter(u => dayjs(u.usageDate).isAfter(monthStart)).length
      const lastMonth = usages.filter(u => {
        const date = dayjs(u.usageDate)
        return date.isAfter(lastMonthStart) && date.isBefore(monthStart)
      }).length

      const totalDays = Math.max(1, Math.ceil(dayjs().diff(dayjs(usages[usages.length - 1]?.usageDate || now), 'day', true)))
      const averagePerDay = usages.length > 0 ? Number((usages.length / totalDays).toFixed(1)) : 0

      setStats({
        today,
        yesterday,
        thisWeek,
        lastWeek,
        thisMonth,
        lastMonth,
        total: usages.length,
        averagePerDay,
      })
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  // Обогащаем историю данными из store
  const usageWithDetails = useMemo<UsageWithDetails[]>(() => {
    return usageHistory.map(usage => {
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
  }, [usageHistory, medicines, medicineKits, familyMembers])

  // Фильтруем историю по выбранному периоду для премиум статистики
  const filteredHistoryForPremium = useMemo(() => {
    if (!isPremium) {
      return []
    }

    const now = dayjs()
    let startDate: dayjs.Dayjs

    if (selectedPeriod === 'week') {
      // Последние 7 дней
      startDate = now.subtract(7, 'day').startOf('day')
    } else if (selectedPeriod === 'month') {
      // Последние 30 дней
      startDate = now.subtract(30, 'day').startOf('day')
    } else {
      // Для "все время" не фильтруем, возвращаем все
      return usageHistory
    }

    const filtered = usageHistory.filter(usage => {
      const usageDate = dayjs(usage.usageDate).startOf('day')
      return usageDate.isAfter(startDate) || usageDate.isSame(startDate, 'day')
    })

    return filtered
  }, [isPremium, usageHistory, selectedPeriod])

  // Статистика по дням (график приема по дням)
  const dayStats = useMemo(() => {
    if (!isPremium || filteredHistoryForPremium.length === 0) {
      return []
    }

    const now = dayjs()
    let daysCount = 7
    let dateFormat = 'DD.MM'

    if (selectedPeriod === 'month') {
      daysCount = 30
    } else if (selectedPeriod === 'all') {
      // Для "все время" берем все дни из истории
      if (filteredHistoryForPremium.length === 0) {
        return []
      }
      const firstDate = dayjs(filteredHistoryForPremium[filteredHistoryForPremium.length - 1].usageDate).startOf('day')
      const lastDate = dayjs(filteredHistoryForPremium[0].usageDate).startOf('day')
      daysCount = lastDate.diff(firstDate, 'day') + 1
      dateFormat = daysCount > 30 ? 'DD.MM' : 'DD.MM'
    }

    // Создаем объект для подсчета приемов по дням
    const days: Record<string, number> = {}
    
    // Инициализируем все дни нулями
    for (let i = 0; i < daysCount; i++) {
      const date = now.subtract(i, 'day').startOf('day')
      const key = date.format('YYYY-MM-DD')
      days[key] = 0
    }

    // Подсчитываем приемы
    filteredHistoryForPremium.forEach(usage => {
      const dateKey = dayjs(usage.usageDate).startOf('day').format('YYYY-MM-DD')
      if (days[dateKey] !== undefined) {
        days[dateKey]++
      }
    })

    // Преобразуем в массив и сортируем по дате (от старых к новым)
    return Object.entries(days)
      .map(([dateKey, count]) => ({
        date: dateKey,
        count,
        label: dayjs(dateKey).format(dateFormat),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [isPremium, filteredHistoryForPremium, selectedPeriod])

  // Статистика по часам (премиум)
  const hourStats = useMemo(() => {
    if (!isPremium || filteredHistoryForPremium.length === 0) {
      return []
    }

    const hours: Record<number, number> = {}
    for (let i = 0; i < 24; i++) {
      hours[i] = 0
    }

    filteredHistoryForPremium.forEach(usage => {
      const hour = dayjs(usage.usageDate).hour()
      hours[hour] = (hours[hour] || 0) + 1
    })

    return Object.entries(hours).map(([hour, count]) => ({
      hour: Number(hour),
      count,
    }))
  }, [isPremium, filteredHistoryForPremium])

  // Статистика по дням недели (премиум)
  const weekdayStats = useMemo(() => {
    if (!isPremium || filteredHistoryForPremium.length === 0) {
      return []
    }

    const weekdays: Record<number, number> = {}
    const weekdayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

    for (let i = 0; i < 7; i++) {
      weekdays[i] = 0
    }

    filteredHistoryForPremium.forEach(usage => {
      const weekday = dayjs(usage.usageDate).day()
      weekdays[weekday] = (weekdays[weekday] || 0) + 1
    })

    return Object.entries(weekdays).map(([weekday, count]) => ({
      weekday: Number(weekday),
      name: weekdayNames[Number(weekday)],
      count,
    }))
  }, [isPremium, filteredHistoryForPremium])

  // Статистика по аптечкам (премиум)
  const kitStats = useMemo(() => {
    if (!isPremium || filteredHistoryForPremium.length === 0) {
      return []
    }

    const kits: Record<number, number> = {}
    filteredHistoryForPremium.forEach(usage => {
      const medicine = medicines.find(m => m.id === usage.medicineId)
      if (medicine?.medicineKitId) {
        kits[medicine.medicineKitId] = (kits[medicine.medicineKitId] || 0) + 1
      }
    })

    const total = Object.values(kits).reduce((sum, count) => sum + count, 0)

    return Object.entries(kits)
      .map(([kitId, count]) => {
        const kit = medicineKits.find(k => k.id === Number(kitId))
        return {
          kitId: Number(kitId),
          kitName: kit?.name || 'Неизвестная аптечка',
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [isPremium, filteredHistoryForPremium, medicines, medicineKits])

  // Топ лекарств (премиум)
  const topMedicines = useMemo(() => {
    if (!isPremium || filteredHistoryForPremium.length === 0) {
      return []
    }

    const medicineCounts: Record<number, number> = {}
    filteredHistoryForPremium.forEach(usage => {
      medicineCounts[usage.medicineId] = (medicineCounts[usage.medicineId] || 0) + 1
    })

    return Object.entries(medicineCounts)
      .map(([medicineId, count]) => {
        const medicine = medicines.find(m => m.id === Number(medicineId))
        return {
          medicineId: Number(medicineId),
          medicineName: medicine?.name || 'Неизвестное лекарство',
          count,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [isPremium, filteredHistoryForPremium, medicines])

  const statCards = useMemo(() => [
    {
      title: 'Сегодня',
      value: stats.today,
      icon: '📅',
      color: colors.primary,
    },
    {
      title: 'Эта неделя',
      value: stats.thisWeek,
      icon: '📆',
      color: colors.secondary,
    },
    {
      title: 'Этот месяц',
      value: stats.thisMonth,
      icon: '🗓️',
      color: colors.primary,
    },
    {
      title: 'Всего',
      value: stats.total,
      icon: '📊',
      color: colors.muted,
    },
  ], [stats, colors])

  if (isLoading) {
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Flex style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Загрузка статистики...
            </Text>
          </Flex>
        </Background>
      </SafeAreaView>
    )
  }

  if (stats.total === 0) {
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Empty
            icon='bar-chart'
            title='Нет данных'
            description='Начните отмечать приемы лекарств, чтобы увидеть статистику'
          />
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
                onRefresh={() => loadStatistics(true)}
                tintColor={colors.primary}
              />
            }
          >
            <PaddingHorizontal>
              {/* Основная статистика */}
              <View style={styles.statsGrid}>
                {statCards.map((card, index) => (
                  <View
                    key={index}
                    style={[
                      styles.statCard,
                      { backgroundColor: colors.card, borderColor: colors.border }
                    ]}
                  >
                    <Text style={styles.statIcon}>{card.icon}</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {card.value}
                    </Text>
                    <Text style={[styles.statTitle, { color: colors.muted }]}>
                      {card.title}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Дополнительная статистика */}
              <View style={styles.additionalStats}>
                <View style={[styles.additionalStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.additionalStatLabel, { color: colors.muted }]}>Вчера</Text>
                  <Text style={[styles.additionalStatValue, { color: colors.text }]}>{stats.yesterday}</Text>
                </View>
                <View style={[styles.additionalStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.additionalStatLabel, { color: colors.muted }]}>В день</Text>
                  <Text style={[styles.additionalStatValue, { color: colors.text }]}>{stats.averagePerDay}</Text>
                </View>
              </View>

              {/* Сравнение периодов */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Динамика</Text>

                <View style={[styles.comparisonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonLabel, { color: colors.text }]}>Эта неделя</Text>
                    <Text style={[styles.comparisonValue, { color: colors.primary }]}>{stats.thisWeek}</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonLabel, { color: colors.muted }]}>Прошлая неделя</Text>
                    <Text style={[styles.comparisonValue, { color: colors.muted }]}>{stats.lastWeek}</Text>
                  </View>
                  {stats.lastWeek > 0 && (
                    <View style={styles.comparisonDiff}>
                      <Text style={[
                        styles.comparisonDiffText,
                        { color: stats.thisWeek >= stats.lastWeek ? '#4CAF50' : '#F44336' }
                      ]}>
                        {stats.thisWeek >= stats.lastWeek ? '↑' : '↓'} {Math.abs(stats.thisWeek - stats.lastWeek)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.comparisonCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: SPACING.md }]}>
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonLabel, { color: colors.text }]}>Этот месяц</Text>
                    <Text style={[styles.comparisonValue, { color: colors.primary }]}>{stats.thisMonth}</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonLabel, { color: colors.muted }]}>Прошлый месяц</Text>
                    <Text style={[styles.comparisonValue, { color: colors.muted }]}>{stats.lastMonth}</Text>
                  </View>
                  {stats.lastMonth > 0 && (
                    <View style={styles.comparisonDiff}>
                      <Text style={[
                        styles.comparisonDiffText,
                        { color: stats.thisMonth >= stats.lastMonth ? '#4CAF50' : '#F44336' }
                      ]}>
                        {stats.thisMonth >= stats.lastMonth ? '↑' : '↓'} {Math.abs(stats.thisMonth - stats.lastMonth)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Расширенная статистика для премиум */}
              {isPremium && usageHistory.length > 0 && (
                <>
                  {/* Переключатель периода */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Расширенная статистика</Text>
                    <View style={styles.periodSelector}>
                      <Pressable
                        style={[
                          styles.periodButton,
                          {
                            backgroundColor: selectedPeriod === 'week' ? colors.primary : 'transparent',
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => setSelectedPeriod('week')}
                      >
                        <Text style={[
                          styles.periodButtonText,
                          { color: selectedPeriod === 'week' ? '#FFFFFF' : colors.text }
                        ]}>
                          Неделя
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.periodButton,
                          {
                            backgroundColor: selectedPeriod === 'month' ? colors.primary : 'transparent',
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => setSelectedPeriod('month')}
                      >
                        <Text style={[
                          styles.periodButtonText,
                          { color: selectedPeriod === 'month' ? '#FFFFFF' : colors.text }
                        ]}>
                          Месяц
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.periodButton,
                          {
                            backgroundColor: selectedPeriod === 'all' ? colors.primary : 'transparent',
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => setSelectedPeriod('all')}
                      >
                        <Text style={[
                          styles.periodButtonText,
                          { color: selectedPeriod === 'all' ? '#FFFFFF' : colors.text }
                        ]}>
                          Все время
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Статистика по часам */}
                  {hourStats.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Приемы по времени суток</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {hourStats.map(({ hour, count }) => (
                          <View key={hour} style={styles.hourBar}>
                            <Text style={[styles.hourLabel, { color: colors.muted }]}>
                              {hour.toString().padStart(2, '0')}:00
                            </Text>
                            <View style={styles.barContainer}>
                              <View
                                style={[
                                  styles.bar,
                                  {
                                    width: `${Math.min(100, (count / Math.max(...hourStats.map(h => h.count), 1)) * 100)}%`,
                                    backgroundColor: colors.primary
                                  }
                                ]}
                              />
                            </View>
                            <Text style={[styles.barValue, { color: colors.text }]}>{count}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Статистика по дням недели */}
                  {weekdayStats.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Приемы по дням недели</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {weekdayStats.map(({ weekday, name, count }) => (
                          <View key={weekday} style={styles.weekdayBar}>
                            <Text style={[styles.weekdayLabel, { color: colors.muted }]}>{name}</Text>
                            <View style={styles.barContainer}>
                              <View
                                style={[
                                  styles.bar,
                                  {
                                    width: `${Math.min(100, (count / Math.max(...weekdayStats.map(w => w.count), 1)) * 100)}%`,
                                    backgroundColor: colors.primary
                                  }
                                ]}
                              />
                            </View>
                            <Text style={[styles.barValue, { color: colors.text }]}>{count}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Статистика по аптечкам */}
                  {kitStats.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Приемы по аптечкам</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {kitStats.map(({ kitName, count, percentage }) => (
                          <View key={kitName} style={styles.kitStat}>
                            <View style={styles.kitStatHeader}>
                              <Text style={[styles.kitStatName, { color: colors.text }]}>{kitName}</Text>
                              <Text style={[styles.kitStatCount, { color: colors.primary }]}>{count}</Text>
                            </View>
                            <View style={styles.barContainer}>
                              <View
                                style={[
                                  styles.bar,
                                  {
                                    width: `${percentage}%`,
                                    backgroundColor: colors.primary
                                  }
                                ]}
                              />
                            </View>
                            <Text style={[styles.kitStatPercentage, { color: colors.muted }]}>{percentage}%</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Топ лекарств */}
                  {topMedicines.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Топ лекарств</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {topMedicines.map(({ medicineName, count }, index) => (
                          <View key={medicineName} style={styles.topMedicineItem}>
                            <View style={styles.topMedicineRank}>
                              <Text style={[styles.topMedicineRankText, { color: colors.primary }]}>
                                #{index + 1}
                              </Text>
                            </View>
                            <View style={styles.topMedicineContent}>
                              <Text style={[styles.topMedicineName, { color: colors.text }]}>{medicineName}</Text>
                              <Text style={[styles.topMedicineCount, { color: colors.muted }]}>
                                {count} {count === 1 ? 'прием' : count < 5 ? 'приема' : 'приемов'}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* История приемов */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Последние приемы</Text>
                {usageWithDetails.slice(0, 10).map(usage => (
                  <View
                    key={usage.id}
                    style={[
                      styles.historyItem,
                      { backgroundColor: colors.card, borderColor: colors.border }
                    ]}
                  >
                    <View style={styles.historyContent}>
                      <Text style={[styles.historyDate, { color: colors.text }]}>
                        {dayjs(usage.usageDate).format('DD.MM.YYYY HH:mm')}
                      </Text>
                      {usage.medicineName && (
                        <Text style={[styles.historyMedicine, { color: colors.text }]}>
                          {usage.medicineName}
                        </Text>
                      )}
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
            </PaddingHorizontal>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: SPACING.md,
    borderRadius: SPACING.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: FONT_SIZE.xl * 1.5,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.heading,
    fontWeight: 'bold',
    marginBottom: SPACING.xs / 2,
  },
  statTitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  additionalStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  additionalStatCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: SPACING.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  additionalStatLabel: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs / 2,
  },
  additionalStatValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  comparisonCard: {
    padding: SPACING.md,
    borderRadius: SPACING.md,
    borderWidth: 1,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  comparisonLabel: {
    fontSize: FONT_SIZE.md,
  },
  comparisonValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  comparisonDiff: {
    marginTop: SPACING.xs,
    alignItems: 'flex-end',
  },
  comparisonDiffText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: SPACING.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  chartCard: {
    padding: SPACING.md,
    borderRadius: SPACING.md,
    borderWidth: 1,
  },
  hourBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  hourLabel: {
    width: 50,
    fontSize: FONT_SIZE.sm,
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 10,
  },
  barValue: {
    width: 30,
    textAlign: 'right',
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  weekdayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  weekdayLabel: {
    width: 30,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  kitStat: {
    marginBottom: SPACING.md,
  },
  kitStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  kitStatName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    flex: 1,
  },
  kitStatCount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  kitStatPercentage: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs / 2,
  },
  topMedicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  topMedicineRank: {
    width: 40,
    alignItems: 'center',
  },
  topMedicineRankText: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  topMedicineContent: {
    flex: 1,
  },
  topMedicineName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    marginBottom: SPACING.xs / 2,
  },
  topMedicineCount: {
    fontSize: FONT_SIZE.sm,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    marginBottom: SPACING.xs / 2,
  },
  historyMedicine: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
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
  },
  historyQuantity: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  dayStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    minHeight: 150,
    paddingVertical: SPACING.md,
  },
  dayStatItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  dayStatBar: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: SPACING.xs,
  },
  dayStatBarFill: {
    width: '100%',
    borderRadius: SPACING.xs / 2,
    minHeight: 2,
  },
  dayStatLabel: {
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.xs / 2,
  },
  dayStatValue: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
})

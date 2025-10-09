import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService } from '@/shared/lib/database'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { Medicine, MedicineUsage } from '@/entities/medicine/model/types'
import { MedicineKit } from '@/entities/kit/model/types'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native'

interface MedicineStats {
  medicineId: string
  medicineName: string
  medicineForm: string
  kitName: string
  count: number
  lastTaken: Date
}

interface PeriodStats {
  today: number
  yesterday: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
  total: number
}

type Period = 'week' | 'month' | 'all'

export function StatisticsScreen() {
  const { colors } = useTheme()
  const [history, setHistory] = useState<MedicineUsage[]>([])
  const [medicineStats, setMedicineStats] = useState<MedicineStats[]>([])
  const [periodStats, setPeriodStats] = useState<PeriodStats>({
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    total: 0
  })
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      console.log('🔍 Loading statistics...')

      await databaseService.init()

      // Загружаем все лекарства
      const allMedicines = await databaseService.getMedicines()
      const medicinesMap = new Map(allMedicines.map(m => [m.id, m]))

      // Загружаем все аптечки
      const allKits = await databaseService.getKits()
      const kitsMap = new Map(allKits.map(k => [k.id, k]))

      // Загружаем историю для всех лекарств
      const allHistory: MedicineUsage[] = []

      for (const medicine of allMedicines) {
        try {
          const usages = await databaseService.getMedicineUsage(medicine.id)
          allHistory.push(...usages)
        } catch (error) {
          console.warn(`Failed to load usage for medicine ${medicine.id}:`, error)
        }
      }

      // Сортируем по дате (новые сначала)
      allHistory.sort((a, b) => b.usageDate.getTime() - a.usageDate.getTime())

      setHistory(allHistory)

      // Вычисляем статистику по периодам
      const stats = calculatePeriodStats(allHistory)
      setPeriodStats(stats)

      // Вычисляем статистику по лекарствам
      const medStats = calculateMedicineStats(allHistory, medicinesMap, kitsMap)
      setMedicineStats(medStats)

      console.log(`✅ Loaded statistics for ${allHistory.length} items`)
    } catch (error) {
      console.error('❌ Failed to load statistics:', error)
      Alert.alert('Ошибка', 'Не удалось загрузить статистику')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const calculatePeriodStats = (items: MedicineUsage[]): PeriodStats => {
    const now = new Date()

    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const monthAgo = new Date(now)
    monthAgo.setDate(monthAgo.getDate() - 30)

    const twoMonthsAgo = new Date(now)
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60)

    return {
      today: items.filter(i => i.usageDate >= today).length,
      yesterday: items.filter(i => i.usageDate >= yesterday && i.usageDate < today).length,
      thisWeek: items.filter(i => i.usageDate >= weekAgo).length,
      lastWeek: items.filter(i => i.usageDate >= twoWeeksAgo && i.usageDate < weekAgo).length,
      thisMonth: items.filter(i => i.usageDate >= monthAgo).length,
      lastMonth: items.filter(i => i.usageDate >= twoMonthsAgo && i.usageDate < monthAgo).length,
      total: items.length
    }
  }

  const calculateMedicineStats = (
    items: MedicineUsage[],
    medicinesMap: Map<string, Medicine>,
    kitsMap: Map<string, MedicineKit>
  ): MedicineStats[] => {
    const statsMap = new Map<string, MedicineStats>()

    for (const item of items) {
      const medicine = medicinesMap.get(item.medicineId)
      if (!medicine) continue

      const kit = kitsMap.get(medicine.kitId)

      if (!statsMap.has(item.medicineId)) {
        statsMap.set(item.medicineId, {
          medicineId: item.medicineId,
          medicineName: medicine.name,
          medicineForm: medicine.form,
          kitName: kit?.name || 'Неизвестная аптечка',
          count: 0,
          lastTaken: item.usageDate
        })
      }

      const stats = statsMap.get(item.medicineId)!
      stats.count += item.quantityUsed || 1

      if (item.usageDate > stats.lastTaken) {
        stats.lastTaken = item.usageDate
      }
    }

    // Сортируем по количеству приемов
    return Array.from(statsMap.values()).sort((a, b) => b.count - a.count)
  }

  const getAveragePerDay = () => {
    if (history.length === 0) return 0

    const oldestDate = history[history.length - 1].usageDate
    const days = Math.ceil((new Date().getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))

    return days > 0 ? (history.length / days).toFixed(1) : history.length.toString()
  }

  const getTopMedicine = (): MedicineStats | null => {
    return medicineStats.length > 0 ? medicineStats[0] : null
  }

  const getFilteredStats = () => {
    const now = new Date()

    switch (selectedPeriod) {
      case 'week': {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        const filtered = history.filter(h => h.usageDate >= weekAgo)
        return calculateMedicineStats(
          filtered,
          new Map(medicineStats.map(m => [m.medicineId, {
            id: m.medicineId,
            name: m.medicineName,
            form: m.medicineForm,
            kitId: '',
          } as Medicine])),
          new Map()
        )
      }
      case 'month': {
        const monthAgo = new Date(now)
        monthAgo.setDate(monthAgo.getDate() - 30)
        const filtered = history.filter(h => h.usageDate >= monthAgo)
        return calculateMedicineStats(
          filtered,
          new Map(medicineStats.map(m => [m.medicineId, {
            id: m.medicineId,
            name: m.medicineName,
            form: m.medicineForm,
            kitId: '',
          } as Medicine])),
          new Map()
        )
      }
      default:
        return medicineStats
    }
  }

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week':
        return 'за неделю'
      case 'month':
        return 'за месяц'
      default:
        return 'за все время'
    }
  }

  const getPeriodCount = () => {
    switch (selectedPeriod) {
      case 'week':
        return periodStats.thisWeek
      case 'month':
        return periodStats.thisMonth
      default:
        return periodStats.total
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Загрузка статистики...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const topMedicine = getTopMedicine()
  const averagePerDay = getAveragePerDay()
  const filteredStats = getFilteredStats()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadStatistics(true)}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Статистика</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Анализ приема лекарств
          </Text>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Нет данных для статистики
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Начните отмечать приемы лекарств, чтобы увидеть статистику
            </Text>
          </View>
        ) : (
          <>
            {/* Основная статистика */}
            <View style={styles.statsContainer}>
              <View style={[styles.largeStatCard, { backgroundColor: colors.primary }]}>
                <Text style={styles.largeStatNumber}>{periodStats.total}</Text>
                <Text style={styles.largeStatLabel}>Всего приемов</Text>
              </View>

              <View style={styles.smallStatsRow}>
                <View style={[styles.smallStatCard, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.smallStatNumber}>{periodStats.today}</Text>
                  <Text style={styles.smallStatLabel}>Сегодня</Text>
                </View>
                <View style={[styles.smallStatCard, { backgroundColor: colors.success }]}>
                  <Text style={styles.smallStatNumber}>{averagePerDay}</Text>
                  <Text style={styles.smallStatLabel}>В день</Text>
                </View>
              </View>
            </View>

            {/* Сравнение периодов */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Динамика</Text>

              <View style={styles.comparisonCard}>
                <View style={styles.comparisonRow}>
                  <Text style={[styles.comparisonLabel, { color: colors.text }]}>Эта неделя</Text>
                  <Text style={[styles.comparisonValue, { color: colors.primary }]}>
                    {periodStats.thisWeek}
                  </Text>
                </View>
                <View style={styles.comparisonRow}>
                  <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>
                    Прошлая неделя
                  </Text>
                  <Text style={[styles.comparisonValue, { color: colors.textSecondary }]}>
                    {periodStats.lastWeek}
                  </Text>
                </View>
                {periodStats.lastWeek > 0 && (
                  <View style={styles.comparisonDiff}>
                    <Text style={[styles.comparisonDiffText, {
                      color: periodStats.thisWeek >= periodStats.lastWeek ? colors.success : colors.error
                    }]}>
                      {periodStats.thisWeek >= periodStats.lastWeek ? '↑' : '↓'}{' '}
                      {Math.abs(periodStats.thisWeek - periodStats.lastWeek)} приемов
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.comparisonCard, { marginTop: SPACING.md }]}>
                <View style={styles.comparisonRow}>
                  <Text style={[styles.comparisonLabel, { color: colors.text }]}>Этот месяц</Text>
                  <Text style={[styles.comparisonValue, { color: colors.primary }]}>
                    {periodStats.thisMonth}
                  </Text>
                </View>
                <View style={styles.comparisonRow}>
                  <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>
                    Прошлый месяц
                  </Text>
                  <Text style={[styles.comparisonValue, { color: colors.textSecondary }]}>
                    {periodStats.lastMonth}
                  </Text>
                </View>
                {periodStats.lastMonth > 0 && (
                  <View style={styles.comparisonDiff}>
                    <Text style={[styles.comparisonDiffText, {
                      color: periodStats.thisMonth >= periodStats.lastMonth ? colors.success : colors.error
                    }]}>
                      {periodStats.thisMonth >= periodStats.lastMonth ? '↑' : '↓'}{' '}
                      {Math.abs(periodStats.thisMonth - periodStats.lastMonth)} приемов
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Топ лекарств */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Топ лекарств {getPeriodLabel()}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {getPeriodCount()} приемов
                </Text>
              </View>

              <View style={styles.periodSelector}>
                <TouchableOpacity
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
                    { color: selectedPeriod === 'week' ? 'white' : colors.text }
                  ]}>
                    Неделя
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
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
                    { color: selectedPeriod === 'month' ? 'white' : colors.text }
                  ]}>
                    Месяц
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
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
                    { color: selectedPeriod === 'all' ? 'white' : colors.text }
                  ]}>
                    Все время
                  </Text>
                </TouchableOpacity>
              </View>

              {filteredStats.length === 0 ? (
                <View style={styles.emptyTopContainer}>
                  <Text style={[styles.emptyTopText, { color: colors.textSecondary }]}>
                    Нет данных за выбранный период
                  </Text>
                </View>
              ) : (
                <View style={styles.topList}>
                  {filteredStats.slice(0, 10).map((stat, index) => (
                    <View
                      key={stat.medicineId}
                      style={[styles.topItem, { borderColor: colors.border }]}
                    >
                      <View style={styles.topRank}>
                        <Text style={[styles.topRankText, {
                          color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.textSecondary
                        }]}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </Text>
                      </View>

                      <View style={styles.topInfo}>
                        <Text style={[styles.topName, { color: colors.text }]}>
                          {stat.medicineName}
                        </Text>
                        <Text style={[styles.topForm, { color: colors.textSecondary }]}>
                          {stat.medicineForm} • 📦 {stat.kitName}
                        </Text>
                        <Text style={[styles.topLastTaken, { color: colors.textSecondary }]}>
                          Последний прием:{' '}
                          {stat.lastTaken.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>

                      <View style={[styles.topCount, { backgroundColor: colors.primary }]}>
                        <Text style={styles.topCountText}>{stat.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>О статистике</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Статистика обновляется автоматически{'\n'}
            • Сравнение текущего и прошлого периода{'\n'}
            • Топ самых часто принимаемых лекарств{'\n'}
            • Средняя частота приема в день{'\n'}
            • Потяните вниз, чтобы обновить
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
  statsContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  largeStatCard: {
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  largeStatNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING.sm,
  },
  largeStatLabel: {
    fontSize: FONT_SIZE.lg,
    color: 'white',
    opacity: 0.9,
  },
  smallStatsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  smallStatCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  smallStatNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING.xs,
  },
  smallStatLabel: {
    fontSize: FONT_SIZE.sm,
    color: 'white',
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.sm,
  },
  comparisonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: SPACING.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  comparisonLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  comparisonValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
  comparisonDiff: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  comparisonDiffText: {
    fontSize: FONT_SIZE.md,
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
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  topList: {
    gap: SPACING.md,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
  },
  topRank: {
    width: 40,
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  topRankText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  topInfo: {
    flex: 1,
  },
  topName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  topForm: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  topLastTaken: {
    fontSize: FONT_SIZE.sm,
  },
  topCount: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  topCountText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyTopContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyTopText: {
    fontSize: FONT_SIZE.md,
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


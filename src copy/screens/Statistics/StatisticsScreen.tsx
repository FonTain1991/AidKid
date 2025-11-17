import { useTheme } from '@/app/providers/theme'
import { SPACING } from '@/shared/config'
import { FONT_SIZE } from '@/shared/config/constants/font'
import { databaseService } from '@/shared/lib/database'
import { SafeAreaView } from '@/shared/ui/SafeAreaView'
import { Medicine, MedicineUsage } from '@/entities/medicine/model/types'
import { MedicineKit } from '@/entities/kit/model/types'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl, Dimensions } from 'react-native'
import { useSubscription } from '@/shared/hooks/useSubscription'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation/types'
import { Button } from '@/shared/ui/Button'
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts'

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

interface DayStats {
  date: Date
  count: number
  label: string
}

interface HourStats {
  hour: number
  count: number
}

interface WeekdayStats {
  weekday: number
  name: string
  count: number
}

interface CalendarDay {
  date: Date
  count: number
  isEmpty: boolean
}

interface KitStats {
  kitId: string
  kitName: string
  count: number
  percentage: number
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export function StatisticsScreen() {
  const { colors } = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const { isPremium, isLoading: subscriptionLoading } = useSubscription()
  const [history, setHistory] = useState<MedicineUsage[]>([])
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

  // Расширенная статистика (премиум)
  const [dayStats, setDayStats] = useState<DayStats[]>([])
  const [hourStats, setHourStats] = useState<HourStats[]>([])
  const [weekdayStats, setWeekdayStats] = useState<WeekdayStats[]>([])
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [kitStats, setKitStats] = useState<KitStats[]>([])
  const [complianceRate, setComplianceRate] = useState<number>(0)
  const [comparisonDayStats, setComparisonDayStats] = useState<{ current: DayStats[]; previous: DayStats[] }>({
    current: [],
    previous: [],
  })
  const [medicinesMap, setMedicinesMap] = useState<Map<string, Medicine>>(new Map())
  const [kitsMap, setKitsMap] = useState<Map<string, MedicineKit>>(new Map())

  useEffect(() => {
    loadStatistics()
  }, [isPremium, selectedPeriod])

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
      const medicinesMapData = new Map(allMedicines.map(m => [m.id, m]))
      setMedicinesMap(medicinesMapData)

      // Загружаем все аптечки
      const allKits = await databaseService.getKits()
      const kitsMapData = new Map(allKits.map(k => [k.id, k]))
      setKitsMap(kitsMapData)

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

      // Вычисляем расширенную статистику для премиум
      if (isPremium && allHistory.length > 0) {
        const days = calculateDayStats(allHistory)
        setDayStats(days)

        const hours = calculateHourStats(allHistory)
        setHourStats(hours)

        const weekdays = calculateWeekdayStats(allHistory)
        setWeekdayStats(weekdays)

        const calendar = calculateCalendarStats(allHistory)
        setCalendarDays(calendar)

        const kits = calculateKitStats(allHistory, medicinesMapData, kitsMapData)
        setKitStats(kits)

        const comparison = calculateComparisonStats(allHistory)
        setComparisonDayStats(comparison)

        // TODO: Расчет compliance rate (нужны данные о напоминаниях)
        // const compliance = calculateComplianceRate(allHistory, reminders)
        // setComplianceRate(compliance)
      } else {
        // Очищаем расширенную статистику если не премиум
        setDayStats([])
        setHourStats([])
        setWeekdayStats([])
        setCalendarDays([])
        setKitStats([])
        setComparisonDayStats({ current: [], previous: [] })
      }

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

  const getAveragePerDay = () => {
    if (history.length === 0) {
      return 0
    }

    const oldestDate = history[history.length - 1].usageDate
    const days = Math.ceil((new Date().getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))

    return days > 0 ? (history.length / days).toFixed(1) : history.length.toString()
  }

  // Расчет статистики по дням
  const calculateDayStats = (items: MedicineUsage[], daysCount?: number, startDate?: Date): DayStats[] => {
    const now = startDate || new Date()
    const days: DayStats[] = []
    const count = daysCount || (selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90)

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const itemCount = items.filter(item => {
        const itemDate = new Date(item.usageDate)
        itemDate.setHours(0, 0, 0, 0)
        return itemDate >= date && itemDate < nextDate
      }).length

      days.push({
        date,
        count: itemCount,
        label: `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`
      })
    }

    return days
  }

  // Расчет статистики для сравнения периодов
  const calculateComparisonStats = (items: MedicineUsage[]): { current: DayStats[]; previous: DayStats[] } => {
    const now = new Date()
    const daysCount = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90

    // Текущий период
    const current = calculateDayStats(items, daysCount, now)

    // Предыдущий период
    const previousStartDate = new Date(now)
    previousStartDate.setDate(previousStartDate.getDate() - daysCount)
    const previous = calculateDayStats(items, daysCount, previousStartDate)

    return { current, previous }
  }

  // Расчет статистики по часам
  const calculateHourStats = (items: MedicineUsage[]): HourStats[] => {
    const hourCounts = new Array(24).fill(0)

    items.forEach(item => {
      const hour = new Date(item.usageDate).getHours()
      hourCounts[hour]++
    })

    return hourCounts.map((count, hour) => ({
      hour,
      count
    }))
  }

  // Расчет статистики по дням недели
  const calculateWeekdayStats = (items: MedicineUsage[]): WeekdayStats[] => {
    const weekdayCounts = new Array(7).fill(0)
    const weekdayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

    items.forEach(item => {
      const weekday = new Date(item.usageDate).getDay()
      weekdayCounts[weekday]++
    })

    return weekdayCounts.map((count, weekday) => ({
      weekday,
      name: weekdayNames[weekday],
      count
    }))
  }

  // Расчет календарной статистики (последние 30 дней)
  const calculateCalendarStats = (items: MedicineUsage[]): CalendarDay[] => {
    const now = new Date()
    const calendar: CalendarDay[] = []
    const daysCount = 30

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const count = items.filter(item => {
        const itemDate = new Date(item.usageDate)
        itemDate.setHours(0, 0, 0, 0)
        return itemDate >= date && itemDate < nextDate
      }).length

      calendar.push({
        date,
        count,
        isEmpty: false
      })
    }

    return calendar
  }

  // Расчет статистики по аптечкам
  const calculateKitStats = (
    items: MedicineUsage[],
    medicinesMap: Map<string, Medicine>,
    kitsMap: Map<string, MedicineKit>
  ): KitStats[] => {
    const kitCounts = new Map<string, { kitId: string; kitName: string; count: number }>()

    items.forEach(item => {
      const medicine = medicinesMap.get(item.medicineId)
      if (!medicine) {
        return
      }

      const kit = kitsMap.get(medicine.kitId)
      if (!kit) {
        return
      }

      if (!kitCounts.has(kit.id)) {
        kitCounts.set(kit.id, {
          kitId: kit.id,
          kitName: kit.name,
          count: 0,
        })
      }

      const stats = kitCounts.get(kit.id)!
      stats.count += item.quantityUsed || 1
    })

    const total = Array.from(kitCounts.values()).reduce((sum, kit) => sum + kit.count, 0)

    return Array.from(kitCounts.values())
      .map(kit => ({
        ...kit,
        percentage: total > 0 ? (kit.count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }

  // Генерация цветов для PieChart
  const generateColors = (count: number): string[] => {
    const colors = [
      '#4A90E2', // Синий
      '#50C878', // Зеленый
      '#FF6B6B', // Красный
      '#FFD93D', // Желтый
      '#9B59B6', // Фиолетовый
      '#3498DB', // Голубой
      '#E74C3C', // Красноватый
      '#F39C12', // Оранжевый
      '#1ABC9C', // Бирюзовый
      '#95A5A6', // Серый
    ]

    // Повторяем цвета если нужно больше
    const result: string[] = []
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length])
    }
    return result
  }

  // Получение максимального значения для нормализации графиков
  const getMaxCount = (stats: { count: number }[]): number => {
    if (stats.length === 0) {
      return 1
    }
    return Math.max(...stats.map(s => s.count), 1)
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

  const averagePerDay = getAveragePerDay()

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
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

            {/* Переключатель периода для графиков */}
            <View style={styles.section}>
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
            </View>

            {/* Расширенная статистика для премиум */}
            {isPremium && history.length > 0 && (
              <>
                {/* График приема по дням */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    📊 График приема {selectedPeriod === 'week' ? 'за неделю' : selectedPeriod === 'month' ? 'за месяц' : 'за 3 месяца'}
                  </Text>
                  <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                    <BarChart
                      data={dayStats.map(day => ({
                        value: day.count,
                        label: day.label,
                        frontColor: colors.primary,
                      }))}
                      width={Dimensions.get('window').width - SPACING.md * 4}
                      height={150}
                      barWidth={Math.max(20, (Dimensions.get('window').width - SPACING.md * 4) / dayStats.length - 10)}
                      spacing={5}
                      roundedTop
                      roundedBottom
                      hideRules
                      xAxisThickness={0}
                      yAxisThickness={0}
                      yAxisTextStyle={{ color: colors.textSecondary, fontSize: FONT_SIZE.xs }}
                      xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: FONT_SIZE.xs }}
                      noOfSections={4}
                      maxValue={Math.max(...dayStats.map(d => d.count), 1)}
                      isAnimated
                    />
                  </View>
                </View>

                {/* Статистика по времени суток */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>⏰ Активность по времени</Text>
                  <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <BarChart
                        data={hourStats.map(hour => ({
                          value: hour.count,
                          label: hour.hour.toString(),
                          frontColor: hour.count > 0 ? colors.primary : colors.border,
                        }))}
                        width={hourStats.length * 25}
                        height={150}
                        barWidth={20}
                        spacing={5}
                        roundedTop
                        roundedBottom
                        hideRules
                        xAxisThickness={0}
                        yAxisThickness={0}
                        yAxisTextStyle={{ color: colors.textSecondary, fontSize: FONT_SIZE.xs }}
                        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: FONT_SIZE.xs }}
                        noOfSections={4}
                        maxValue={Math.max(...hourStats.map(h => h.count), 1)}
                        isAnimated
                        showVerticalLines={false}
                      />
                    </ScrollView>
                  </View>
                </View>

                {/* Статистика по дням недели */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>📅 Активность по дням недели</Text>
                  <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                    <BarChart
                      data={weekdayStats.map(weekday => ({
                        value: weekday.count,
                        label: weekday.name,
                        frontColor: weekday.count > 0 ? colors.primary : colors.border,
                      }))}
                      width={Dimensions.get('window').width - SPACING.md * 4}
                      height={150}
                      barWidth={Math.max(30, (Dimensions.get('window').width - SPACING.md * 4) / weekdayStats.length - 15)}
                      spacing={5}
                      roundedTop
                      roundedBottom
                      hideRules
                      xAxisThickness={0}
                      yAxisThickness={0}
                      yAxisTextStyle={{ color: colors.textSecondary, fontSize: FONT_SIZE.xs }}
                      xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: FONT_SIZE.xs }}
                      noOfSections={4}
                      maxValue={Math.max(...weekdayStats.map(w => w.count), 1)}
                      isAnimated
                    />
                  </View>
                </View>

                {/* Статистика по аптечкам */}
                {kitStats.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>📦 Распределение по аптечкам</Text>
                    <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                      <View style={styles.pieChartContainer}>
                        <PieChart
                          data={kitStats.map((kit, index) => {
                            const pieColors = generateColors(kitStats.length)
                            return {
                              value: kit.count,
                              label: kit.kitName.length > 15 ? kit.kitName.substring(0, 15) + '...' : kit.kitName,
                              color: pieColors[index],
                              text: kit.kitName.length > 15 ? kit.kitName.substring(0, 15) + '...' : kit.kitName,
                            }
                          })}
                          radius={80}
                          showText
                          textColor={colors.text}
                          textSize={FONT_SIZE.xs}
                          showValuesAsLabels
                          focusOnPress
                          showGradient
                          donut
                          sectionAutoFocus
                        />
                      </View>
                      <View style={styles.kitStatsList}>
                        {kitStats.map((kit, index) => {
                          const pieColors = generateColors(kitStats.length)
                          return (
                            <View key={kit.kitId} style={styles.kitStatItem}>
                              <View style={[styles.kitColorDot, { backgroundColor: pieColors[index] }]} />
                              <Text style={[styles.kitStatName, { color: colors.text }]} numberOfLines={1}>
                                {kit.kitName}
                              </Text>
                              <Text style={[styles.kitStatPercentage, { color: colors.textSecondary }]}>
                                {kit.percentage.toFixed(1)}%
                              </Text>
                              <Text style={[styles.kitStatCount, { color: colors.textSecondary }]}>
                                ({kit.count})
                              </Text>
                            </View>
                          )
                        })}
                      </View>
                    </View>
                  </View>
                )}

                {/* Сравнение периодов */}
                {comparisonDayStats.current.length > 0 && comparisonDayStats.previous.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      📊 Сравнение периодов ({selectedPeriod === 'week' ? 'неделя' : selectedPeriod === 'month' ? 'месяц' : '3 месяца'})
                    </Text>
                    <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                      <LineChart
                        data={comparisonDayStats.current.map((day, index) => ({
                          value: day.count,
                          label: day.label,
                        }))}
                        data2={comparisonDayStats.previous.map((day, index) => ({
                          value: day.count,
                          label: day.label,
                        }))}
                        width={Dimensions.get('window').width - SPACING.md * 4}
                        height={180}
                        spacing={Math.max(20, (Dimensions.get('window').width - SPACING.md * 4) / comparisonDayStats.current.length - 10)}
                        thickness={2}
                        thickness2={2}
                        color={colors.primary}
                        color2={colors.secondary || '#95A5A6'}
                        hideRules
                        xAxisThickness={0}
                        yAxisThickness={0}
                        yAxisTextStyle={{ color: colors.textSecondary, fontSize: FONT_SIZE.xs }}
                        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: FONT_SIZE.xs }}
                        noOfSections={4}
                        maxValue={Math.max(
                          ...comparisonDayStats.current.map(d => d.count),
                          ...comparisonDayStats.previous.map(d => d.count),
                          1
                        )}
                        isAnimated
                        curved
                        curved2
                      />
                      <View style={styles.comparisonLegend}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                            Текущий период
                          </Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: colors.secondary || '#95A5A6' }]} />
                          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                            Предыдущий период
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Календарь приемов */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>📆 Календарь приемов (последние 30 дней)</Text>
                  <View style={[styles.calendarCard, { backgroundColor: colors.card }]}>
                    <View style={styles.calendarGrid}>
                      {calendarDays.map((day, index) => {
                        const maxCount = getMaxCount(calendarDays)
                        const intensity = maxCount > 0 ? day.count / maxCount : 0
                        const opacity = intensity > 0 ? Math.max(0.3, intensity) : 0.1

                        return (
                          <View
                            key={index}
                            style={[
                              styles.calendarDay,
                              {
                                backgroundColor: day.count > 0
                                  ? `${colors.primary}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`
                                  : colors.border + '20',
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.calendarDayNumber, { color: colors.text }]}>
                              {day.date.getDate()}
                            </Text>
                            {day.count > 0 && (
                              <Text style={[styles.calendarDayCount, { color: colors.text }]}>
                                {day.count}
                              </Text>
                            )}
                          </View>
                        )
                      })}
                    </View>
                  </View>
                </View>
              </>
            )}
          </>
        )}

        {/* Предложение премиум для не-премиум пользователей */}
        {!isPremium && !subscriptionLoading && history.length > 0 && (
          <View style={[styles.premiumSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.premiumTitle, { color: colors.text }]}>
              💎 Расширенная статистика
            </Text>
            <Text style={[styles.premiumText, { color: colors.textSecondary }]}>
              Получите доступ к графикам, анализу по времени, календарю приемов и другим премиум функциям
            </Text>
            <Button
              title='Оформить подписку'
              onPress={() => navigation.navigate('Subscription')}
              variant='primary'
              style={styles.premiumButton}
            />
          </View>
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
  premiumSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  premiumText: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  premiumButton: {
    width: '100%',
  },
  chartCard: {
    borderRadius: 12,
    padding: SPACING.md,
  },
  calendarCard: {
    borderRadius: 12,
    padding: SPACING.md,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarDay: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  calendarDayNumber: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  calendarDayCount: {
    fontSize: 8,
    marginTop: 1,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  kitStatsList: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  kitStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  kitColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  kitStatName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    marginRight: SPACING.sm,
  },
  kitStatPercentage: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginRight: SPACING.xs,
    minWidth: 45,
    textAlign: 'right',
  },
  kitStatCount: {
    fontSize: FONT_SIZE.sm,
    minWidth: 40,
    textAlign: 'right',
  },
  comparisonLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontSize: FONT_SIZE.xs,
  },
  detailIcon: {
    fontSize: FONT_SIZE.md,
    marginLeft: SPACING.sm,
    opacity: 0.7,
  },
})


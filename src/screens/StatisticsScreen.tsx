import '@/i18n'
import { Empty } from '@/components/Empty'
import { Background, Flex, PaddingHorizontal, SafeAreaView } from '@/components/Layout'
import { Text } from '@/components/Text'
import { SPACING } from '@/constants'
import { FONT_SIZE } from '@/constants/font'
import { useNavigationBarColor, useScreenProperties } from '@/hooks'
import { calculateActivityHeatmap } from '@/lib/activityHeatmap'
import { calculateFamilyMemberStats } from '@/lib/familyMemberStats'
import { calculateMedicineConsumption } from '@/lib/medicineConsumption'
import { calculateMedicineRunoutForecast } from '@/lib/medicineRunoutForecast'
import { calculateMissedMedicineStats } from '@/lib/missedMedicineStats'
import { calculatePlanAdherence } from '@/lib/planAdherence'
import { calculatePremiumPeriodDynamics } from '@/lib/premiumPeriodDynamics'
import { buildStatisticsCsvReport, buildStatisticsHtmlReport, buildStatisticsShareReport } from '@/lib/statisticsExport'
import { getStatisticsChartVisibility } from '@/lib/statisticsChartVisibility'
import { filterUsageByPeriod, type StatisticsPeriod } from '@/lib/statisticsPeriod'
import { getUsageUnitValue } from '@/lib/usageUnit'
import { databaseService } from '@/services'
import { useAppStore } from '@/store'
import { useSubscription } from '@/components/Subscription/hooks/useSubscription'
import { useTheme } from '@/providers/theme'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, View, Pressable } from 'react-native'
import RNFS from 'react-native-fs'
import { generatePDF } from 'react-native-html-to-pdf'
import Share from 'react-native-share'
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
  unitValue?: string
}

const statisticsPeriodLabelKeys: Record<StatisticsPeriod, string> = {
  day: 'statistics.day',
  week: 'statistics.week',
  month: 'statistics.month',
  all: 'statistics.allTime',
}

export function StatisticsScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { isPremium } = useSubscription()
  const medicines = useAppStore(state => state.medicines)
  const medicineKits = useAppStore(state => state.medicineKits)
  const familyMembers = useAppStore(state => state.familyMembers)
  const reminders = useAppStore(state => state.reminders)
  const reminderMedicines = useAppStore(state => state.reminderMedicines)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPeriodChanging, setIsPeriodChanging] = useState(false)
  const [usageHistory, setUsageHistory] = useState<MedicineUsage[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<StatisticsPeriod>('day')
  const [isSharingStatistics, setIsSharingStatistics] = useState(false)
  const [isSharingStatisticsCsv, setIsSharingStatisticsCsv] = useState(false)
  const [isSharingStatisticsPdf, setIsSharingStatisticsPdf] = useState(false)
  const periodChangeFrameRef = useRef<number | null>(null)
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
      title: t('screens.statistics')
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
      const todayEnd = now.endOf('day')
      const yesterdayStart = now.subtract(1, 'day').startOf('day')
      const yesterdayEnd = now.subtract(1, 'day').endOf('day')
      const weekStart = now.startOf('week')
      const weekEnd = now.endOf('week')
      const lastWeekStart = now.subtract(1, 'week').startOf('week')
      const lastWeekEnd = now.subtract(1, 'week').endOf('week')
      const monthStart = now.startOf('month')
      const monthEnd = now.endOf('month')
      const lastMonthStart = now.subtract(1, 'month').startOf('month')
      const lastMonthEnd = now.subtract(1, 'month').endOf('month')

      const today = usages.filter(u => {
        const date = dayjs(u.usageDate)
        return (date.isAfter(todayStart) || date.isSame(todayStart, 'day')) &&
          (date.isBefore(todayEnd) || date.isSame(todayEnd, 'day'))
      }).length
      const yesterday = usages.filter(u => {
        const date = dayjs(u.usageDate)
        return (date.isAfter(yesterdayStart) || date.isSame(yesterdayStart, 'day')) &&
          (date.isBefore(yesterdayEnd) || date.isSame(yesterdayEnd, 'day'))
      }).length
      const thisWeek = usages.filter(u => {
        const date = dayjs(u.usageDate)
        return (date.isAfter(weekStart) || date.isSame(weekStart, 'day')) &&
          (date.isBefore(weekEnd) || date.isSame(weekEnd, 'day'))
      }).length
      const lastWeek = usages.filter(u => {
        const date = dayjs(u.usageDate)
        return (date.isAfter(lastWeekStart) || date.isSame(lastWeekStart, 'day')) &&
          (date.isBefore(lastWeekEnd) || date.isSame(lastWeekEnd, 'day'))
      }).length
      const thisMonth = usages.filter(u => {
        const date = dayjs(u.usageDate)
        return (date.isAfter(monthStart) || date.isSame(monthStart, 'day')) &&
          (date.isBefore(monthEnd) || date.isSame(monthEnd, 'day'))
      }).length
      const lastMonth = usages.filter(u => {
        const date = dayjs(u.usageDate)
        return (date.isAfter(lastMonthStart) || date.isSame(lastMonthStart, 'day')) &&
          (date.isBefore(lastMonthEnd) || date.isSame(lastMonthEnd, 'day'))
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

  useEffect(() => {
    return () => {
      if (periodChangeFrameRef.current !== null) {
        cancelAnimationFrame(periodChangeFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setIsPeriodChanging(false)
  }, [selectedPeriod])

  const handleSelectPeriod = useCallback((period: StatisticsPeriod) => {
    if (period === selectedPeriod) {
      return
    }

    if (periodChangeFrameRef.current !== null) {
      cancelAnimationFrame(periodChangeFrameRef.current)
    }

    setIsPeriodChanging(true)
    periodChangeFrameRef.current = requestAnimationFrame(() => {
      setSelectedPeriod(period)
      periodChangeFrameRef.current = null
    })
  }, [selectedPeriod])

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
        unitValue: getUsageUnitValue(medicine),
      }
    })
  }, [usageHistory, medicines, medicineKits, familyMembers])

  const displayedUsageWithDetails = useMemo(() => {
    if (!isPremium) {
      return usageWithDetails
    }

    return filterUsageByPeriod(usageWithDetails, selectedPeriod)
  }, [isPremium, usageWithDetails, selectedPeriod])

  // Фильтруем историю по выбранному периоду для премиум статистики
  const filteredHistoryForPremium = useMemo(() => {
    if (!isPremium) {
      return []
    }

    return filterUsageByPeriod(usageHistory, selectedPeriod)
  }, [isPremium, usageHistory, selectedPeriod])

  const chartVisibility = useMemo(
    () => getStatisticsChartVisibility(selectedPeriod),
    [selectedPeriod]
  )

  const planAdherence = useMemo(() => {
    return calculatePlanAdherence({
      reminders,
      reminderMedicines,
      usages: usageHistory,
      period: selectedPeriod,
    })
  }, [reminders, reminderMedicines, usageHistory, selectedPeriod])


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

    for (let i = 0; i < 7; i++) {
      weekdays[i] = 0
    }

    filteredHistoryForPremium.forEach(usage => {
      const weekday = dayjs(usage.usageDate).day()
      weekdays[weekday] = (weekdays[weekday] || 0) + 1
    })

    return Object.entries(weekdays).map(([weekday, count]) => ({
      weekday: Number(weekday),
      name: dayjs().day(Number(weekday)).format('dd'),
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
          kitName: kit?.name || t('statistics.unknownKit'),
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [isPremium, filteredHistoryForPremium, medicines, medicineKits, t])

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
          medicineName: medicine?.name || t('statistics.unknownMedicine'),
          count,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [isPremium, filteredHistoryForPremium, medicines, t])

  const medicineConsumption = useMemo(() => {
    if (!isPremium || filteredHistoryForPremium.length === 0) {
      return []
    }

    return calculateMedicineConsumption({
      usages: filteredHistoryForPremium,
      medicines,
      unknownMedicineName: t('statistics.unknownMedicine'),
    })
  }, [isPremium, filteredHistoryForPremium, medicines, t])

  const medicineRunoutForecast = useMemo(() => {
    if (!isPremium || filteredHistoryForPremium.length === 0) {
      return []
    }

    return calculateMedicineRunoutForecast({
      usages: filteredHistoryForPremium,
      medicines,
      period: selectedPeriod,
      unknownMedicineName: t('statistics.unknownMedicine'),
    })
  }, [isPremium, filteredHistoryForPremium, medicines, selectedPeriod, t])

  const familyMemberStats = useMemo(() => {
    if (!isPremium || filteredHistoryForPremium.length === 0) {
      return []
    }

    return calculateFamilyMemberStats({
      usages: filteredHistoryForPremium,
      familyMembers,
      noFamilyMemberName: t('statistics.noFamilyMember'),
    })
  }, [isPremium, filteredHistoryForPremium, familyMembers, t])

  const missedMedicineStats = useMemo(() => {
    if (!isPremium || reminders.length === 0) {
      return []
    }

    return calculateMissedMedicineStats({
      reminders,
      reminderMedicines,
      usages: usageHistory,
      medicines,
      period: selectedPeriod,
      unknownMedicineName: t('statistics.unknownMedicine'),
    })
  }, [isPremium, reminders, reminderMedicines, usageHistory, medicines, selectedPeriod, t])

  const activityHeatmap = useMemo(() => {
    if (!isPremium) {
      return []
    }

    return calculateActivityHeatmap({
      usages: filteredHistoryForPremium,
      period: selectedPeriod,
    })
  }, [isPremium, filteredHistoryForPremium, selectedPeriod])

  const premiumPeriodDynamics = useMemo(() => {
    if (!isPremium) {
      return null
    }

    return calculatePremiumPeriodDynamics({
      usages: usageHistory,
      reminders,
      reminderMedicines,
      period: selectedPeriod,
    })
  }, [isPremium, usageHistory, reminders, reminderMedicines, selectedPeriod])

  const buildStatisticsReportParams = useCallback(() => ({
    appName: t('app.name'),
    title: t('statistics.shareReportTitle'),
    periodLabel: t(statisticsPeriodLabelKeys[selectedPeriod]),
    generatedAtLabel: t('statistics.generatedAt'),
    generatedAt: dayjs().format('DD.MM.YYYY HH:mm'),
    labels: {
      summary: t('statistics.summary'),
      totalIntakes: t('statistics.totalIntakes'),
      averagePerDay: t('statistics.perDay'),
      today: t('statistics.today'),
      yesterday: t('statistics.yesterday'),
      thisWeek: t('statistics.thisWeek'),
      lastWeek: t('statistics.lastWeek'),
      thisMonth: t('statistics.thisMonth'),
      lastMonth: t('statistics.lastMonth'),
      premiumDynamics: t('statistics.premiumDynamics'),
      previous: t('statistics.previous'),
      current: t('statistics.current'),
      planAdherence: t('statistics.planAdherence'),
      completedOfPlanned: t('statistics.planAdherenceMeta', {
        completed: '{{completed}}',
        planned: '{{planned}}',
      }),
      missedIntakes: t('statistics.missed'),
      intakes: t('statistics.intakes'),
      topMedicines: t('statistics.topMedicines'),
      medicineKits: t('statistics.byKits'),
      byTimeOfDay: t('statistics.byTimeOfDay'),
      byWeekday: t('statistics.byWeekday'),
      medicineConsumption: t('statistics.medicineConsumption'),
      runoutForecast: t('statistics.runoutForecast'),
      familyMembers: t('statistics.byFamilyMembers'),
      mostMissedMedicines: t('statistics.mostMissedMedicines'),
      activityHeatmap: t('statistics.activityHeatmap'),
      activeDays: t('statistics.activeDays'),
      maxDailyIntakes: t('statistics.maxDailyIntakes'),
      insights: t('statistics.insights'),
      peakHour: t('statistics.peakHour'),
      mostActiveDay: t('statistics.mostActiveDay'),
      lowestStockRisk: t('statistics.lowestStockRisk'),
      recentIntakes: t('statistics.recentIntakes'),
      daysLeft: t('statistics.shareDaysLeft', { count: 0 }).replace('0', '{{count}}'),
      noData: t('statistics.noDataForPeriod'),
    },
    stats,
    totalIntakes: filteredHistoryForPremium.length,
    planAdherence,
    premiumPeriodDynamics,
    topMedicines,
    kitStats,
    hourStats,
    weekdayStats,
    medicineConsumption: medicineConsumption.map(item => ({
      medicineName: item.medicineName,
      quantity: item.quantity,
      unitLabel: t(`units.${item.unitValue}Short`),
    })),
    runoutForecast: medicineRunoutForecast.map(item => ({
      medicineName: item.medicineName,
      daysLeft: item.daysLeft,
    })),
    familyMemberStats,
    missedMedicineStats,
    activityHeatmapSummary: {
      activeDays: activityHeatmap.filter(item => item.count > 0).length,
      maxDailyIntakes: Math.max(...activityHeatmap.map(item => item.count), 0),
    },
    activityHeatmapDays: activityHeatmap,
    recentIntakes: displayedUsageWithDetails.slice(0, 10).map(usage => ({
      date: dayjs(usage.usageDate).format('DD.MM.YYYY HH:mm'),
      medicineName: usage.medicineName || t('statistics.unknownMedicine'),
      quantity: usage.quantityUsed,
      unitLabel: t(`units.${usage.unitValue ?? 'pcs'}Short`),
      familyMemberName: usage.familyMemberName,
      kitName: usage.kitName,
    })),
  }), [
    t,
    selectedPeriod,
    stats,
    filteredHistoryForPremium.length,
    planAdherence,
    premiumPeriodDynamics,
    topMedicines,
    kitStats,
    hourStats,
    weekdayStats,
    medicineConsumption,
    medicineRunoutForecast,
    familyMemberStats,
    missedMedicineStats,
    activityHeatmap,
    displayedUsageWithDetails,
  ])

  const handleShareStatistics = useCallback(async () => {
    if (isSharingStatistics) {
      return
    }

    try {
      setIsSharingStatistics(true)

      const report = buildStatisticsShareReport(buildStatisticsReportParams())

      await Share.open({
        title: t('statistics.shareReportTitle'),
        message: report,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'User did not share') {
        return
      }

      console.error('Failed to share statistics:', error)
      Alert.alert(t('common.error'), t('statistics.shareFailed'))
    } finally {
      setIsSharingStatistics(false)
    }
  }, [
    isSharingStatistics,
    t,
    buildStatisticsReportParams,
  ])

  const handleShareStatisticsCsv = useCallback(async () => {
    if (isSharingStatisticsCsv) {
      return
    }

    try {
      setIsSharingStatisticsCsv(true)

      const csv = buildStatisticsCsvReport(buildStatisticsReportParams())
      const timestamp = dayjs().format('YYYYMMDD_HHmmss')
      const fileName = `aidkit_statistics_${timestamp}.csv`
      const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`

      await RNFS.writeFile(filePath, csv, 'utf8')
      await Share.open({
        title: t('statistics.exportCsv'),
        url: `file://${filePath}`,
        type: 'text/csv',
        filename: fileName,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'User did not share') {
        return
      }

      console.error('Failed to share statistics CSV:', error)
      Alert.alert(t('common.error'), t('statistics.shareFailed'))
    } finally {
      setIsSharingStatisticsCsv(false)
    }
  }, [
    isSharingStatisticsCsv,
    t,
    buildStatisticsReportParams,
  ])

  const handleShareStatisticsPdf = useCallback(async () => {
    if (isSharingStatisticsPdf) {
      return
    }

    try {
      setIsSharingStatisticsPdf(true)

      const timestamp = dayjs().format('YYYYMMDD_HHmmss')
      const fileName = `aidkit_statistics_${timestamp}`
      const html = buildStatisticsHtmlReport(buildStatisticsReportParams())
      const pdf = await generatePDF({
        html,
        fileName,
      })
      const pdfPath = pdf.filePath?.replace(/^file:\/\//, '')

      if (!pdfPath) {
        throw new Error('PDF file path is empty')
      }

      const pdfExists = await RNFS.exists(pdfPath)
      if (!pdfExists) {
        throw new Error(`PDF file does not exist: ${pdfPath}`)
      }

      await Share.open({
        title: t('statistics.exportPdf'),
        url: `file://${pdfPath}`,
        type: 'application/pdf',
        filename: `${fileName}.pdf`,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'User did not share') {
        return
      }

      console.error('Failed to share statistics PDF:', error)
      Alert.alert(t('common.error'), t('statistics.shareFailed'))
    } finally {
      setIsSharingStatisticsPdf(false)
    }
  }, [
    isSharingStatisticsPdf,
    t,
    buildStatisticsReportParams,
  ])

  const statCards = useMemo(
    () => [
      {
        title: t('statistics.today'),
        value: stats.today,
        icon: '📅',
        color: colors.primary,
      },
      {
        title: t('statistics.thisWeek'),
        value: stats.thisWeek,
        icon: '📆',
        color: colors.secondary,
      },
      {
        title: t('statistics.thisMonth'),
        value: stats.thisMonth,
        icon: '🗓️',
        color: colors.primary,
      },
      {
        title: t('statistics.total'),
        value: stats.total,
        icon: '📊',
        color: colors.muted,
      },
    ],
    [stats, colors, t]
  )

  if (isLoading) {
    return (
      <SafeAreaView edges={['bottom']}>
        <Background>
          <Flex style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              {t('statistics.loading')}
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
            title={t('empty.noDataTitle')}
            description={t('empty.noDataDesc')}
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
                  <Text style={[styles.additionalStatLabel, { color: colors.muted }]}>{t('statistics.yesterday')}</Text>
                  <Text style={[styles.additionalStatValue, { color: colors.text }]}>{stats.yesterday}</Text>
                </View>
                <View style={[styles.additionalStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.additionalStatLabel, { color: colors.muted }]}>{t('statistics.perDay')}</Text>
                  <Text style={[styles.additionalStatValue, { color: colors.text }]}>{stats.averagePerDay}</Text>
                </View>
              </View>

              {/* Сравнение периодов */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.dynamics')}</Text>

                <View style={[styles.comparisonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonLabel, { color: colors.text }]}>{t('statistics.thisWeek')}</Text>
                    <Text style={[styles.comparisonValue, { color: colors.primary }]}>{stats.thisWeek}</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonLabel, { color: colors.muted }]}>{t('statistics.lastWeek')}</Text>
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
                    <Text style={[styles.comparisonLabel, { color: colors.text }]}>{t('statistics.thisMonth')}</Text>
                    <Text style={[styles.comparisonValue, { color: colors.primary }]}>{stats.thisMonth}</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={[styles.comparisonLabel, { color: colors.muted }]}>{t('statistics.lastMonth')}</Text>
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
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.extendedStats')}</Text>
                    <View style={styles.periodSelector}>
                      <Pressable
                        style={[
                          styles.periodButton,
                          {
                            backgroundColor: selectedPeriod === 'day' ? colors.primary : 'transparent',
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => handleSelectPeriod('day')}
                      >
                        <Text style={[
                          styles.periodButtonText,
                          { color: selectedPeriod === 'day' ? '#FFFFFF' : colors.text }
                        ]}>
                          {t('statistics.day')}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.periodButton,
                          {
                            backgroundColor: selectedPeriod === 'week' ? colors.primary : 'transparent',
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => handleSelectPeriod('week')}
                      >
                        <Text style={[
                          styles.periodButtonText,
                          { color: selectedPeriod === 'week' ? '#FFFFFF' : colors.text }
                        ]}>
                          {t('statistics.week')}
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
                        onPress={() => handleSelectPeriod('month')}
                      >
                        <Text style={[
                          styles.periodButtonText,
                          { color: selectedPeriod === 'month' ? '#FFFFFF' : colors.text }
                        ]}>
                          {t('statistics.month')}
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
                        onPress={() => handleSelectPeriod('all')}
                      >
                        <Text style={[
                          styles.periodButtonText,
                          { color: selectedPeriod === 'all' ? '#FFFFFF' : colors.text }
                        ]}>
                          {t('statistics.allTime')}
                        </Text>
                      </Pressable>
                    </View>

                    {isPeriodChanging && (
                      <View style={[styles.periodLoadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <ActivityIndicator size='small' color={colors.primary} />
                        <Text style={[styles.periodLoadingText, { color: colors.muted }]}>
                          {t('statistics.periodLoading')}
                        </Text>
                      </View>
                    )}

                  {filteredHistoryForPremium.length === 0 && (
                    <View style={[styles.emptyPeriodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.emptyPeriodText, { color: colors.muted }]}>
                        {t('statistics.noDataForPeriod')}
                      </Text>
                    </View>
                  )}

                    <View style={[styles.planAdherenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.planAdherenceTitle, { color: colors.text }]}>
                        {t('statistics.planAdherence')}
                      </Text>
                      <Text style={[styles.planAdherenceValue, { color: colors.primary }]}>
                        {planAdherence.percentage}%
                      </Text>
                      <Text style={[styles.planAdherenceMeta, { color: colors.muted }]}>
                        {planAdherence.planned > 0
                          ? t('statistics.planAdherenceMeta', {
                            completed: planAdherence.completed,
                            planned: planAdherence.planned,
                          })
                          : t('statistics.noPlannedIntakes')}
                      </Text>
                      {planAdherence.planned > 0 && (
                        <Text style={[styles.planAdherenceMeta, { color: colors.muted }]}>
                          {t('statistics.missedIntakes', { count: planAdherence.missed })}
                        </Text>
                      )}
                    </View>

                    <View style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.exportContent}>
                        <Text style={[styles.exportTitle, { color: colors.text }]}>
                          {t('statistics.exportStatistics')}
                        </Text>
                        <Text style={[styles.exportDescription, { color: colors.muted }]}>
                          {t('statistics.shareReportDesc')}
                        </Text>
                      </View>
                      <View style={styles.exportActions}>
                        <Pressable
                          style={[styles.exportButton, { backgroundColor: colors.primary }]}
                          onPress={handleShareStatistics}
                          disabled={isSharingStatistics}
                        >
                          {isSharingStatistics ? (
                            <ActivityIndicator size='small' color='#FFFFFF' />
                          ) : (
                            <Text style={styles.exportButtonText}>
                              {t('common.share')}
                            </Text>
                          )}
                        </Pressable>
                        <Pressable
                          style={[styles.exportButton, { backgroundColor: colors.primary }]}
                          onPress={handleShareStatisticsCsv}
                          disabled={isSharingStatisticsCsv}
                        >
                          {isSharingStatisticsCsv ? (
                            <ActivityIndicator size='small' color='#FFFFFF' />
                          ) : (
                            <Text style={styles.exportButtonText}>
                              {t('statistics.exportCsv')}
                            </Text>
                          )}
                        </Pressable>
                        <Pressable
                          style={[styles.exportButton, { backgroundColor: colors.primary }]}
                          onPress={handleShareStatisticsPdf}
                          disabled={isSharingStatisticsPdf}
                        >
                          {isSharingStatisticsPdf ? (
                            <ActivityIndicator size='small' color='#FFFFFF' />
                          ) : (
                            <Text style={styles.exportButtonText}>
                              {t('statistics.exportPdf')}
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  {/* Динамика премиум */}
                  {premiumPeriodDynamics && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.premiumDynamics')}</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.comparisonRow}>
                          <Text style={[styles.comparisonLabel, { color: colors.text }]}>{t('statistics.planAdherence')}</Text>
                          <Text style={[styles.comparisonValue, { color: colors.primary }]}>
                            {premiumPeriodDynamics.previous.adherencePercentage}% → {premiumPeriodDynamics.current.adherencePercentage}%
                          </Text>
                        </View>
                        <View style={styles.comparisonRow}>
                          <Text style={[styles.comparisonLabel, { color: colors.text }]}>{t('statistics.missed')}</Text>
                          <Text style={[styles.comparisonValue, { color: colors.primary }]}>
                            {premiumPeriodDynamics.previous.missed} → {premiumPeriodDynamics.current.missed}
                          </Text>
                        </View>
                        <View style={styles.comparisonRow}>
                          <Text style={[styles.comparisonLabel, { color: colors.text }]}>{t('statistics.intakes')}</Text>
                          <Text style={[styles.comparisonValue, { color: colors.primary }]}>
                            {premiumPeriodDynamics.previous.intakes} → {premiumPeriodDynamics.current.intakes}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Статистика по часам */}
                  {chartVisibility.hour && hourStats.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.byTimeOfDay')}</Text>
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
                  {chartVisibility.weekday && weekdayStats.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.byWeekday')}</Text>
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
                  {chartVisibility.kits && kitStats.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.byKits')}</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {kitStats.map(({ kitId, kitName, count, percentage }) => (
                          <View key={kitId} style={styles.kitStat}>
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
                  {chartVisibility.topMedicines && topMedicines.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.topMedicines')}</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {topMedicines.map(({ medicineId, medicineName, count }, index) => (
                          <View key={medicineId} style={styles.topMedicineItem}>
                            <View style={styles.topMedicineRank}>
                              <Text style={[styles.topMedicineRankText, { color: colors.primary }]}>
                                #{index + 1}
                              </Text>
                            </View>
                            <View style={styles.topMedicineContent}>
                              <Text style={[styles.topMedicineName, { color: colors.text }]}>{medicineName}</Text>
                              <Text style={[styles.topMedicineCount, { color: colors.muted }]}>
                                {count} {count === 1 ? t('history.intake_one') : count < 5 ? t('history.intake_few') : t('history.intake_many')}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Расход лекарств */}
                  {medicineConsumption.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.medicineConsumption')}</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {medicineConsumption.map(({ medicineId, medicineName, quantity, unitValue }) => (
                          <View key={medicineId} style={styles.consumptionItem}>
                            <Text style={[styles.consumptionName, { color: colors.text }]}>{medicineName}</Text>
                            <Text style={[styles.consumptionValue, { color: colors.primary }]}>
                              {quantity} {t(`units.${unitValue}Short`)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Прогноз окончания */}
                  {medicineRunoutForecast.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.runoutForecast')}</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {medicineRunoutForecast.map(({ medicineId, medicineName, daysLeft, unitValue }) => (
                          <View key={medicineId} style={styles.consumptionItem}>
                            <Text style={[styles.consumptionName, { color: colors.text }]}>{medicineName}</Text>
                            <Text style={[styles.consumptionValue, { color: colors.primary }]}>
                              {t('statistics.runoutForecastMeta', {
                                count: daysLeft,
                                unit: t(`units.${unitValue}Short`),
                              })}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Статистика по членам семьи */}
                  {familyMemberStats.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.byFamilyMembers')}</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {familyMemberStats.map(({ familyMemberId, familyMemberName, count, percentage }) => (
                          <View key={familyMemberId ?? 'none'} style={styles.kitStat}>
                            <View style={styles.kitStatHeader}>
                              <Text style={[styles.kitStatName, { color: colors.text }]}>{familyMemberName}</Text>
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

                  {/* Топ пропускаемых лекарств */}
                  {missedMedicineStats.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.mostMissedMedicines')}</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {missedMedicineStats.map(({ medicineId, medicineName, missed }) => (
                          <View key={medicineId} style={styles.topMedicineItem}>
                            <View style={styles.topMedicineContent}>
                              <Text style={[styles.topMedicineName, { color: colors.text }]}>{medicineName}</Text>
                              <Text style={[styles.topMedicineCount, { color: colors.muted }]}>
                                {t('statistics.missedMedicineCount', { count: missed })}
                              </Text>
                            </View>
                            <Text style={[styles.kitStatCount, { color: colors.primary }]}>{missed}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Heatmap активности */}
                  {activityHeatmap.length > 0 && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.activityHeatmap')}</Text>
                      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.heatmapGrid}>
                          {activityHeatmap.map(({ date, count, level }) => (
                            <View
                              key={date}
                              style={[
                                styles.heatmapCell,
                                {
                                  backgroundColor: getHeatmapColor(level, colors.primary),
                                  opacity: getHeatmapOpacity(level),
                                }
                              ]}
                            >
                              {count > 0 && (
                                <Text style={styles.heatmapCellText}>{count}</Text>
                              )}
                            </View>
                          ))}
                        </View>
                        <Text style={[styles.heatmapHint, { color: colors.muted }]}>
                          {selectedPeriod === 'all' ? t('statistics.last180Days') : t('statistics.last30Days')}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* История приемов */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics.recentIntakes')}</Text>
                {displayedUsageWithDetails.length === 0 && (
                  <View style={[styles.emptyPeriodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.emptyPeriodText, { color: colors.muted }]}>
                      {t('statistics.noDataForPeriod')}
                    </Text>
                  </View>
                )}
                {displayedUsageWithDetails.slice(0, 10).map(usage => (
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
                          {(() => {
                            const ruMatch = usage.notes?.match(/^Запланированный прием в (?<time>.+)$/)
                            if (ruMatch) {
                              return t('today.scheduledIntakeAt', { time: ruMatch.groups?.time })
                            }
                            const enMatch = usage.notes?.match(/^Scheduled intake at (?<time>.+)$/)
                            if (enMatch) {
                              return t('today.scheduledIntakeAt', { time: enMatch.groups?.time })
                            }
                            return usage.notes
                          })()}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.historyQuantity, { color: colors.primary }]}>
                      {usage.quantityUsed} {t(`units.${usage.unitValue ?? 'pcs'}Short`)}
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
    justifyContent: 'center',
  },
  periodButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  periodLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  periodLoadingText: {
    fontSize: FONT_SIZE.sm,
  },
  emptyPeriodCard: {
    padding: SPACING.md,
    borderRadius: SPACING.md,
    borderWidth: 1,
  },
  emptyPeriodText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  planAdherenceCard: {
    padding: SPACING.md,
    borderRadius: SPACING.md,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  planAdherenceTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  planAdherenceValue: {
    fontSize: FONT_SIZE.heading,
    fontWeight: 'bold',
    marginBottom: SPACING.xs / 2,
  },
  planAdherenceMeta: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: SPACING.md,
    borderWidth: 1,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  exportContent: {
    flex: 1,
  },
  exportTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  exportDescription: {
    fontSize: FONT_SIZE.sm,
  },
  exportActions: {
    gap: SPACING.sm,
  },
  exportButton: {
    minWidth: 88,
    minHeight: 40,
    paddingHorizontal: SPACING.md,
    borderRadius: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
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
  consumptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  consumptionName: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  consumptionValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
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
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  heatmapCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapCellText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '600',
  },
  heatmapHint: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
})

function getHeatmapColor(level: number, activeColor: string): string {
  if (level === 0) {
    return '#E0E0E0'
  }

  return activeColor
}

function getHeatmapOpacity(level: number): number {
  if (level === 0) {
    return 1
  }

  return Math.min(1, 0.35 + (level * 0.16))
}

import { buildStatisticsCsvReport, buildStatisticsHtmlReport, buildStatisticsShareReport } from './statisticsExport'

describe('buildStatisticsShareReport', () => {
  it('builds a readable share report for the selected premium period', () => {
    const report = buildStatisticsShareReport({
      appName: 'AidKit',
      title: 'Statistics report',
      periodLabel: 'Week',
      generatedAtLabel: 'Generated',
      generatedAt: '23.06.2026 21:45',
      labels: {
        summary: 'Summary',
        totalIntakes: 'Total intakes',
        averagePerDay: 'Per day',
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This week',
        lastWeek: 'Last week',
        thisMonth: 'This month',
        lastMonth: 'Last month',
        premiumDynamics: 'Premium dynamics',
        previous: 'Previous',
        current: 'Current',
        planAdherence: 'Plan adherence',
        completedOfPlanned: 'Completed {{completed}} of {{planned}}',
        missedIntakes: 'Missed',
        intakes: 'Intakes',
        topMedicines: 'Top medicines',
        medicineKits: 'Medicine kits',
        byTimeOfDay: 'By time of day',
        byWeekday: 'By weekday',
        medicineConsumption: 'Consumption',
        runoutForecast: 'Runout forecast',
        familyMembers: 'Family members',
        mostMissedMedicines: 'Most missed medicines',
        activityHeatmap: 'Activity',
        activeDays: 'Active days',
        maxDailyIntakes: 'Max daily intakes',
        insights: 'Insights',
        peakHour: 'Peak hour',
        mostActiveDay: 'Most active day',
        lowestStockRisk: 'Lowest stock risk',
        recentIntakes: 'Recent intakes',
        daysLeft: '~{{count}} days',
        noData: 'No data',
      },
      stats: {
        today: 2,
        yesterday: 1,
        thisWeek: 8,
        lastWeek: 5,
        thisMonth: 20,
        lastMonth: 16,
        total: 42,
        averagePerDay: 3.5,
      },
      totalIntakes: 8,
      planAdherence: {
        completed: 6,
        planned: 8,
        missed: 2,
        percentage: 75,
      },
      premiumPeriodDynamics: {
        previous: {
          adherencePercentage: 60,
          missed: 4,
          intakes: 5,
        },
        current: {
          adherencePercentage: 75,
          missed: 2,
          intakes: 8,
        },
      },
      topMedicines: [
        { medicineName: 'Vitamin C', count: 5 },
      ],
      kitStats: [
        { kitName: 'Home kit', count: 6, percentage: 75 },
      ],
      hourStats: [
        { hour: 9, count: 3 },
      ],
      weekdayStats: [
        { name: 'Mon', count: 4 },
      ],
      medicineConsumption: [
        { medicineName: 'Vitamin C', quantity: 4, unitLabel: 'pcs' },
      ],
      runoutForecast: [
        { medicineName: 'Vitamin C', daysLeft: 12 },
      ],
      familyMemberStats: [
        { familyMemberName: 'Alex', count: 5, percentage: 63 },
      ],
      missedMedicineStats: [
        { medicineName: 'Vitamin C', missed: 2 },
      ],
      activityHeatmapSummary: {
        activeDays: 5,
        maxDailyIntakes: 3,
      },
      activityHeatmapDays: [
        { date: '2026-06-21', count: 1, level: 1 },
        { date: '2026-06-22', count: 0, level: 0 },
        { date: '2026-06-23', count: 3, level: 3 },
      ],
      recentIntakes: [
        {
          date: '23.06.2026 09:00',
          medicineName: 'Vitamin C',
          quantity: 1,
          unitLabel: 'pcs',
          familyMemberName: 'Alex',
          kitName: 'Home kit',
        },
      ],
    })

    expect(report).toContain('AidKit')
    expect(report).toContain('Statistics report')
    expect(report).toContain('Week')
    expect(report).toContain('Total intakes: 8')
    expect(report).toContain('Today: 2')
    expect(report).toContain('Per day: 3.5')
    expect(report).toContain('This week: 8')
    expect(report).toContain('Last week: 5')
    expect(report).toContain('Plan adherence: 75%')
    expect(report).toContain('Completed 6 of 8')
    expect(report).toContain('Missed: 2')
    expect(report).toContain('Previous: 60%, Missed: 4, Intakes: 5')
    expect(report).toContain('Current: 75%, Missed: 2, Intakes: 8')
    expect(report).toContain('Vitamin C - 5')
    expect(report).toContain('Home kit - 6 (75%)')
    expect(report).toContain('09:00 - 3')
    expect(report).toContain('Mon - 4')
    expect(report).toContain('Vitamin C - 4 pcs')
    expect(report).toContain('Vitamin C - ~12 days')
    expect(report).toContain('Alex - 5 (63%)')
    expect(report).toContain('Active days: 5')
    expect(report).toContain('Max daily intakes: 3')
    expect(report).toContain('23.06.2026 09:00 - Vitamin C - 1 pcs - Alex - Home kit')
  })

  it('builds escaped csv rows for the selected premium period', () => {
    const csv = buildStatisticsCsvReport({
      appName: 'AidKit',
      title: 'Statistics report',
      periodLabel: 'Week',
      generatedAtLabel: 'Generated',
      generatedAt: '23.06.2026 21:45',
      labels: {
        summary: 'Summary',
        totalIntakes: 'Total intakes',
        averagePerDay: 'Per day',
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This week',
        lastWeek: 'Last week',
        thisMonth: 'This month',
        lastMonth: 'Last month',
        premiumDynamics: 'Premium dynamics',
        previous: 'Previous',
        current: 'Current',
        planAdherence: 'Plan adherence',
        completedOfPlanned: 'Completed {{completed}} of {{planned}}',
        missedIntakes: 'Missed',
        intakes: 'Intakes',
        topMedicines: 'Top medicines',
        medicineKits: 'Medicine kits',
        byTimeOfDay: 'By time of day',
        byWeekday: 'By weekday',
        medicineConsumption: 'Consumption',
        runoutForecast: 'Runout forecast',
        familyMembers: 'Family members',
        mostMissedMedicines: 'Most missed medicines',
        activityHeatmap: 'Activity',
        activeDays: 'Active days',
        maxDailyIntakes: 'Max daily intakes',
        recentIntakes: 'Recent intakes',
        daysLeft: '~{{count}} days',
        noData: 'No data',
      },
      stats: {
        today: 2,
        yesterday: 1,
        thisWeek: 8,
        lastWeek: 5,
        thisMonth: 20,
        lastMonth: 16,
        total: 42,
        averagePerDay: 3.5,
      },
      totalIntakes: 8,
      planAdherence: {
        completed: 6,
        planned: 8,
        missed: 2,
        percentage: 75,
      },
      premiumPeriodDynamics: null,
      topMedicines: [
        { medicineName: 'Vitamin C, "Plus"', count: 5 },
      ],
      kitStats: [
        { kitName: 'Home kit', count: 6, percentage: 75 },
      ],
      hourStats: [
        { hour: 9, count: 3 },
      ],
      weekdayStats: [
        { name: 'Mon', count: 4 },
      ],
      medicineConsumption: [
        { medicineName: 'Vitamin C, "Plus"', quantity: 4, unitLabel: 'pcs' },
      ],
      runoutForecast: [
        { medicineName: 'Vitamin C, "Plus"', daysLeft: 12 },
      ],
      familyMemberStats: [
        { familyMemberName: 'Alex', count: 5, percentage: 63 },
      ],
      missedMedicineStats: [
        { medicineName: 'Vitamin C, "Plus"', missed: 2 },
      ],
      activityHeatmapSummary: {
        activeDays: 5,
        maxDailyIntakes: 3,
      },
      activityHeatmapDays: [
        { date: '2026-06-21', count: 1, level: 1 },
        { date: '2026-06-22', count: 0, level: 0 },
        { date: '2026-06-23', count: 3, level: 3 },
      ],
      recentIntakes: [
        {
          date: '23.06.2026 09:00',
          medicineName: 'Vitamin C, "Plus"',
          quantity: 1,
          unitLabel: 'pcs',
          familyMemberName: 'Alex',
          kitName: 'Home\nkit',
        },
      ],
    })

    expect(csv.split('\n')[0]).toBe('section,metric,value,extra')
    expect(csv).toContain('Summary,Total intakes,8,')
    expect(csv).toContain('Plan adherence,Plan adherence,75%,')
    expect(csv).toContain('Top medicines,"Vitamin C, ""Plus""",5,')
    expect(csv).toContain('Runout forecast,"Vitamin C, ""Plus""",12,~12 days')
    expect(csv).not.toContain('{{count}}')
    expect(csv).toContain('Recent intakes,23.06.2026 09:00,"Vitamin C, ""Plus""",')
    expect(csv).toContain('"1 pcs | Alex | Home\nkit"')
  })

  it('builds html report with visual chart blocks and escaped content', () => {
    const html = buildStatisticsHtmlReport({
      appName: 'AidKit',
      title: 'Statistics report',
      periodLabel: 'Week',
      generatedAtLabel: 'Generated',
      generatedAt: '23.06.2026 21:45',
      labels: {
        summary: 'Summary',
        totalIntakes: 'Total intakes',
        averagePerDay: 'Per day',
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This week',
        lastWeek: 'Last week',
        thisMonth: 'This month',
        lastMonth: 'Last month',
        premiumDynamics: 'Premium dynamics',
        previous: 'Previous',
        current: 'Current',
        planAdherence: 'Plan adherence',
        completedOfPlanned: 'Completed {{completed}} of {{planned}}',
        missedIntakes: 'Missed',
        intakes: 'Intakes',
        topMedicines: 'Top medicines',
        medicineKits: 'Medicine kits',
        byTimeOfDay: 'By time of day',
        byWeekday: 'By weekday',
        medicineConsumption: 'Consumption',
        runoutForecast: 'Runout forecast',
        familyMembers: 'Family members',
        mostMissedMedicines: 'Most missed medicines',
        activityHeatmap: 'Activity',
        activeDays: 'Active days',
        maxDailyIntakes: 'Max daily intakes',
        recentIntakes: 'Recent intakes',
        daysLeft: '~{{count}} days',
        noData: 'No data',
      },
      stats: {
        today: 2,
        yesterday: 1,
        thisWeek: 8,
        lastWeek: 5,
        thisMonth: 20,
        lastMonth: 16,
        total: 42,
        averagePerDay: 3.5,
      },
      totalIntakes: 8,
      planAdherence: {
        completed: 6,
        planned: 8,
        missed: 2,
        percentage: 75,
      },
      premiumPeriodDynamics: {
        previous: {
          adherencePercentage: 60,
          missed: 4,
          intakes: 5,
        },
        current: {
          adherencePercentage: 75,
          missed: 2,
          intakes: 8,
        },
      },
      topMedicines: [
        { medicineName: 'Vitamin C <Plus>', count: 5 },
      ],
      kitStats: [
        { kitName: 'Home kit', count: 6, percentage: 75 },
      ],
      hourStats: [
        { hour: 9, count: 3 },
      ],
      weekdayStats: [
        { name: 'Mon', count: 4 },
      ],
      medicineConsumption: [
        { medicineName: 'Vitamin C <Plus>', quantity: 4, unitLabel: 'pcs' },
      ],
      runoutForecast: [
        { medicineName: 'Vitamin C <Plus>', daysLeft: 12 },
      ],
      familyMemberStats: [
        { familyMemberName: 'Alex', count: 5, percentage: 63 },
      ],
      missedMedicineStats: [
        { medicineName: 'Vitamin C <Plus>', missed: 2 },
      ],
      activityHeatmapSummary: {
        activeDays: 5,
        maxDailyIntakes: 3,
      },
      activityHeatmapDays: [
        { date: '2026-06-21', count: 1, level: 1 },
        { date: '2026-06-22', count: 0, level: 0 },
        { date: '2026-06-23', count: 3, level: 3 },
      ],
      recentIntakes: [
        {
          date: '23.06.2026 09:00',
          medicineName: 'Vitamin C <Plus>',
          quantity: 1,
          unitLabel: 'pcs',
          familyMemberName: 'Alex',
          kitName: 'Home kit',
        },
      ],
    })

    expect(html).toContain('<!doctype html>')
    expect(html).toContain('Statistics report')
    expect(html).toContain('Vitamin C &lt;Plus&gt;')
    expect(html).toContain('class="donut-chart"')
    expect(html).toContain('stroke-dasharray="75 25"')
    expect(html).toContain('<svg class="svg-bar-chart"')
    expect(html).toContain('<rect')
    expect(html).toContain('Insights')
    expect(html).toContain('Peak hour')
    expect(html).toContain('09:00')
    expect(html).toContain('Lowest stock risk')
    expect(html).toContain('~12 days')
    expect(html).toContain('class="bar-fill"')
    expect(html).toContain('width: 100%')
    expect(html).toContain('title="2026-06-23: 3"')
    expect(html).toContain('class="heatmap-cell active level-3"')
    expect(html).toContain('<table')
  })
})

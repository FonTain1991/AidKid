interface ReportLabels {
  summary: string
  totalIntakes: string
  averagePerDay: string
  today: string
  yesterday: string
  thisWeek: string
  lastWeek: string
  thisMonth: string
  lastMonth: string
  premiumDynamics: string
  previous: string
  current: string
  planAdherence: string
  completedOfPlanned: string
  missedIntakes: string
  intakes: string
  topMedicines: string
  medicineKits: string
  byTimeOfDay: string
  byWeekday: string
  medicineConsumption: string
  runoutForecast: string
  familyMembers: string
  mostMissedMedicines: string
  activityHeatmap: string
  activeDays: string
  maxDailyIntakes: string
  insights?: string
  peakHour?: string
  mostActiveDay?: string
  lowestStockRisk?: string
  recentIntakes: string
  daysLeft: string
  noData: string
}

interface PlanAdherenceReport {
  completed: number
  planned: number
  missed: number
  percentage: number
}

interface MedicineConsumptionReportItem {
  medicineName: string
  quantity: number
  unitLabel: string
}

interface MedicineRunoutForecastReportItem {
  medicineName: string
  daysLeft: number
}

interface FamilyMemberReportItem {
  familyMemberName: string
  count: number
  percentage: number
}

interface MissedMedicineReportItem {
  medicineName: string
  missed: number
}

interface PeriodStatsReport {
  today: number
  yesterday: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
  total: number
  averagePerDay: number
}

interface PeriodDynamicsReportValue {
  adherencePercentage: number
  missed: number
  intakes: number
}

interface PremiumPeriodDynamicsReport {
  previous: PeriodDynamicsReportValue
  current: PeriodDynamicsReportValue
}

interface CountReportItem {
  count: number
}

interface TopMedicineReportItem extends CountReportItem {
  medicineName: string
}

interface KitReportItem extends CountReportItem {
  kitName: string
  percentage: number
}

interface HourReportItem extends CountReportItem {
  hour: number
}

interface WeekdayReportItem extends CountReportItem {
  name: string
}

interface ActivityHeatmapSummary {
  activeDays: number
  maxDailyIntakes: number
}

interface ActivityHeatmapReportDay {
  date: string
  count: number
  level: number
}

interface RecentIntakeReportItem {
  date: string
  medicineName: string
  quantity: number
  unitLabel: string
  familyMemberName?: string
  kitName?: string
}

interface BuildStatisticsShareReportParams {
  appName: string
  title: string
  periodLabel: string
  generatedAtLabel: string
  generatedAt: string
  labels: ReportLabels
  stats: PeriodStatsReport
  totalIntakes: number
  planAdherence: PlanAdherenceReport
  premiumPeriodDynamics: PremiumPeriodDynamicsReport | null
  topMedicines: TopMedicineReportItem[]
  kitStats: KitReportItem[]
  hourStats: HourReportItem[]
  weekdayStats: WeekdayReportItem[]
  medicineConsumption: MedicineConsumptionReportItem[]
  runoutForecast: MedicineRunoutForecastReportItem[]
  familyMemberStats: FamilyMemberReportItem[]
  missedMedicineStats: MissedMedicineReportItem[]
  activityHeatmapSummary: ActivityHeatmapSummary
  activityHeatmapDays?: ActivityHeatmapReportDay[]
  recentIntakes: RecentIntakeReportItem[]
}

interface CsvRow {
  section: string
  metric: string
  value: string | number
  extra?: string | number
}

export function buildStatisticsShareReport(params: BuildStatisticsShareReportParams): string {
  const {
    appName,
    title,
    periodLabel,
    generatedAtLabel,
    generatedAt,
    labels,
    stats,
    totalIntakes,
    planAdherence,
    premiumPeriodDynamics,
    topMedicines,
    kitStats,
    hourStats,
    weekdayStats,
    medicineConsumption,
    runoutForecast,
    familyMemberStats,
    missedMedicineStats,
    activityHeatmapSummary,
    recentIntakes,
  } = params

  return [
    appName,
    title,
    periodLabel,
    `${generatedAtLabel}: ${generatedAt}`,
    '',
    labels.summary,
    `${labels.totalIntakes}: ${totalIntakes}`,
    `${labels.today}: ${stats.today}`,
    `${labels.yesterday}: ${stats.yesterday}`,
    `${labels.thisWeek}: ${stats.thisWeek}`,
    `${labels.lastWeek}: ${stats.lastWeek}`,
    `${labels.thisMonth}: ${stats.thisMonth}`,
    `${labels.lastMonth}: ${stats.lastMonth}`,
    `${labels.averagePerDay}: ${stats.averagePerDay}`,
    '',
    `${labels.planAdherence}: ${planAdherence.percentage}%`,
    formatTemplate(labels.completedOfPlanned, {
      completed: planAdherence.completed,
      planned: planAdherence.planned,
    }),
    `${labels.missedIntakes}: ${planAdherence.missed}`,
    '',
    formatPremiumDynamics(labels, premiumPeriodDynamics),
    '',
    formatSection({
      title: labels.topMedicines,
      items: topMedicines,
      formatItem: item => `${item.medicineName} - ${item.count}`,
      emptyLabel: labels.noData,
    }),
    '',
    formatSection({
      title: labels.medicineKits,
      items: kitStats,
      formatItem: item => `${item.kitName} - ${item.count} (${item.percentage}%)`,
      emptyLabel: labels.noData,
    }),
    '',
    formatSection({
      title: labels.byTimeOfDay,
      items: hourStats.filter(item => item.count > 0),
      formatItem: item => `${String(item.hour).padStart(2, '0')}:00 - ${item.count}`,
      emptyLabel: labels.noData,
    }),
    '',
    formatSection({
      title: labels.byWeekday,
      items: weekdayStats.filter(item => item.count > 0),
      formatItem: item => `${item.name} - ${item.count}`,
      emptyLabel: labels.noData,
    }),
    '',
    formatSection({
      title: labels.medicineConsumption,
      items: medicineConsumption,
      formatItem: item => `${item.medicineName} - ${item.quantity} ${item.unitLabel}`,
      emptyLabel: labels.noData,
    }),
    '',
    formatSection({
      title: labels.runoutForecast,
      items: runoutForecast,
      formatItem: item => `${item.medicineName} - ${formatTemplate(labels.daysLeft, { count: item.daysLeft })}`,
      emptyLabel: labels.noData,
    }),
    '',
    formatSection({
      title: labels.familyMembers,
      items: familyMemberStats,
      formatItem: item => `${item.familyMemberName} - ${item.count} (${item.percentage}%)`,
      emptyLabel: labels.noData,
    }),
    '',
    formatSection({
      title: labels.mostMissedMedicines,
      items: missedMedicineStats,
      formatItem: item => `${item.medicineName} - ${item.missed}`,
      emptyLabel: labels.noData,
    }),
    '',
    labels.activityHeatmap,
    `${labels.activeDays}: ${activityHeatmapSummary.activeDays}`,
    `${labels.maxDailyIntakes}: ${activityHeatmapSummary.maxDailyIntakes}`,
    '',
    formatSection({
      title: labels.recentIntakes,
      items: recentIntakes,
      formatItem: formatRecentIntake,
      emptyLabel: labels.noData,
    }),
  ].join('\n')
}

export function buildStatisticsCsvReport(params: BuildStatisticsShareReportParams): string {
  const { appName, title, periodLabel, generatedAtLabel, generatedAt, labels } = params
  const rows: CsvRow[] = [
    { section: 'Metadata', metric: 'App', value: appName },
    { section: 'Metadata', metric: 'Title', value: title },
    { section: 'Metadata', metric: 'Period', value: periodLabel },
    { section: 'Metadata', metric: generatedAtLabel, value: generatedAt },
    ...buildSummaryCsvRows(params),
    ...buildAdherenceCsvRows(params),
    ...buildPremiumDynamicsCsvRows(params),
    ...params.topMedicines.map(item => ({
      section: labels.topMedicines,
      metric: item.medicineName,
      value: item.count,
    })),
    ...params.kitStats.map(item => ({
      section: labels.medicineKits,
      metric: item.kitName,
      value: item.count,
      extra: `${item.percentage}%`,
    })),
    ...params.hourStats.filter(item => item.count > 0).map(item => ({
      section: labels.byTimeOfDay,
      metric: `${String(item.hour).padStart(2, '0')}:00`,
      value: item.count,
    })),
    ...params.weekdayStats.filter(item => item.count > 0).map(item => ({
      section: labels.byWeekday,
      metric: item.name,
      value: item.count,
    })),
    ...params.medicineConsumption.map(item => ({
      section: labels.medicineConsumption,
      metric: item.medicineName,
      value: item.quantity,
      extra: item.unitLabel,
    })),
    ...params.runoutForecast.map(item => ({
      section: labels.runoutForecast,
      metric: item.medicineName,
      value: item.daysLeft,
      extra: formatTemplate(labels.daysLeft, { count: item.daysLeft }),
    })),
    ...params.familyMemberStats.map(item => ({
      section: labels.familyMembers,
      metric: item.familyMemberName,
      value: item.count,
      extra: `${item.percentage}%`,
    })),
    ...params.missedMedicineStats.map(item => ({
      section: labels.mostMissedMedicines,
      metric: item.medicineName,
      value: item.missed,
    })),
    {
      section: labels.activityHeatmap,
      metric: labels.activeDays,
      value: params.activityHeatmapSummary.activeDays,
    },
    {
      section: labels.activityHeatmap,
      metric: labels.maxDailyIntakes,
      value: params.activityHeatmapSummary.maxDailyIntakes,
    },
    ...params.recentIntakes.map(item => ({
      section: labels.recentIntakes,
      metric: item.date,
      value: item.medicineName,
      extra: [
        `${item.quantity} ${item.unitLabel}`,
        item.familyMemberName,
        item.kitName,
      ].filter(Boolean).join(' | '),
    })),
  ]

  return [
    ['section', 'metric', 'value', 'extra'].join(','),
    ...rows.map(row => [
      row.section,
      row.metric,
      row.value,
      row.extra ?? '',
    ].map(formatCsvCell).join(',')),
  ].join('\n')
}

export function buildStatisticsHtmlReport(params: BuildStatisticsShareReportParams): string {
  const { appName, title, periodLabel, generatedAtLabel, generatedAt, labels, stats, totalIntakes, planAdherence } = params

  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${buildReportCss()}</style>`,
    '</head>',
    '<body>',
    '<main class="report">',
    '<header class="header">',
    `<div class="app">${escapeHtml(appName)}</div>`,
    `<h1>${escapeHtml(title)}</h1>`,
    `<p>${escapeHtml(periodLabel)} · ${escapeHtml(generatedAtLabel)}: ${escapeHtml(generatedAt)}</p>`,
    '</header>',
    '<section class="grid">',
    formatMetricCard(labels.totalIntakes, totalIntakes),
    formatMetricCard(labels.today, stats.today),
    formatMetricCard(labels.thisWeek, stats.thisWeek),
    formatMetricCard(labels.averagePerDay, stats.averagePerDay),
    '</section>',
    '<section class="section">',
    `<h2>${escapeHtml(labels.planAdherence)}</h2>`,
    formatDonutChartHtml(planAdherence),
    formatProgressBar(labels.planAdherence, planAdherence.percentage, `${planAdherence.percentage}%`),
    `<p>${escapeHtml(formatTemplate(labels.completedOfPlanned, {
      completed: planAdherence.completed,
      planned: planAdherence.planned,
    }))}</p>`,
    `<p>${escapeHtml(labels.missedIntakes)}: ${planAdherence.missed}</p>`,
    '</section>',
    formatDynamicsHtml(params),
    formatBarChartHtml(labels.topMedicines, params.topMedicines.map(item => ({
      label: item.medicineName,
      value: item.count,
    }))),
    formatBarChartHtml(labels.medicineKits, params.kitStats.map(item => ({
      label: item.kitName,
      value: item.count,
      extra: `${item.percentage}%`,
    }))),
    formatBarChartHtml(labels.byTimeOfDay, params.hourStats.filter(item => item.count > 0).map(item => ({
      label: `${String(item.hour).padStart(2, '0')}:00`,
      value: item.count,
    }))),
    formatBarChartHtml(labels.byWeekday, params.weekdayStats.filter(item => item.count > 0).map(item => ({
      label: item.name,
      value: item.count,
    }))),
    formatTableHtml({
      title: labels.medicineConsumption,
      columns: [labels.medicineConsumption, labels.totalIntakes],
      rows: params.medicineConsumption.map(item => [
        item.medicineName,
        `${item.quantity} ${item.unitLabel}`,
      ]),
      emptyLabel: labels.noData,
    }),
    formatTableHtml({
      title: labels.runoutForecast,
      columns: [labels.runoutForecast, labels.daysLeft],
      rows: params.runoutForecast.map(item => [
        item.medicineName,
        formatTemplate(labels.daysLeft, { count: item.daysLeft }),
      ]),
      emptyLabel: labels.noData,
    }),
    formatTableHtml({
      title: labels.familyMembers,
      columns: [labels.familyMembers, labels.totalIntakes],
      rows: params.familyMemberStats.map(item => [
        item.familyMemberName,
        `${item.count} (${item.percentage}%)`,
      ]),
      emptyLabel: labels.noData,
    }),
    formatTableHtml({
      title: labels.mostMissedMedicines,
      columns: [labels.mostMissedMedicines, labels.missedIntakes],
      rows: params.missedMedicineStats.map(item => [
        item.medicineName,
        item.missed,
      ]),
      emptyLabel: labels.noData,
    }),
    formatInsightsHtml(params),
    formatHeatmapSummaryHtml(labels, params.activityHeatmapSummary, params.activityHeatmapDays),
    formatTableHtml({
      title: labels.recentIntakes,
      columns: [labels.recentIntakes, labels.medicineConsumption, labels.familyMembers],
      rows: params.recentIntakes.map(item => [
        item.date,
        `${item.medicineName} · ${item.quantity} ${item.unitLabel}`,
        [item.familyMemberName, item.kitName].filter(Boolean).join(' · '),
      ]),
      emptyLabel: labels.noData,
    }),
    '</main>',
    '</body>',
    '</html>',
  ].join('')
}

function buildSummaryCsvRows(params: BuildStatisticsShareReportParams): CsvRow[] {
  const { labels, stats, totalIntakes } = params

  return [
    { section: labels.summary, metric: labels.totalIntakes, value: totalIntakes },
    { section: labels.summary, metric: labels.today, value: stats.today },
    { section: labels.summary, metric: labels.yesterday, value: stats.yesterday },
    { section: labels.summary, metric: labels.thisWeek, value: stats.thisWeek },
    { section: labels.summary, metric: labels.lastWeek, value: stats.lastWeek },
    { section: labels.summary, metric: labels.thisMonth, value: stats.thisMonth },
    { section: labels.summary, metric: labels.lastMonth, value: stats.lastMonth },
    { section: labels.summary, metric: labels.averagePerDay, value: stats.averagePerDay },
  ]
}

function buildAdherenceCsvRows(params: BuildStatisticsShareReportParams): CsvRow[] {
  const { labels, planAdherence } = params

  return [
    { section: labels.planAdherence, metric: labels.planAdherence, value: `${planAdherence.percentage}%` },
    { section: labels.planAdherence, metric: labels.completedOfPlanned, value: planAdherence.completed, extra: planAdherence.planned },
    { section: labels.planAdherence, metric: labels.missedIntakes, value: planAdherence.missed },
  ]
}

function buildPremiumDynamicsCsvRows(params: BuildStatisticsShareReportParams): CsvRow[] {
  const { labels, premiumPeriodDynamics } = params

  if (!premiumPeriodDynamics) {
    return []
  }

  return [
    ...formatPeriodDynamicsCsvRows(labels.previous, premiumPeriodDynamics.previous, labels),
    ...formatPeriodDynamicsCsvRows(labels.current, premiumPeriodDynamics.current, labels),
  ]
}

function formatPeriodDynamicsCsvRows(
  title: string,
  value: PeriodDynamicsReportValue,
  labels: ReportLabels
): CsvRow[] {
  return [
    { section: labels.premiumDynamics, metric: `${title} ${labels.planAdherence}`, value: `${value.adherencePercentage}%` },
    { section: labels.premiumDynamics, metric: `${title} ${labels.missedIntakes}`, value: value.missed },
    { section: labels.premiumDynamics, metric: `${title} ${labels.intakes}`, value: value.intakes },
  ]
}

function formatPremiumDynamics(
  labels: ReportLabels,
  premiumPeriodDynamics: PremiumPeriodDynamicsReport | null
): string {
  if (!premiumPeriodDynamics) {
    return `${labels.premiumDynamics}\n- ${labels.noData}`
  }

  return [
    labels.premiumDynamics,
    formatPeriodDynamics(labels.previous, premiumPeriodDynamics.previous, labels),
    formatPeriodDynamics(labels.current, premiumPeriodDynamics.current, labels),
  ].join('\n')
}

function formatPeriodDynamics(
  title: string,
  value: PeriodDynamicsReportValue,
  labels: ReportLabels
): string {
  return `${title}: ${value.adherencePercentage}%, ${labels.missedIntakes}: ${value.missed}, ${labels.intakes}: ${value.intakes}`
}

function formatSection<T>(params: {
  title: string
  items: T[]
  formatItem: (item: T) => string
  emptyLabel: string
}): string {
  const { title, items, formatItem, emptyLabel } = params

  if (items.length === 0) {
    return `${title}\n- ${emptyLabel}`
  }

  return [
    title,
    ...items.map(item => `- ${formatItem(item)}`),
  ].join('\n')
}

function formatTemplate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
    template
  )
}

function formatRecentIntake(item: RecentIntakeReportItem): string {
  return [
    item.date,
    item.medicineName,
    `${item.quantity} ${item.unitLabel}`,
    item.familyMemberName,
    item.kitName,
  ].filter(Boolean).join(' - ')
}

function formatCsvCell(value: string | number): string {
  const cell = String(value)

  if ((/[",\n]/).test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`
  }

  return cell
}

function formatMetricCard(label: string, value: string | number): string {
  return [
    '<div class="metric-card">',
    `<div class="metric-value">${escapeHtml(value)}</div>`,
    `<div class="metric-label">${escapeHtml(label)}</div>`,
    '</div>',
  ].join('')
}

function formatDynamicsHtml(params: BuildStatisticsShareReportParams): string {
  const { labels, premiumPeriodDynamics } = params

  if (!premiumPeriodDynamics) {
    return ''
  }

  return [
    '<section class="section">',
    `<h2>${escapeHtml(labels.premiumDynamics)}</h2>`,
    '<div class="grid two">',
    formatMetricCard(labels.previous, `${premiumPeriodDynamics.previous.adherencePercentage}%`),
    formatMetricCard(labels.current, `${premiumPeriodDynamics.current.adherencePercentage}%`),
    '</div>',
    '</section>',
  ].join('')
}

function formatBarChartHtml(
  title: string,
  items: Array<{ label: string; value: number; extra?: string }>
): string {
  const maxValue = Math.max(...items.map(item => item.value), 1)

  if (items.length === 0) {
    return ''
  }

  return [
    '<section class="section">',
    `<h2>${escapeHtml(title)}</h2>`,
    formatSvgBarChartHtml(items),
    '<div class="bar-chart">',
    ...items.map(item => formatProgressBar(
      item.label,
      Math.round((item.value / maxValue) * 100),
      item.extra ? `${item.value} · ${item.extra}` : item.value
    )),
    '</div>',
    '</section>',
  ].join('')
}

function formatDonutChartHtml(planAdherence: PlanAdherenceReport): string {
  const completed = Math.max(0, Math.min(100, planAdherence.percentage))
  const missed = Math.max(0, 100 - completed)

  return [
    '<div class="donut-wrap">',
    '<svg class="donut-chart" viewBox="0 0 42 42">',
    '<circle class="donut-bg" cx="21" cy="21" r="15.9155"></circle>',
    `<circle class="donut-value" cx="21" cy="21" r="15.9155" stroke-dasharray="${completed} ${missed}"></circle>`,
    `<text x="21" y="23" text-anchor="middle">${completed}%</text>`,
    '</svg>',
    '</div>',
  ].join('')
}

function formatSvgBarChartHtml(items: Array<{ label: string; value: number; extra?: string }>): string {
  if (items.length === 0) {
    return ''
  }

  const chartWidth = 520
  const rowHeight = 30
  const maxValue = Math.max(...items.map(item => item.value), 1)
  const chartHeight = items.length * rowHeight

  return [
    `<svg class="svg-bar-chart" viewBox="0 0 ${chartWidth} ${chartHeight}" role="img">`,
    ...items.map((item, index) => {
      const barWidth = Math.max(2, Math.round((item.value / maxValue) * 320))
      const y = (index * rowHeight) + 6

      return [
        `<text x="0" y="${y + 12}" class="svg-label">${escapeHtml(item.label)}</text>`,
        `<rect x="160" y="${y}" width="${barWidth}" height="14" rx="7"></rect>`,
        `<text x="${170 + barWidth}" y="${y + 12}" class="svg-value">${escapeHtml(item.extra ? `${item.value} · ${item.extra}` : item.value)}</text>`,
      ].join('')
    }),
    '</svg>',
  ].join('')
}

function formatInsightsHtml(params: BuildStatisticsShareReportParams): string {
  const { labels, hourStats, weekdayStats, runoutForecast } = params
  const peakHour = getTopItem(hourStats.filter(item => item.count > 0), item => item.count)
  const mostActiveDay = getTopItem(weekdayStats.filter(item => item.count > 0), item => item.count)
  const [lowestStockRisk] = runoutForecast

  return [
    '<section class="section insights">',
    `<h2>${escapeHtml(labels.insights || 'Insights')}</h2>`,
    '<div class="grid three">',
    formatMetricCard(labels.peakHour || 'Peak hour', peakHour ? `${String(peakHour.hour).padStart(2, '0')}:00 (${peakHour.count})` : labels.noData),
    formatMetricCard(labels.mostActiveDay || 'Most active day', mostActiveDay ? `${mostActiveDay.name} (${mostActiveDay.count})` : labels.noData),
    formatMetricCard(labels.lowestStockRisk || 'Lowest stock risk', lowestStockRisk ? `${lowestStockRisk.medicineName} ${formatTemplate(labels.daysLeft, { count: lowestStockRisk.daysLeft })}` : labels.noData),
    '</div>',
    '</section>',
  ].join('')
}

function formatProgressBar(label: string, percentage: number, value: string | number): string {
  return [
    '<div class="bar-row">',
    '<div class="bar-header">',
    `<span>${escapeHtml(label)}</span>`,
    `<strong>${escapeHtml(value)}</strong>`,
    '</div>',
    '<div class="bar-track">',
    `<div class="bar-fill" style="width: ${Math.max(0, Math.min(100, percentage))}%"></div>`,
    '</div>',
    '</div>',
  ].join('')
}

function formatTableHtml(params: {
  title: string
  columns: string[]
  rows: Array<Array<string | number>>
  emptyLabel: string
}): string {
  const { title, columns, rows, emptyLabel } = params

  return [
    '<section class="section">',
    `<h2>${escapeHtml(title)}</h2>`,
    '<table>',
    '<thead>',
    '<tr>',
    ...columns.map(column => `<th>${escapeHtml(column)}</th>`),
    '</tr>',
    '</thead>',
    '<tbody>',
    ...(rows.length > 0
      ? rows.map(row => [
        '<tr>',
        ...row.map(cell => `<td>${escapeHtml(cell)}</td>`),
        '</tr>',
      ].join(''))
      : [`<tr><td colspan="${columns.length}">${escapeHtml(emptyLabel)}</td></tr>`]),
    '</tbody>',
    '</table>',
    '</section>',
  ].join('')
}

function formatHeatmapSummaryHtml(
  labels: ReportLabels,
  summary: ActivityHeatmapSummary,
  days?: ActivityHeatmapReportDay[]
): string {
  const heatmapDays = days && days.length > 0
    ? days
    : Array.from({ length: Math.max(1, Math.min(30, summary.activeDays || 1)) }, (_, index) => ({
      date: String(index + 1),
      count: index + 1 <= summary.maxDailyIntakes ? summary.maxDailyIntakes : 0,
      level: index + 1 <= summary.activeDays ? 1 : 0,
    }))

  return [
    '<section class="section">',
    `<h2>${escapeHtml(labels.activityHeatmap)}</h2>`,
    '<div class="heatmap">',
    ...heatmapDays.map(day => (
      `<span class="heatmap-cell ${day.count > 0 ? 'active' : ''} level-${day.level}" title="${escapeHtml(`${day.date}: ${day.count}`)}">${day.count > 0 ? escapeHtml(day.count) : ''}</span>`
    )),
    '</div>',
    `<p>${escapeHtml(labels.activeDays)}: ${summary.activeDays}</p>`,
    `<p>${escapeHtml(labels.maxDailyIntakes)}: ${summary.maxDailyIntakes}</p>`,
    '</section>',
  ].join('')
}

function buildReportCss(): string {
  return `
    body { margin: 0; background: #f6f7fb; color: #17212b; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .report { padding: 28px; }
    .header { background: #ffffff; border-radius: 18px; padding: 24px; margin-bottom: 18px; }
    .app { color: #64748b; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    h1 { margin: 8px 0; font-size: 28px; }
    h2 { margin: 0 0 14px; font-size: 18px; }
    p { margin: 8px 0; color: #475569; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
    .grid.two { grid-template-columns: repeat(2, 1fr); }
    .grid.three { grid-template-columns: repeat(3, 1fr); }
    .metric-card, .section { background: #ffffff; border-radius: 16px; padding: 18px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
    .metric-value { color: #2563eb; font-size: 24px; font-weight: 800; }
    .metric-label { margin-top: 6px; color: #64748b; font-size: 12px; }
    .section { margin-bottom: 18px; }
    .bar-row { margin-bottom: 12px; }
    .bar-header { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; font-size: 13px; }
    .bar-track { height: 12px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 999px; background: #2563eb; }
    .donut-wrap { display: flex; justify-content: center; margin: 8px 0 16px; }
    .donut-chart { width: 132px; height: 132px; transform: rotate(-90deg); }
    .donut-chart text { transform: rotate(90deg); transform-origin: 21px 21px; fill: #17212b; font-size: 8px; font-weight: 800; }
    .donut-bg { fill: none; stroke: #e2e8f0; stroke-width: 5; }
    .donut-value { fill: none; stroke: #2563eb; stroke-width: 5; stroke-linecap: round; }
    .svg-bar-chart { width: 100%; max-height: 260px; margin-bottom: 14px; }
    .svg-bar-chart rect { fill: #2563eb; }
    .svg-label { fill: #334155; font-size: 11px; }
    .svg-value { fill: #64748b; font-size: 11px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
    th { color: #475569; font-weight: 700; }
    .heatmap { display: flex; flex-wrap: wrap; gap: 5px; margin: 8px 0 12px; }
    .heatmap-cell { width: 18px; height: 18px; border-radius: 4px; background: #e2e8f0; color: #ffffff; font-size: 8px; display: inline-flex; align-items: center; justify-content: center; }
    .heatmap-cell.active { background: #93c5fd; }
    .heatmap-cell.level-2 { background: #60a5fa; }
    .heatmap-cell.level-3 { background: #2563eb; }
    .heatmap-cell.level-4 { background: #1d4ed8; }
  `
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getTopItem<T>(items: T[], getValue: (item: T) => number): T | null {
  return items.reduce<T | null>((topItem, item) => {
    if (!topItem || getValue(item) > getValue(topItem)) {
      return item
    }

    return topItem
  }, null)
}

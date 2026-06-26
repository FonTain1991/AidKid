import type { Medicine, MedicineKit } from '@/services/models'

export interface KitMedicineItem {
  name: string
  quantity: number
  unitLabel: string
  expirationLabel: string
}

export interface KitTreeNode {
  kitName: string
  medicines: KitMedicineItem[]
  children: KitTreeNode[]
}

interface KitExportLabels {
  medicines: string
  quantity: string
  expirationDate: string
  noMedicines: string
  totalMedicines: string
}

export interface BuildKitExportParams {
  appName: string
  title: string
  generatedAtLabel: string
  generatedAt: string
  labels: KitExportLabels
  trees: KitTreeNode[]
}

export function normalizeKitId(id: string | number | null | undefined): string | null {
  if (id === null || id === undefined) {
    return null
  }

  return String(id)
}

export function getChildKits(parentId: number | null, kits: MedicineKit[]): MedicineKit[] {
  const normalizedParent = normalizeKitId(parentId)

  return kits
    .filter(kit => normalizeKitId(kit.parentId) === normalizedParent)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
}

export function buildKitTreeNode(
  kit: MedicineKit,
  kits: MedicineKit[],
  medicines: Medicine[],
  getUnitLabel: (unitValue: string) => string,
  formatExpirationDate: (expirationDate: number) => string
): KitTreeNode {
  const kitMedicines = medicines
    .filter(medicine => normalizeKitId(medicine.medicineKitId) === normalizeKitId(kit.id))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
    .map(medicine => ({
      name: medicine.name,
      quantity: medicine.quantity ?? 0,
      unitLabel: getUnitLabel(medicine.unitForQuantity ?? 'pcs'),
      expirationLabel: formatExpirationDate(medicine.expirationDate),
    }))

  return {
    kitName: kit.name,
    medicines: kitMedicines,
    children: getChildKits(kit.id ?? null, kits).map(child => buildKitTreeNode(child, kits, medicines, getUnitLabel, formatExpirationDate)),
  }
}

export function buildKitTrees(
  rootKitId: number | null,
  kits: MedicineKit[],
  medicines: Medicine[],
  getUnitLabel: (unitValue: string) => string,
  formatExpirationDate: (expirationDate: number) => string
): KitTreeNode[] {
  if (rootKitId !== null) {
    const kit = kits.find(item => normalizeKitId(item.id) === normalizeKitId(rootKitId))

    if (!kit) {
      return []
    }

    return [buildKitTreeNode(kit, kits, medicines, getUnitLabel, formatExpirationDate)]
  }

  return getChildKits(null, kits).map(kit => buildKitTreeNode(kit, kits, medicines, getUnitLabel, formatExpirationDate))
}

export function countKitTreeMedicines(trees: KitTreeNode[]): number {
  return trees.reduce((total, tree) => total + countKitNodeMedicines(tree), 0)
}

function countKitNodeMedicines(node: KitTreeNode): number {
  return node.medicines.length + node.children.reduce((total, child) => total + countKitNodeMedicines(child), 0)
}

export function buildKitShareReport(params: BuildKitExportParams): string {
  const { appName, title, generatedAtLabel, generatedAt, labels, trees } = params
  const totalMedicines = countKitTreeMedicines(trees)

  return [
    appName,
    title,
    `${generatedAtLabel}: ${generatedAt}`,
    formatTemplate(labels.totalMedicines, { count: totalMedicines }),
    '',
    ...trees.flatMap((tree, index) => {
      const lines = formatKitTreeText(tree, labels)

      if (index === trees.length - 1) {
        return lines
      }

      return [...lines, '']
    }),
  ].join('\n')
}

export function buildKitHtmlReport(params: BuildKitExportParams): string {
  const { appName, title, generatedAtLabel, generatedAt, labels, trees } = params
  const totalMedicines = countKitTreeMedicines(trees)

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
    `<p>${escapeHtml(generatedAtLabel)}: ${escapeHtml(generatedAt)} · ${escapeHtml(formatTemplate(labels.totalMedicines, { count: totalMedicines }))}</p>`,
    '</header>',
    ...trees.map(tree => formatKitTreeHtml(tree, labels, 2)),
    '</main>',
    '</body>',
    '</html>',
  ].join('')
}

function formatKitTreeText(node: KitTreeNode, labels: KitExportLabels, depth = 0): string[] {
  const indent = '  '.repeat(depth)
  const lines = [`${indent}${node.kitName}`]

  for (const medicine of node.medicines) {
    lines.push(`${indent}  - ${medicine.name} — ${medicine.quantity} ${medicine.unitLabel}, ${labels.expirationDate}: ${medicine.expirationLabel}`)
  }

  for (const child of node.children) {
    lines.push('')
    lines.push(...formatKitTreeText(child, labels, depth + 1))
  }

  return lines
}

function formatKitTreeHtml(node: KitTreeNode, labels: KitExportLabels, headingLevel: number): string {
  const headingTag = `h${Math.min(headingLevel, 4)}`

  return [
    '<section class="section kit-section">',
    `<${headingTag}>${escapeHtml(node.kitName)}</${headingTag}>`,
    formatMedicinesTableHtml(node.medicines, labels),
    ...node.children.map(child => formatKitTreeHtml(child, labels, headingLevel + 1)),
    '</section>',
  ].join('')
}

function formatMedicinesTableHtml(medicines: KitMedicineItem[], labels: KitExportLabels): string {
  return [
    '<table>',
    '<thead>',
    '<tr>',
    `<th>${escapeHtml(labels.medicines)}</th>`,
    `<th>${escapeHtml(labels.quantity)}</th>`,
    `<th>${escapeHtml(labels.expirationDate)}</th>`,
    '</tr>',
    '</thead>',
    '<tbody>',
    ...(medicines.length > 0
      ? medicines.map(medicine => [
        '<tr>',
        `<td>${escapeHtml(medicine.name)}</td>`,
        `<td>${escapeHtml(`${medicine.quantity} ${medicine.unitLabel}`)}</td>`,
        `<td>${escapeHtml(medicine.expirationLabel)}</td>`,
        '</tr>',
      ].join(''))
      : [`<tr><td colspan="3">${escapeHtml(labels.noMedicines)}</td></tr>`]),
    '</tbody>',
    '</table>',
  ].join('')
}

function formatTemplate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
    template
  )
}

function buildReportCss(): string {
  return `
    body { margin: 0; background: #f6f7fb; color: #17212b; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .report { padding: 28px; }
    .header { background: #ffffff; border-radius: 18px; padding: 24px; margin-bottom: 18px; }
    .app { color: #64748b; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    h1 { margin: 8px 0; font-size: 28px; }
    h2, h3, h4 { margin: 0 0 14px; font-size: 18px; }
    h3 { font-size: 16px; }
    h4 { font-size: 14px; }
    p { margin: 8px 0; color: #475569; }
    .section { background: #ffffff; border-radius: 16px; padding: 18px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); margin-bottom: 18px; }
    .kit-section .kit-section { margin-top: 14px; box-shadow: none; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
    th { color: #475569; font-weight: 700; }
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

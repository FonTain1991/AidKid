import {
  buildKitHtmlReport,
  buildKitShareReport,
  buildKitTrees,
  countKitTreeMedicines,
} from './kitExport'
import type { Medicine, MedicineKit } from '@/services/models'

const kits: MedicineKit[] = [
  { id: 1, name: 'Home kit', color: '#fff', parentId: null },
  { id: 2, name: 'Travel', color: '#fff', parentId: '1' },
]

const medicineItems: Medicine[] = [
  { id: 1, name: 'Vitamin C', medicineKitId: 1, quantity: 5, unitForQuantity: 'pcs', expirationDate: 1782430800000 },
  { id: 2, name: 'Aspirin', medicineKitId: 1, quantity: 10, unitForQuantity: 'pack', expirationDate: 1790206800000 },
  { id: 3, name: 'Plaster', medicineKitId: 2, quantity: 1, unitForQuantity: 'pcs', expirationDate: 1804030800000 },
]

const labels = {
  medicines: 'Medicines',
  quantity: 'Quantity',
  expirationDate: 'Expiry date',
  noMedicines: 'No medicines',
  totalMedicines: 'Total medicines: {{count}}',
}

const getUnitLabel = (unitValue: string) => ({
  pcs: 'pcs',
  pack: 'tab',
}[unitValue] ?? unitValue)

const formatExpirationDate = () => '12.06.2026'

describe('buildKitTrees', () => {
  it('builds a nested tree for a single kit', () => {
    const trees = buildKitTrees(1, kits, medicineItems, getUnitLabel, formatExpirationDate)

    expect(trees).toHaveLength(1)
    expect(trees[0].kitName).toBe('Home kit')
    expect(trees[0].medicines.map(item => item.name)).toEqual(['Aspirin', 'Vitamin C'])
    expect(trees[0].medicines[0].expirationLabel).toBe('12.06.2026')
    expect(trees[0].children[0].kitName).toBe('Travel')
    expect(trees[0].children[0].medicines[0].name).toBe('Plaster')
  })

  it('builds root kits when rootKitId is null', () => {
    const trees = buildKitTrees(null, kits, medicineItems, getUnitLabel, formatExpirationDate)

    expect(trees).toHaveLength(1)
    expect(countKitTreeMedicines(trees)).toBe(3)
  })
})

describe('buildKitShareReport', () => {
  it('builds a readable tree report', () => {
    const trees = buildKitTrees(1, kits, medicineItems, getUnitLabel, formatExpirationDate)
    const report = buildKitShareReport({
      appName: 'AidKit',
      title: 'Home kit',
      generatedAtLabel: 'Generated',
      generatedAt: '26.06.2026 12:00',
      labels,
      trees,
    })

    expect(report).toContain('Home kit')
    expect(report).toContain('  - Aspirin — 10 tab, Expiry date: 12.06.2026')
    expect(report).toContain('  Travel')
    expect(report).toContain('    - Plaster — 1 pcs, Expiry date: 12.06.2026')
    expect(report).toContain('Total medicines: 3')
  })
})

describe('buildKitHtmlReport', () => {
  it('builds an html report with nested sections', () => {
    const trees = buildKitTrees(1, kits, medicineItems, getUnitLabel, formatExpirationDate)
    const html = buildKitHtmlReport({
      appName: 'AidKit',
      title: 'Home kit',
      generatedAtLabel: 'Generated',
      generatedAt: '26.06.2026 12:00',
      labels,
      trees,
    })

    expect(html).toContain('<h1>Home kit</h1>')
    expect(html).toContain('<h2>Home kit</h2>')
    expect(html).toContain('<h3>Travel</h3>')
    expect(html).toContain('Vitamin C')
    expect(html).toContain('Plaster')
    expect(html).toContain('Expiry date')
    expect(html).toContain('12.06.2026')
  })
})

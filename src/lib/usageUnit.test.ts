import { getUsageUnitValue } from './usageUnit'

describe('getUsageUnitValue', () => {
  it('uses quantity unit before dosage unit', () => {
    expect(getUsageUnitValue({ unitForQuantity: 'pack', unit: 'mg' })).toBe('pack')
  })

  it('falls back to dosage unit when quantity unit is missing', () => {
    expect(getUsageUnitValue({ unitForQuantity: null, unit: 'ml' })).toBe('ml')
  })

  it('falls back to pcs when medicine has no units', () => {
    expect(getUsageUnitValue({ unitForQuantity: null, unit: null })).toBe('pcs')
  })
})

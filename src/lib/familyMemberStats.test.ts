import { calculateFamilyMemberStats } from './familyMemberStats'

describe('calculateFamilyMemberStats', () => {
  it('groups usages by family member and calculates percentages', () => {
    const result = calculateFamilyMemberStats({
      usages: [
        { familyMemberId: 1 },
        { familyMemberId: 1 },
        { familyMemberId: null },
      ],
      familyMembers: [
        { id: 1, name: 'Ivan' },
      ],
      noFamilyMemberName: 'No member',
    })

    expect(result).toEqual([
      {
        familyMemberId: 1,
        familyMemberName: 'Ivan',
        count: 2,
        percentage: 67,
      },
      {
        familyMemberId: null,
        familyMemberName: 'No member',
        count: 1,
        percentage: 33,
      },
    ])
  })
})

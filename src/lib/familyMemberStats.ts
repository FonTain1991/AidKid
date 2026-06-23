interface UsageLike {
  familyMemberId: number | null
}

interface FamilyMemberLike {
  id?: number | null
  name: string
}

interface CalculateFamilyMemberStatsParams {
  usages: UsageLike[]
  familyMembers: FamilyMemberLike[]
  noFamilyMemberName: string
  limit?: number
}

export interface FamilyMemberStatItem {
  familyMemberId: number | null
  familyMemberName: string
  count: number
  percentage: number
}

export function calculateFamilyMemberStats(params: CalculateFamilyMemberStatsParams): FamilyMemberStatItem[] {
  const { usages, familyMembers, noFamilyMemberName, limit = 5 } = params
  const total = usages.length
  const countsByFamilyMemberId = usages.reduce<Record<string, number>>((acc, usage) => {
    const key = String(usage.familyMemberId ?? 'none')
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return Object.entries(countsByFamilyMemberId)
    .map(([familyMemberIdKey, count]) => {
      const familyMemberId = familyMemberIdKey === 'none' ? null : Number(familyMemberIdKey)
      const familyMember = familyMemberId ? familyMembers.find(item => item.id === familyMemberId) : undefined

      return {
        familyMemberId,
        familyMemberName: familyMember?.name || noFamilyMemberName,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

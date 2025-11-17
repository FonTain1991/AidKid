import { FamilyMember } from '@/services/models'
import { familyMembersModel } from '@/services/models/FamilyMembers'
import { useEffect, useState } from 'react'
import { useEvent } from './useEvent'

type CreateFamilyMemberPayload = Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>
type UseFamilyMemberCreateReturn = [
  (data: CreateFamilyMemberPayload) => Promise<FamilyMember | undefined>,
  {
    isLoading: boolean
    error: Error | null
  }
]

const familyMembersCache: FamilyMember[] = []
export function useFamilyMembers() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getFamilyMembers = useEvent(async (resetCache: boolean = false) => {
    setIsLoading(true)
    setError(null)

    if (familyMembersCache.length && !resetCache) {
      setFamilyMembers(familyMembersCache)
      return
    }

    try {
      const members = await familyMembersModel.getFamilyMembers()
      setFamilyMembers(members)
      familyMembersCache.push(...members)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch family members'))
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    getFamilyMembers()
  }, [getFamilyMembers])

  return {
    familyMembers,
    isLoading,
    error,
    refetch() {
      getFamilyMembers(true)
    }
  }
}

export function useFamilyMemberCreate(): UseFamilyMemberCreateReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createFamilyMember = useEvent(async (data: CreateFamilyMemberPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const member = await familyMembersModel.createFamilyMember(data)
      familyMembersCache.push(member)
      return member
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create family member'))
    } finally {
      setIsLoading(false)
    }
  })

  return [
    createFamilyMember,
    {
      isLoading,
      error,
    },
  ]
}
import { FamilyMember } from '@/services/models'
import { familyMembersModel } from '@/services/models/FamilyMembers'
import { useAppStore } from '@/store'
import { useState } from 'react'
import { useEvent } from './useEvent'

type CreateFamilyMemberPayload = Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>


export function useFamilyMember() {
  const {
    setFamilyMembers,
    addFamilyMember,
    updateFamilyMember: updateFamilyMemberStore,
    deleteFamilyMember: deleteFamilyMemberStore
  } = useAppStore(state => state)

  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getAllFamilyMembers = useEvent(async () => {
    try {
      const familyMembers = await familyMembersModel.getAll()
      setFamilyMembers(familyMembers)
    } catch (err) {
      console.error(err instanceof Error ? err : new Error('Failed to fetch family members'))
    }
  })

  const createFamilyMember = useEvent(async (data: CreateFamilyMemberPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const member = await familyMembersModel.createFamilyMember(data)
      if (!member) {
        throw new Error('Failed to create family member')
      }
      addFamilyMember(member)
      return member
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create family member'))
    } finally {
      setIsLoading(false)
    }
  })

  type UpdateFamilyMemberPayload = Partial<CreateFamilyMemberPayload> & { id: number }
  const updateFamilyMember = useEvent(async (data: UpdateFamilyMemberPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const member = await familyMembersModel.updateFamilyMember(data.id, data)
      updateFamilyMemberStore(member)
      return member
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create family member'))
    } finally {
      setIsLoading(false)
    }
  })

  const deleteFamilyMember = useEvent(async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      await familyMembersModel.deleteFamilyMember(id)
      deleteFamilyMemberStore(id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete family member'))
    } finally {
      setIsLoading(false)
    }
  })


  return {
    getAllFamilyMembers,
    createFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    isLoading,
    error,
  }
}
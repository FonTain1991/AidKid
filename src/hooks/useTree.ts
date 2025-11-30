import { tree } from '@/utils'
import { useMemo } from 'react'

export function useTree(array: any[]) {
  return useMemo(() => {
    return tree(array, 'id', 'parent_id', null)
  }, [array])
}
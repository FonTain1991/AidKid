import { useRef, useCallback } from 'react'

export function useEvent<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef<T>(callback)

  callbackRef.current = callback

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args)
  }, []) as T
}
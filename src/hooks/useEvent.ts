import { useCallback, useRef } from 'react'

type CallbackType<A extends any[], R> = (...args: A) => R;

export const useEvent = <A extends any[], R>(fn: CallbackType<A, R>): CallbackType<A, R> => {
  const ref = useRef(fn)

  ref.current = fn

  return useCallback((...args) => {
    return ref.current(...args)
  }, [])
}
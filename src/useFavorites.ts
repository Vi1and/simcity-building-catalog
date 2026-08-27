import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'scbi-city-archive:favorites:v1'

const readFavorites = (): Set<string> => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed.filter((item): item is string => typeof item === 'string')) : new Set()
  } catch {
    return new Set()
  }
}

export const useFavorites = () => {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(readFavorites)

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setFavoriteIds(readFavorites())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const persist = useCallback((next: Set<string>) => {
    setFavoriteIds(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
  }, [])

  const toggleFavorite = useCallback(
    (id: string) => {
      const next = new Set(favoriteIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      persist(next)
      return next.has(id)
    },
    [favoriteIds, persist],
  )

  const addFavorites = useCallback((ids: Iterable<string>) => {
    const additions = [...ids]
    if (additions.length === 0) return

    setFavoriteIds((current) => {
      const next = new Set(current)
      for (const id of additions) next.add(id)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  const clearFavorites = useCallback(() => {
    persist(new Set())
  }, [persist])

  return { favoriteIds, toggleFavorite, addFavorites, clearFavorites }
}

import { useState, useCallback } from 'react'

export function useFilters(initial = {}) {
  const [filters, setFilters] = useState(initial)

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }))
  }, [])

  const resetFilters = useCallback(() => setFilters(initial), [])

  const setPage = useCallback((page) => setFilters((prev) => ({ ...prev, page })), [])

  return { filters, setFilter, resetFilters, setPage }
}

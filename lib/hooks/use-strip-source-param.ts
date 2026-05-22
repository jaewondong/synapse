import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function useStripSourceParam() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!searchParams.has('source')) return
    const url = new URL(window.location.href)
    url.searchParams.delete('source')
    window.history.replaceState({}, '', url.toString())
  }, [searchParams])
}

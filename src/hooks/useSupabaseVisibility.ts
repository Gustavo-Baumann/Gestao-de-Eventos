import { useEffect } from 'react'
import { resetAndRecreateClient } from '../supabase-client'

export function useSupabaseVisibility() {
  useEffect(() => {
    let wasHidden = false

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true
        return
      }

      if (wasHidden) {
        resetAndRecreateClient();
        wasHidden = false
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
    }
  }, [])
}
import { useEffect } from 'react'
import { resetAndRecreateClient, getSupabaseClient } from '../supabase-client'

export function useSupabaseVisibility() {
  useEffect(() => {
    let wasHidden = false

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true
        return
      }

      if (wasHidden) {
        resetAndRecreateClient()

        setTimeout(() => {
          getSupabaseClient().auth.getSession().then(({ data }) => {
          })
        }, 100)
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
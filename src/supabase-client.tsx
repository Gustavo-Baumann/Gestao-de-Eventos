import { createClient, SupabaseClient } from "@supabase/supabase-js"
import React, { createContext, useContext, useEffect, useState } from "react"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

let _cachedClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_cachedClient) {
    _cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    })
    _cachedClient.auth.startAutoRefresh()
  }
  return _cachedClient
}

export function resetAndRecreateClient(): SupabaseClient {
  if (_cachedClient) {
    _cachedClient.auth.stopAutoRefresh()
  }

  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('supabase.auth.token')) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))

  _cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  })
  _cachedClient.auth.startAutoRefresh()

  return _cachedClient
}

const SupabaseContext = createContext<SupabaseClient | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [client,setClient] = useState<SupabaseClient>(getSupabaseClient)

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getSupabaseClient()
      if (current !== client) {
        setClient(current)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [client])

  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabaseClient(): SupabaseClient {
  const context = useContext(SupabaseContext)
  if (!context) throw new Error("useSupabaseClient deve ser usado dentro de <SupabaseProvider>")
  return context
}

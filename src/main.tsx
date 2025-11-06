import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SupabaseProvider } from './supabase-client.tsx'
import { useSupabaseVisibility } from './hooks/useSupabaseVisibility.ts'

function Root() {
  useSupabaseVisibility() 
  return (
    <SupabaseProvider>
      <App />
    </SupabaseProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

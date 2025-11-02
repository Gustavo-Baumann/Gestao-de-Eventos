import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../supabase-client';

interface UsuarioContextType {
  usuario_id: string | null;
}

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined);

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [usuario_id, setUsuarioId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUsuarioId(session?.user?.id || null);
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        setUsuarioId(null);
      }
    };

    fetchUsuario();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuarioId(session?.user?.id || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UsuarioContext.Provider value={{ usuario_id }}>
      {children}
    </UsuarioContext.Provider>
  );
}

export function useUsuario() {
  const context = useContext(UsuarioContext);
  if (!context) {
    throw new Error('useUser deve ser usado dentro de UserProvider');
  }
  return context;
}
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { supabase } from '../supabase-client';

export interface PerfilUsuario {
  nome: string;
  numero_celular: string | null;
  tipo_usuario: string;
  data_nascimento: string | null;
  cidade_id: number | null;
  imagem_url: string | null;
}

interface UsuarioContextType {
  perfil: PerfilUsuario | null;
  carregando: boolean;
  erro: string | null;
}

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined);

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const buscarPerfil = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        setPerfil(null);
        setCarregando(false);
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          nome,
          numero_celular,
          tipo_usuario,
          data_nascimento,
          cidade_id,
          imagem_url
        `)
        .eq('id', userId)
        .eq('deletado', false)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        setErro('Falha ao carregar dados do usuário');
        setPerfil(null);
      } else if (data) {
        setPerfil(data);
      } else {
        setErro('Perfil não encontrado ou desativado');
        setPerfil(null);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setErro('Erro interno');
      setPerfil(null);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarPerfil();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await buscarPerfil();
      } else if (event === 'SIGNED_OUT') {
        setPerfil(null);
        setCarregando(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UsuarioContext.Provider value={{ perfil, carregando, erro }}>
      {children}
    </UsuarioContext.Provider>
  );
}

export function useUsuario(): UsuarioContextType {
  const context = useContext(UsuarioContext);
  if (!context) {
    throw new Error('useUsuario deve ser usado dentro de UsuarioProvider');
  }
  return context;
}
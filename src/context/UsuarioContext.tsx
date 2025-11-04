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
  imagem_url: string | undefined;
}

interface UsuarioContextType {
  perfil: PerfilUsuario | null;
  carregando: boolean;
  erro: string | null;
  buscarPerfilPorNome: (nome: string) => Promise<PerfilUsuario | null>;
  atualizarCampo: (campo: keyof PerfilUsuario, valor: any) => Promise<void>;
  uploadImagemPerfil: (file: File) => Promise<string | undefined>
  logout: () => Promise<void>
}

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined);

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const buscarPerfilLogado = async () => {
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
        .select('nome, numero_celular, tipo_usuario, data_nascimento, cidade_id, imagem_url')
        .eq('id', userId)
        .eq('deletado', false)
        .single();

      if (error) throw error;
      setPerfil(data);
    } catch (err: any) {
      console.error('Erro ao buscar perfil logado:', err);
      setErro('Erro ao carregar perfil');
      setPerfil(null);
    } finally {
      setCarregando(false);
    }
  };

  const buscarPerfilPorNome = async (nome: string): Promise<PerfilUsuario | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('nome, numero_celular, tipo_usuario, data_nascimento, cidade_id, imagem_url')
        .eq('nome', nome)
        .eq('deletado', false)
        .single();
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  };

  const atualizarCampo = async (campo: keyof PerfilUsuario, valor: any) => {
    if (!perfil?.nome) return;
    const { error } = await supabase
      .from('usuarios')
      .update({ [campo]: valor })
      .eq('nome', perfil.nome)
      .eq('deletado', false);
    if (error) throw error;
    setPerfil(prev => prev ? { ...prev, [campo]: valor } : null);
  };

const uploadImagemPerfil = async (file: File): Promise<string | undefined> => {
  if (!perfil?.nome) return undefined;

  const extensao = file.name.split('.').pop()?.toLowerCase();
  const nomeArquivo = `private/${perfil.nome}-${Date.now()}.${extensao}`;
  console.log("fez a call")

  const { data, error } = await supabase.storage
    .from('imagens_perfil')
    .upload(nomeArquivo, file, {
      cacheControl: '3600',
      upsert: true,
  });

  console.log("terminou a call")

  if (error) {
    console.error('Erro no upload:', error);
    return undefined;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('imagens_perfil')
    .getPublicUrl(nomeArquivo);

  return publicUrl;
};

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setPerfil(null);
      setCarregando(false);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  useEffect(() => {
    buscarPerfilLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        await buscarPerfilLogado();
      } else if (event === 'SIGNED_OUT') {
        setPerfil(null);
        setCarregando(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UsuarioContext.Provider
      value={{
        perfil,
        carregando,
        erro,
        buscarPerfilPorNome,
        atualizarCampo,
        logout,
        uploadImagemPerfil,
      }}
    >
      {children}
    </UsuarioContext.Provider>
  );
}

export function useUsuario() {
  const context = useContext(UsuarioContext);
  if (!context) {
    throw new Error('useUsuario deve ser usado dentro de UsuarioProvider');
  }
  return context;
}

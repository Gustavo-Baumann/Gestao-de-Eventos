import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { getSupabaseClient } from '../supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  userId: string | null;
  carregando: boolean;
  erro: string | null;
  supabase: SupabaseClient;
  buscarPerfilPorNome: (nome: string) => Promise<PerfilUsuario | null>;
  atualizarCampo: (campo: keyof PerfilUsuario, valor: any) => Promise<void>;
  uploadImagemPerfil: (file: File) => Promise<string | undefined>
  criarEvento: (dados: CriarEventoData) => Promise<void>;
  logout: () => Promise<void>
  deletarConta: () => Promise<void>
}

interface CriarEventoData {
  nome: string;
  data_realizacao: string; 
  data_encerramento: string;
  descricao: string | null;
  numero_vagas: number | null;
  gratuito: boolean;
  cidade: number | null;
  banner_url?: File | null;
  imagens_url?: File[] | null;
}

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined);

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  const buscarPerfilLogado = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setPerfil(null);
        setUserId(null);
        setCarregando(false);
        return;
      }

      const uuid = session.user.id;
      setUserId(uuid);

      const { data, error } = await supabase
        .from('usuarios')
        .select('nome, numero_celular, tipo_usuario, data_nascimento, cidade_id, imagem_url')
        .eq('id', uuid)
        .eq('deletado', false)
        .single();

      if (error) throw error;
      setPerfil(data);
    } catch (err: any) {
      console.error('Erro ao buscar perfil logado:', err);
      setErro('Erro ao carregar perfil');
      setPerfil(null);
      setUserId(null);
    } finally {
      setCarregando(false);
    }
  };

  const buscarPerfilPorNome = async (nome: string): Promise<PerfilUsuario | null> => {
    try {
      console.log('[DEBUG] SupabaseClient ID:', supabase)
      console.log('[DEBUG] Chamando .select() agora...')
      const { data, error } = await supabase
        .from('usuarios')
        .select('nome, numero_celular, tipo_usuario, data_nascimento, cidade_id, imagem_url')
        .eq('nome', nome)
        .eq('deletado', false)
        .single();
      console.log('[DEBUG] Retorno:', { data, error })
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

  const { error } = await supabase.storage
    .from('imagens_perfil')
    .upload(nomeArquivo, file, {
      cacheControl: '3600',
      upsert: true,
  });

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

  const uploadBanner = async (file: File, eventoId: number): Promise<string> => {
    const caminho = `${eventoId}/banner.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('imagens_banner')
      .upload(caminho, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('imagens_banner')
      .getPublicUrl(caminho);
      
    if (!urlData?.publicUrl) {
      throw new Error('Falha ao gerar URL pública do banner');
    }

    return urlData.publicUrl;
  };

  const uploadImagensAdicionais = async (files: File[], eventoId: number): Promise<string[]> => {
    const urls: string[] = [];

    for (const file of files) {
      const extensao = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const nomeArquivo = `${eventoId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from('imagens_evento')
        .upload(nomeArquivo, file, { upsert: true });

      if (uploadError) {
        console.error(`Erro no upload de ${file.name}:`, uploadError);
        continue; 
      }

      const { data: urlData } = supabase.storage
        .from('imagens_evento')
        .getPublicUrl(nomeArquivo);

      if (urlData?.publicUrl) {
        urls.push(urlData.publicUrl);
      }
    }

    if (urls.length === 0) throw new Error('Nenhuma imagem foi enviada com sucesso');

    return urls;
  };

  const criarEvento = async (dados: CriarEventoData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Usuário não autenticado');

      const { data: eventoCriado, error: insertError } = await supabase.from('eventos').insert({
        id_criador: userId, 
        ...dados,
      }).select('id').single();

      if (insertError) throw insertError;

      const eventoId = eventoCriado.id;
      let bannerUrl: string | null = null;
      let imagensUrls: string[] = [];

      if (dados.banner_url) {
        bannerUrl = await uploadBanner(dados.banner_url, eventoId);
      }

      if (dados.imagens_url && dados.imagens_url.length > 0) {
        imagensUrls = await uploadImagensAdicionais(dados.imagens_url, eventoId);
      }

      const updateData: any = {};
      if (bannerUrl) updateData.banner_url = bannerUrl;
      if (imagensUrls.length > 0) updateData.imagens_url = imagensUrls;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('eventos')
          .update(updateData)
          .eq('id', eventoId);

        if (updateError) throw updateError;
      }
    } catch (err: any) {
      console.error('Erro ao criar evento:', err);
      throw err;
    }
  };

  const deletarConta = async () => {
    const { error } = await supabase.rpc('deletar_minha_conta');

    if (error) {
      console.error('Erro ao deletar conta:', error);
      alert('Ocorreu um erro ao deletar a conta. Tente novamente.');
    } else {
      await logout(); 
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
        setUserId(null);
        setCarregando(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UsuarioContext.Provider
      value={{
        perfil,
        userId,
        carregando,
        erro,
        supabase,
        buscarPerfilPorNome,
        atualizarCampo,
        logout,
        uploadImagemPerfil,
        criarEvento,
        deletarConta,
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
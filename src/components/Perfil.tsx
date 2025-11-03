import { useParams } from 'react-router-dom';
import { supabase } from '../supabase-client';
import { useState, useEffect } from 'react';
import type { PerfilUsuario } from '../context/UsuarioContext';
import { useUsuario } from '../context/UsuarioContext';
import Header from './Header';
import CampoEditavel from './CampoEditavel';
import CampoCidadeEditavel from './CampoCidadeEditavel';
import Carregando from './Carregando';
import CidadeDisplay from './CidadeDisplay';
import Fallback from './Fallback';
import { lerSlug } from '../utils/slug';

export default function Perfil() {
  const { nome: slug } = useParams<{ nome: string }>();
  const { perfil: usuarioLogado } = useUsuario();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const nomeFromUrl = slug ? lerSlug(slug) : '';
  const isProprioPerfil = usuarioLogado?.nome === nomeFromUrl;

  useEffect(() => {
    const fetchPerfil = async () => {
      setCarregando(true);
      console.log(nomeFromUrl)
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
        .eq('nome', nomeFromUrl)
        .eq('deletado', false)
        .single();

      if (error || !data) {
        setPerfil(null);
      } else {
        setPerfil(data);
      }
      setCarregando(false);
    };

    fetchPerfil();
  }, [nomeFromUrl]);

  const handleUpdate = async (campo: keyof PerfilUsuario, valor: any) => {
    if (!usuarioLogado?.nome) return;

    const { error } = await supabase
      .from('usuarios')
      .update({ [campo]: valor })
      .eq('nome', usuarioLogado.nome)
      .eq('deletado', false);

    if (!error) {
      setPerfil(prev => prev ? { ...prev, [campo]: valor } : null);
    } else {
      throw error;
    }
  };

  if (carregando) return <Carregando />;
  if (!perfil) return <Fallback />;

  return (
    <div className="min-h-screen bg-neutral-200 pt-20 md:pt-20 p-4">
      <Header titulo={isProprioPerfil ? 'Meu Perfil' : `Perfil de @${perfil.nome}`} />

      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-2xl">
              {perfil.nome.charAt(0).toUpperCase()}
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            @{perfil.nome}
          </h1>

          <div className="space-y-4">
            {isProprioPerfil ? (
              <>
                <CampoEditavel
                  label="Número de Celular"
                  valor={perfil.numero_celular}
                  campo="numero_celular"
                  onSalvar={(v) => handleUpdate('numero_celular', v)}
                  tipo="tel"
                  placeholder="(00) 00000-0000"
                />
                <CampoEditavel
                  label="Data de Nascimento"
                  valor={perfil.data_nascimento}
                  campo="data_nascimento"
                  onSalvar={(v) => handleUpdate('data_nascimento', v)}
                  tipo="date"
                />
                <CampoCidadeEditavel
                  cidade_id={perfil.cidade_id}
                  onSalvar={(id) => handleUpdate('cidade_id', id)}
                />
              </>
            ) : (
              <>
                {perfil.numero_celular && (
                  <div className="py-2">
                    <p className="text-sm font-medium text-gray-700">Celular</p>
                    <p className="text-sm text-gray-900">{perfil.numero_celular}</p>
                  </div>
                )}
                {perfil.data_nascimento && (
                  <div className="py-2">
                    <p className="text-sm font-medium text-gray-700">Data de Nascimento</p>
                    <p className="text-sm text-gray-900">
                      {new Date(perfil.data_nascimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                <div className="py-2">
                  <p className="text-sm font-medium text-gray-700">Cidade</p>
                  <p className="text-sm text-gray-900">
                    <CidadeDisplay cidade_id={perfil.cidade_id} />
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
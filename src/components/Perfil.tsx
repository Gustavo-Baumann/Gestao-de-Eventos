import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { PerfilUsuario } from '../context/UsuarioContext';
import { useUsuario } from '../context/UsuarioContext';
import Header from './Header';
import CampoEditavel from './CampoEditavel';
import CampoCidadeEditavel from './CampoCidadeEditavel';
import Carregando from './Carregando';
import CidadeDisplay from './CidadeDisplay';
import Fallback from './Fallback';
import { Camera } from 'lucide-react';
import ModalUploadImagem from './modalUploadImagem';

export default function Perfil() {
  const { nome: slug } = useParams<{ nome: string }>();
  const nomeFromUrl = slug ? decodeURIComponent(slug) : '';
  const { 
    perfil: usuarioLogado, 
    buscarPerfilPorNome, 
    atualizarCampo, 
    uploadImagemPerfil, 
  } = useUsuario();

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [imagemCarregando, setImagemCarregando] = useState(false);

  const isProprioPerfil = usuarioLogado?.nome === nomeFromUrl;

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      const dados = isProprioPerfil
        ? usuarioLogado
        : await buscarPerfilPorNome(nomeFromUrl);
      setPerfil(dados);
      setCarregando(false);
    };
    carregar();
  }, [nomeFromUrl, usuarioLogado, isProprioPerfil, buscarPerfilPorNome]);

  const handleUpload = async (file: File) => {
    if (!perfil?.nome) return;

    setImagemCarregando(true);
    const url = await uploadImagemPerfil(file);
    if (url) {
      await atualizarCampo('imagem_url', url);
      setPerfil(prev => prev ? { ...prev, imagem_url: url } : null);
    }
    setImagemCarregando(false);
  };

  if (carregando) return <Carregando />;
  if (!perfil) return <Fallback />;

  const temImagem = !!perfil.imagem_url;

  return (
    <div className="min-h-screen bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Header titulo={isProprioPerfil ? 'Meu Perfil' : `Perfil de @${perfil.nome}`} />

        <div className="bg-white dark:bg-neutral-700 border border-blue-200 dark:border-blue-700 rounded-xl p-8 shadow-sm mt-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              {temImagem ? (
                <img
                  src={perfil.imagem_url}
                  alt={`Foto de perfil de ${perfil.nome}`}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-4xl border-4 border-white dark:border-neutral-800 shadow-lg">
                  {perfil.nome.charAt(0).toUpperCase()}
                </div>
              )}

              {isProprioPerfil && (
                <button
                  onClick={() => setModalAberto(true)}
                  disabled={imagemCarregando}
                  className="absolute bottom-0 right-0 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition disabled:opacity-50"
                  aria-label="Alterar foto de perfil"
                >
                  {imagemCarregando ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6" />
                  )}
                </button>
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center mb-8">
            @{perfil.nome}
          </h1>

          <div className="space-y-6">
            {isProprioPerfil ? (
              <>
                <CampoEditavel
                  label="Número de Celular"
                  valor={perfil.numero_celular}
                  campo="numero_celular"
                  onSalvar={(v) => atualizarCampo('numero_celular', v)}
                  tipo="tel"
                  placeholder="(00) 00000-0000"
                />
                <CampoEditavel
                  label="Data de Nascimento"
                  valor={perfil.data_nascimento}
                  campo="data_nascimento"
                  onSalvar={(v) => atualizarCampo('data_nascimento', v)}
                  tipo="date"
                />
                <CampoCidadeEditavel
                  cidade_id={perfil.cidade_id}
                  onSalvar={(id) => atualizarCampo('cidade_id', id)}
                />
              </>
            ) : (
              <>
                {perfil.numero_celular && (
                  <div className="py-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Celular</p>
                    <p className="text-base text-gray-900 dark:text-gray-100 mt-1">{perfil.numero_celular}</p>
                  </div>
                )}
                {perfil.data_nascimento && (
                  <div className="py-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Nascimento</p>
                    <p className="text-base text-gray-900 dark:text-gray-100 mt-1">
                      {new Date(perfil.data_nascimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                <div className="py-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cidade</p>
                  <div className="mt-1">
                    <CidadeDisplay cidade_id={perfil.cidade_id} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ModalUploadImagem
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={handleUpload}
      />
    </div>
  );
}
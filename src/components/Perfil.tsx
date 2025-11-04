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
import { lerSlug } from '../utils/slug';
import { Camera } from 'lucide-react';
import ModalUploadImagem from './modalUploadImagem';

export default function Perfil() {
  const { nome: slug } = useParams<{ nome: string }>();
  const nomeFromUrl = slug ? lerSlug(slug) : '';
  const { 
    perfil: usuarioLogado, 
    buscarPerfilPorNome, 
    atualizarCampo, 
    uploadImagemPerfil 
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
    <div className="min-h-screen bg-neutral-200 pt-20 md:pt-20 p-4">
      <Header titulo={isProprioPerfil ? 'Meu Perfil' : `Perfil de @${perfil.nome}`} />
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-center mb-6 relative">
            <div className="relative">
              {temImagem ? (
                <img
                  src={perfil.imagem_url}
                  alt={`Foto de perfil de ${perfil.nome}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-2xl border-4 border-white shadow-md">
                  {perfil.nome.charAt(0).toUpperCase()}
                </div>
              )}

              {isProprioPerfil && (
                <button
                  onClick={() => setModalAberto(true)}
                  disabled={imagemCarregando}
                  className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition transform translate-x-1 translate-y-1 disabled:opacity-50"
                  aria-label="Alterar foto de perfil"
                >
                  {imagemCarregando ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>
              )}
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

      <ModalUploadImagem
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={handleUpload}
      />
    </div>
  );
}
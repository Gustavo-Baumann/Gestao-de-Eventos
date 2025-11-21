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
import { AlertCircle, Camera, MoreVertical } from 'lucide-react';
import ModalUploadImagem from './modalUploadImagem';

export default function Perfil() {
  const { nome: slug } = useParams<{ nome: string }>();
  const nomeFromUrl = slug ? decodeURIComponent(slug) : '';
  const { 
    perfil: usuarioLogado, 
    buscarPerfilPorNome, 
    atualizarCampo, 
    uploadImagemPerfil,
    deletarConta,
  } = useUsuario();

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [imagemCarregando, setImagemCarregando] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalDeleteAberto, setModalDeleteAberto] = useState(false);
  const [textoConfirmacao, setTextoConfirmacao] = useState('');
  const [deletando, setDeletando] = useState(false);

  const isProprioPerfil = usuarioLogado?.nome === nomeFromUrl;
  const textoMagico = "excluir minha conta permanentemente";

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

  const handleDeletarConta = async () => {
    if (textoConfirmacao.trim() !== textoMagico) return;

    setDeletando(true);
    await deletarConta();
    setDeletando(false);
  }

  if (carregando) return <Carregando />;
  if (!perfil) return <Fallback />;

  const temImagem = !!perfil.imagem_url;

  return (
    <div className="min-h-screen bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Header titulo={isProprioPerfil ? 'Meu Perfil' : `Perfil de @${perfil.nome}`} />

        <div className="bg-white dark:bg-neutral-700 border border-blue-200 dark:border-blue-700 rounded-xl p-8 shadow-sm mt-16">
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

        {isProprioPerfil && (
          <div className="mt-6 relative w-full">
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="w-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-200 font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
            >
              <MoreVertical className="w-5 h-5" />
              Opções da conta
            </button>

            {menuAberto && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuAberto(false)}
                />

                <div className="absolute bottom-full left-0 right-0 z-50 mb-2">
                  <div className="bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setMenuAberto(false);
                        setModalDeleteAberto(true);
                      }}
                      className="w-full text-left px-6 py-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center gap-3 font-medium"
                    >
                      <AlertCircle className="w-5 h-5" />
                      Deletar conta permanentemente
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {modalDeleteAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-700 rounded-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Deletar conta</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Essa ação é <strong>irreversível</strong>. Todos os seus dados serão apagados ou anonimizados.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Para confirmar, digite exatamente:<br />
              <code className="bg-gray-200 dark:bg-neutral-800 px-2 py-1 rounded">{textoMagico}</code>
            </p>

            <input
              type="text"
              value={textoConfirmacao}
              onChange={(e) => setTextoConfirmacao(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={textoMagico}
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setModalDeleteAberto(false); setTextoConfirmacao(''); }}
                className="px-6 py-3 bg-gray-300 dark:bg-neutral-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-neutral-500 transition"
                disabled={deletando}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletarConta}
                disabled={textoConfirmacao.trim() !== textoMagico || deletando}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {deletando ? 'Deletando...' : 'Deletar permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalUploadImagem
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={handleUpload}
      />
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Paginacao from '../components/Paginacao';
import { useUsuario } from '../context/UsuarioContext';
import Carregando from './Carregando';
import Container from './Container';

interface Evento {
  id: number;
  nome: string;
  data_realizacao: string;
  banner_url: string | null;
  realizado: boolean;
  aprovado: boolean;
  id_criador: string;
  criador_nome?: string;
  criador_imagem_url?: string | null;
}

const ITENS_POR_PAGINA = 10;

const MeusEventos = () => {
  const { perfil, userId, supabase, logout } = useUsuario(); 
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    if (!perfil) return;

    const buscarEventos = async () => {
      setCarregando(true);

      const { data, error } = await supabase
        .from('eventos')
        .select(`
          id,
          nome,
          data_realizacao,
          banner_url,
          realizado,
          aprovado,
          id_criador,
          usuarios!id_criador (
            nome,
            imagem_url
          )
        `)
        .eq('id_criador', userId)
        .eq('deletado', false)
        .order('data_realizacao', { ascending: true });

      if (error) {
        console.error('Erro ao buscar eventos:', error);
        setEventos([]);
      } else {
        const formatados = (data || []).map((e: any) => ({
          id: e.id,
          nome: e.nome,
          data_realizacao: e.data_realizacao,
          banner_url: e.banner_url,
          realizado: e.realizado,
          aprovado: e.aprovado,
          id_criador: e.id_criador,
          criador_nome: e.usuarios?.nome,
          criador_imagem_url: e.usuarios?.imagem_url,
        }));
        setEventos(formatados);
      }
      setCarregando(false);
    };

    buscarEventos();
  }, [perfil, userId]); 

  const futuros = eventos
    .filter(e => !e.realizado)
    .sort((a, b) => new Date(a.data_realizacao).getTime() - new Date(b.data_realizacao).getTime());

  const passados = eventos
    .filter(e => e.realizado)
    .sort((a, b) => new Date(b.data_realizacao).getTime() - new Date(a.data_realizacao).getTime());

  const todosOrdenados = [...futuros, ...passados];

  const totalPaginas = Math.ceil(todosOrdenados.length / ITENS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const fim = inicio + ITENS_POR_PAGINA;
  const eventosPaginados = todosOrdenados.slice(inicio, fim);

  if (carregando) {
    return (
      <Container>
        <Header titulo="Meus Eventos" />
        <Carregando />
      </Container>
    );
  }

  if(perfil?.tipo_usuario == 'cliente'){
    return (
      <Container>
        <Header titulo="Meus Eventos" />
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <div className="w-full max-w-lg">
            <div className="bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-700 rounded-xl p-8 shadow-sm">
              <div className="flex justify-center mb-6">
                <div
                  className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  <svg
                    className="w-10 h-10 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 text-center mb-3">
                Permissão insuficiente
              </h1>

              <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
                Sua conta não tem permissão para criar eventos. Use uma conta do tipo{' '}
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  organizador
                </span>{' '}
                para criar seus eventos.
              </p>

              <div
                role="status"
                aria-live="polite"
                className="text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-6 text-center"
              >
                Entre com uma conta de organizador ou solicite acesso ao administrador.
              </div>

              <button
                onClick={() => {
                  logout(); 
                }}
                className="w-full max-w-md mx-auto block text-center py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 transition duration-200"
                aria-label="Fazer login como organizador"
              >
                Fazer login como organizador
              </button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

return (
  <div className="min-h-screen bg-white dark:bg-neutral-800 text-black dark:text-white pt-20 md:pt-20 p-4">
    <Header titulo="Meus Eventos" />

    <div className="max-w-3xl mx-auto mt-8 space-y-6">
      {eventosPaginados.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">
          Você ainda não criou nenhum evento.
        </p>
      ) : (
        eventosPaginados.map((evento) => (
          <article
            key={evento.id}
            className="bg-white dark:bg-neutral-700 rounded-2xl shadow-lg overflow-hidden border border-gray-300 dark:border-neutral-600"
            aria-labelledby={`evento-titulo-${evento.id}`}
          >
            <div className="h-48 bg-gray-200 dark:bg-neutral-600">
              {evento.banner_url ? (
                <img
                  src={evento.banner_url}
                  alt={`Banner do evento ${evento.nome}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    e.currentTarget.className = 'hidden';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 ${evento.banner_url ? 'hidden' : ''
                  }`}
              >
                Sem banner
              </div>
            </div>

            <div className="flex">
              <div className="w-32 h-32 -mt-16 ml-6 flex-shrink-0 relative">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-lg bg-gray-200 dark:bg-neutral-600">
                  {evento.criador_imagem_url ? (
                    <img
                      src={evento.criador_imagem_url}
                      alt={`Foto de perfil de ${evento.criador_nome}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        e.currentTarget.className = 'hidden';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`absolute inset-0 flex items-center justify-center text-5xl font-bold text-gray-400 dark:text-gray-500 ${evento.criador_imagem_url ? 'hidden' : ''
                      }`}
                  >
                    {evento.criador_nome?.[0]?.toUpperCase() || '?'}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 pt-4">
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {evento.criador_nome}
                </p>
                <div>
                  <h3
                    id={`evento-titulo-${evento.id}`}
                    className="text-xl font-bold text-black dark:text-white mb-2"
                  >
                    {evento.nome}
                  </h3>

                  {!evento.aprovado && (
                    <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm font-medium rounded-full border border-yellow-300 dark:border-yellow-700">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Aprovação pendente
                    </div>
                  )}
                </div>
                <Link
                  to={`/evento/${evento.id}`}
                  className="inline-block px-5 py-3 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition text-base font-medium border border-purple-300 dark:border-purple-700"
                >
                  Ver detalhes do evento
                </Link>
              </div>
            </div>
          </article>
        ))
      )}

      <Paginacao
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        onPaginaChange={setPaginaAtual}
      />
    </div>
  </div>  
);
};

export default MeusEventos;
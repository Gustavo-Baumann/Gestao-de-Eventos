import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Paginacao from '../components/Paginacao';
import { useUsuario } from '../context/UsuarioContext';
import Carregando from './Carregando';

interface Evento {
  id: number;
  nome: string;
  data_realizacao: string;
  banner_url: string | null;
  realizado: boolean;
  id_criador: string;
  criador_nome?: string;
  criador_imagem_url?: string | null;
}

const ITENS_POR_PAGINA = 10;

const MeusEventos = () => {
  const { perfil, userId, supabase } = useUsuario(); 
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
      <div className="min-h-screen bg-white dark:bg-neutral-800 text-black dark:text-white pt-20 md:pt-20 p-4">
        <Header titulo="Meus Eventos" />
        <Carregando />
      </div>
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
            {/* Seção 1: Apenas o banner (altura total) */}
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

            {/* Seção 2: Foto do criador + Informações (flex row) */}
            <div className="flex">
              {/* Foto do criador – círculo centralizado */}
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

              {/* Informações à direita */}
              <div className="flex-1 p-6 pt-4">
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {evento.criador_nome}
                </p>
                <h3
                  id={`evento-titulo-${evento.id}`}
                  className="text-xl font-bold text-black dark:text-white mb-4"
                >
                  {evento.nome}
                </h3>
                <Link
                  to={`/evento/${evento.id}`}
                  className="inline-block px-5 py-3 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition text-base font-medium border border-purple-300 dark:border-purple-700"
                >
                  Clique para ver informações
                </Link>
              </div>
            </div>

            {/* Seção 3: Botão Editar */}
            <div className="px-6 pb-6 flex justify-start">
              {!evento.realizado && (
                <Link
                  to={`/editar-evento/${evento.id}`}
                  className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-base font-medium"
                >
                  Editar Evento
                </Link>
              )}
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
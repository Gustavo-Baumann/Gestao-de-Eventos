import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  CalendarIcon,
  TicketIcon,
  StarIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import BarraSuperior from './BarraSuperior';
import { useUsuario } from '../context/UsuarioContext';
import Paginacao from '../components/Paginacao';
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
  cidade?: string;
}

export interface Municipio {
  id: number;     
  nome: string;
  uf: string;
}

const ITENS_POR_PAGINA = 20;

const Feed = () => {
  const navigate = useNavigate();
  const { perfil, supabase } = useUsuario();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarPassados, setMostrarPassados] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [cidadeAlvo, setCidadeAlvo] = useState<number | null>(null);
  const [queryPesquisa, setQueryPesquisa] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'nome' | 'cidade'>('nome');

  const isCliente = perfil?.tipo_usuario === 'cliente';
  const isOrganizador = perfil?.tipo_usuario === 'organizador';

  const handleCriarEvento = () => {
    navigate('/criar-evento');
    setSidebarOpen(false);
  };

  const handleMeusEventos = () => {
    navigate('/meus-eventos');
    setSidebarOpen(false);
  };

  const handleMinhasInscricoes = () => {
    navigate('/minhas-inscricoes');
    setSidebarOpen(false);
  };

  const handleReviews = () => {
    navigate('/reviews');
    setSidebarOpen(false);
  };

  const buscarEventos = useCallback(async () => {
    if (!perfil || !supabase) return;

    setCarregando(true);

    let queryBuilder = supabase
      .from('eventos')
      .select(`
        id,
        nome,
        data_realizacao,
        banner_url,
        realizado,
        id_criador,
        cidade,
        usuarios!id_criador (
          nome,
          imagem_url
        )
      `)
      .eq('deletado', false)
      .eq('realizado', mostrarPassados)
      .order('data_realizacao', { ascending: true });

    if (tipoFiltro === 'cidade') {
      const cidadeParaUsar = cidadeAlvo ?? perfil?.cidade_id;
      if (cidadeParaUsar) {
        queryBuilder = queryBuilder.eq('cidade', cidadeParaUsar);
      }
    } else if (tipoFiltro === 'nome' && !queryPesquisa.trim() && perfil?.cidade_id) {
      queryBuilder = queryBuilder.eq('cidade', perfil.cidade_id);
    }

    if (tipoFiltro === 'nome' && queryPesquisa.trim()) {
      queryBuilder = queryBuilder.ilike('nome', `%${queryPesquisa.trim()}%`);
    }

    const { data, error } = await queryBuilder;

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
        cidade: e.cidade,
      }));
      setEventos(formatados);
    }
    setCarregando(false);
    setPaginaAtual(1);
  }, [perfil, supabase, mostrarPassados, tipoFiltro, cidadeAlvo, queryPesquisa]);

  useEffect(() => {
    if (perfil?.cidade_id) {
      setCidadeAlvo(null); 
      setQueryPesquisa(''); 
      setTipoFiltro('nome');
      buscarEventos();
    }
  }, [perfil?.cidade_id]); 

  useEffect(() => {
    buscarEventos();
  }, [buscarEventos]);

  const totalPaginas = Math.ceil(eventos.length / ITENS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const fim = inicio + ITENS_POR_PAGINA;
  const eventosPaginados = eventos.slice(inicio, fim);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-800 text-black dark:text-white">
      <BarraSuperior
        onBuscar={(query, tipo) => {
          if (tipo === 'nome') {
            setQueryPesquisa(query.trim());
            setCidadeAlvo(null);           
          } else if (tipo === 'cidade') {
            setQueryPesquisa('');         
          }
          setTipoFiltro(tipo);
        }}
        tipoFiltro={tipoFiltro}
        setTipoFiltro={(novoTipo) => {
          setTipoFiltro(novoTipo);

          if (novoTipo === 'cidade') {
            setQueryPesquisa(''); 
            if (cidadeAlvo === null) {
              setCidadeAlvo(perfil?.cidade_id ?? null);
            }
          }
        }}
        cidadeAlvo={cidadeAlvo}
        setCidadeAlvo={setCidadeAlvo}
        perfilCidadeId={perfil?.cidade_id ?? null}
      />

      <div className="flex h-screen pt-16 md:pt-20">
        <aside
          className={`
            fixed md:relative z-40 flex flex-col bg-white dark:bg-neutral-800
            border-r border-gray-200 dark:border-neutral-700
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-64' : 'w-12 md:w-64'}  
            h-screen md:h-auto overflow-hidden
          `}
          role="navigation"
          aria-label="Menu lateral"
        >
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className={`
                absolute top-4 left-1/2 -translate-x-1/2 p-2
                bg-purple-600 text-white rounded-lg shadow-md
                hover:bg-purple-700 transition-all md:hidden
              `}
              aria-label="Abrir menu lateral"
            >
              <ChevronDoubleRightIcon className="w-5 h-5" />
            </button>
          )}

          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-2 p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-neutral-700 rounded-full transition-colors md:hidden"
              aria-label="Fechar menu"
            >
              <ChevronDoubleLeftIcon className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1 pt-16 md:pt-6 px-3 overflow-y-auto">
            <nav className="flex flex-col gap-3">
              {isOrganizador && (
                <>
                  <button
                    onClick={handleCriarEvento}
                    className={`
                      flex items-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-xl 
                      hover:bg-purple-700 transition-colors font-medium shadow-sm
                      md:flex
                      ${!sidebarOpen ? 'hidden' : ''}
                    `.trim()}
                    aria-label="Criar novo evento"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span className={sidebarOpen ? 'block' : 'hidden md:block'}>Criar Evento</span>
                  </button>

                  <button
                    onClick={handleMeusEventos}
                    className={`flex items-center gap-3 px-4 py-3 bg-purple-100 dark:bg-neutral-700 
                    text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-200 
                    dark:hover:bg-neutral-600 transition-colors font-medium shadow-sm" 
                    md:flex ${!sidebarOpen ? 'hidden' : ''}`.trim()}
                    aria-label="Ver meus eventos"
                  >
                    <CalendarIcon className="w-5 h-5" />
                    <span className={sidebarOpen ? 'block' : 'hidden md:block'}>Meus Eventos</span>
                  </button>
                </>
              )}

              {isCliente && (
                <>
                  <button
                    onClick={handleMinhasInscricoes}
                    className={`flex items-center gap-3 px-4 py-3 bg-purple-600 text-white 
                    rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-sm 
                    md:flex ${!sidebarOpen ? 'hidden' : ''}`.trim()}
                    aria-label="Ver minhas inscrições"
                  >
                    <TicketIcon className="w-5 h-5" />
                    <span className={sidebarOpen ? 'block' : 'hidden md:block'}>Minhas Inscrições</span>
                  </button>

                  <button
                    onClick={handleReviews}
                    className={`flex items-center gap-3 px-4 py-3 bg-purple-100 dark:bg-neutral-700 
                    text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-200 
                    dark:hover:bg-neutral-600 transition-colors font-medium md:flex ${!sidebarOpen ? 'hidden' : ''}`}
                    aria-label="Ver minhas reviews"
                  >
                    <StarIcon className="w-5 h-5" />
                    <span className={sidebarOpen ? 'block' : 'hidden md:block'}>Reviews</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </aside>

        <main
          className={`
            flex-1 overflow-y-auto p-6 md:p-8 lg:p-10
            transition-all duration-300
            ${sidebarOpen ? 'ml-64' : 'ml-12 md:ml-0'}
          `}
          role="main"
          aria-live="polite"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold" id="titulo-pagina">
                {mostrarPassados ? 'Histórico de Eventos' : 'Lista de Eventos'}
              </h1>
              <button
                onClick={() => setMostrarPassados(prev => !prev)}
                className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-neutral-700 transition-colors group"
                aria-label={mostrarPassados ? "Ver eventos futuros" : "Ver histórico de eventos"}
                aria-pressed={mostrarPassados}
              >
                <ClockIcon
                  className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform"
                  aria-hidden="true"
                />
              </button>
            </div>

            {carregando ? (
              <div role="status" aria-live="polite" className="text-center py-10">
                <Carregando />
              </div>
            ) : eventosPaginados.length === 0 ? (
              <p
                className="text-center text-gray-600 dark:text-gray-400 py-10"
                role="status"
                aria-live="polite"
              >
                {tipoFiltro === 'nome' && queryPesquisa
                  ? `Nenhum evento encontrado com o nome "${queryPesquisa}".`
                  : mostrarPassados
                  ? 'Nenhum evento passado encontrado.'
                  : 'Nenhum evento futuro encontrado na sua cidade.'}
              </p>
            ) : (
              <section aria-labelledby="titulo-pagina">
                <div className="space-y-6">
                  {eventosPaginados.map((evento) => (
                    <article
                      key={evento.id}
                      className="bg-white dark:bg-neutral-700 rounded-2xl shadow-lg overflow-hidden border border-gray-300 dark:border-neutral-600"
                      aria-labelledby={`evento-titulo-${evento.id}`}
                    >
                      <div className="h-48 bg-gray-200 dark:bg-neutral-600 relative">
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
                          className={`absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 ${
                            evento.banner_url ? 'hidden' : ''
                          }`}
                          aria-hidden="true"
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
                              className={`absolute inset-0 flex items-center justify-center text-5xl font-bold text-gray-400 dark:text-gray-500 ${
                                evento.criador_imagem_url ? 'hidden' : ''
                              }`}
                              aria-hidden="true"
                            >
                              {evento.criador_nome?.[0]?.toUpperCase() || '?'}
                            </div>
                          </div>
                        </div>

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
                          <a
                            href={`/evento/${evento.id}`}
                            className="inline-block px-5 py-3 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition text-base font-medium border border-purple-300 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/evento/${evento.id}`);
                            }}
                            aria-label={`Ver detalhes do evento ${evento.nome}`}
                          >
                            Detalhes do evento
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {totalPaginas > 1 && (
              <nav className="mt-10" aria-label="Paginação">
                <Paginacao
                  paginaAtual={paginaAtual}
                  totalPaginas={totalPaginas}
                  onPaginaChange={setPaginaAtual}
                />
              </nav>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Feed;
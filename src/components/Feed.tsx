import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  CalendarIcon,
  TicketIcon,
  StarIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline';
import BarraSuperior from './BarraSuperior';
import { useUsuario } from '../context/UsuarioContext';

const Feed = () => {
  const navigate = useNavigate();
  const { perfil } = useUsuario();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-800 text-black dark:text-white">
      <BarraSuperior />

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
        >
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Feed</h1>
            <div className="bg-gray-100 dark:bg-neutral-700 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-xl p-12 text-center text-gray-500 dark:text-neutral-400">
              <p className="text-lg">Área de conteúdo principal</p>
              <p className="text-sm mt-2">Eventos, feed, cards, etc. serão exibidos aqui</p>
            </div>

            <div className="mt-8 space-y-6">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-50 dark:bg-neutral-700 rounded-lg p-4 border border-gray-200 dark:border-neutral-600"
                >
                  <p className="text-sm text-gray-600 dark:text-neutral-300">
                    Item de feed #{i + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Feed;
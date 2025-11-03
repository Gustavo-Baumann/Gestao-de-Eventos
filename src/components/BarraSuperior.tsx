import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { supabase } from '../supabase-client';
import { useTema } from '../context/TemaContext';
import { useUsuario } from '../context/UsuarioContext';

const BarraSuperior = () => {
  const navigate = useNavigate();
  const { toggleDarkMode, tema } = useTema()
  const { perfil } = useUsuario();

  const [queryPesquisa, setQueryPesquisa] = useState<string>('');
  const [tipoFiltro, setTipoFiltro] = useState<'nome' | 'cidade'>('nome');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const handleHome = () => {
    navigate('/');
    window.location.reload();
  };

  const handleBusca = () => {
    console.log('Buscando:', queryPesquisa, 'por', tipoFiltro);
  };

  const handlePerfil = () => {
    if (perfil?.nome) navigate(`/perfil/${perfil.nome}`);
  };

  const handleLogout = async () => {
    console.log("foi")
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleToggleDarkMode = () => {
    toggleDarkMode();
  };

  return (
    <header
      className="bg-purple-600 text-white w-full fixed top-0 left-0 z-50 shadow-lg"
      role="banner"
    >
      <div className="flex h-16 px-1 max-w-screen-xl mx-auto">

        <div className="flex items-center justify-start gap-2 w-4/5 sm:w-2/3 lg:w-1/2 ">
          <button
            onClick={handleHome}
            className="px-3 py-2 bg-purple-600 border-2 border-white rounded-xl 
            font-semibold text-sm hover:bg-purple-700 transition-colors 
            whitespace-nowrap min-w-[20%]"
            aria-label="Voltar ao Feed"
          >
            Feed
          </button>

          <div className="flex items-center flex-1 h-10 mx-2 md:mx-0 min-w-0">
            <input
              type="text"
              value={queryPesquisa}
              onChange={(e) => setQueryPesquisa(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBusca()}
              placeholder="Buscar..."
              className="flex-1 h-full px-3 bg-white text-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm text-sm min-w-0"
              aria-label="Campo de busca"
            />

            <button
              onClick={handleBusca}
              className="h-full px-2 bg-white text-gray-600 hover:text-purple-600 flex items-center justify-center"
              aria-label="Executar busca"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>

            <div className="h-full px-2 bg-purple-700 text-white flex items-center">
              <FunnelIcon className="w-5 h-5" aria-hidden="true" />
              <span className="ml-1 hidden sm:inline text-xs font-medium">Filtrar por</span>
            </div>

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as 'nome' | 'cidade')}
              className="h-full px-2 bg-white text-gray-800 rounded-r-lg focus:outline-none text-xs min-w-[80px]"
              aria-label="Tipo de filtro"
            >
              <option value="nome">Nome</option>
              <option value="cidade">Cidade</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pr-2 w-1/5 sm:w-1/3 lg:w-1/2">

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handlePerfil}
              className="flex items-center gap-2 px-3 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors text-sm font-medium"
              aria-label="Acessar meu perfil"
            >
              <UserCircleIcon className="w-5 h-5" aria-hidden="true" />
              <span className="hidden lg:inline">Meu Perfil</span>
            </button>

            <button
              onClick={() => navigate('/configuracoes')}
              className="p-2 bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors"
              aria-label="Configurações"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>

            <button
              onClick={handleToggleDarkMode}
              className="p-2 bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors"
              aria-label={tema == 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {tema == 'escuro' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 p-2 bg-purple-700 hover:bg-red-600 rounded-lg transition-colors text-sm font-medium"
              aria-label="Sair da conta"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" aria-hidden="true" />
              <span className="hidden lg:inline">Sair</span>
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors md:hidden"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-purple-700 rounded-lg shadow-xl z-50 md:hidden">
          <div className="flex flex-col p-2 gap-1">
            <button
              onClick={() => { handlePerfil(); setMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-purple-800 rounded-lg text-sm"
            >
              <UserCircleIcon className="w-5 h-5" />
              <span>Meu Perfil</span>
            </button>

            <button
              onClick={() => { navigate('/configuracoes'); setMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-purple-800 rounded-lg text-sm"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Configurações</span>
            </button>

            <button
              onClick={() => { handleToggleDarkMode(); setMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-purple-800 rounded-lg text-sm"
            >
              {tema == 'escuro' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              <span>{tema == 'escuro' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-sm"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default BarraSuperior;
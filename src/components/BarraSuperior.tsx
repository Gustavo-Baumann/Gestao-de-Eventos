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
import { useTema } from '../context/TemaContext';
import { useUsuario } from '../context/UsuarioContext';
import { type Municipio } from './Feed';
import { useEffect, useState } from 'react';

interface BarraSuperiorProps {
  onBuscar: (query: string, tipo: 'nome' | 'cidade') => void;
  tipoFiltro: 'nome' | 'cidade';
  setTipoFiltro: (t: 'nome' | 'cidade') => void;
  cidadeAlvo: number | null;
  setCidadeAlvo: (id: number | null) => void;
  perfilCidadeId: number | null;
}

const BarraSuperior = ({
  onBuscar,
  tipoFiltro,
  setTipoFiltro,
  cidadeAlvo,
  setCidadeAlvo,
  perfilCidadeId,
}: BarraSuperiorProps) => {
  const navigate = useNavigate();
  const { toggleDarkMode, tema } = useTema();
  const { perfil, logout, supabase } = useUsuario();

  const [menuOpen, setMenuOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sugestoes, setSugestoes] = useState<Municipio[]>([]);
  const [carregando, setCarregando] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setInputValue(valor);
  };

  const handleHome = () => {
    navigate('/');
    window.location.reload();
  };

  const handlePerfil = () => {
    if (perfil?.nome) {
      const slug = perfil.nome
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .replace(/_+/g, '_');
      navigate(`/perfil/${slug}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleToggleDarkMode = () => {
    toggleDarkMode();
  };

  const handleBuscar = () => {
    const valor = inputValue.trim();
    onBuscar(valor, tipoFiltro);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  useEffect(() => {
    if (tipoFiltro !== 'cidade' || !inputValue.trim()) {
      setSugestoes([]);
      return;
    }

    const delay = setTimeout(() => {
      setCarregando(true);
      supabase
        .from('municipios')
        .select('codigo_ibge, nome, estados!codigo_uf (uf)')
        .ilike('nome', `%${inputValue}%`)
        .order('nome')
        .limit(10)
        .then(({ data, error }) => {
          if (!error && data) {
            const formatadas = data.map((c: any) => ({
              id: c.codigo_ibge,
              nome: c.nome,
              uf: c.estados?.uf || '',
            }));
            setSugestoes(formatadas);
          }
          setCarregando(false);
        });
    }, 300);

    return () => clearTimeout(delay);
  }, [inputValue, tipoFiltro, supabase]);

  useEffect(() => {
    if (tipoFiltro === 'nome') {
      setInputValue('');
      setSugestoes([]);
    }
  }, [tipoFiltro]);

  return (
    <header
      className="bg-purple-600 text-white w-full fixed top-0 left-0 z-50 shadow-lg"
      role="banner"
    >
      <div className="flex h-16 px-1 max-w-7xl mx-auto items-center">

        <div className="flex items-center justify-start gap-2 w-4/5 sm:w-2/3 lg:w-1/2 relative">
          <button
            onClick={handleHome}
            className="px-3 py-2 bg-purple-600 border-2 border-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors whitespace-nowrap min-w-[20%]"
            aria-label="Voltar ao Feed"
          >
            Feed
          </button>

          <div className="flex items-center flex-1 h-10 mx-2 md:mx-0 min-w-0 relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={tipoFiltro === 'nome' ? 'Buscar por nome...' : 'Buscar por cidade...'}
              className="flex-1 h-full px-3 bg-white text-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm text-sm min-w-0"
              aria-label="Campo de busca"
              aria-autocomplete={tipoFiltro === 'cidade' ? 'list' : 'none'}
              aria-controls={tipoFiltro === 'cidade' && sugestoes.length > 0 ? 'lista-sugestoes-cidades' : undefined}
              aria-expanded={tipoFiltro === 'cidade' && sugestoes.length > 0}
            />

            <button
              onClick={handleBuscar}
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
              onChange={(e) => {
                const novoTipo = e.target.value as 'nome' | 'cidade';
                setTipoFiltro(novoTipo);
                setInputValue('');
                setSugestoes([]);
                if (novoTipo === 'cidade') {
                  setCidadeAlvo(perfilCidadeId ?? null);  
                }
              }}
              className="h-full px-2 bg-white text-gray-800 rounded-r-lg focus:outline-none text-xs min-w-[80px]"
              aria-label="Tipo de filtro"
            >
              <option value="nome">Nome</option>
              <option value="cidade">Cidade</option>
            </select>

            {tipoFiltro === 'cidade' && inputValue && sugestoes.length > 0 && (
              <ul
                id="lista-sugestoes-cidades"
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 max-h-60 overflow-auto border border-gray-200"
                role="listbox"
                aria-label="Sugestões de cidades"
              >
                {carregando ? (
                  <li className="px-3 py-2 text-gray-500 text-sm italic">Carregando...</li>
                ) : (
                  sugestoes.map((cidade) => (
                    <li
                      key={cidade.id}
                      role="option"
                      className="px-3 py-2 hover:bg-purple-100 cursor-pointer text-gray-800 text-sm flex items-center justify-between"
                      onClick={() => {
                        setInputValue(`${cidade.nome} - ${cidade.uf}`);
                        setCidadeAlvo(cidade.id);
                        setSugestoes([]);
                      }}
                    >
                      <span>{cidade.nome}</span>
                    </li>
                  ))
                )}
              </ul>
            )}

            {tipoFiltro === 'cidade' && cidadeAlvo !== perfilCidadeId && (
              <div
                className="absolute -bottom-8 left-0 right-0 flex items-center justify-between px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg"
                role="status"
                aria-live="polite"
              >
                <span>Filtrando por: <strong>{sugestoes.find(c => c.id === cidadeAlvo)?.nome || 'Outra cidade'}</strong></span>
                <button
                  onClick={() => {
                    setCidadeAlvo(perfilCidadeId);
                    setInputValue('');
                    setSugestoes([]);
                  }}
                  className="text-purple-600 hover:text-purple-800"
                  aria-label="Limpar filtro de cidade"
                >
                  ×
                </button>
              </div>
            )}
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
              aria-label={tema === 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {tema === 'escuro' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
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
            aria-haspopup="true"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="absolute top-full right-0 mt-1 w-56 bg-purple-700 rounded-lg shadow-xl z-50 md:hidden"
          role="menu"
          aria-label="Menu do usuário"
        >
          <div className="flex flex-col p-2 gap-1">
            <button
              onClick={() => { handlePerfil(); setMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-purple-800 rounded-lg text-sm"
              role="menuitem"
            >
              <UserCircleIcon className="w-5 h-5" />
              <span>Meu Perfil</span>
            </button>

            <button
              onClick={() => { navigate('/configuracoes'); setMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-purple-800 rounded-lg text-sm"
              role="menuitem"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Configurações</span>
            </button>

            <button
              onClick={() => { handleToggleDarkMode(); setMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-purple-800 rounded-lg text-sm"
              role="menuitem"
            >
              {tema === 'escuro' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              <span>{tema === 'escuro' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-sm"
              role="menuitem"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default BarraSuperior;
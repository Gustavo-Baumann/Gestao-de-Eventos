import { createContext, useContext, useReducer, type ReactNode, useLayoutEffect } from 'react';

type Tema = 'claro' | 'escuro';

interface TemaState {
  Tema: Tema;
}

type TemaAcao = | { type: 'SET_TEMA'; payload: Tema } | { type: 'TOGGLE_TEMA' };

const getTemaInicial = (): Tema => {
  if (typeof window === 'undefined') return 'claro';

  const saved = localStorage.getItem('tema');
  if (saved === 'claro' || saved === 'escuro') {
    return saved;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'escuro' : 'claro';
};

const temaInicial: TemaState = { Tema: getTemaInicial() };

function temaReducer(state: TemaState, action: TemaAcao): TemaState {
  switch (action.type) {
    case 'SET_TEMA':
      return { ...state, Tema: action.payload };
    case 'TOGGLE_TEMA':
      return { ...state, Tema: state.Tema === 'claro' ? 'escuro' : 'claro' };
    default:
      return state;
  }
}

interface TemaContextType {
  tema: Tema;
  toggleDarkMode: () => void;
}

const TemaContext = createContext<TemaContextType | undefined>(undefined);

export function TemaProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(temaReducer, temaInicial);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    if (state.Tema === 'escuro') {
      root.classList.add('dark');
    }
    localStorage.setItem('tema', state.Tema);
    console.log("trocou para" + state.Tema)
  }, [state.Tema]);

   useLayoutEffect(() => {
    const saved = localStorage.getItem('tema');
    const temaAtual: Tema = saved === 'escuro' ? 'escuro' : 'claro';
    dispatch({ type: 'SET_TEMA', payload: temaAtual });
  }, []);

  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_TEMA' });
  };

  return (
    <TemaContext.Provider value={{ tema: state.Tema, toggleDarkMode }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const context = useContext(TemaContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
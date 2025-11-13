import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Carregando from './components/Carregando'
import ErrorBoundary from './components/ErrorBoundary'
import { useAuth } from './hooks/useAuth'
import { TemaProvider } from './context/TemaContext'
import { UsuarioProvider } from './context/UsuarioContext'
import Evento from './components/Evento'

const Feed = React.lazy(() => import('./components/Feed'));
const Cadastro = React.lazy(() => import('./components/Cadastro'));
const Login = React.lazy(() => import('./components/Login'));
const Configuracoes = React.lazy(() => import('./components/Configuracoes'));
const Fallback = React.lazy(() => import('./components/Fallback'));
const Perfil = React.lazy(() => import('./components/Perfil'));
const Erro = React.lazy(() => import('./components/Erro'));
const CriarEvento = React.lazy(() => import('./components/CriarEvento'))
const MeusEventos = React.lazy(() => import('./components/MeusEventos'))

function App() {

  const { sessao, carregando } = useAuth()

  if(carregando){
    return <Carregando />
  }

  return (
    <TemaProvider>
      <UsuarioProvider>
      <Router>
        <ErrorBoundary>
        <Suspense fallback= {<Carregando />}>
          <Routes>
            <Route path='/' element={ sessao ? <Feed /> : <Navigate to="/login" replace />} />
            <Route path='/cadastro' element={ sessao ? <Navigate to="/" replace /> : <Cadastro />} />
            <Route path='/login' element={ sessao ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/perfil/:nome" element={ sessao ? <Perfil /> : <Navigate to="/login" replace />} />
            <Route path='/configuracoes' element={ sessao ? <Configuracoes /> : <Navigate to="/login" replace />} />
            <Route path='/criar-evento' element={ sessao ? <CriarEvento /> : <Navigate to="/login" replace />} />
            <Route path='/evento/:id' element={ sessao ? <Evento /> : <Navigate to="/login" replace />} />
            <Route path='/meus-eventos' element={ sessao ? <MeusEventos /> : <Navigate to="/login" replace />} />
            <Route path='/erro' element={<Erro />} /> 
            <Route path='*' element={<Fallback />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </Router>
      </UsuarioProvider>
    </TemaProvider>
  ) 
}

export default App

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Feed from './components/Feed'
import Carregando from './components/Carregando'
import Fallback from './components/Fallback'
import { useAuth } from './hooks/useAuth'
import Cadastro from './components/Cadastro'
import Login from './components/Login'
import Configuracoes from './components/Configuracoes'
import { TemaProvider } from './context/TemaContext'
import { UsuarioProvider } from './context/UsuarioContext'

function App() {

  const { sessao, carregando } = useAuth()

  if(carregando){
    return <Carregando />
  }


  return (
    <TemaProvider>
    <UsuarioProvider>
      <Router>
       <Routes>
          <Route path='/' element={ sessao ? <Feed /> : <Navigate to="/login" replace />} />
          <Route path='/cadastro' element={ sessao ? <Navigate to="/" replace /> : <Cadastro />} />
          <Route path='/login' element={ sessao ? <Navigate to="/" replace /> : <Login />} />
          <Route path='/configuracoes' element={ sessao ? <Configuracoes /> : <Navigate to="/login" replace />} />
          <Route path='*' element={<Fallback />} />
        </Routes>
      </Router>
    </UsuarioProvider>
    </TemaProvider>
  ) 
}

export default App

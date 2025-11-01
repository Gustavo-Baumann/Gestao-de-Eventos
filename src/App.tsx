import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Feed from './components/Feed'
import Carregando from './components/Carregando'
import Fallback from './components/Fallback'
import { useAuth } from './hooks/useAuth'
import Cadastro from './components/Cadastro'
import Login from './components/Login'
import Configuracoes from './components/Configuracoes'

function App() {

  const { sessao, carregando } = useAuth()

  if(carregando){
    return <Carregando />
  }


  return (
    <Router>
      <Routes>
        <Route path='/' element={ sessao ? <Feed /> : <Navigate to="/login" replace />} />
        <Route path='/cadastro' element={ sessao ? <Navigate to="/" replace /> : <Cadastro />} />
        <Route path='/login' element={ sessao ? <Navigate to="/" replace /> : <Login />} />
        <Route path='/configuracoes' element={ sessao ? <Configuracoes /> : <Navigate to="/" replace />} />
        <Route path='*' element={<Fallback />} />
      </Routes>
    </Router>
  ) 
}

export default App

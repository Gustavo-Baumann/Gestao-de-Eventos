import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '../supabase-client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const navigate = useNavigate()
  const supabase = getSupabaseClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErro(error.message)
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-200 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white border border-blue-200 rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            Login
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-5" aria-label="Formulário de login">
            <div className="flex flex-col">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                aria-label="Endereço de email"
                aria-required="true"
                autoComplete="email"
                className="max-w-md w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                aria-label="Senha de acesso"
                aria-required="true"
                autoComplete="current-password"
                className="max-w-md w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {erro && (
              <div
                role="alert"
                aria-live="assertive"
                className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3"
              >
                Credenciais inválidas. Verifique seu email e senha.
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              aria-label={carregando ? 'Entrando, aguarde...' : 'Fazer login' }
              aria-disabled={carregando}
              className="max-w-md w-full py-3 mt-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {carregando ? (
                <>
                  <span className="sr-only">Carregando...</span>
                  <span aria-hidden="true">Entrando...</span>
                </>
              ) : (
                'Fazer login'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Não tem conta?{' '}
            <button
              type="button"
              onClick={() => navigate('/cadastro')}
              className="text-blue-600 underline cursor-pointer hover:text-blue-800 transition focus:outline-none focus:underline focus:text-blue-800"
              aria-label="Ir para a página de cadastro"
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
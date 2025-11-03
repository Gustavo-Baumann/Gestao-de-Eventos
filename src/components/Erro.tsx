import { Link } from 'react-router-dom';

export default function Erro() {
  return (
    <div className="min-h-screen bg-neutral-200 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white border border-red-200 rounded-xl p-8 shadow-sm">
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-gray-800 text-center mb-3">
            Ops! Algo deu errado
          </h1>

          <p className="text-sm text-gray-600 text-center mb-6">
            Não foi possível carregar esta parte da aplicação. Tente novamente ou volte mais tarde.
          </p>

          <Link
            to="/"
            className="w-full max-w-md mx-auto block text-center py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-200"
            aria-label="Voltar para a página inicial"
          >
            Voltar para o início
          </Link>

        </div>
      </div>
    </div>
  );
}
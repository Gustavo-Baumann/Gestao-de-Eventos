const Carregando = () => {
  return (
    <div className="min-h-screen bg-neutral-200 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white border border-blue-200 rounded-xl p-8 shadow-sm">
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse"
              aria-hidden="true"
            >
              <svg
                className="w-10 h-10 text-blue-600 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582M20 20v-5h-.582M4 20h5v-.582M20 4h-5v.582M12 12a5 5 0 100-10 5 5 0 000 10z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-gray-800 text-center mb-3">
            Carregando
          </h1>

          <div
            role="status"
            aria-live="polite"
            className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center"
          >
            Por favor, aguarde enquanto carregamos os dados...
          </div>

          <div className="sr-only" aria-live="assertive">
            Carregando conteúdo, aguarde...
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carregando;
interface PaginacaoProps {
  paginaAtual: number;
  totalPaginas: number;
  onPaginaChange: (pagina: number) => void;
}

export default function Paginacao({ paginaAtual, totalPaginas, onPaginaChange }: PaginacaoProps) {
  if (totalPaginas <= 1) return null;

  return (
    <nav className="flex justify-center items-center gap-2 mt-8" aria-label="Paginação">
      <button
        onClick={() => onPaginaChange(paginaAtual - 1)}
        disabled={paginaAtual === 1}
        className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-200 dark:hover:bg-purple-800 transition"
        aria-label="Página anterior"
      >
        Anterior
      </button>

      <span className="text-sm text-gray-700 dark:text-gray-300">
        Página {paginaAtual} de {totalPaginas}
      </span>

      <button
        onClick={() => onPaginaChange(paginaAtual + 1)}
        disabled={paginaAtual === totalPaginas}
        className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-200 dark:hover:bg-purple-800 transition"
        aria-label="Próxima página"
      >
        Próxima
      </button>
    </nav>
  );
}
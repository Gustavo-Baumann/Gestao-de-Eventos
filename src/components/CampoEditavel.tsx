import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';

interface CampoEditavelProps {
  label: string;
  valor: string | null;
  campo:
    | keyof import('../context/UsuarioContext').PerfilUsuario
    | keyof import('../components/Evento').EventoData;
  onSalvar: (novoValor: string) => Promise<void>;
  tipo?: 'text' | 'tel' | 'date' | 'datetime-local';
  placeholder?: string;
  disabled?: boolean; 
}

export default function CampoEditavel({
  label,
  valor,
  campo,
  onSalvar,
  tipo = 'text',
  placeholder,
  disabled = false,
}: CampoEditavelProps) {
  const [editando, setEditando] = useState(false);
  const [novoValor, setNovoValor] = useState(valor || '');
  const [valorOriginal] = useState(valor || '');
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await onSalvar(novoValor);
      setEditando(false);
    } catch {
      alert('Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    setNovoValor(valorOriginal);
    setEditando(false);
  };

  if (!editando) {
    return (
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </p>
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {valor || 'Não informado'}
          </p>
        </div>

        <button
          onClick={() => setEditando(true)}
          disabled={disabled}
          className={`
            p-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-500
            ${disabled
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
            }
          `}
          aria-label={`Editar ${label.toLowerCase()}`}
          aria-disabled={disabled}
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 py-2">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        <input
          type={tipo}
          value={novoValor}
          onChange={(e) => setNovoValor(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500
            bg-white dark:bg-neutral-800
            border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-500 dark:placeholder:text-gray-400
          `}
          autoFocus
        />
      </div>

      <button
        onClick={handleSalvar}
        disabled={salvando}
        className={`
          p-2 rounded-lg transition flex items-center justify-center
          ${salvando
            ? 'bg-purple-400 cursor-wait'
            : 'bg-purple-600 hover:bg-purple-700'
          } text-white
        `}
        aria-label="Salvar alterações"
      >
        {salvando ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
      </button>

      <button
        onClick={handleCancelar}
        className={`
          p-2 rounded-lg transition
          bg-gray-200 dark:bg-gray-700
          text-gray-700 dark:text-gray-300
          hover:bg-gray-300 dark:hover:bg-gray-600
        `}
        aria-label="Cancelar edição"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
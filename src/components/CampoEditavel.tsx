import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';

interface CampoEditavelProps {
  label: string;
  valor: string | null;
  campo: keyof import('../context/UsuarioContext').PerfilUsuario;
  onSalvar: (novoValor: string) => Promise<void>;
  tipo?: 'text' | 'tel' | 'date';
  placeholder?: string;
}

export default function CampoEditavel({
  label,
  valor,
  campo,
  onSalvar,
  tipo = 'text',
  placeholder,
}: CampoEditavelProps) {
  const [editando, setEditando] = useState(false);
  const [novoValor, setNovoValor] = useState(valor || '');
  const [valorOriginal] = useState(valor || ''); // para cancelar
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
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-sm text-gray-900">{valor || 'Não informado'}</p>
        </div>
        <button
          onClick={() => setEditando(true)}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label={`Editar ${label.toLowerCase()}`}
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 py-2">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <input
          type={tipo}
          value={novoValor}
          onChange={(e) => setNovoValor(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
        />
      </div>
      <button
        onClick={handleSalvar}
        disabled={salvando}
        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition"
        aria-label="Confirmar"
      >
        {salvando ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
      </button>
      <button
        onClick={handleCancelar}
        className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        aria-label="Cancelar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
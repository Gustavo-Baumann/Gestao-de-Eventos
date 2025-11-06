import { useState, useEffect } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { useSupabaseClient } from '../supabase-client';

interface Cidade {
  codigo_ibge: number;
  nome: string;
  uf: string;
}

interface CampoCidadeEditavelProps {
  cidade_id: number | null;
  onSalvar: (novoId: number) => Promise<void>;
}

export default function CampoCidadeEditavel({ cidade_id, onSalvar }: CampoCidadeEditavelProps) {
  const [editando, setEditando] = useState(false);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [busca, setBusca] = useState('');
  const [cidadeAtual, setCidadeAtual] = useState<Cidade | null>(null);
  const [salvando, setSalvando] = useState(false);
  const supabase = useSupabaseClient()

  useEffect(() => {
    if (!cidade_id) return;

    supabase
      .from('municipios')
      .select('codigo_ibge, nome, estados!codigo_uf (uf)')
      .eq('codigo_ibge', cidade_id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return;

        const estado = data.estados as unknown as { uf: string } | null;

        setCidadeAtual({
          codigo_ibge: data.codigo_ibge,
          nome: data.nome,
          uf: estado?.uf || '',
        });
      });
  }, [cidade_id]);


  useEffect(() => {
    const delay = setTimeout(() => {
      if (busca.length < 2) {
        setCidades([]);
        return;
      }

      supabase
        .from('municipios')
        .select('codigo_ibge, nome, estados!codigo_uf (uf)')
        .ilike('nome', `%${busca}%`)
        .order('nome')
        .limit(10)
        .then(({ data }) => {
          if (data) {
            const formatted = data.map((c: any) => ({
              codigo_ibge: c.codigo_ibge,
              nome: c.nome,
              uf: c.estados?.uf || '',
            }));
            setCidades(formatted);
          }
        });
    }, 300);

    return () => clearTimeout(delay);
  }, [busca]);

  const handleSalvar = async (novoId: number) => {
    setSalvando(true);
    try {
      await onSalvar(novoId);
      setEditando(false);
    } catch {
      alert('Erro ao salvar cidade.');
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    setBusca('');
    setCidades([]);
    setEditando(false);
  };

  if (!editando) {
    return (
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-gray-700">Cidade</p>
          <p className="text-sm text-gray-900">
            {cidadeAtual ? `${cidadeAtual.nome} - ${cidadeAtual.uf}` : 'Não informada'}
          </p>
        </div>
        <button
          onClick={() => setEditando(true)}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Editar cidade"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Cidade
      </label>
      <div className="relative">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome da cidade"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
        />
        {cidades.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {cidades.map((cidade) => (
              <li
                key={cidade.codigo_ibge}
                onClick={() => handleSalvar(cidade.codigo_ibge)}
                className="px-4 py-2 hover:bg-purple-50 cursor-pointer focus:bg-purple-100 focus:outline-none"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSalvar(cidade.codigo_ibge);
                  }
                }}
              >
                {cidade.nome} - {cidade.uf}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleCancelar}
          className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm"
        >
          <X className="w-4 h-4 inline mr-1" /> Cancelar
        </button>
      </div>
    </div>
  );
}
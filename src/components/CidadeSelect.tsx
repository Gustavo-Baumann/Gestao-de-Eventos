import { useState, useEffect } from 'react';
import { type Cidade } from './CampoCidadeEditavel';
import { useUsuario } from '../context/UsuarioContext';

interface CidadeSelectProps {
  value: number | null;
  onChange: (id: number | null) => void;
  required?: boolean;
}

export default function CidadeSelect({ value, onChange, required }: CidadeSelectProps) {
  const [busca, setBusca] = useState('');
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [cidadeAtual, setCidadeAtual] = useState<Cidade | null>(null);
  const [carregandoCidade, setCarregandoCidade] = useState(false);
  const { supabase } = useUsuario();

  useEffect(() => {
    if (!value) {
      setCidadeAtual(null);
      return;
    }

    setCarregandoCidade(true);
    supabase
      .from('municipios')
      .select('codigo_ibge, nome, estados!codigo_uf (uf)')
      .eq('codigo_ibge', value)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const estados = data.estados as any;
          setCidadeAtual({
            codigo_ibge: data.codigo_ibge,
            nome: data.nome,
            uf: estados?.uf || '',
          });
        } else {
          setCidadeAtual(null);
        }
        setCarregandoCidade(false);
      });
  }, [value, supabase]);

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
  }, [busca, supabase]);

  const handleSelecionar = (cidade: Cidade) => {
    onChange(cidade.codigo_ibge);
    setBusca('');
    setCidades([]);
  };

  const handleLimpar = () => {
    onChange(null);
    setBusca('');
    setCidades([]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-black dark:text-white mb-1">
        Cidade do evento {required && <span className="text-red-500">*</span>}
      </label>

      {cidadeAtual && (
        <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-2">
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {cidadeAtual.nome} - {cidadeAtual.uf}
          </span>
          <button
            type="button"
            onClick={handleLimpar}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            × Remover
          </button>
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome da cidade..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          disabled={carregandoCidade}
        />

        {cidades.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-auto">
            {cidades.map((cidade) => (
              <li
                key={cidade.codigo_ibge}
                onClick={() => handleSelecionar(cidade)}
                className="px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900 cursor-pointer text-sm"
              >
                {cidade.nome} - {cidade.uf}
              </li>
            ))}
          </ul>
        )}
      </div>

      {carregandoCidade && (
        <p className="text-xs text-gray-500 mt-1">Carregando cidade...</p>
      )}
    </div>
  );
}
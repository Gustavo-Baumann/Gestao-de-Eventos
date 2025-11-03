import { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';

interface CidadeDisplayProps {
  cidade_id: number | null;
}

export default function CidadeDisplay({ cidade_id }: CidadeDisplayProps) {
  const [cidade, setCidade] = useState<{ nome: string; uf: string } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!cidade_id) {
      setCarregando(false);
      return;
    }

    supabase
      .from('municipios')
      .select('nome, estados!codigo_uf (uf)')
      .eq('codigo_ibge', cidade_id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.error('Erro ao carregar cidade:', error);
          setCidade(null);
        } else {
          const estado = data.estados as unknown as { uf: string } | null;
          setCidade({
            nome: data.nome,
            uf: estado?.uf || '',
          });
        }
        setCarregando(false);
      });
  }, [cidade_id]);

  if (carregando) return <span className="text-sm text-gray-500">Carregando...</span>;
  if (!cidade) return <span className="text-sm text-gray-600">Não informada</span>;

  return (
    <span className="text-sm text-gray-900">
      {cidade.nome} - {cidade.uf}
    </span>
  );
}
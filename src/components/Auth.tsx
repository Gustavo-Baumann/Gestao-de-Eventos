// src/pages/Cadastro.tsx
import { useState, useEffect } from 'react';
import { supabase } from "../supabase-client"

interface FormData {
  email: string;
  password: string;
  nome: string;
  numero_celular: string;
  data_nascimento: string;
  tipo_usuario: 'cliente' | 'organizador';
  cidade_id: number | null;
}

export default function Cadastro() {
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
    nome: '',
    numero_celular: '',
    data_nascimento: '',
    tipo_usuario: 'cliente',
    cidade_id: null,
  });

  const [cidades, setCidades] = useState<any[]>([]);
  const [buscaCidade, setBuscaCidade] = useState('');
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');

  const salvarDadosTemporarios = () => {
    localStorage.setItem('cadastro_pendente', JSON.stringify(form));
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (buscaCidade.length < 2) {
        setCidades([]);
        return;
      }

      supabase
        .from('municipios')
        .select('codigo_ibge, nome, estados!codigo_uf (uf)')
        .ilike('nome', `%${buscaCidade}%`)
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
  }, [buscaCidade]);

useEffect(() => {
  const channel = new BroadcastChannel('cadastro_channel');
  const EXECUTED_KEY = 'cadastro_executado';
  const EXECUTED_TIMESTAMP = 'cadastro_timestamp';

  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        const dadosSalvos = localStorage.getItem('cadastro_pendente');
        if (!dadosSalvos) return;

        const timestamp = Date.now();
        const ultimoExecutado = localStorage.getItem(EXECUTED_TIMESTAMP);

        if (ultimoExecutado && timestamp - parseInt(ultimoExecutado) < 5000) {
          window.close();
          return;
        }

        localStorage.setItem(EXECUTED_TIMESTAMP, timestamp.toString());
        channel.postMessage({ type: 'EXECUTANDO' });

        try {
          const dados = JSON.parse(dadosSalvos);
          const { error } = await supabase.from('usuarios').insert({
            id: session.user.id,
            nome: dados.nome,
            numero_celular: dados.numero_celular || null,
            tipo_usuario: dados.tipo_usuario,
            data_nascimento: dados.data_nascimento || null,
            cidade_id: dados.cidade_id,
            imagem_url: null,
          });

          if (error) throw error;

          localStorage.removeItem('cadastro_pendente');
          localStorage.setItem(EXECUTED_KEY, 'true');
          channel.postMessage({ type: 'SUCESSO' });
          window.location.href = '/dashboard';
          
        } catch (error: any) {
          localStorage.removeItem(EXECUTED_TIMESTAMP);
          alert('Erro ao salvar perfil: ' + error.message);
        }
      }
    }
  );

  channel.onmessage = (e) => {
    if (e.data.type === 'EXECUTANDO' || e.data.type === 'SUCESSO') {
      if (localStorage.getItem('cadastro_pendente')) {
        window.close();
      }
    }
  };

  return () => {
    authListener.subscription.unsubscribe();
    channel.close();
  };
}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin, 
        },
      });

      if (error) throw error;

      salvarDadosTemporarios();
      setAguardandoConfirmacao(true);
      setEmailEnviado(form.email);

    } catch (error: any) {
      alert(error.message);
    }
  };

  if (aguardandoConfirmacao) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Confirme seu email!</h2>
        <p>
          Enviamos um link de confirmação para: <strong>{emailEnviado}</strong>
        </p>
        <p>Clique no link para ativar sua conta.</p>
        <p>
          <small>
            Após confirmar, seu perfil será criado automaticamente.
          </small>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: 'auto', padding: '2rem' }}>
      <h2>Cadastro</h2>

      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />

      <input
        type="password"
        placeholder="Senha"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        minLength={6}
      />

      <input
        placeholder="Nome completo"
        value={form.nome}
        onChange={(e) => setForm({ ...form, nome: e.target.value })}
        required
      />

      <input
        placeholder="Número de Celular"
        value={form.numero_celular}
        onChange={(e) => setForm({ ...form, numero_celular: e.target.value })}
      />

      <input
        type="date"
        value={form.data_nascimento}
        onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
      />

      <select
        value={form.tipo_usuario}
        onChange={(e) => setForm({ ...form, tipo_usuario: e.target.value as any })}
      >
        <option value="cliente">Cliente</option>
        <option value="organizador">Organizador</option>
      </select>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Digite o nome da sua cidade"
          value={buscaCidade}
          onChange={(e) => setBuscaCidade(e.target.value)}
        />
        {buscaCidade && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #ccc',
              maxHeight: 200,
              overflow: 'auto',
              zIndex: 10,
            }}
          >
            {cidades.map((cidade) => (
              <div
                key={cidade.codigo_ibge}
                onClick={() => {
                  setForm({ ...form, cidade_id: cidade.codigo_ibge });
                  setBuscaCidade(`${cidade.nome} - ${cidade.uf}`);
                  setCidades([]);
                }}
                style={{
                  padding: 8,
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                }}
              >
                {cidade.nome} - {cidade.uf}
              </div>
            ))}
          </div>
        )}
      </div>

      {form.cidade_id && (
        <p>Cidade: {cidades.find(c => c.codigo_ibge === form.cidade_id)?.nome}</p>
      )}

      <button type="submit" style={{ marginTop: '1rem' }}>
        Cadastrar
      </button>
    </form>
  );
}
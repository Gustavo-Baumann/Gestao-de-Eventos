import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from "../supabase-client"
import { Eye, EyeOff } from 'lucide-react'

interface FormData {
  email: string;
  password: string;
  nome: string;
  numero_celular: string;
  data_nascimento: string;
  tipo_usuario: 'cliente' | 'organizador';
  cidade_id: number | null;
}

interface Cidade {
  codigo_ibge: number;
  nome: string;
  uf: string
}

export default function Cadastro() {
  const navigate = useNavigate()
  const supabase = getSupabaseClient()
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
    nome: '',
    numero_celular: '',
    data_nascimento: '',
    tipo_usuario: 'cliente',
    cidade_id: null,
  });

  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [buscaCidade, setBuscaCidade] = useState('');
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');
  const [erro,setErro] = useState<string | null>(null)
  const [erroDataNascimento, setErroDataNascimento] = useState<string | null>(null);
  const [dadosAnteriores, setDadosAnteriores] = useState<FormData | null>(null);
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
  const [erroSenhaConfirmacao, setErroSenhaConfirmacao] = useState<string | null>(null)
  const [nomeDisponivel, setNomeDisponivel] = useState<null | boolean>(null);
  const [checandoNome, setChecandoNome] = useState(false);

  const salvarDadosTemporarios = () => {
    localStorage.setItem('cadastro_pendente', JSON.stringify(form));
  };

  const verificarNomeDuplicado = async (nome: string): Promise<boolean> => {
    if (!nome.trim()) return false;

    const nomeNormalizado = nome.trim().toLowerCase().replace(/\s+/g, '_');

    const { data, error } = await supabase.rpc('verificar_nome_duplicado', {
      nome_input: nomeNormalizado
    });

    if (error) {
      console.error("Erro ao verificar duplicado:", error);
      return false; 
    }

    return data === true;
  };

  useEffect(() => {
    if (!form.nome.trim()) {
      setNomeDisponivel(null);
      return;
    }

    setChecandoNome(true);

    const delay = setTimeout(async () => {
      const existe = await verificarNomeDuplicado(form.nome);
      setNomeDisponivel(!existe);  
      setChecandoNome(false);
    }, 400); 

    return () => clearTimeout(delay);
  }, [form.nome]);

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
          setErro('Erro ao salvar perfil ' + error.message)
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
    setErro(null);
    setErroSenhaConfirmacao(null);

    const erroData = validarDataNascimento(form.data_nascimento);
    if (erroData) {
      setErroDataNascimento(erroData);
      return;
    }

    if (form.password !== confirmarSenha) {
      setErroSenhaConfirmacao('As senhas não coincidem.')
      return;
    }

    if (form.password.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return;
    }

    if (nomeDisponivel === false) {
      setErro('Já existe um usuário com esse nome. Escolha outro.');
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin, 
        },
      });

      if (error) throw error;

      setDadosAnteriores({ ...form });
      salvarDadosTemporarios();
      setAguardandoConfirmacao(true);
      setEmailEnviado(form.email);

    } catch (error: any) {
      setErro(error.message)
    }
  };

  if (aguardandoConfirmacao) {
    return (
      <div className="min-h-screen bg-neutral-200 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white border border-blue-200 rounded-xl p-8 shadow-sm text-center">
          <div className="mx-auto mb-6 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Confirme seu email!
          </h2>

          <p className="text-gray-700 mb-2">
            Enviamos um link de confirmação para:
          </p>

          <p className="font-medium text-purple-600 text-lg mb-4 break-all">
            {emailEnviado}
          </p>

          <p className="text-sm text-gray-600 mb-6">
            Clique no link para ativar sua conta. O link expira em 1 hora.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: emailEnviado,
                  });
                  if (error) throw error;
                  alert('Email reenviado com sucesso!');
                } catch (err: any) {
                  alert('Erro ao reenviar: ' + err.message);
                }
              }}
              className="w-full py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition"
              aria-label="Reenviar email de confirmação"
            >
              Reenviar email
            </button>

            <button
              type="button"
              onClick={() => {
                if (dadosAnteriores) setForm(dadosAnteriores);
                setAguardandoConfirmacao(false);
                setEmailEnviado('');
              }}
              className="text-blue-600 underline hover:text-blue-800 text-sm transition focus:outline-none focus:underline"
              aria-label="Voltar para editar os dados do cadastro"
            >
              Editar dados
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            Não recebeu? Verifique a pasta de spam ou lixo eletrônico.
          </p>
        </div>
      </div>
    </div>
    );
  }

  const validarDataNascimento = (data: string): string | null => {
  if (!data) return null; 

  const hoje = new Date();
  const dataNasc = new Date(data);

  if (isNaN(dataNasc.getTime())) {
    return 'Data inválida.';
  }

  if (dataNasc > hoje) {
    return 'Data de nascimento não pode ser no futuro.';
  }

  const dataMinima = new Date(hoje.getFullYear() - 120, hoje.getMonth(), hoje.getDate());
  if (dataNasc < dataMinima) {
    return 'Data muito antiga. Verifique o ano.';
  }

  const idadeMinima = 18;
  const dataMinIdade = new Date(hoje.getFullYear() - idadeMinima, hoje.getMonth(), hoje.getDate());
  if (dataNasc > dataMinIdade) {
    return `Você precisa ter pelo menos ${idadeMinima} anos.`;
  }

  return null;
};

  return (
    <div className="min-h-screen bg-neutral-200 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white border border-blue-200 rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            Cadastro
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-label="Formulário de cadastro">
            <div className="flex flex-col">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="seu@email.com"
                aria-label="Endereço de email"
                aria-required="true"
                autoComplete="email"
                className="max-w-md w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  aria-label="Senha de acesso"
                  aria-required="true"
                  autoComplete="new-password"
                  className="max-w-md w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="confirmar-senha" className="text-sm font-medium text-gray-700 mb-1">
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  id="confirmar-senha"
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  placeholder="Digite a senha novamente"
                  aria-label="Confirmação da senha"
                  aria-required="true"
                  autoComplete="new-password"
                  className="max-w-md w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={mostrarConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {erroSenhaConfirmacao && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {erroSenhaConfirmacao}
              </p>
            )}

            <div className="flex flex-col">
              <label htmlFor="nome" className="text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <input
                id="nome"
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                placeholder="Seu nome completo"
                aria-label="Nome completo"
                aria-required="true"
                autoComplete="name"
                className="max-w-md w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {form.nome.trim() !== "" && (
              <p className="mt-1 text-sm">
                {checandoNome && (
                  <span className="text-gray-600 italic">Verificando disponibilidade...</span>
                )}

                {!checandoNome && nomeDisponivel === true && (
                  <span className="text-green-600 font-medium">Nome disponível ✓</span>
                )}

                {!checandoNome && nomeDisponivel === false && (
                  <span className="text-red-600 font-medium">
                    Nome já está em uso ✗
                  </span>
                )}
              </p>
            )}

            <div className="flex flex-col">
              <label htmlFor="numero_celular" className="text-sm font-medium text-gray-700 mb-1">
                Número de celular - Opcional
              </label>
              <input
                id="celular"
                type="tel"
                value={form.numero_celular}
                onChange={(e) => setForm({ ...form, numero_celular: e.target.value })}
                placeholder="(00) 00000-0000"
                aria-label="Número de celular"
                className="max-w-md w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="data_nascimento" className="text-sm font-medium text-gray-700 mb-1">
                Data de nascimento
              </label>
              <input
                id="data_nascimento"
                type="date"
                value={form.data_nascimento}
                onChange={(e) => {
                  const novaData = e.target.value;
                  setForm({ ...form, data_nascimento: novaData });

                  const erro = validarDataNascimento(novaData);
                  setErroDataNascimento(erro);
                }}
                aria-label="Data de nascimento"
                aria-invalid={!!erroDataNascimento}
                aria-describedby={erroDataNascimento ? 'erro-data-nascimento' : undefined}
                autoComplete="bday"
                className="max-w-md w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {erroDataNascimento && (
              <p
                id="erro-data-nascimento"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {erroDataNascimento}
              </p>
            )}

            <div className="flex flex-col">
              <label htmlFor="tipo_usuario" className="text-sm font-medium text-gray-700 mb-1">
                Tipo de usuário (Escolha organizador apenas se você pretende postar seus próprios eventos)
              </label>
              <select
                id="tipo_usuario"
                value={form.tipo_usuario}
                onChange={(e) => setForm({ ...form, tipo_usuario: e.target.value as any })}
                aria-label="Tipo de usuário"
                className="max-w-md w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                <option value="cliente">Cliente</option>
                <option value="organizador">Organizador</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="busca_cidade" className="text-sm font-medium text-gray-700 mb-1">
                Informe a cidade de onde você quer receber eventos
              </label>
              <div className="relative">
                <input
                  id="busca_cidade"
                  type="text"
                  required
                  value={buscaCidade}
                  onChange={(e) => setBuscaCidade(e.target.value)}
                  placeholder="Digite o nome da sua cidade"
                  aria-label="Buscar cidade"
                  aria-autocomplete="list"
                  autoComplete="off"
                  className="max-w-md w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
                {cidades.length > 0 && (
                  <ul
                    role="listbox"
                    aria-label="Resultados de busca por cidade"
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
                  >
                    {cidades.map((cidade) => (
                      <li
                        key={cidade.codigo_ibge}
                        role="option"
                        aria-selected={form.cidade_id === cidade.codigo_ibge}
                        onClick={() => {
                          setForm({ ...form, cidade_id: cidade.codigo_ibge });
                          setBuscaCidade(`${cidade.nome} - ${cidade.uf}`);
                          setCidades([]);
                        }}
                        className="px-4 py-2 hover:bg-purple-50 cursor-pointer focus:bg-purple-100 focus:outline-none"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setForm({ ...form, cidade_id: cidade.codigo_ibge });
                            setBuscaCidade(`${cidade.nome} - ${cidade.uf}`);
                            setCidades([]);
                          }
                        }}
                      >
                        {cidade.nome} - {cidade.uf}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {form.cidade_id && !buscaCidade.includes('-') && (
                <p className="mt-2 text-sm text-gray-600">
                  Cidade selecionada: <strong>{cidades.find(c => c.codigo_ibge === form.cidade_id)?.nome}</strong>
                </p>
              )}
            </div>

            {erro && (
              <div
                role="alert"
                aria-live="assertive"
                className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3"
              >
                {erro}
              </div>
            )}

            <button
              type="submit"
              className="max-w-md w-full py-3 mt-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Cadastrar
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Já tem conta?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-600 underline cursor-pointer hover:text-blue-800 transition focus:outline-none focus:underline"
              aria-label="Ir para a página de login"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { XCircle, Loader2, Calendar, MapPin } from "lucide-react";
import Header from "./Header";
import Container from "./Container";
import { useUsuario } from "../context/UsuarioContext";

interface MinhaInscricao {
  id: number;
  status: "pendente" | "confirmada" | "expirada";
  created_at: string;
  eventos: {
    id: number;
    nome: string;
    banner_url: string | null;
    data_realizacao: string;
    cidade: string | null;
  };
}

const MinhasInscricoes = () => {
  const { supabase, userId, perfil, logout } = useUsuario();

  const [inscricoes, setInscricoes] = useState<MinhaInscricao[]>([]);
  const [municipiosMap, setMunicipiosMap] = useState<Record<string, { nome: string; uf: string }>>({});
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<Set<number>>(new Set());
  const [erro, setErro] = useState<string | null>(null);

  const buscarMunicipios = async (codigos: string[]) => {
  if (!supabase || codigos.length === 0) return;

  const { data: municipios } = await supabase
    .from("municipios")
    .select("codigo_ibge, nome, codigo_uf")
    .in("codigo_ibge", codigos);

  if (!municipios || municipios.length === 0) return;

  const ufsUnicas = [...new Set(municipios.map(m => m.codigo_uf))].filter(Boolean);

  const { data: estados } = await supabase
    .from("estados")
    .select("codigo_uf, uf")
    .in("codigo_uf", ufsUnicas);

  const ufMap = Object.fromEntries(
    (estados || []).map(e => [e.codigo_uf, e.uf])
  );

  const map = Object.fromEntries(
    municipios.map(m => [
      m.codigo_ibge,
      {
        nome: m.nome,
        uf: ufMap[m.codigo_uf] || "??"
      }
    ])
  );

  setMunicipiosMap(prev => ({ ...prev, ...map }));
};

  const buscarMinhasInscricoes = async () => {
    if (!supabase || !userId) {
      setErro("Usuário não autenticado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro(null);

    const { data, error } = await supabase
      .from("inscricoes")
      .select(`
        id,
        status,
        created_at,
        eventos!evento_id (
          id,
          nome,
          banner_url,
          data_realizacao,
          cidade,
          realizado
        )
      `)
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar inscrições:", error);
      setErro("Erro ao carregar suas inscrições.");
      setCarregando(false);
      return;
    }

    const formatadas = (data || [])
      .filter((item: any) => item.eventos && !item.eventos.realizado)
      .map((item: any) => ({
        id: item.id,
        status: item.status,
        created_at: item.created_at,
        eventos: {
          id: item.eventos.id,
          nome: item.eventos.nome,
          banner_url: item.eventos.banner_url,
          data_realizacao: item.eventos.data_realizacao,
          cidade: item.eventos.cidade,
        },
      }));

    setInscricoes(formatadas);

    const codigosUnicos = [
      ...new Set(formatadas.map((i: any) => i.eventos.cidade).filter(Boolean)),
    ] as string[];

    if (codigosUnicos.length > 0) {
      buscarMunicipios(codigosUnicos);
    }

    setCarregando(false);
  };

  useEffect(() => {
    buscarMinhasInscricoes();
  }, [userId, supabase]);

  const cancelarInscricao = async (inscricaoId: number) => {
    if (!confirm("Tem certeza que deseja cancelar esta inscrição?")) return;

    setProcessando(prev => new Set(prev).add(inscricaoId));

    const { error } = await supabase!
      .from("inscricoes")
      .delete()
      .eq("id", inscricaoId);

    if (!error) {
      setInscricoes(prev => prev.filter(i => i.id !== inscricaoId));
    } else {
      alert("Erro ao cancelar inscrição. Tente novamente.");
    }

    setProcessando(prev => {
      const novo = new Set(prev);
      novo.delete(inscricaoId);
      return novo;
    });
  };

  const formatarData = (data: string) => {
    return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const obterLocalizacao = (codigoIbge: string | null) => {
    if (!codigoIbge) return null;
    const municipio = municipiosMap[codigoIbge];
    if (!municipio) return "Carregando...";
    return `${municipio.nome}, ${municipio.uf}`;
  };

  if (perfil?.tipo_usuario === 'organizador') {
    return (
        <Container>
        <Header titulo="Minhas Inscrições" />

        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
            <div className="w-full max-w-lg">
            <div className="bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-700 rounded-xl p-8 shadow-sm">
                <div className="flex justify-center mb-6">
                <div
                    className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center"
                    aria-hidden="true"
                >
                    <svg
                    className="w-10 h-10 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                    </svg>
                </div>
                </div>

                <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 text-center mb-3">
                Acesso restrito
                </h1>

                <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
                Contas do tipo <span className="font-medium text-purple-600 dark:text-purple-400">organizador</span> não podem se inscrever em eventos.
                </p>

                <div
                role="status"
                aria-live="polite"
                className="text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-6 text-center"
                >
                Use uma conta do tipo <strong>cliente</strong> para visualizar e gerenciar suas inscrições.
                </div>

                <button
                onClick={() => {
                    logout();
                }}
                className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 transition duration-200"
                aria-label="Fazer login como cliente"
                >
                Fazer login como cliente
                </button>
            </div>
            </div>
        </div>
        </Container>
    );
    }

  if (carregando) {
    return (
      <Container>
        <Header titulo="Minhas Inscrições" />
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header titulo="Minhas Inscrições" />

      <div className="flex justify-center">
        <div className="w-full max-w-4xl space-y-6">

          {erro && (
            <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-center">
              {erro}
            </div>
          )}

          {inscricoes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Você não tem inscrições em eventos futuros no momento.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Eventos realizados ou expirados não aparecem aqui.
              </p>
            </div>
          ) : (
            <ul className="space-y-6">
              {inscricoes.map((inscricao) => {
                const estaProcessando = processando.has(inscricao.id);
                const evento = inscricao.eventos;
                const localizacao = obterLocalizacao(evento.cidade);

                return (
                  <li
                    key={inscricao.id}
                    className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-gray-200 dark:border-neutral-700 overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-64 h-48 md:h-auto relative overflow-hidden">
                        {evento.banner_url ? (
                          <img
                            src={evento.banner_url}
                            alt={`Banner do evento ${evento.nome}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-white opacity-50" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-6">
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                              {evento.nome}
                            </h3>

                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                              <p className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatarData(evento.data_realizacao)}
                              </p>
                              {localizacao && (
                                <p className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {localizacao}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                              <span className="text-sm font-medium">Status:</span>
                              <span
                                className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${
                                  inscricao.status === "confirmada"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : inscricao.status === "pendente"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                              >
                                {inscricao.status.charAt(0).toUpperCase() + inscricao.status.slice(1)}
                              </span>
                            </div>
                          </div>

                          {inscricao.status !== "expirada" && (
                            <div className="mt-6">
                              <button
                                onClick={() => cancelarInscricao(inscricao.id)}
                                disabled={estaProcessando}
                                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition text-sm font-medium flex items-center gap-2"
                              >
                                {estaProcessando ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Cancelar Inscrição
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Container>
  );
};

export default MinhasInscricoes;
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, XCircle, Trash2, Loader2, User } from "lucide-react";
import Header from "./Header";
import { useUsuario } from "../context/UsuarioContext";
import Container from "./Container";

interface Inscricao {
  id: number;
  created_at: string;
  status: "pendente" | "confirmada" | "expirada";
  usuario: {
    id: string;
    nome: string;
    imagem_url: string | null;
  };
}

const Inscricoes = () => {
  const { id: eventoId } = useParams<{ id: string }>();
  const { supabase } = useUsuario();

  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<Set<number>>(new Set());
  const [erro, setErro] = useState<string | null>(null);

  const eventoIdNum = Number(eventoId);

  const buscarInscricoes = async () => {
    if (!supabase || !eventoId || isNaN(eventoIdNum)) {
      setErro("Evento não encontrado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro(null);

    const { data, error } = await supabase
      .from("inscricoes")
      .select(`
        id,
        created_at,
        status,
        usuarios!usuario_id (
          id,
          nome,
          imagem_url
        )
      `)
      .eq("evento_id", eventoIdNum)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar inscrições:", error);
      setErro("Erro ao carregar inscrições.");
    } else {
      const formatadas = (data || []).map((item: any) => ({
        id: item.id,
        created_at: item.created_at,
        status: item.status,
        usuario: {
          id: item.usuarios.id,
          nome: item.usuarios.nome,
          imagem_url: item.usuarios.imagem_url,
        },
      }));
      setInscricoes(formatadas);
    }
    setCarregando(false);
  };

  useEffect(() => {
    buscarInscricoes();
  }, [eventoId, supabase]);

  const confirmarInscricao = async (inscricaoId: number) => {
    setProcessando(prev => new Set(prev).add(inscricaoId));
    const { error } = await supabase
      .from("inscricoes")
      .update({ status: "confirmada" })
      .eq("id", inscricaoId);

    if (!error) {
      setInscricoes(prev =>
        prev.map(i => (i.id === inscricaoId ? { ...i, status: "confirmada" } : i))
      );
    } else {
      alert("Erro ao confirmar inscrição.");
    }
    setProcessando(prev => {
      const novo = new Set(prev);
      novo.delete(inscricaoId);
      return novo;
    });
  };

  const deletarInscricao = async (inscricaoId: number) => {
    if (!confirm("Tem certeza que deseja remover esta inscrição?")) return;

    setProcessando(prev => new Set(prev).add(inscricaoId));
    const { error } = await supabase
      .from("inscricoes")
      .delete()
      .eq("id", inscricaoId);

    if (!error) {
      setInscricoes(prev => prev.filter(i => i.id !== inscricaoId));
    } else {
      alert("Erro ao remover inscrição.");
    }
    setProcessando(prev => {
      const novo = new Set(prev);
      novo.delete(inscricaoId);
      return novo;
    });
  };

  const formatarData = (data: string) => {
    return format(new Date(data), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-800 text-black dark:text-white pt-20 md:pt-20 p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <Container>
      <Header titulo="Gerenciar Inscrições" />

      <div className="flex justify-center">
        <div className="w-full max-w-4xl space-y-6">
          {erro && (
            <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-center">
              {erro}
            </div>
          )}

          {!carregando && inscricoes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Nenhuma inscrição encontrada para este evento.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {inscricoes.map((inscricao) => {
                const estaProcessando = processando.has(inscricao.id);
                const imagemUrl = inscricao.usuario.imagem_url;

                return (
                  <li
                    key={inscricao.id}
                    className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-gray-200 dark:border-neutral-700 overflow-hidden"
                  >
                    <div className="p-5 md:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-6 flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {imagemUrl ? (
                              <img
                                src={imagemUrl}
                                alt={`Foto de ${inscricao.usuario.nome}`}
                                className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 dark:border-purple-800"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {inscricao.usuario.nome}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Inscrito em {formatarData(inscricao.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="md:col-span-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
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

                          <div className="flex gap-2">
                            {inscricao.status === "confirmada" ? (
                              <button
                                onClick={() => deletarInscricao(inscricao.id)}
                                disabled={estaProcessando}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition text-sm font-medium flex items-center gap-2"
                                aria-label="Remover inscrição confirmada"
                              >
                                {estaProcessando ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                Remover
                              </button>
                            ) : (
                              <>
                                {(inscricao.status === "pendente" || inscricao.status === "expirada") && (
                                  <button
                                    onClick={() => confirmarInscricao(inscricao.id)}
                                    disabled={estaProcessando}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition text-sm font-medium flex items-center gap-2"
                                    aria-label="Confirmar inscrição"
                                  >
                                    {estaProcessando ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                    Confirmar
                                  </button>
                                )}
                                <button
                                  onClick={() => deletarInscricao(inscricao.id)}
                                  disabled={estaProcessando}
                                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition text-sm font-medium flex items-center gap-2"
                                  aria-progress="Remover inscrição"
                                >
                                  {estaProcessando ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                  Cancelar
                                </button>
                              </>
                            )}
                          </div>
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

export default Inscricoes;
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Calendar, MapPin, Star, Trash2, Send } from "lucide-react";
import Header from "./Header";
import Container from "./Container";
import { useUsuario } from "../context/UsuarioContext";

interface InscricaoComEvento {
  id: number;
  evento_id: number;
  eventos: {
    id: number;
    nome: string;
    banner_url: string | null;
    data_realizacao: string;
    cidade: string | null;
  };
}

interface ReviewExistente {
  id: number;
  nota: number;
  comentario: string;
}

const Reviews = () => {
  const { supabase, userId, perfil, logout } = useUsuario();

  const [itens, setItens] = useState<(InscricaoComEvento & { review?: ReviewExistente; carregandoReview?: boolean })[]>([]);
  const [municipiosMap, setMunicipiosMap] = useState<Record<string, { nome: string; uf: string }>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<Set<number>>(new Set());
  const [estrelasHover, setEstrelasHover] = useState<Record<number, number>>({});
  const [estrelasSelecionadas, setEstrelasSelecionadas] = useState<Record<number, number>>({});
  const [comentarios, setComentarios] = useState<Record<number, string>>({});

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

  const buscarInscricoesParaReview = async () => {
    if (!supabase || !userId) {
      setErro("Usuário não autenticado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const { data: inscricoes } = await supabase
        .from("inscricoes")
        .select("id, evento_id")
        .eq("usuario_id", userId)
        .eq("status", "confirmada");

      if (!inscricoes || inscricoes.length === 0) {
        setItens([]);
        setCarregando(false);
        return;
      }

      const eventoIds = inscricoes.map(i => i.evento_id);

      const { data: eventos } = await supabase
        .from("eventos")
        .select("id, nome, banner_url, data_realizacao, cidade, realizado")
        .in("id", eventoIds)
        .eq("realizado", true);

      const itensFinais: (InscricaoComEvento & { review?: ReviewExistente })[] = [];
      const codigosIbge: string[] = [];

      eventos?.forEach(evento => {
        const inscricao = inscricoes.find(i => i.evento_id === evento.id);
        if (inscricao && evento.cidade) {
          itensFinais.push({
            id: inscricao.id,
            evento_id: evento.id,
            eventos: {
              id: evento.id,
              nome: evento.nome,
              banner_url: evento.banner_url,
              data_realizacao: evento.data_realizacao,
              cidade: evento.cidade,
            }
          });
          if (!codigosIbge.includes(evento.cidade)) {
            codigosIbge.push(evento.cidade);
          }
        }
      });

      if (codigosIbge.length > 0) {
        await buscarMunicipios(codigosIbge);
      }

      const inscricaoIds = itensFinais.map(i => i.id);
      let reviewsMap: Record<number, ReviewExistente> = {};

      if (inscricaoIds.length > 0) {
        const { data: reviews } = await supabase
          .from("reviews")
          .select("id, id_inscricao, id_evento, id_usuario, nota, comentario")
          .in("id_inscricao", inscricaoIds);

        if (reviews) {
          reviews.forEach(r => {
            reviewsMap[r.id_inscricao] = { id: r.id, nota: r.nota, comentario: r.comentario };
            setEstrelasSelecionadas(prev => ({ ...prev, [r.id_inscricao]: r.nota }));
            setComentarios(prev => ({ ...prev, [r.id_inscricao]: r.comentario }));
          });
        }
      }

      setItens(itensFinais.map(i => ({
        ...i, review: reviewsMap[i.id]
      })));

    } catch (err: any) {
      console.error("Erro completo:", err);
      setErro("Erro ao carregar eventos para avaliação.");
    }

    setCarregando(false);
  };

  useEffect(() => {
    buscarInscricoesParaReview();
  }, [userId, supabase]);

  const enviarOuAtualizarReview = async (inscricaoId: number, eventoId: number) => {
    const nota = estrelasSelecionadas[inscricaoId];
    const comentario = comentarios[inscricaoId] || "";

    if (!nota || nota < 1 || nota > 5) {
      alert("Por favor, selecione de 1 a 5 estrelas.");
      return;
    }

    setEnviando(prev => new Set(prev).add(inscricaoId));

    const reviewExistente = itens.find(i => i.id === inscricaoId)?.review;

    const payload = {
      id_inscricao: inscricaoId,
      id_usuario: userId,
      id_evento: eventoId,
      nota,
      comentario
    };

    console.log("Payload sendo enviado:", payload);

    let error;
    if (!reviewExistente) {
        ({ error } = await supabase
        .from("reviews")
        .insert(payload));
    } else {
      ({ error } = await supabase
        .from("reviews")
        .update(payload)
        .eq("id", reviewExistente.id));
    }

    if (!error) {
      setItens(prev => prev.map(item =>
        item.id === inscricaoId
          ? { ...item, review: { ...reviewExistente, nota, comentario } as ReviewExistente }
          : item
      ));
      alert(reviewExistente ? "Review atualizada com sucesso!" : "Obrigado pela sua review!");
    } else {
      console.error("Erro detalhado do Supabase:", error);
      alert("Erro ao salvar review. Veja o console para detalhes.");
    }

    setEnviando(prev => {
      const novo = new Set(prev);
      novo.delete(inscricaoId);
      return novo;
    });
  };

  const deletarReview = async (inscricaoId: number, reviewId: number) => {
    if (!confirm("Tem certeza que deseja excluir sua review?")) return;

    setEnviando(prev => new Set(prev).add(inscricaoId));

    const { error } = await supabase!
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (!error) {
      setItens(prev => prev.map(item =>
        item.id === inscricaoId ? { ...item, review: undefined } : item
      ));
      setEstrelasSelecionadas(prev => { const p = { ...prev }; delete p[inscricaoId]; return p; });
      setComentarios(prev => { const p = { ...prev }; delete p[inscricaoId]; return p; });
      alert("Review removida com sucesso.");
    } else {
      alert("Erro ao remover review.");
    }

    setEnviando(prev => {
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
        <Header titulo="Minhas Reviews" />
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <div className="w-full max-w-lg">
            <div className="bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-700 rounded-xl p-8 shadow-sm">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 text-center mb-3">
                Acesso restrito
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
                Contas do tipo <span className="font-medium text-purple-600 dark:text-purple-400">organizador</span> não podem deixar reviews.
              </p>
              <div role="status" aria-live="polite" className="text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-6 text-center">
                Use uma conta do tipo <strong>cliente</strong> para avaliar eventos.
              </div>
              <button
                onClick={logout}
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
        <Header titulo="Minhas Reviews" />
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header titulo="Minhas Reviews" />

      <div className="flex justify-center">
        <div className="w-full max-w-4xl space-y-6">

          {erro && (
            <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-center">
              {erro}
            </div>
          )}

          {itens.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Você ainda não participou de nenhum evento realizado ou não há eventos para avaliar no momento.
              </p>
            </div>
          ) : (
            <ul className="space-y-6">
              {itens.map((item) => {
                const inscricaoId = item.id;
                const evento = item.eventos;
                const review = item.review;
                const estaEnviando = enviando.has(inscricaoId);
                const notaAtual = estrelasHover[inscricaoId] || estrelasSelecionadas[inscricaoId] || 0;

                return (
                  <li key={inscricaoId} className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-gray-200 dark:border-neutral-700 overflow-hidden">
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
                              {obterLocalizacao(evento.cidade) && (
                                <p className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {obterLocalizacao(evento.cidade)}
                                </p>
                              )}
                            </div>

                            <div className="mt-6">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Sua avaliação <span className="text-red-500">*</span>
                              </label>
                              <div
                                className="flex gap-2"
                                role="radiogroup"
                                aria-label="Avaliação por estrelas"
                              >
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    disabled={estaEnviando}
                                    onMouseEnter={() => setEstrelasHover(prev => ({ ...prev, [inscricaoId]: star }))}
                                    onMouseLeave={() => setEstrelasHover(prev => { const p = { ...prev }; delete p[inscricaoId]; return p; })}
                                    onClick={() => setEstrelasSelecionadas(prev => ({ ...prev, [inscricaoId]: star }))}
                                    aria-label={`Dar ${star} estrela${star > 1 ? 's' : ''}`}
                                    aria-pressed={notaAtual >= star}
                                    className="focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                                  >
                                    <Star
                                      className={`w-10 h-10 transition-all ${notaAtual >= star
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300 dark:text-gray-600"
                                        } hover:text-yellow-400 hover:fill-yellow-400`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mt-5">
                              <label htmlFor={`comentario-${inscricaoId}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Seu comentário (opcional)
                              </label>
                              <textarea
                                id={`comentario-${inscricaoId}`}
                                rows={3}
                                value={comentarios[inscricaoId] || ""}
                                onChange={(e) => setComentarios(prev => ({ ...prev, [inscricaoId]: e.target.value }))}
                                disabled={estaEnviando}
                                placeholder="Conte como foi sua experiência..."
                                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                                aria-label="Comentário da review"
                              />
                            </div>
                          </div>

                          <div className="mt-6 flex gap-3 flex-wrap">
                            <button
                              onClick={() => enviarOuAtualizarReview(inscricaoId, evento.id)}
                              disabled={estaEnviando || !estrelasSelecionadas[inscricaoId]}
                              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition flex items-center gap-2 font-medium"
                              aria-label={review ? "Atualizar review" : "Enviar review"}
                            >
                              {estaEnviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              {review ? "Atualizar Review" : "Enviar Review"}
                            </button>

                            {review && (
                              <button
                                onClick={() => deletarReview(inscricaoId, review.id)}
                                disabled={estaEnviando}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition flex items-center gap-2 font-medium"
                                aria-label="Excluir review"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir Review
                              </button>
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

export default Reviews;
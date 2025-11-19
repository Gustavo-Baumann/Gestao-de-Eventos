import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Header from "./Header";
import Container from "./Container";
import { useUsuario } from "../context/UsuarioContext";

interface EventoPendente {
  id: number;
  nome: string;
  banner_url: string | null;
  criado_em: string;
  criador_nome: string;
  criador_imagem_url: string | null;
}

const AprovarEvento = () => {
  const { supabase, logout } = useUsuario();
  const navigate = useNavigate();

  const [eventosPendentes, setEventosPendentes] = useState<EventoPendente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<Set<number>>(new Set());
  const [isAdmin, setIsAdmin] = useState<null | boolean>(null);

  useEffect(() => {
    if (!supabase) return;

    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(session?.user?.app_metadata?.role === 'admin');
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAdmin(session?.user?.app_metadata?.role === 'admin');
    });

    return () => subscription.unsubscribe();
  }, [supabase]);


  const buscarEventosPendentes = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("eventos")
      .select(`
        id,
        nome,
        banner_url,
        realizado,
        criado_em:created_at,
        usuarios!id_criador (
          nome,
          imagem_url
        )
      `)
      .neq('aprovado', true)
      .eq('realizado', false)     
      .neq('deletado', true)      
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar eventos pendentes:", error);
      setEventosPendentes([]);
    } else {
      const formatados: EventoPendente[] = (data || []).map((item: any) => ({
        id: item.id,
        nome: item.nome,
        banner_url: item.banner_url,
        criado_em: item.criado_em,
        criador_nome: Array.isArray(item.usuarios) ? item.usuarios[0]?.nome || 'Desconhecido' : item.usuarios?.nome || 'Desconhecido',
        criador_imagem_url: Array.isArray(item.usuarios) ? item.usuarios[0]?.imagem_url : item.usuarios?.imagem_url,
      }));

      setEventosPendentes(formatados);
    }
    setCarregando(false);
  };

  useEffect(() => {
    if (isAdmin === true) {
      buscarEventosPendentes();
    } else if (isAdmin === false) {
      setCarregando(false);
    }
  }, [isAdmin]);

  const aprovarEvento = async (eventoId: number) => {
    setProcessando(prev => new Set(prev).add(eventoId));

    const { error } = await supabase!
      .from("eventos")
      .update({ aprovado: true })
      .eq("id", eventoId);

    if (!error) {
      setEventosPendentes(prev => prev.filter(e => e.id !== eventoId));
    } else {
      alert("Erro ao aprovar evento.");
    }

    setProcessando(prev => {
      const novo = new Set(prev);
      novo.delete(eventoId);
      return novo;
    });
  };

  const rejeitarEvento = async (eventoId: number) => {
    if (!confirm("Tem certeza que deseja REJEITAR e EXCLUIR permanentemente este evento?")) return;

    setProcessando(prev => new Set(prev).add(eventoId));

    const { error } = await supabase!
      .from("eventos")
      .delete()
      .eq("id", eventoId);

    if (!error) {
      setEventosPendentes(prev => prev.filter(e => e.id !== eventoId));
    } else {
      alert("Erro ao rejeitar evento.");
    }

    setProcessando(prev => {
      const novo = new Set(prev);
      novo.delete(eventoId);
      return novo;
    });
  };

  if (isAdmin === false) {
    return (
      <Container>
        <Header titulo="Aprovar Eventos" />
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

              <h1 className="text-2xl font-semibold text-center mb-3">
                Acesso restrito
              </h1>
              <p className="text-sm text-center mb-6">
                Esta página é exclusiva para <strong className="text-purple-600 dark:text-purple-400">administradores</strong>.
              </p>
              <div className="text-sm bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-6 text-center">
                Faça login com uma conta de administrador.
              </div>
              <button onClick={logout} className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Fazer login novamente
              </button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (carregando || isAdmin === null) {
    return (
      <Container>
        <Header titulo="Aprovar Eventos" />
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header titulo="Aprovar Eventos" />

      <div className="flex justify-center py-8">
        <div className="w-full max-w-5xl">

          {eventosPendentes.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-neutral-800 rounded-2xl border">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Não há eventos pendentes de aprovação.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {eventosPendentes.map((evento) => {
                const processandoEste = processando.has(evento.id);

                return (
                  <article
                  key={evento.id}
                  className="bg-white dark:bg-neutral-700 rounded-2xl shadow-lg overflow-hidden border border-gray-300 dark:border-neutral-600"
                >
                  <div className="h-48 bg-gray-200 dark:bg-neutral-600 relative">
                    {evento.banner_url ? (
                      <img
                        src={evento.banner_url}
                        alt={`Banner do evento ${evento.nome}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <div className={`absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 ${evento.banner_url ? 'hidden' : ''}`}>
                      Sem banner
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-32 h-32 -mt-16 ml-6 flex-shrink-0 relative">
                      <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-lg bg-gray-200 dark:bg-neutral-600">
                        {evento.criador_imagem_url ? (
                          <img
                            src={evento.criador_imagem_url}
                            alt={`Foto de ${evento.criador_nome}`}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center text-5xl font-bold text-gray-400 dark:text-gray-500 ${evento.criador_imagem_url ? 'hidden' : ''}`}>
                          {evento.criador_nome?.[0]?.toUpperCase() || '?'}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-6 pt-4">
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {evento.criador_nome}
                      </p>
                      <h3 className="text-xl font-bold text-black dark:text-white mb-4">
                        {evento.nome}
                      </h3>

                      <button
                        onClick={() => navigate(`/evento/${evento.id}`)}
                        className="mb-6 inline-block px-5 py-3 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition text-base font-medium border border-purple-300 dark:border-purple-700"
                      >
                        Detalhes do evento
                      </button>

                      <div className="flex gap-4">
                        <button
                          onClick={() => aprovarEvento(evento.id)}
                          disabled={processandoEste}
                          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 font-medium transition"
                        >
                          {processandoEste ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                          Aprovar
                        </button>

                        <button
                          onClick={() => rejeitarEvento(evento.id)}
                          disabled={processandoEste}
                          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 font-medium transition"
                        >
                          {processandoEste ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default AprovarEvento;
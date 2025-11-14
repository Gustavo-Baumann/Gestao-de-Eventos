import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, X, Trash2, Upload, Loader2, Search } from "lucide-react";
import { useUsuario } from "../context/UsuarioContext";
import Header from "./Header";
import CampoEditavel from "./CampoEditavel";

export interface EventoData {
  id: number;
  nome: string;
  descricao: string | null;
  cidade: string | null;
  numero_vagas: number | null;
  gratuito: boolean;
  realizado: boolean;
  data_realizacao: string;
  data_encerramento: string;
  banner_url: string | null;
  imagens_url: string[];
  id_criador: string;
}

interface Criador {
  id: string;
  nome: string;
}

interface Municipio {
  codigo_ibge: string;
  nome: string;
  uf: string;
}

const Evento = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { perfil, userId, supabase } = useUsuario();

  const [evento, setEvento] = useState<EventoData | null>(null);
  const [criador, setCriador] = useState<Criador | null>(null);
  const [cidadeAtual, setCidadeAtual] = useState<Municipio | null>(null);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [buscaCidade, setBuscaCidade] = useState("");
  const [editandoCidade, setEditandoCidade] = useState(false);
  const [mostrarSugestoes, setShowSugestoes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isDono = userId === evento?.id_criador;
  const podeSeInscrever =
    perfil?.tipo_usuario === "cliente" && evento && !evento.realizado;

  useEffect(() => {
    const fetchEvento = async () => {
      if (!supabase || !id) return;

      try {
        setLoading(true);

        const { data: eventoData, error: eventoError } = await supabase
          .from("eventos")
          .select(
            `
            id, nome, descricao, cidade, numero_vagas, gratuito, realizado,
            data_realizacao, data_encerramento, banner_url, imagens_url, id_criador
            `
          )
          .eq("id", id)
          .single();

        if (eventoError) throw eventoError;
        if (!eventoData) throw new Error("Evento não encontrado");

        const { data: criadorData, error: criadorError } = await supabase
          .from("usuarios")
          .select("id, nome")
          .eq("id", eventoData.id_criador)
          .single();

        if (criadorError) throw criadorError;

        setEvento(eventoData);
        setCriador(criadorData);

        if (eventoData.cidade) {
          const { data: cidadeData, error: cidadeError } = await supabase
            .from("municipios")
            .select("codigo_ibge, nome, codigo_uf")
            .eq("codigo_ibge", eventoData.cidade)
            .single();

          if (!cidadeError && cidadeData) {
            const { data: ufData } = await supabase
              .from("estados")
              .select("uf")
              .eq("codigo_uf", cidadeData.codigo_uf)
              .single();

            const municipio: Municipio = {
              codigo_ibge: cidadeData.codigo_ibge,
              nome: cidadeData.nome,
              uf: ufData?.uf || "",
            };
            setCidadeAtual(municipio);
          }
        }
      } catch (err: any) {
        setError(err.message || "Erro ao carregar evento");
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [id, supabase]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!buscaCidade.trim() || !supabase) return;

      const { data, error } = await supabase
        .from("municipios")
        .select("codigo_ibge, nome, codigo_uf")
        .ilike("nome", `%${buscaCidade}%`)
        .limit(10);

      if (!error && data) {
        const resultados = await Promise.all(
          data.map(async (mun) => {
            const { data: ufData } = await supabase
              .from("estados")
              .select("uf")
              .eq("codigo_uf", mun.codigo_uf)
              .single();
            return {
              codigo_ibge: mun.codigo_ibge,
              nome: mun.nome,
              uf: ufData?.uf || "",
            };
          })
        );
        setMunicipios(resultados);
        setShowSugestoes(true);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [buscaCidade, supabase]);

  const handleInscricao = async () => {
    console.log("Inscrição solicitada");
  };

  const handleSalvarCampo = async (campo: keyof EventoData, novoValor: string) => {
    if (!supabase || !evento) return;
    const { error } = await supabase
      .from("eventos")
      .update({ [campo]: novoValor })
      .eq("id", evento.id);
    if (error) throw error;
    setEvento((prev) => prev ? { ...prev, [campo]: novoValor } : null);
  };

  const handleIniciarEdicaoCidade = () => {
    setEditandoCidade(true);
    setBuscaCidade("");
    setShowSugestoes(false);
  };

  const handleCancelarEdicaoCidade = () => {
    setEditandoCidade(false);
    setBuscaCidade("");
    setShowSugestoes(false);
  };

  const handleSelecionarCidade = async (municipio: Municipio) => {
    if (!supabase || !evento) return;
    try {
      const { error } = await supabase
        .from("eventos")
        .update({ cidade: municipio.codigo_ibge })
        .eq("id", evento.id);
      if (error) throw error;

      setEvento((prev) => prev ? { ...prev, cidade: municipio.codigo_ibge } : null);
      setCidadeAtual(municipio);
      setEditandoCidade(false);
      setBuscaCidade("");
      setShowSugestoes(false);
    } catch (err: any) {
      alert("Erro ao salvar cidade: " + err.message);
    }
  };

  const handleModalDelete = () => setShowDeleteModal(true);
  const handleCancelarDelete = () => setShowDeleteModal(false);

  const handleConfirmarDelete = async () => {
    if (!supabase || !evento) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("eventos").delete().eq("id", evento.id);
      if (error) throw error;
      navigate("/eventos");
    } catch (err: any) {
      alert("Erro ao deletar evento: " + err.message);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !evento) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${evento.id}/banner.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("imagens_banner")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("imagens_banner")
        .getPublicUrl(fileName);
      const novaBannerUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("eventos")
        .update({ banner_url: novaBannerUrl })
        .eq("id", evento.id);
      if (updateError) throw updateError;

      setEvento((prev) => prev ? { ...prev, banner_url: novaBannerUrl } : null);
    } catch (err: any) {
      alert("Erro ao fazer upload do banner: " + (err.message || "Tente novamente."));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !evento) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      if (!fileExt) throw new Error("Arquivo inválido");
      const filePath = `${evento.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("imagens_evento")
        .upload(filePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("imagens_evento")
        .getPublicUrl(filePath);
      const novaImagemUrl = urlData.publicUrl;

      const novasImagens = [...(evento.imagens_url || []), novaImagemUrl];
      const { error: updateError } = await supabase
        .from("eventos")
        .update({ imagens_url: novasImagens })
        .eq("id", evento.id);
      if (updateError) throw updateError;

      setEvento((prev) => prev ? { ...prev, imagens_url: novasImagens } : null);
    } catch (err: any) {
      alert("Erro: " + (err.message?.includes("security") ? "Permissão negada" : err.message));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeletarImagem = async (url: string) => {
    if (!supabase || !evento) return;
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.split("/storage/v1/object/public/imagens_evento/")[1];
      if (!path) throw new Error("URL inválida");

      const { error: deleteError } = await supabase.storage
        .from("imagens_evento")
        .remove([path]);
      if (deleteError) throw deleteError;

      const novasImagens = evento.imagens_url.filter((img) => img !== url);
      const { error: updateError } = await supabase
        .from("eventos")
        .update({ imagens_url: novasImagens })
        .eq("id", evento.id);
      if (updateError) throw updateError;

      setEvento((prev) => prev ? { ...prev, imagens_url: novasImagens } : null);
    } catch (err: any) {
      alert("Erro ao deletar imagem: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-800 text-black dark:text-white pt-20 md:pt-20 p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !evento || !criador) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-800 text-black dark:text-white pt-20 md:pt-20 p-4">
        <Header titulo="Visualização do Evento" />
        <p className="text-red-600 text-center">{error || "Evento não encontrado"}</p>
      </div>
    );
  }

  const formatarData = (data: string) =>
    new Date(data).toLocaleString("pt-BR", {
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const vagasTexto = evento.numero_vagas
    ? `0/${evento.numero_vagas}`
    : "Sem limite de vagas";

  return (
  <div className="min-h-screen bg-white dark:bg-neutral-800 text-black dark:text-white pt-20 md:pt-20 p-4">
    <Header titulo="Visualização do Evento" />

    <div className="max-w-3xl mx-auto space-y-0">
      <div className="bg-gray-50 dark:bg-neutral-700 rounded-t-xl overflow-hidden">
        {evento.banner_url ? (
          <div className="relative h-64">
            <img
              src={`${evento.banner_url}`}
              alt={`Banner do evento ${evento.nome}`}
              className="w-full h-full object-cover"
            />
            {isDono && (
              <button
                onClick={() => document.getElementById("banner-upload")?.click()}
                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition flex items-center gap-1"
                aria-label="Alterar banner"
              >
                <Pencil className="w-4 h-4" />
                <span className="text-xs">Alterar</span>
              </button>
            )}
            <input
              id="banner-upload"
              type="file"
              accept="image/*"
              hidden
              onChange={handleUploadBanner}
            />
          </div>
        ) : (
          <div className="h-64 bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center gap-3">
            <Upload className="w-10 h-10 text-gray-500" />
            <p className="text-gray-500 text-sm">Nenhum banner</p>
            {isDono && (
              <label className="cursor-pointer px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition">
                Adicionar banner
                <input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleUploadBanner}
                />
              </label>
            )}
          </div>
        )}

        {evento.realizado && (
          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-600 p-4">
            <p className="text-red-700 dark:text-red-300 font-medium" role="alert">
              Este evento já foi realizado.
            </p>
          </div>
        )}

        <div className="p-6 space-y-4">
          <CampoEditavel
            label="Nome do evento"
            valor={evento.nome}
            campo="nome"
            onSalvar={(v) => handleSalvarCampo("nome", v)}
            disabled={!isDono || evento.realizado} 
          />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Criador</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{criador.nome}</p>
            </div>
          </div>

          <CampoEditavel
            label="Data de realização"
            valor={formatarData(evento.data_realizacao)}
            campo="data_realizacao"
            tipo="datetime-local"
            onSalvar={(v) => handleSalvarCampo("data_realizacao", v)}
            disabled={!isDono || evento.realizado}
          />

          <CampoEditavel
            label="Data de encerramento"
            valor={formatarData(evento.data_encerramento)}
            campo="data_encerramento"
            tipo="datetime-local"
            onSalvar={(v) => handleSalvarCampo("data_encerramento", v)}
            disabled={!isDono || evento.realizado}
          />

          <CampoEditavel
            label="Descrição"
            valor={evento.descricao || ""}
            campo="descricao"
            onSalvar={(v) => handleSalvarCampo("descricao", v)}
            disabled={!isDono || evento.realizado}
          />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cidade</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {cidadeAtual
                  ? `${cidadeAtual.nome} - ${cidadeAtual.uf || "UF não informada"}`
                  : "Não informada"}
              </p>
            </div>

            {isDono && !evento.realizado && !editandoCidade && (
              <button
                onClick={handleIniciarEdicaoCidade}
                className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition"
                aria-label="Editar cidade"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          {editandoCidade && (
            <div className="relative space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={buscaCidade}
                    onChange={(e) => setBuscaCidade(e.target.value)}
                    onFocus={() => setShowSugestoes(true)}
                    placeholder="Digite o nome da cidade..."
                    className={`
                      w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500
                      bg-white dark:bg-neutral-800 border-gray-300 dark:border-gray-600
                      text-gray-900 dark:text-gray-100
                    `}
                    autoFocus
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>

                <button
                  onClick={handleCancelarEdicaoCidade}
                  className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  aria-label="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {mostrarSugestoes && municipios.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {municipios.map((mun) => (
                    <button
                      key={mun.codigo_ibge}
                      onClick={() => handleSelecionarCidade(mun)}
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition text-sm"
                    >
                      {mun.nome} - {mun.uf}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vagas</p>
            <p className="text-sm">{vagasTexto}</p>
            {evento.numero_vagas && (
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-purple-600 h-full transition-all duration-300"
                  style={{ width: "0%" }}
                  aria-label="0 vagas ocupadas"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</p>
            <p className="text-sm">
              {evento.gratuito ? "Gratuito" : "Pago"}
              {isDono && !evento.realizado && (
                <button
                  onClick={() => handleSalvarCampo("gratuito", (!evento.gratuito).toString())}
                  className="ml-2 p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                  aria-label="Alterar tipo"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </p>
          </div>

          {podeSeInscrever && (
            <button
              onClick={handleInscricao}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Inscrever-se
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6 mt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Imagens do evento</h3>
            {isDono && (
              <label className="cursor-pointer p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="text-sm">Adicionar</span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleUploadImagem}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {evento.imagens_url && evento.imagens_url.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {evento.imagens_url.slice(0, 10).map((url, idx) => (
                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`Imagem ${idx + 1} do evento`}
                    className="w-full h-full object-cover"
                  />
                  {isDono && (
                    <button
                      onClick={() => handleDeletarImagem(url)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition"
                      aria-label="Remover imagem"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Nenhuma imagem adicionada.</p>
          )}
        </div>

        {isDono && !evento.realizado && (
          <>
            <button
              onClick={handleModalDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
              aria-label="Deletar evento"
            >
              Deletar Evento
              <Trash2 className="w-4 h-4" />
            </button>

            {showDeleteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Confirmar exclusão
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tem certeza que deseja deletar o evento <strong>{evento.nome}</strong>? 
                    Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleCancelarDelete}
                      disabled={deleting}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmarDelete}
                      disabled={deleting}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition font-medium"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deletando...
                        </>
                      ) : (
                        <>
                          Sim, deletar
                          <Trash2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
);
};

export default Evento;
import { useState, useRef } from 'react';
import Header from './Header';
import { useUsuario } from '../context/UsuarioContext';
import CidadeSelect from './CidadeSelect';

const CriarEvento = () => {
  const { perfil, criarEvento } = useUsuario();

  const [nome, setNome] = useState('');
  const [dataRealizacao, setDataRealizacao] = useState('');
  const [dataEncerramento, setDataEncerramento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [numeroVagas, setNumeroVagas] = useState('');
  const [gratuito, setGratuito] = useState('true');
  const [cidadeId, setCidadeId] = useState<number | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [imagensAdicionais, setImagensAdicionais] = useState<File[]>([]);
  const [horaRealizacao, setHoraRealizacao] = useState('09:00');
  const [horaEncerramento, setHoraEncerramento] = useState('17:00');

  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const imagensInputRef = useRef<HTMLInputElement>(null);

  const combinarDataHora = (data: string, hora: string) => `${data}T${hora}`;
  const isDataFutura = (dataISO: string) => {
    const agora = new Date();
    const evento = new Date(dataISO);

    return evento.getTime() >= agora.getTime();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!perfil) {
      setErro('Usuário não autenticado.');
      return;
    }

    const dataRealizacaoISO = combinarDataHora(dataRealizacao, horaRealizacao);
    const dataEncerramentoISO = combinarDataHora(dataEncerramento, horaEncerramento);

    if (!nome.trim()) return setErro('Nome é obrigatório.');
    if (!isDataFutura(dataRealizacaoISO)) return setErro('Data de realização deve ser no futuro.');
    if (!isDataFutura(dataEncerramentoISO)) return setErro('Data de encerramento deve ser no futuro.');
    if (new Date(dataEncerramentoISO) < new Date(dataRealizacaoISO))
      return setErro('Encerramento deve ser após realização.');
    if (descricao.length > 500) return setErro('Descrição: máx. 500 caracteres.');
    if (numeroVagas && (isNaN(Number(numeroVagas)) || Number(numeroVagas) <= 0))
      return setErro('Informe um número positivo.');

    setEnviando(true);

    try {
      await criarEvento({
        nome: nome,
        data_realizacao: dataRealizacaoISO,
        data_encerramento: dataEncerramentoISO,
        descricao: descricao || null,
        numero_vagas: numeroVagas ? Number(numeroVagas) : null,
        gratuito: gratuito === 'true',
        cidade: cidadeId,
        banner_url: bannerFile,
        imagens_url: imagensAdicionais,
      });

      alert('Evento criado com sucesso!');
      setNome(''); setDataRealizacao(''); setHoraRealizacao('09:00');
      setDataEncerramento(''); setHoraEncerramento('17:00');
      setDescricao(''); setNumeroVagas(''); setGratuito('true');
      setBannerFile(null); setImagensAdicionais([]);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      if (imagensInputRef.current) imagensInputRef.current.value = '';
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar evento.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-800 text-black dark:text-white pt-20 md:pt-20 p-4">
      <Header titulo="Criar Evento" />

      <div className="flex justify-center items-start min-h-[calc(100vh-5rem)]">
        <div className="w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-neutral-700">
          <h2 className="text-2xl font-bold text-center mb-8 text-purple-600 dark:text-purple-400">
            Informe os dados do evento
          </h2>

          {erro && (
            <div
              role="alert"
              className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm"
            >
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium mb-2">
                Nome do evento <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="Nome do seu evento"
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="dataRealizacao" className="block text-sm font-medium mb-2">
                Data e hora de realização <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  id="dataRealizacao"
                  type="date"
                  value={dataRealizacao}
                  onChange={(e) => setDataRealizacao(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  aria-required="true"
                />
                <input
                  id="horaRealizacao"
                  type="time"
                  value={horaRealizacao}
                  onChange={(e) => {
                    const time = e.target.value;
                    const date = dataRealizacao.split('T')[0] || new Date().toISOString().split('T')[0];
                    setHoraRealizacao(time);
                    setDataRealizacao(`${date}T${time}`);
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  aria-required="true"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dataEncerramento" className="block text-sm font-medium mb-2">
                Data e hora de encerramento <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  id="dataEncerramento"
                  type="date"
                  value={dataEncerramento}
                  onChange={(e) => setDataEncerramento(e.target.value)}
                  required
                  min={dataRealizacao.split('T')[0] || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  aria-required="true"
                />
                <input
                  id="horaEncerramento"
                  type="time"
                  value={horaEncerramento}
                  onChange={(e) => {
                    const time = e.target.value;
                    const date = dataEncerramento.split('T')[0] || dataRealizacao.split('T')[0] || new Date().toISOString().split('T')[0];
                    setHoraEncerramento(time);
                    setDataEncerramento(`${date}T${time}`);
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  aria-required="true"
                />
              </div>
            </div>

            <div>
              <label htmlFor="descricao" className="block text-sm font-medium mb-2">
                Descrição <span className="text-gray-500 text-xs">(máx. 500 caracteres)</span>
              </label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value.slice(0, 500))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                placeholder="Informe a descrição do evento"
                aria-describedby="descricao-help"
              />
              <p id="descricao-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {descricao.length}/500
              </p>
            </div>

            <CidadeSelect
              value={cidadeId}
              onChange={setCidadeId}
              required
            />

            <div>
              <label htmlFor="numeroVagas" className="block text-sm font-medium mb-2">
                Número de vagas
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Caso seu evento tenha um número limitado de vagas, informe aqui
              </p>
              <input
                id="numeroVagas"
                type="number"
                min="1"
                value={numeroVagas}
                onChange={(e) => setNumeroVagas(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Deixe vazio para vagas ilimitadas"
                aria-describedby="vagas-help"
              />
              <p id="vagas-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Opcional – deixe vazio para vagas ilimitadas
              </p>
            </div>

            <div>
              <label htmlFor="gratuito" className="block text-sm font-medium mb-2">
                O evento é gratuito?
              </label>
              <select
                id="gratuito"
                value={gratuito}
                onChange={(e) => setGratuito(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-black dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>

            <div>
              <label htmlFor="banner" className="block text-sm font-medium mb-2">
                Banner do evento
              </label>
              <input
                ref={bannerInputRef}
                id="banner"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setBannerFile(file);
                }}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 dark:file:bg-purple-900 file:text-purple-700 dark:file:text-purple-300 hover:file:bg-purple-100 dark:hover:file:bg-purple-800 cursor-pointer"
                aria-describedby="banner-help"
              />
              <p id="banner-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {bannerFile ? `Selecionado: ${bannerFile.name}` : 'Nenhum arquivo selecionado'}
              </p>
            </div>

            <div>
              <label htmlFor="imagens" className="block text-sm font-medium mb-2">
                Imagens adicionais (máx. 10)
              </label>
              <input
                ref={imagensInputRef}
                id="imagens"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const novosArquivos = Array.from(e.target.files || []);
                  
                  setImagensAdicionais((prev) => {
                    const todos = [...prev, ...novosArquivos];
                    const unicos = todos.filter((file, index, self) =>
                      index === self.findIndex((f) => f.name === file.name && f.size === file.size)
                    );
                    return unicos.slice(0, 10); 
                  });

                  if (imagensInputRef.current) {
                    imagensInputRef.current.value = '';
                  }
                }}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 dark:file:bg-purple-900 file:text-purple-700 dark:file:text-purple-300 hover:file:bg-purple-100 dark:hover:file:bg-purple-800 cursor-pointer"
                aria-describedby="imagens-help"
              />
              <p id="imagens-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {imagensAdicionais.length > 0
                  ? `${imagensAdicionais.length} imagem(ns) selecionada(s)`
                  : 'Nenhuma imagem selecionada'}
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={enviando || !perfil}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
                aria-label={enviando ? 'Enviando...' : 'Criar evento'}
              >
                {enviando ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  'Criar Evento'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CriarEvento;
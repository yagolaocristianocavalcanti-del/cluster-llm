import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Download, 
  Check, 
  Search, 
  Zap, 
  Layers, 
  HardDrive, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  RotateCw,
  Sparkles,
  Info,
  Radio,
  Server,
  Smartphone,
  Monitor,
  CheckCheck,
  Flame,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  Terminal,
  Activity
} from 'lucide-react';
import { ModelItem, ModelType, ClusterNode, OllamaHostInfo } from '../types';

interface ModelsViewProps {
  models: ModelItem[];
  nodes?: ClusterNode[];
  activeModelName?: string;
  onDownloadModel: (modelId: string) => void;
  onUseModel: (modelName: string) => void;
  onSelectForFinetune?: (modelName: string) => void;
  onPullOllamaModel?: (modelName: string, host?: string) => Promise<boolean>;
  onSyncOllama?: (host?: string) => Promise<void>;
  onTestOllamaHost?: (host: string) => Promise<OllamaHostInfo>;
}

export const ModelsView: React.FC<ModelsViewProps> = ({
  models,
  nodes = [],
  activeModelName,
  onDownloadModel,
  onUseModel,
  onSelectForFinetune,
  onPullOllamaModel,
  onSyncOllama,
  onTestOllamaHost,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'installed' | 'available' | 'lightweight' | 'code' | 'reasoning'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Estado do Ollama Host & Pull
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaHostInfo>({
    host: 'http://localhost:11434',
    status: 'checking',
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingHost, setIsTestingHost] = useState(false);
  const [customPullName, setCustomPullName] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  // Total RAM disponível no Cluster
  const totalClusterRamGb = nodes.reduce((acc, n) => acc + (n.status === 'online' ? n.ram_total_gb : 0), 0) || 64;

  // Sugestões populares para puxar no Ollama
  const popularOllamaModels = [
    { name: 'deepseek-r1:7b', label: 'DeepSeek R1 (7B Reasoning)', size: '4.7 GB', type: 'reasoning' },
    { name: 'llama3.2:3b', label: 'LLaMA 3.2 (3B Mobile/Fast)', size: '2.0 GB', type: 'lightweight' },
    { name: 'llama3:8b', label: 'LLaMA 3 (8B Instruct)', size: '4.7 GB', type: 'inference' },
    { name: 'qwen2.5:7b', label: 'Qwen 2.5 (7B Multilingual)', size: '4.4 GB', type: 'inference' },
    { name: 'mistral:7b', label: 'Mistral (7B v0.3)', size: '4.1 GB', type: 'inference' },
    { name: 'phi3:mini', label: 'Phi-3 Mini (3.8B Lightweight)', size: '2.3 GB', type: 'lightweight' },
    { name: 'deepseek-coder:6.7b', label: 'DeepSeek Coder (6.7B)', size: '3.8 GB', type: 'code' },
    { name: 'tinyllama:1.1b', label: 'TinyLLaMA (1.1B Ultra-fast)', size: '638 MB', type: 'lightweight' },
  ];

  // Verificar status do Ollama inicial
  useEffect(() => {
    checkOllamaConnectivity(ollamaHost);
  }, []);

  const checkOllamaConnectivity = async (hostToCheck: string) => {
    setIsTestingHost(true);
    setOllamaStatus((prev) => ({ ...prev, status: 'checking', host: hostToCheck }));
    
    try {
      if (onTestOllamaHost) {
        const info = await onTestOllamaHost(hostToCheck);
        setOllamaStatus(info);
      } else {
        const res = await fetch(`/api/ollama/status?host=${encodeURIComponent(hostToCheck)}`);
        const data = await res.json();
        setOllamaStatus({
          host: hostToCheck,
          status: data.online ? 'connected' : 'offline',
          version: data.version,
          models_count: data.models_count,
          latency_ms: data.latency_ms,
          error: data.message,
        });
      }
    } catch {
      setOllamaStatus({
        host: hostToCheck,
        status: 'offline',
        error: 'Inacessível ou timeout',
      });
    } finally {
      setIsTestingHost(false);
    }
  };

  const handleSyncWithOllama = async () => {
    setIsSyncing(true);
    try {
      if (onSyncOllama) {
        await onSyncOllama(ollamaHost);
      } else {
        await fetch(`/api/ollama/tags?host=${encodeURIComponent(ollamaHost)}`);
      }
      await checkOllamaConnectivity(ollamaHost);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExecutePull = async (modelToPull?: string) => {
    const targetName = (modelToPull || customPullName).trim();
    if (!targetName) return;

    setIsPulling(true);
    setPullProgress(10);

    const interval = setInterval(() => {
      setPullProgress((p) => {
        if (p >= 90) return p;
        return p + Math.floor(Math.random() * 15 + 5);
      });
    }, 400);

    try {
      if (onPullOllamaModel) {
        await onPullOllamaModel(targetName, ollamaHost);
      } else {
        await fetch('/api/ollama/pull', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: targetName, host: ollamaHost }),
        });
      }
      setPullProgress(100);
      setCustomPullName('');
    } finally {
      setTimeout(() => {
        clearInterval(interval);
        setIsPulling(false);
        setPullProgress(0);
        handleSyncWithOllama();
      }, 700);
    }
  };

  const filteredModels = models.filter((m) => {
    if (activeTab === 'installed' && !m.installed) return false;
    if (activeTab === 'available' && m.installed) return false;
    if (activeTab === 'lightweight' && m.type !== 'lightweight' && !m.parameters.includes('1.') && !m.parameters.includes('3.')) return false;
    if (activeTab === 'code' && m.type !== 'code' && !m.name.includes('coder')) return false;
    if (activeTab === 'reasoning' && m.type !== 'reasoning' && !m.name.includes('r1') && !m.name.includes('deepseek')) return false;

    if (selectedType !== 'all' && m.type !== selectedType) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.display.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.quantization.toLowerCase().includes(q) ||
        m.parameters.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="view-models">
      {/* 1. Bar de Integração com Ollama & Conexão de Nós */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/30 backdrop-blur-xl border border-indigo-500/20 space-y-4 shadow-2xl shadow-black/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Integração Direta com Ollama & Servos do Cluster
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                    ollamaStatus.status === 'connected'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : ollamaStatus.status === 'checking'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {ollamaStatus.status === 'connected' ? `🟢 Conectado (${ollamaStatus.latency_ms || 2}ms)` : ollamaStatus.status === 'checking' ? '🟡 Verificando...' : '🔴 Offline / Local'}
                  </span>
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Conecte a daemons Ollama rodando no PC Master, nós Termux Android ou PCs na rede local
                </p>
              </div>
            </div>
          </div>

          {/* Controles de Host e Sincronização */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-black/40 rounded-2xl p-1 border border-white/10">
              <input
                type="text"
                value={ollamaHost}
                onChange={(e) => setOllamaHost(e.target.value)}
                placeholder="http://localhost:11434"
                className="bg-transparent text-xs font-mono text-indigo-200 px-3 py-1.5 focus:outline-none w-48 sm:w-56"
              />
              <button
                onClick={() => checkOllamaConnectivity(ollamaHost)}
                disabled={isTestingHost}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                title="Testar conexão com esta URL"
              >
                {isTestingHost ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : 'Testar'}
              </button>
            </div>

            <button
              onClick={handleSyncWithOllama}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              title="Puxar todos os modelos já baixados no Ollama para o cluster"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Ollama'}
            </button>
          </div>
        </div>

        {/* Chips de Hosts Rápidos & Puxador Direto de Modelos */}
        <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-white/50">
            <span>Predefinições:</span>
            <button
              onClick={() => { setOllamaHost('http://localhost:11434'); checkOllamaConnectivity('http://localhost:11434'); }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] font-mono transition-colors"
            >
              💻 Master (127.0.0.1:11434)
            </button>
            <button
              onClick={() => { setOllamaHost('http://192.168.1.142:11434'); checkOllamaConnectivity('http://192.168.1.142:11434'); }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] font-mono transition-colors"
            >
              📱 Termux Android (:11434)
            </button>
            <button
              onClick={() => { setOllamaHost('http://192.168.1.105:11434'); checkOllamaConnectivity('http://192.168.1.105:11434'); }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] font-mono transition-colors"
            >
              🖥️ PC Worker Win11 (:11434)
            </button>
          </div>

          {/* Quick Pull input */}
          <div className="w-full md:w-auto flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                value={customPullName}
                onChange={(e) => setCustomPullName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecutePull()}
                placeholder="Puxar modelo (ex: deepseek-r1:7b)"
                className="w-full pl-3 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 font-mono"
              />
            </div>
            <button
              onClick={() => handleExecutePull()}
              disabled={isPulling || !customPullName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              {isPulling ? `${pullProgress}%` : 'Ollama Pull'}
            </button>
          </div>
        </div>

        {/* Barra de Progresso de Pull Ativo */}
        {isPulling && (
          <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/30 space-y-1.5 animate-fadeIn">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-amber-300 font-semibold flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Puxando camadas do modelo '{customPullName || 'Ollama'}' para o cluster...
              </span>
              <span className="text-white font-bold">{pullProgress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${pullProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Header, Search, & Filter Tabs */}
      <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl shadow-black/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-400" />
              Catálogo Unificado de Modelos & Shards GGUF
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              {models.filter(m => m.installed).length} modelos prontos para execução em pipeline ou tensor paralelo
            </p>
          </div>

          {/* Abas de Navegação */}
          <div className="flex flex-wrap rounded-full bg-black/30 p-1 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'all' ? 'bg-white text-slate-950 shadow-md font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              Todos ({models.length})
            </button>
            <button
              onClick={() => setActiveTab('installed')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'installed' ? 'bg-emerald-400 text-slate-950 shadow-md font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              Prontos / Instalados ({models.filter((m) => m.installed).length})
            </button>
            <button
              onClick={() => setActiveTab('lightweight')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'lightweight' ? 'bg-purple-400 text-slate-950 shadow-md font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              📱 Leves Android (&le;4B)
            </button>
            <button
              onClick={() => setActiveTab('reasoning')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'reasoning' ? 'bg-amber-400 text-slate-950 shadow-md font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              🧠 Raciocínio (DeepSeek)
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'available' ? 'bg-indigo-400 text-white shadow-md font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              Disponíveis ({models.filter((m) => !m.installed).length})
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome (ex: deepseek-r1, llama3, phi3), parâmetros (8B, 70B), quantização (Q4_K_M)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 backdrop-blur-md"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-white/90 focus:outline-none focus:border-indigo-400 backdrop-blur-md"
            >
              <option value="all" className="bg-slate-900">Todas as Categorias</option>
              <option value="inference" className="bg-slate-900">Inferência Geral (LLaMA 3, Mistral)</option>
              <option value="reasoning" className="bg-slate-900">Raciocínio Lógico (DeepSeek R1, QwQ)</option>
              <option value="code" className="bg-slate-900">Programação & Código (DeepSeek Coder)</option>
              <option value="lightweight" className="bg-slate-900">Ultra-Leves Celular (Phi-3, TinyLLaMA)</option>
              <option value="multimodal" className="bg-slate-900">Visão & Multimodal (LLaVA)</option>
            </select>
          </div>
        </div>

        {/* Sugestões Populares para Adicionar */}
        <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-white/40 text-[11px] whitespace-nowrap flex items-center gap-1 font-semibold">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Puxar com 1 Clique:
          </span>
          {popularOllamaModels.map((pop) => (
            <button
              key={pop.name}
              onClick={() => handleExecutePull(pop.name)}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-indigo-500/20 text-white/80 hover:text-indigo-200 border border-white/10 hover:border-indigo-500/40 text-[11px] font-mono whitespace-nowrap transition-all flex items-center gap-1.5"
            >
              <span>{pop.name}</span>
              <span className="text-[10px] text-white/40">({pop.size})</span>
              <PlusCircle className="w-3 h-3 text-indigo-400" />
            </button>
          ))}
        </div>
      </div>

      {/* 3. Grid de Modelos Enriquecidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredModels.map((model) => {
          const isActive = activeModelName === model.name;
          const hasEnoughRam = totalClusterRamGb >= model.recommended_ram_gb;

          return (
            <div
              key={model.id}
              className={`rounded-3xl bg-white/[0.05] backdrop-blur-xl border transition-all p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group ${
                isActive
                  ? 'border-emerald-500/60 ring-2 ring-emerald-500/30 bg-emerald-950/10'
                  : model.installed
                  ? 'border-white/15 hover:border-indigo-400/50'
                  : 'border-white/5 opacity-85 hover:opacity-100 hover:border-white/20'
              }`}
            >
              {/* Active Model Top Ribbon */}
              {isActive && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase px-3 py-0.5 rounded-bl-xl shadow-md flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" />
                  Modelo Ativo
                </div>
              )}

              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3 mb-3 pr-8">
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                      {model.display}
                    </h3>
                    <div className="text-xs font-mono text-indigo-300 mt-0.5 break-all">
                      {model.name}
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border flex-shrink-0 backdrop-blur-md ${
                    model.installed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {model.installed ? 'Instalado' : 'Disponível'}
                  </span>
                </div>

                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  {model.description}
                </p>

                {/* Badges de Especificações Técnicas */}
                <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-black/30 border border-white/10 mb-4 text-xs font-mono backdrop-blur-md">
                  <div>
                    <span className="text-white/40 text-[10px] block uppercase">Tamanho em Disco</span>
                    <span className="text-white font-semibold flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-indigo-400" />
                      {model.size}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block uppercase">Quantização</span>
                    <span className="text-indigo-300 font-semibold">{model.quantization}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block uppercase">Parâmetros</span>
                    <span className="text-white font-semibold">{model.parameters}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block uppercase">RAM Recomendada</span>
                    <span className={`font-semibold flex items-center gap-1 ${
                      hasEnoughRam ? 'text-amber-300' : 'text-rose-400'
                    }`}>
                      <Cpu className="w-3 h-3" />
                      {model.recommended_ram_gb} GB
                      {hasEnoughRam ? (
                        <span className="text-[9px] text-emerald-400">(OK)</span>
                      ) : (
                        <span className="text-[9px] text-rose-400">(Alerta)</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Nós onde o modelo está pronto */}
                {model.installed && (
                  <div className="mb-4 text-[11px] text-white/60 flex items-center gap-1.5 flex-wrap">
                    <span className="text-white/40 text-[10px] uppercase font-mono">Disponível em:</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-[10px] flex items-center gap-1">
                      <Server className="w-2.5 h-2.5 text-indigo-400" />
                      Master Workstation
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-[10px] flex items-center gap-1">
                      <Smartphone className="w-2.5 h-2.5 text-emerald-400" />
                      Termux S24
                    </span>
                  </div>
                )}
              </div>

              {/* Ações do Card */}
              <div>
                {model.is_downloading && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-mono text-white/80 mb-1">
                      <span>Baixando camadas GGUF/Ollama...</span>
                      <span className="text-indigo-300 font-bold">{model.download_progress || 0}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${model.download_progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                  {model.installed ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onUseModel(model.name)}
                        className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full font-bold text-xs shadow-lg transition-all ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                            : 'bg-white hover:bg-slate-100 text-slate-950 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        {isActive ? 'Ativo na Inferência' : 'Usar na Inferência'}
                      </button>

                      {onSelectForFinetune ? (
                        <button
                          onClick={() => onSelectForFinetune(model.name)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all backdrop-blur-md"
                          title="Usar este modelo como base para Fine-Tuning LoRA"
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-300" />
                          Fine-Tuning
                        </button>
                      ) : (
                        <button
                          onClick={() => onUseModel(model.name)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all backdrop-blur-md"
                        >
                          <Activity className="w-3.5 h-3.5 text-indigo-300" />
                          Testar Prompt
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onDownloadModel(model.id)}
                      disabled={model.is_downloading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs transition-all disabled:opacity-50 backdrop-blur-md hover:scale-[1.01]"
                    >
                      {model.is_downloading ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          Baixando para o Cluster...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                          Baixar / Ollama Pull ({model.size})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredModels.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
          <Box className="w-12 h-12 text-white/20 mx-auto" />
          <h4 className="text-white font-semibold text-sm">Nenhum modelo encontrado para este filtro</h4>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Tente buscar por outro termo ou use o campo de 'Ollama Pull' acima para baixar diretamente qualquer modelo do repositório Ollama.
          </p>
          <button
            onClick={() => { setActiveTab('all'); setSearchQuery(''); setSelectedType('all'); }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold transition-all"
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Zap, 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Sliders, 
  Sparkles, 
  Layers, 
  Server, 
  Smartphone, 
  Monitor, 
  Cpu, 
  Clock,
  Send,
  MessageSquare,
  Box,
  HardDrive,
  Radio,
  Search,
  CheckCircle2,
  ChevronDown,
  Terminal,
  Activity,
  Trash2,
  Download
} from 'lucide-react';
import { ClusterNode, ModelItem } from '../types';

interface InferenceViewProps {
  nodes: ClusterNode[];
  models: ModelItem[];
  selectedModelName: string;
  onSelectModel: (name: string) => void;
  onRunInference: (prompt: string, model: string, selectedNodeIds: string[], temp: number, maxTokens: number) => Promise<any>;
  onNavigateToModels?: () => void;
}

export const InferenceView: React.FC<InferenceViewProps> = ({
  nodes,
  models,
  selectedModelName,
  onSelectModel,
  onRunInference,
  onNavigateToModels,
}) => {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [distributionMode, setDistributionMode] = useState<'tensor' | 'pipeline' | 'roundrobin'>('tensor');
  const [selectedNodes, setSelectedNodes] = useState<string[]>(nodes.filter(n => n.status === 'online').map(n => n.node_id));
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ 
    tps: number; 
    totalTokens: number; 
    timeSec: number; 
    engine?: string;
    nodeBreakdown: { name: string; pct: number }[] 
  } | null>(null);

  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelSearch, setModelSearch] = useState('');

  const installedModels = models.filter((m) => m.installed);
  const currentModel = models.find((m) => m.name === selectedModelName) || models[0];

  const samplePrompts = [
    { label: 'Visão Geral do Cluster', text: 'Explique de forma detalhada como o LLM Cluster Trainer V3 unifica celulares Android e PCs para computação de tensores heterogênea.' },
    { label: 'Script Python Assíncrono', text: 'Crie um script em Python usando aiohttp e asyncio para coletar métricas de CPU e RAM de múltiplos servidores simultaneamente.' },
    { label: 'Otimização LoRA', text: 'Quais são as melhores configurações de LoRA rank (r) e alpha para treinar um modelo de 8 bilhões de parâmetros em dispositivos com menos de 16GB de VRAM?' },
    { label: 'Raciocínio Passo a Passo', text: 'Um cluster possui 3 dispositivos: Nó A com 16GB RAM, Nó B com 8GB RAM e Nó C com 12GB RAM. Como particionar 32 camadas de um transformer para balancear a carga perfeitamente?' }
  ];

  const toggleNodeSelection = (nodeId: string) => {
    if (selectedNodes.includes(nodeId)) {
      if (selectedNodes.length > 1) {
        setSelectedNodes(selectedNodes.filter((id) => id !== nodeId));
      }
    } else {
      setSelectedNodes([...selectedNodes, nodeId]);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setOutput('');
    setStats(null);

    const activeNodeList = nodes.filter((n) => selectedNodes.includes(n.node_id));
    const startTime = Date.now();

    const fullPrompt = systemPrompt.trim() 
      ? `[SISTEMA: ${systemPrompt.trim()}]\n\n${prompt.trim()}`
      : prompt.trim();

    try {
      const res = await onRunInference(fullPrompt, selectedModelName, selectedNodes, temperature, maxTokens);
      const text = res?.output || 'Inferência concluída com sucesso.';
      
      // Simulação de streaming visual fluido
      let curr = '';
      const words = text.split(' ');
      for (let i = 0; i < words.length; i++) {
        curr += (i > 0 ? ' ' : '') + words[i];
        setOutput(curr);
        await new Promise((r) => setTimeout(r, 18));
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const totalTokens = res?.tokens_generated || Math.ceil(text.length / 3.8);
      const tps = res?.tokens_per_sec || Math.round((totalTokens / Math.max(elapsed, 0.2)) * 10) / 10;

      // Calcular breakdown de participação dos nós
      const count = activeNodeList.length || 1;
      const basePct = Math.floor(100 / count);
      const breakdown = activeNodeList.map((n, idx) => ({
        name: n.device_name.split(' ')[0],
        pct: idx === 0 ? 100 - basePct * (count - 1) : basePct,
      }));

      setStats({
        tps,
        totalTokens,
        timeSec: Math.round(elapsed * 10) / 10,
        engine: res?.engine || 'tensor_cluster',
        nodeBreakdown: breakdown,
      });
    } catch (e: any) {
      setOutput(`[ERRO]: Não foi possível completar a inferência: ${e?.message || 'Falha de comunicação'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="view-inference">
      {/* Top Banner de Status do Pipeline de Inferência */}
      <div className="p-4 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Motor de Inferência Distribuída</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                🟢 {selectedNodes.length} Nós Ativos
              </span>
            </div>
            <p className="text-xs text-white/50">
              Modelo ativo: <strong className="text-indigo-200 font-mono">{currentModel?.display || selectedModelName}</strong> ({currentModel?.quantization || 'Q4_K_M'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onNavigateToModels && (
            <button
              onClick={onNavigateToModels}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold backdrop-blur-md transition-all ml-auto"
            >
              <Box className="w-3.5 h-3.5 text-indigo-300" />
              Puxar Ollama / Catálogo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls & Node Selector */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card Configuração da Inferência */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Configuração do Modelo & Parâmetros</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                className="text-[11px] font-mono text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                {showSystemPrompt ? '- Ocultar Sistema' : '+ Prompt de Sistema'}
              </button>
            </div>

            {/* Prompt de Sistema Opcional */}
            {showSystemPrompt && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-black/40 border border-white/10 animate-fadeIn">
                <label className="text-[11px] font-semibold text-indigo-300 flex items-center justify-between">
                  <span>Instruções do Sistema (System Prompt)</span>
                  <span className="text-white/40 text-[10px]">Opcional</span>
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Ex: Você é um assistente técnico especialista em computação distribuída..."
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 resize-none h-16"
                />
              </div>
            )}

            {/* Seleção do Modelo com Destaque Visual */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/80">
                  Modelo LLM Selecionado
                </label>
                {currentModel && (
                  <span className="text-[10px] font-mono text-amber-300">
                    RAM Recom: {currentModel.recommended_ram_gb} GB
                  </span>
                )}
              </div>

              {/* Botão de Dropdown Customizado */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-indigo-500/30 text-left hover:border-indigo-400 transition-all backdrop-blur-md"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 flex-shrink-0">
                      <Box className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">
                        {currentModel?.display || selectedModelName}
                      </div>
                      <div className="text-[10px] font-mono text-indigo-300 truncate">
                        {currentModel?.parameters || '8B'} • {currentModel?.quantization || 'Q4_K_M'} • {currentModel?.size || '4.7 GB'}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                </button>

                {/* Popover de Seleção com Busca */}
                {showModelPicker && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-40 p-3 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/20 shadow-2xl space-y-2 max-h-72 overflow-y-auto">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Buscar modelo..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-400"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1 pt-1">
                      {installedModels
                        .filter((m) => m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.display.toLowerCase().includes(modelSearch.toLowerCase()))
                        .map((m) => {
                          const isSel = m.name === selectedModelName;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                onSelectModel(m.name);
                                setShowModelPicker(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                                isSel
                                  ? 'bg-indigo-600/40 text-white border border-indigo-400/50'
                                  : 'hover:bg-white/5 text-white/80'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-xs text-white">{m.display}</div>
                                <div className="text-[10px] font-mono text-white/50">{m.parameters} • {m.quantization} • {m.size}</div>
                              </div>
                              {isSel && <Check className="w-4 h-4 text-emerald-400" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modo de Distribuição */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1.5">
                Estratégia de Particionamento
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'tensor', label: 'Tensor Shard', sub: 'Camadas divididas' },
                  { id: 'pipeline', label: 'Pipeline Layer', sub: 'Sequencial nós' },
                  { id: 'roundrobin', label: 'Round-Robin', sub: 'Prompts paralelos' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDistributionMode(mode.id as any)}
                    className={`py-2 px-1.5 rounded-xl text-center backdrop-blur-md transition-all ${
                      distributionMode === mode.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                        : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                    }`}
                  >
                    <div className="text-[11px] leading-tight">{mode.label}</div>
                    <div className="text-[9px] opacity-70 font-mono">{mode.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders: Temperatura & Max Tokens */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-3 rounded-2xl bg-black/25 border border-white/10">
                <div className="flex justify-between text-xs text-white/80 mb-1">
                  <span>Temperatura</span>
                  <span className="font-mono text-indigo-300 font-bold">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-2xl bg-black/25 border border-white/10">
                <div className="flex justify-between text-xs text-white/80 mb-1">
                  <span>Max Tokens</span>
                  <span className="font-mono text-indigo-300 font-bold">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="64"
                  max="2048"
                  step="64"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card Seletor de Nós Participantes */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-3 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold text-sm text-white">Nós Participantes do Cálculo</h3>
              </div>
              <span className="text-xs font-mono text-indigo-300">
                {selectedNodes.length}/{nodes.length} Ativos
              </span>
            </div>

            <p className="text-xs text-white/50">
              Marque quais celulares e computadores receberão fatias dos tensores:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {nodes.map((node) => {
                const isSelected = selectedNodes.includes(node.node_id);
                return (
                  <div
                    key={node.node_id}
                    onClick={() => toggleNodeSelection(node.node_id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-white'
                        : 'bg-black/20 border-white/5 text-white/40 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/5">
                        {node.platform === 'Android' ? (
                          <Smartphone className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Monitor className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          {node.device_name}
                          {node.is_master && (
                            <span className="px-1.5 py-0.2 bg-indigo-500/30 text-indigo-300 rounded text-[9px] font-mono">
                              Master
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-white/50 flex items-center gap-2">
                          <span>{node.address}:{node.port}</span>
                          <span>•</span>
                          <span>RAM: {node.ram_used_gb}/{node.ram_total_gb} GB</span>
                        </div>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-white/20'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Prompt Area, Output & Realtime Metrics */}
        <div className="lg:col-span-7 space-y-5">
          {/* Caixa de Entrada de Prompt */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Prompt de Entrada</h3>
              </div>
              <span className="text-[11px] font-mono text-white/40">
                {prompt.length} caracteres
              </span>
            </div>

            {/* Sugestões de Prompts Rápidos */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] text-white/40 uppercase font-mono whitespace-nowrap">Exemplos:</span>
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(s.text)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[11px] whitespace-nowrap transition-all"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Digite sua instrução ou pergunta para o cluster de nós processar..."
              className="w-full p-4 rounded-2xl bg-black/40 border border-white/15 text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 resize-none h-32 backdrop-blur-md"
            />

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setPrompt('')}
                disabled={!prompt}
                className="text-xs text-white/40 hover:text-white transition-colors disabled:opacity-30 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
                    Computando Tensores...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-slate-950 fill-current" />
                    Executar no Cluster
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Área de Resposta & Métricas de Execução */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl shadow-black/20 relative min-h-[300px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Resposta Gerada pelo Cluster</h3>
                </div>

                {output && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                )}
              </div>

              {output ? (
                <div className="font-mono text-xs sm:text-sm text-white/90 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto pr-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                  {output}
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-center text-white/40 space-y-2">
                  <Box className="w-8 h-8 opacity-40" />
                  <p className="text-xs">O resultado da inferência aparecerá aqui após o processamento.</p>
                </div>
              )}
            </div>

            {/* Métricas de Performance em Tempo Real */}
            {stats && (
              <div className="pt-4 border-t border-white/10 space-y-3 animate-fadeIn">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
                    <span className="text-[10px] uppercase font-mono text-white/40 block">Throughput</span>
                    <span className="font-mono text-emerald-300 font-bold text-sm">{stats.tps} tokens/s</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
                    <span className="text-[10px] uppercase font-mono text-white/40 block">Total Gerado</span>
                    <span className="font-mono text-indigo-300 font-bold text-sm">{stats.totalTokens} tokens</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/30 border border-white/10">
                    <span className="text-[10px] uppercase font-mono text-white/40 block">Tempo Total</span>
                    <span className="font-mono text-amber-300 font-bold text-sm">{stats.timeSec} s</span>
                  </div>
                </div>

                {/* Participação de cada nó */}
                <div className="p-3 rounded-2xl bg-black/30 border border-white/10 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-white/40 block">
                    Carga Distribuída por Dispositivo:
                  </span>
                  <div className="flex items-center gap-2">
                    {stats.nodeBreakdown.map((item, idx) => (
                      <div key={idx} className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-white/70">
                          <span>{item.name}</span>
                          <span className="font-bold">{item.pct}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-400 h-full rounded-full"
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

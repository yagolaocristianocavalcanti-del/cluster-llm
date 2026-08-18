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
  MessageSquare
} from 'lucide-react';
import { ClusterNode, ModelItem } from '../types';

interface InferenceViewProps {
  nodes: ClusterNode[];
  models: ModelItem[];
  selectedModelName: string;
  onSelectModel: (name: string) => void;
  onRunInference: (prompt: string, model: string, selectedNodeIds: string[], temp: number, maxTokens: number) => Promise<any>;
}

export const InferenceView: React.FC<InferenceViewProps> = ({
  nodes,
  models,
  selectedModelName,
  onSelectModel,
  onRunInference,
}) => {
  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [distributionMode, setDistributionMode] = useState<'tensor' | 'pipeline' | 'roundrobin'>('tensor');
  const [selectedNodes, setSelectedNodes] = useState<string[]>(nodes.filter(n => n.status === 'online').map(n => n.node_id));
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ tps: number; totalTokens: number; timeSec: number; nodeBreakdown: { name: string; pct: number }[] } | null>(null);

  const installedModels = models.filter((m) => m.installed);

  const samplePrompts = [
    { label: 'Visão Geral do Cluster', text: 'Explique de forma detalhada como o LLM Cluster Trainer V3 unifica celulares Android e PCs para computação de tensores heterogênea.' },
    { label: 'Script Python Assíncrono', text: 'Crie um script em Python usando aiohttp e asyncio para coletar métricas de CPU e RAM de múltiplos servidores simultaneamente.' },
    { label: 'Otimização LoRA', text: 'Quais são as melhores configurações de LoRA rank (r) e alpha para treinar um modelo de 8 bilhões de parâmetros em dispositivos com menos de 16GB de VRAM?' },
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

    try {
      const res = await onRunInference(prompt, selectedModelName, selectedNodes, temperature, maxTokens);
      const text = res?.output || 'Inferência concluída.';
      
      // Simulação de streaming visual fluido
      let curr = '';
      const words = text.split(' ');
      for (let i = 0; i < words.length; i++) {
        curr += (i > 0 ? ' ' : '') + words[i];
        setOutput(curr);
        await new Promise((r) => setTimeout(r, 20));
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const totalTokens = Math.ceil(text.length / 3.8);
      const tps = Math.round((totalTokens / Math.max(elapsed, 0.2)) * 10) / 10;

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls & Node Selector */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card Configuração da Inferência */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">Configuração do Motor de Inferência</h3>
            </div>

            {/* Seleção do Modelo */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1.5">
                Modelo LLM Selecionado
              </label>
              <select
                value={selectedModelName}
                onChange={(e) => onSelectModel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-indigo-200 font-semibold focus:outline-none focus:border-indigo-400 backdrop-blur-md"
              >
                {installedModels.map((m) => (
                  <option key={m.id} value={m.name} className="bg-slate-900 text-white">
                    {m.display} ({m.quantization})
                  </option>
                ))}
              </select>
            </div>

            {/* Modo de Distribuição */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1.5">
                Modo de Divisão do Tensor / Pipeline
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'tensor', label: 'Tensor Shard' },
                  { id: 'pipeline', label: 'Pipeline Layer' },
                  { id: 'roundrobin', label: 'Round-Robin' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDistributionMode(mode.id as any)}
                    className={`py-2 px-1.5 rounded-xl text-[11px] font-semibold transition-all text-center backdrop-blur-md ${
                      distributionMode === mode.id
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                        : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders: Temperatura & Max Tokens */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
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

              <div>
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
                {selectedNodes.length} de {nodes.length} nós ativos
              </span>
            </div>

            <p className="text-xs text-white/50">
              Clique nos nós para incluí-los ou removê-los do pipeline de processamento:
            </p>

            <div className="space-y-2">
              {nodes.map((node) => {
                const isSelected = selectedNodes.includes(node.node_id);
                return (
                  <div
                    key={node.node_id}
                    onClick={() => toggleNodeSelection(node.node_id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 backdrop-blur-md ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-400/50 text-white shadow-md'
                        : 'bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/10 text-white/40'
                      }`}>
                        {node.platform === 'Android' ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <Monitor className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs truncate block text-white">{node.device_name}</span>
                        <span className="text-[10px] font-mono text-white/50">{node.address} • {node.arch}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-mono text-indigo-200">
                        {node.cpu_usage}% CPU
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-400 bg-indigo-400' : 'border-white/30'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Prompt & Live Distributed Terminal */}
        <div className="lg:col-span-7 space-y-5">
          {/* Prompt Box */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-3 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Prompt para o Cluster
              </label>

              {/* Sample Buttons */}
              <div className="hidden sm:flex items-center gap-1.5">
                {samplePrompts.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(s.text)}
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] text-white/80 hover:text-white border border-white/10 transition-colors backdrop-blur-md"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Digite sua instrução, pergunta ou tarefa para ser processada pelos núcleos do cluster..."
              className="w-full p-4 rounded-2xl bg-black/30 border border-white/15 text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 resize-none font-sans backdrop-blur-md"
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs text-white/50 font-mono">
                {prompt.length} caracteres
              </span>

              <button
                id="run-inference-btn"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-slate-900" />
                    Processando no Cluster...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-slate-900" />
                    Distribuir e Gerar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Output Terminal */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-3 shadow-2xl shadow-black/20 flex flex-col min-h-[380px] justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="font-bold text-sm text-white">Saída de Resposta Sincronizada</h3>
                </div>

                <div className="flex items-center gap-2">
                  {stats && (
                    <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-indigo-300">
                      <span>⚡ {stats.tps} t/s</span>
                      <span>•</span>
                      <span>⏱️ {stats.timeSec}s</span>
                      <span>•</span>
                      <span>📊 {stats.totalTokens} tokens</span>
                    </div>
                  )}

                  <button
                    onClick={handleCopy}
                    disabled={!output}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white hover:text-slate-900 text-white disabled:opacity-30 transition-colors shadow-sm"
                    title="Copiar resposta"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Output Content Area */}
              <div className="mt-4 p-4 rounded-2xl bg-black/30 border border-white/10 text-sm text-white/90 min-h-[220px] max-h-[360px] overflow-y-auto font-sans leading-relaxed whitespace-pre-wrap backdrop-blur-md">
                {output ? (
                  output
                ) : (
                  <span className="text-white/40 italic">
                    Aguardando execução. O texto gerado e a telemetria do cluster aparecerão aqui em tempo real...
                  </span>
                )}
              </div>
            </div>

            {/* Shard & Node Contribution Breakdown */}
            {stats && (
              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-md">
                <span className="text-[11px] font-semibold text-white/60 block mb-2 font-mono uppercase">
                  Distribuição de Camadas por Dispositivo:
                </span>
                <div className="flex items-center gap-2">
                  {stats.nodeBreakdown.map((b, i) => (
                    <div key={i} className="flex-1">
                      <div className="flex justify-between text-[10px] font-mono text-white/70 mb-1">
                        <span className="truncate">{b.name}</span>
                        <span className="text-indigo-300 font-bold">{b.pct}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-400 to-violet-400 h-full rounded-full"
                          style={{ width: `${b.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

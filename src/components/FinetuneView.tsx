import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Play, 
  StopCircle, 
  Upload, 
  FileText, 
  Layers, 
  Activity, 
  Terminal, 
  CheckCircle2, 
  Sparkles, 
  Download, 
  Sliders,
  Smartphone,
  Monitor
} from 'lucide-react';
import { ClusterNode, ModelItem } from '../types';
import { SAMPLE_DATASETS } from '../data/mockData';

interface FinetuneViewProps {
  nodes: ClusterNode[];
  models: ModelItem[];
  onStartFinetune: (config: any) => void;
}

export const FinetuneView: React.FC<FinetuneViewProps> = ({
  nodes,
  models,
  onStartFinetune,
}) => {
  const [selectedModel, setSelectedModel] = useState(models[0]?.name || 'llama3:8b-instruct-q4_K_M');
  const [selectedDatasetId, setSelectedDatasetId] = useState(SAMPLE_DATASETS[0].id);
  const [customDatasetName, setCustomDatasetName] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [isGeneratingDataset, setIsGeneratingDataset] = useState(false);
  const [datasetTopic, setDatasetTopic] = useState('Atendimento ao Cliente e Suporte em Português');
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [generatedSamples, setGeneratedSamples] = useState<any[]>([]);
  
  const [epochs, setEpochs] = useState(3);
  const [batchSize, setBatchSize] = useState(4);
  const [learningRate, setLearningRate] = useState(0.0002);
  const [loraRank, setLoraRank] = useState(16);
  const [loraAlpha, setLoraAlpha] = useState(32);

  const [isTraining, setIsTraining] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(1);
  const [progressPct, setProgressPct] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([2.14, 1.82, 1.45, 1.18, 0.94, 0.81, 0.72, 0.65]);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const onlineNodes = nodes.filter((n) => n.status === 'online');

  // Simulação de treinamento vivo quando acionado
  useEffect(() => {
    let timer: any;
    if (isTraining && progressPct < 100) {
      timer = setInterval(() => {
        setProgressPct((prev) => {
          const next = prev + 4;
          if (next >= 100) {
            setIsTraining(false);
            setIsCompleted(true);
            setTrainingLogs((l) => [
              ...l,
              `[${new Date().toLocaleTimeString()}] ✅ Treinamento concluído com sucesso!`,
              `[${new Date().toLocaleTimeString()}] 💾 Pesos LoRA mesclados salvos em 'adapter_lora_final.gguf'`,
            ]);
            return 100;
          }

          // Atualizar épocas e perdas
          const ep = Math.min(epochs, Math.floor((next / 100) * epochs) + 1);
          setCurrentEpoch(ep);

          const currentLoss = Math.max(0.45, 2.2 - (next / 100) * 1.6 + (Math.random() * 0.08 - 0.04));
          setLossHistory((lh) => [...lh.slice(-15), Math.round(currentLoss * 1000) / 1000]);

          if (next % 16 === 0) {
            setTrainingLogs((l) => [
              ...l,
              `[${new Date().toLocaleTimeString()}] Época ${ep}/${epochs} - Step ${(next * 12)} - Loss: ${currentLoss.toFixed(4)} - Sincronização de gradientes nos ${onlineNodes.length} nós OK.`,
            ]);
          }

          return next;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isTraining, progressPct, epochs, onlineNodes.length]);

  const handleStartTraining = () => {
    const dataset = SAMPLE_DATASETS.find((d) => d.id === selectedDatasetId);
    const dName = dataset ? dataset.name : customDatasetName || 'Dataset Customizado';

    setIsTraining(true);
    setIsCompleted(false);
    setProgressPct(0);
    setCurrentEpoch(1);
    setLossHistory([2.14]);
    setTrainingLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Inicializando pipeline de treinamento LoRA...`,
      `[${new Date().toLocaleTimeString()}] 📦 Carregando modelo base: ${selectedModel}`,
      `[${new Date().toLocaleTimeString()}] 📊 Dataset selecionado: ${dName}`,
      `[${new Date().toLocaleTimeString()}] 🔀 Dividindo em ${onlineNodes.length} Shards paralelos para os nós do cluster...`,
      `[${new Date().toLocaleTimeString()}] ⚡ LoRA Rank: ${loraRank} | Alpha: ${loraAlpha} | LR: ${learningRate}`,
    ]);

    onStartFinetune({
      model: selectedModel,
      dataset_name: dName,
      epochs,
      batch_size: batchSize,
      learning_rate: learningRate,
      lora_rank: loraRank,
      nodes: onlineNodes.map((n) => n.node_id),
    });
  };

  const handleStopTraining = () => {
    setIsTraining(false);
    setTrainingLogs((l) => [...l, `[${new Date().toLocaleTimeString()}] 🛑 Treinamento interrompido pelo usuário.`]);
  };

  const handleGenerateDatasetAI = async () => {
    if (!datasetTopic.trim()) return;
    setIsGeneratingDataset(true);
    try {
      const res = await fetch('/api/finetune/generate-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: datasetTopic, count: 5 })
      });
      const data = await res.json();
      if (data.success && data.dataset) {
        setGeneratedSamples(data.dataset);
        setCustomContent(JSON.stringify(data.dataset, null, 2));
        setCustomDatasetName(`Dataset IA: ${datasetTopic.slice(0, 20)}...`);
      }
    } catch (e) {
      console.warn("Erro ao gerar dataset:", e);
    } finally {
      setIsGeneratingDataset(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="view-finetune">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuração de Treinamento */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <Dumbbell className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-sm text-white">Configuração do Fine-Tuning LoRA</h3>
                <p className="text-xs text-white/50">Distribuição automática de Shards entre os nós</p>
              </div>
            </div>

            {/* Modelo Base */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1.5">
                Modelo Base para Ajuste Fino
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isTraining}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-indigo-200 font-semibold focus:outline-none focus:border-indigo-400 backdrop-blur-md"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.name} className="bg-slate-900 text-white">
                    {m.display} ({m.parameters})
                  </option>
                ))}
              </select>
            </div>

            {/* Seleção de Dataset */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/80">
                  Dataset de Instruções (JSONL / TXT)
                </label>
                <button
                  type="button"
                  onClick={() => setShowDatasetModal(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Gerar com IA
                </button>
              </div>
              <div className="space-y-2">
                {SAMPLE_DATASETS.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => !isTraining && setSelectedDatasetId(d.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all backdrop-blur-md ${
                      selectedDatasetId === d.id
                        ? 'bg-indigo-500/20 border-indigo-400/50 text-white shadow-md'
                        : 'bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                      <span className="text-white">{d.name}</span>
                      <span className="text-[10px] font-mono text-indigo-300">{d.samples_count}</span>
                    </div>
                    <p className="text-[11px] text-white/50 line-clamp-1">{d.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hiperparâmetros em Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs text-white/80 block mb-1">Épocas ({epochs})</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={epochs}
                  onChange={(e) => setEpochs(parseInt(e.target.value) || 1)}
                  disabled={isTraining}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="text-xs text-white/80 block mb-1">Batch Size por Nó</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                  disabled={isTraining}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="text-xs text-white/80 block mb-1">LoRA Rank (r)</label>
                <select
                  value={loraRank}
                  onChange={(e) => setLoraRank(parseInt(e.target.value))}
                  disabled={isTraining}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                >
                  <option value="8" className="bg-slate-900">r=8 (Mais leve)</option>
                  <option value="16" className="bg-slate-900">r=16 (Recomendado)</option>
                  <option value="32" className="bg-slate-900">r=32 (Alta precisão)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/80 block mb-1">Learning Rate</label>
                <input
                  type="text"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0.0002)}
                  disabled={isTraining}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Start / Stop Button */}
            <div className="pt-3">
              {!isTraining ? (
                <button
                  id="start-finetune-btn"
                  onClick={handleStartTraining}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-xl shadow-amber-400/20 transition-all hover:scale-[1.01]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Iniciar Treinamento Distribuído
                </button>
              ) : (
                <button
                  id="stop-finetune-btn"
                  onClick={handleStopTraining}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/20 transition-all"
                >
                  <StopCircle className="w-4 h-4" />
                  Interromper Treinamento
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Training Dashboard, Loss Curve & Shard Progress */}
        <div className="lg:col-span-7 space-y-5">
          {/* Loss Curve & Metrics Card */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">Curva de Perda (Loss Curve) & Épocas</h3>
                  <p className="text-xs text-white/50">Convergência do modelo calculada a cada step de otimização</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Época: {currentEpoch}/{epochs}
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Loss Atual: {lossHistory[lossHistory.length - 1]?.toFixed(4) || '—'}
                </span>
              </div>
            </div>

            {/* Barra Geral de Progresso */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-white/80 mb-1.5">
                <span>Progresso Geral do Fine-Tuning</span>
                <span className="font-mono text-indigo-300 font-bold">{progressPct}%</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-3 p-0.5 border border-white/10 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Gráfico Visual de Loss SVG */}
            <div className="h-40 w-full bg-black/30 rounded-2xl p-4 border border-white/10 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
                <div className="border-b border-white/20 w-full" />
                <div className="border-b border-white/20 w-full" />
                <div className="border-b border-white/20 w-full" />
              </div>

              {/* Linhas e Pontos de Loss */}
              <div className="relative h-24 w-full flex items-end justify-between px-2 z-10">
                {lossHistory.map((lossVal, idx) => {
                  const maxLoss = 2.5;
                  const normalizedHeight = Math.max(10, Math.min(95, ((maxLoss - lossVal) / maxLoss) * 100));
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 group flex-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50 group-hover:scale-125 transition-transform"
                        style={{ marginBottom: `${normalizedHeight}%` }}
                        title={`Step ${idx + 1}: Loss ${lossVal}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] text-white/50 font-mono pt-1 border-t border-white/10">
                <span>Início (Loss: 2.20)</span>
                <span>Convergência Ótima (Loss &lt; 0.60)</span>
              </div>
            </div>

            {/* Shards Progress por Dispositivo */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-white/60 block uppercase font-mono">
                Alocação de Shards por Dispositivo:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {onlineNodes.map((node, i) => {
                  const shardProgress = Math.min(100, Math.max(0, progressPct + (i % 2 === 0 ? 2 : -2)));
                  return (
                    <div key={node.node_id} className="p-3 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-md">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-white flex items-center gap-1.5 truncate">
                          {node.platform === 'Android' ? (
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                          <span className="truncate">{node.device_name.split(' ')[0]}</span>
                        </span>
                        <span className="font-mono text-indigo-300 text-[11px]">
                          Shard {i + 1} ({shardProgress}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${shardProgress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Terminal de Logs ao Vivo */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-3 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Console de Logs de Treinamento</h3>
              </div>
              {isCompleted && (
                <button
                  onClick={() => alert("Pesos 'adapter_lora_final.gguf' exportados com sucesso para a pasta de modelos!")}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold shadow-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Adaptador .GGUF
                </button>
              )}
            </div>

            <div className="bg-black/30 rounded-2xl p-4 font-mono text-xs text-emerald-300 h-52 overflow-y-auto border border-white/10 space-y-1.5 backdrop-blur-md">
              {trainingLogs.length > 0 ? (
                trainingLogs.map((log, idx) => <div key={idx}>{log}</div>)
              ) : (
                <div className="text-white/40 italic">
                  Aguardando início do treinamento. Os logs de sincronização e gradientes aparecerão aqui...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Gerador de Dataset Sintético com IA */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900/90 border border-white/20 backdrop-blur-2xl shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Gerador de Dataset Sintético (Gemini AI)</h3>
              </div>
              <button
                onClick={() => setShowDatasetModal(false)}
                className="text-white/60 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-white/80 font-semibold block mb-1">
                  Qual é o tema ou domínio do Fine-Tuning?
                </label>
                <input
                  type="text"
                  value={datasetTopic}
                  onChange={(e) => setDatasetTopic(e.target.value)}
                  placeholder="Ex: Respostas médicas para triagem, Código TypeScript limpo..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDatasetModal(false)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isGeneratingDataset || !datasetTopic.trim()}
                  onClick={handleGenerateDatasetAI}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-lg disabled:opacity-50"
                >
                  {isGeneratingDataset ? (
                    <span>Gerando Pares...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Gerar com Gemini</span>
                    </>
                  )}
                </button>
              </div>

              {generatedSamples.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">
                      ✓ {generatedSamples.length} Amostras JSONL Geradas
                    </span>
                    <button
                      onClick={() => {
                        setShowDatasetModal(false);
                      }}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold text-[11px]"
                    >
                      Aplicar ao Treinamento
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto bg-black/40 rounded-xl p-3 font-mono text-[11px] text-white/80 space-y-2">
                    {generatedSamples.map((sample, idx) => (
                      <div key={idx} className="pb-1 border-b border-white/5">
                        <span className="text-amber-400">Instrução:</span> {sample.instruction}
                        <br />
                        <span className="text-emerald-400">Resposta:</span> {sample.output}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

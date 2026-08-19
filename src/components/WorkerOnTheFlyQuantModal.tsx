import React, { useState } from 'react';
import { 
  Cpu, 
  X, 
  Zap, 
  Radio, 
  Wifi, 
  Smartphone, 
  CheckCircle2, 
  HardDrive, 
  FileCode, 
  Copy, 
  Check,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { WorkerOnTheFlyQuantConfig, ClusterNode } from '../types';

interface WorkerOnTheFlyQuantModalProps {
  config: WorkerOnTheFlyQuantConfig;
  nodes: ClusterNode[];
  onUpdateConfig: (newConfig: WorkerOnTheFlyQuantConfig) => void;
  onClose: () => void;
}

export const WorkerOnTheFlyQuantModal: React.FC<WorkerOnTheFlyQuantModalProps> = ({
  config,
  nodes,
  onUpdateConfig,
  onClose,
}) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [format, setFormat] = useState(config.format);
  const [compressGradients, setCompressGradients] = useState(config.compressGradients);
  const [compressActivations, setCompressActivations] = useState(config.compressActivations);
  const [copiedCode, setCopiedCode] = useState(false);

  const androidCount = nodes.filter((n) => n.platform === 'Android').length;

  const handleSave = () => {
    const bandwidthSaving = format === 'int4' ? 76 : (format === 'nf4' ? 72 : (format === 'int8' ? 52 : 48));
    const memSaving = format === 'int4' ? 68 : (format === 'nf4' ? 64 : (format === 'int8' ? 45 : 40));

    onUpdateConfig({
      enabled,
      format,
      compressGradients,
      compressActivations,
      targetDeviceTypes: ['Android', 'Windows', 'Linux'],
      bandwidthSavingEstimatePct: bandwidthSaving,
      memorySavingEstimatePct: memSaving,
    });
    onClose();
  };

  const workerPySnippet = `# Exemplo: Quantização On-The-Fly no Worker (worker.py / Termux)
from motor_worker import WorkerNode, DynamicQuantEngine

# Instanciar nó worker com quantização sob demanda
worker = WorkerNode(
    master_ip="192.168.1.100",
    quant_on_the_fly=${enabled ? 'True' : 'False'},
    quant_format="${format}",  # 'int4', 'int8' ou 'nf4'
    compress_gradients=${compressGradients ? 'True' : 'False'},
    compress_activations=${compressActivations ? 'True' : 'False'}
)

@worker.on_receive_forward_tensor
def process_tensor(input_tensor):
    # Quantiza em INT4 antes do forward pass para poupar RAM local
    quant_tensor = DynamicQuantEngine.quantize(input_tensor, format="${format}")
    output = worker.compute_shard_layers(quant_tensor)
    return DynamicQuantEngine.compress_for_network(output)

worker.start()`;

  const copySnippet = () => {
    navigator.clipboard.writeText(workerPySnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[92vh] p-6 rounded-3xl bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl flex flex-col space-y-4 text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Quantização On-the-Fly no Worker
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Wi-Fi & RAM Booster
                </span>
              </h3>
              <p className="text-xs text-white/50">
                Nós mais fracos (Androids antigos, Raspberry Pi) comprimem tensores e gradientes em tempo real
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard de Economia */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
            <span className="text-[10px] uppercase font-bold text-cyan-300/80 block">Economia de Banda Wi-Fi</span>
            <span className="text-xl font-bold font-mono text-cyan-300 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" />
              ~{format === 'int4' ? '76%' : (format === 'nf4' ? '72%' : '52%')}
            </span>
            <span className="text-[10px] text-white/50 mt-0.5 block">Tráfego de rede reduzido</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Economia de RAM por Nó</span>
            <span className="text-xl font-bold font-mono text-emerald-300 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" />
              ~{format === 'int4' ? '68%' : (format === 'nf4' ? '64%' : '45%')}
            </span>
            <span className="text-[10px] text-white/50 mt-0.5 block">Ideal para nós com 6-8GB</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30">
            <span className="text-[10px] uppercase font-bold text-purple-300/80 block">Dispositivos Elegíveis</span>
            <span className="text-xl font-bold font-mono text-purple-300">
              {nodes.length} Nó(s) ({androidCount} Android)
            </span>
            <span className="text-[10px] text-white/50 mt-0.5 block">Ativação sob demanda</span>
          </div>
        </div>

        {/* Configuração */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3.5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quant-otf-enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-400 bg-black/40 border-white/20 focus:ring-0"
              />
              <label htmlFor="quant-otf-enabled" className="text-xs font-bold text-white cursor-pointer">
                Habilitar Quantização On-the-Fly em Todos os Workers do Cluster
              </label>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              enabled ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/10 text-white/40 border-white/10'
            }`}>
              {enabled ? 'HABILITADO' : 'DESATIVADO'}
            </span>
          </div>

          {/* Formato de Quantização On-The-Fly */}
          <div>
            <label className="text-xs font-semibold text-white/70 block mb-2">
              Formato de Quantização On-The-Fly dos Tensores:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'int4', label: 'INT4 (4-bit Uniform)', desc: 'Máxima economia de banda' },
                { id: 'nf4', label: 'NF4 (NormalFloat 4)', desc: 'Precisão excelente de QLoRA' },
                { id: 'int8', label: 'INT8 (8-bit Quant)', desc: 'Equilíbrio velocidade/RAM' },
                { id: 'fp8_e4m3', label: 'FP8 (E4M3)', desc: 'Ultra-rápido em GPUs Ada' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    format === f.id
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <span className="font-bold text-xs block text-white">{f.label}</span>
                  <span className="text-[10px] text-white/50 block mt-0.5">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles adicionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={compressGradients}
                onChange={(e) => setCompressGradients(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-cyan-400 bg-black/40 border-white/20"
              />
              <span className="text-white/80">Comprimir Gradientes no Backward Pass</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={compressActivations}
                onChange={(e) => setCompressActivations(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-cyan-400 bg-black/40 border-white/20"
              />
              <span className="text-white/80">Quantizar Ativações Intermediárias de Shards</span>
            </label>
          </div>
        </div>

        {/* Snippet do Worker */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/70 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              Código Automático do Worker (Termux / Python):
            </span>
            <button
              type="button"
              onClick={copySnippet}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-300 font-semibold transition-all"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Copiado!' : 'Copiar Snippet'}</span>
            </button>
          </div>

          <pre className="p-3 rounded-2xl bg-black/50 border border-white/10 font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
            {workerPySnippet}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-400/20 transition-all hover:scale-105 active:scale-95"
          >
            Salvar & Aplicar aos Workers
          </button>
        </div>
      </div>
    </div>
  );
};

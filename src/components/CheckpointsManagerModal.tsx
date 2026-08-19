import React, { useState } from 'react';
import { 
  RotateCcw, 
  X, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Play, 
  HardDrive, 
  Cloud, 
  Layers, 
  Clock, 
  Activity, 
  Save, 
  Plus, 
  AlertCircle,
  Sparkles,
  Database
} from 'lucide-react';
import { FinetuneCheckpoint } from '../types';

interface CheckpointsManagerModalProps {
  checkpoints: FinetuneCheckpoint[];
  currentStep: number;
  currentEpoch: number;
  isTraining: boolean;
  onAutoResumeCheckpoint: (checkpoint: FinetuneCheckpoint) => void;
  onCreateManualCheckpoint: () => void;
  onDeleteCheckpoint: (checkpointId: string) => void;
  autoSaveIntervalSteps: number;
  onChangeAutoSaveInterval: (steps: number) => void;
  onClose: () => void;
}

export const CheckpointsManagerModal: React.FC<CheckpointsManagerModalProps> = ({
  checkpoints,
  currentStep,
  currentEpoch,
  isTraining,
  onAutoResumeCheckpoint,
  onCreateManualCheckpoint,
  onDeleteCheckpoint,
  autoSaveIntervalSteps,
  onChangeAutoSaveInterval,
  onClose,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDownloadWeights = (checkpoint: FinetuneCheckpoint) => {
    try {
      const mockBlob = new Blob([
        JSON.stringify({
          model: checkpoint.model_name,
          step: checkpoint.step,
          epoch: checkpoint.epoch,
          loss: checkpoint.loss,
          adapter_format: 'LoRA_NF4_GGUF',
          lora_rank: checkpoint.config_snapshot.loraRank,
          lora_alpha: checkpoint.config_snapshot.loraAlpha,
          weights_checksum: 'sha256:7f9a8d6e3c1b0f5e8d9a2c4e6b8a1c3d',
        }, null, 2)
      ], { type: 'application/json' });

      const url = URL.createObjectURL(mockBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adapter_lora_step_${checkpoint.step}_loss_${checkpoint.loss.toFixed(3)}.gguf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Erro ao exportar pesos do checkpoint:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[92vh] p-6 rounded-3xl bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl flex flex-col space-y-4 text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Gerenciador de Checkpoints & Auto-Resume
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Resiliência Ativa
                </span>
              </h3>
              <p className="text-xs text-white/50">
                Garante que nenhum progresso seja perdido caso haja oscilação de Wi-Fi ou desligamento de nós
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

        {/* Barra de Configurações de Auto-Save */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-white block">Intervalo de Salvamento Automático</span>
              <span className="text-[11px] text-white/50">Grava pesos de adaptadores LoRA e estado do otimizador</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={autoSaveIntervalSteps}
              onChange={(e) => onChangeAutoSaveInterval(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white/90 focus:outline-none focus:border-amber-400"
            >
              <option value={10} className="bg-slate-900">A cada 10 Steps (Alta Resiliência)</option>
              <option value={25} className="bg-slate-900">A cada 25 Steps (Recomendado)</option>
              <option value={50} className="bg-slate-900">A cada 50 Steps (Economia I/O)</option>
              <option value={100} className="bg-slate-900">A cada 100 Steps</option>
              <option value={9999} className="bg-slate-900">Apenas ao final de cada Época</option>
            </select>

            <button
              type="button"
              onClick={onCreateManualCheckpoint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              Salvar Agora
            </button>
          </div>
        </div>

        {/* Lista de Checkpoints Salvos */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {checkpoints.length === 0 ? (
            <div className="p-8 text-center bg-black/20 rounded-2xl border border-white/10 text-white/50 text-xs">
              Nenhum checkpoint salvo ainda. Os checkpoints serão gerados automaticamente durante o treinamento.
            </div>
          ) : (
            checkpoints.map((chk, index) => {
              const isLatest = index === 0;
              const isDeleting = confirmDeleteId === chk.id;

              return (
                <div
                  key={chk.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isLatest
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                      : 'bg-black/20 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-sm text-white truncate">{chk.name}</h4>
                        {isLatest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400 text-slate-950 shadow-sm">
                            Mais Recente
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-indigo-300 bg-indigo-500/20 border border-indigo-500/30">
                          Loss: {chk.loss.toFixed(4)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-amber-300 bg-amber-500/20 border border-amber-500/30">
                          Época {chk.epoch} • Step {chk.step}/{chk.total_steps}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-white/50 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5 text-white/40" />
                          {chk.adapter_size_mb} MB (.GGUF)
                        </span>
                        <span>•</span>
                        <span>{new Date(chk.created_at).toLocaleTimeString('pt-BR')}</span>
                        <span>•</span>
                        <span className="text-white/60 truncate">{chk.model_name}</span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadWeights(chk)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-xs transition-all"
                        title="Baixar Pesos LoRA .GGUF deste Checkpoint"
                      >
                        <Download className="w-4 h-4 text-emerald-300" />
                      </button>

                      {isDeleting ? (
                        <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-500/50 p-1 rounded-xl animate-fadeIn">
                          <span className="text-[11px] text-rose-200 px-1 font-bold">Apagar?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteCheckpoint(chk.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px]"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(chk.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white text-xs transition-all"
                          title="Excluir checkpoint"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isTraining}
                        onClick={() => {
                          onAutoResumeCheckpoint(chk);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                        Retomar (Auto-Resume)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto-Resume restaura Loss, Otimizador e Shards de onde parou</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

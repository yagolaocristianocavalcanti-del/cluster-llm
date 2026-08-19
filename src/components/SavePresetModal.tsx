import React, { useState } from 'react';
import { BookmarkPlus, X, Check, Sliders, Zap, HardDrive, Network, Database } from 'lucide-react';
import { FinetunePreset } from '../types';

interface SavePresetModalProps {
  currentConfig: FinetunePreset['config'];
  onSave: (preset: Omit<FinetunePreset, 'id' | 'created_at'>) => void;
  onClose: () => void;
  existingPresetNames: string[];
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({
  currentConfig,
  onSave,
  onClose,
  existingPresetNames,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FinetunePreset['category']>('custom');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Por favor, informe um nome para o perfil de configuração.');
      return;
    }
    if (existingPresetNames.some((n) => n.toLowerCase() === trimmedName.toLowerCase())) {
      setError('Já existe um preset com este nome. Escolha um nome diferente.');
      return;
    }

    onSave({
      name: trimmedName,
      description: description.trim() || 'Configuração personalizada de Fine-Tuning QLoRA.',
      category: category || 'custom',
      isBuiltin: false,
      config: currentConfig,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl space-y-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Salvar Perfil de Fine-Tuning</h3>
              <p className="text-xs text-white/50">Crie um preset reutilizável com os parâmetros atuais</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1.5">
              Nome do Preset <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex: Configuração Economia Snapdragon 8 Gen 3"
              className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 font-medium"
              autoFocus
            />
            {error && <p className="text-xs text-rose-400 mt-1 font-medium">{error}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1.5">
              Descrição do Perfil (Objetivo / Caso de Uso)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Calibrado para nós com 8GB a 12GB de RAM via Termux e QLoRA 4-bit"
              className="w-full px-4 py-2 rounded-2xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1.5">
              Categoria / Rótulo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'economy', label: '🌿 Economia' },
                { id: 'precision', label: '🎯 Alta Precisão' },
                { id: 'balanced', label: '⚖️ Equilibrado' },
                { id: 'speed', label: '⚡ Rápido' },
                { id: 'code', label: '💻 Código / Raciocínio' },
                { id: 'custom', label: '👤 Customizado' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center truncate ${
                    category === cat.id
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resumo Instantâneo dos Parâmetros Que Serão Gravados */}
          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-2">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Parâmetros Capturados Neste Preset:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-white/70">
              <div className="flex items-center gap-1.5">
                <span className="text-white/40">Quantização:</span>
                <span className="text-white font-bold">{currentConfig.quantization}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/40">LoRA Rank (r):</span>
                <span className="text-amber-300 font-bold">{currentConfig.loraRank} (α={currentConfig.loraAlpha})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/40">Precisão LoRA:</span>
                <span className="text-white font-bold">{currentConfig.adapterPrecision.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/40">Otimizador:</span>
                <span className="text-white font-bold truncate">{currentConfig.optimizer.split('_')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/40">Max Seq Length:</span>
                <span className="text-white font-bold">{currentConfig.maxSeqLength} tokens</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/40">Batch Efetivo:</span>
                <span className="text-white font-bold">{currentConfig.microBatchSize} x {currentConfig.gradientAccumulationSteps}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/40">Checkpointing:</span>
                <span className={currentConfig.gradientCheckpointing ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                  {currentConfig.gradientCheckpointing ? 'ATIVO' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/40">Compressão:</span>
                <span className="text-white font-bold">{currentConfig.gradientCompression.toUpperCase()}</span>
              </div>
            </div>
            <div className="text-[10px] text-white/50 pt-1 border-t border-white/5 truncate">
              Módulos ({currentConfig.targetModules.length}): [{currentConfig.targetModules.join(', ')}]
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-lg shadow-amber-400/20 transition-all hover:scale-105 active:scale-95"
            >
              <Check className="w-4 h-4" />
              Salvar Preset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

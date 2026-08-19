import React from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  BookmarkPlus, 
  Sliders, 
  Zap, 
  Sparkles, 
  Check, 
  ChevronRight, 
  RotateCcw,
  Save,
  Plus
} from 'lucide-react';
import { FinetunePreset } from '../types';

interface FinetunePresetsBarProps {
  presets: FinetunePreset[];
  activePresetId: string;
  isModified: boolean;
  onSelectPreset: (preset: FinetunePreset) => void;
  onOpenSaveModal: () => void;
  onOpenManageModal: () => void;
  onRevertToPreset: () => void;
  onQuickUpdatePreset?: () => void;
  isTraining: boolean;
}

export const FinetunePresetsBar: React.FC<FinetunePresetsBarProps> = ({
  presets,
  activePresetId,
  isModified,
  onSelectPreset,
  onOpenSaveModal,
  onOpenManageModal,
  onRevertToPreset,
  onQuickUpdatePreset,
  isTraining,
}) => {
  const activePreset = presets.find((p) => p.id === activePresetId) || presets[0];

  const getPresetIcon = (category?: string) => {
    switch (category) {
      case 'economy':
        return '🌿';
      case 'precision':
        return '🎯';
      case 'balanced':
        return '⚖️';
      case 'speed':
        return '⚡';
      case 'code':
        return '💻';
      default:
        return '👤';
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 space-y-3.5">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Perfis de Treinamento (Presets)</h3>
              {isModified ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse">
                  Modificado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {activePreset?.name.split('(')[0].trim() || 'Preset Ativo'}
                </span>
              )}
            </div>
            <p className="text-xs text-white/50">
              Alterne rapidamente entre perfis otimizados de hiperparâmetros ou salve sua própria calibragem
            </p>
          </div>
        </div>

        {/* Buttons: Save Current, Manage */}
        <div className="flex items-center gap-2 flex-wrap">
          {isModified && (
            <button
              type="button"
              onClick={onRevertToPreset}
              disabled={isTraining}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-xs font-semibold border border-white/10 transition-all"
              title="Restaurar valores do preset ativo"
            >
              <RotateCcw className="w-3 h-3 text-amber-300" />
              Reverter
            </button>
          )}

          {isModified && !activePreset?.isBuiltin && onQuickUpdatePreset && (
            <button
              type="button"
              onClick={onQuickUpdatePreset}
              disabled={isTraining}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-slate-950 text-xs font-bold border border-amber-500/40 transition-all shadow-sm"
              title="Salvar alterações diretamente no preset customizado ativo"
            >
              <Save className="w-3 h-3 fill-current" />
              Sobrescrever Preset
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSaveModal}
            disabled={isTraining}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-lg shadow-amber-400/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Salvar como Novo Preset
          </button>

          <button
            type="button"
            onClick={onOpenManageModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-300" />
            Biblioteca ({presets.length})
          </button>
        </div>
      </div>

      {/* Preset Cards Selector Pills / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {presets.map((preset) => {
          const isSelected = preset.id === activePresetId;
          const icon = getPresetIcon(preset.category);

          return (
            <button
              key={preset.id}
              type="button"
              disabled={isTraining}
              onClick={() => onSelectPreset(preset)}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-amber-400/15 border-amber-400 shadow-lg shadow-amber-400/10 ring-1 ring-amber-400/50'
                  : 'bg-black/30 border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-base">{icon}</span>
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 stroke-[3]" /> ATIVO
                    </span>
                  ) : preset.isBuiltin ? (
                    <span className="text-[9px] uppercase font-bold text-white/40">
                      Nativo
                    </span>
                  ) : (
                    <span className="text-[9px] uppercase font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/20">
                      Custom
                    </span>
                  )}
                </div>

                <h4 className={`text-xs font-bold truncate mb-1 ${
                  isSelected ? 'text-amber-200' : 'text-white group-hover:text-amber-200'
                }`}>
                  {preset.name}
                </h4>
                <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              {/* Quick Specs Summary Badge */}
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/60">
                <span className="text-amber-300 font-bold">r={preset.config.loraRank}</span>
                <span>•</span>
                <span>{preset.config.maxSeqLength} tks</span>
                <span>•</span>
                <span className="uppercase">{preset.config.optimizer.split('_')[0]}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

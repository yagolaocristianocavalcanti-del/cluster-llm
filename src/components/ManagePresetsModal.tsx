import React, { useState, useRef } from 'react';
import { 
  Sliders, 
  X, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Zap, 
  HardDrive, 
  Database,
  Tag,
  Search,
  ArrowRight
} from 'lucide-react';
import { FinetunePreset } from '../types';

interface ManagePresetsModalProps {
  presets: FinetunePreset[];
  activePresetId: string;
  onApplyPreset: (preset: FinetunePreset) => void;
  onDeletePreset: (presetId: string) => void;
  onDuplicatePreset: (preset: FinetunePreset) => void;
  onImportPresets: (imported: FinetunePreset[]) => void;
  onResetToDefaults: () => void;
  onClose: () => void;
}

export const ManagePresetsModal: React.FC<ManagePresetsModalProps> = ({
  presets,
  activePresetId,
  onApplyPreset,
  onDeletePreset,
  onDuplicatePreset,
  onImportPresets,
  onResetToDefaults,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPresets = presets.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Exportar presets como arquivo JSON
  const handleExportJSON = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(presets, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `motor_finetune_presets_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.warn('Erro ao exportar presets:', err);
    }
  };

  // Importar presets de arquivo JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          // Validar campos mínimos
          const validPresets = parsed.filter((item) => item.name && item.config && typeof item.config === 'object');
          if (validPresets.length > 0) {
            onImportPresets(validPresets);
            setImportStatus({ success: true, message: `${validPresets.length} preset(s) importado(s) com sucesso!` });
          } else {
            setImportStatus({ success: false, message: 'Nenhum preset válido encontrado no arquivo JSON.' });
          }
        } else if (parsed && parsed.name && parsed.config) {
          onImportPresets([parsed]);
          setImportStatus({ success: true, message: `Preset '${parsed.name}' importado com sucesso!` });
        } else {
          setImportStatus({ success: false, message: 'Formato de arquivo inválido. Esperado JSON de presets.' });
        }
      } catch (err) {
        setImportStatus({ success: false, message: 'Erro ao analisar arquivo JSON.' });
      }
    };
    reader.readAsText(file);
    // Limpar input para permitir reimportação do mesmo arquivo
    e.target.value = '';
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'economy':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">🌿 Economia</span>;
      case 'precision':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">🎯 Alta Precisão</span>;
      case 'balanced':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">⚖️ Equilibrado</span>;
      case 'speed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">⚡ Rápido</span>;
      case 'code':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">💻 Código</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/70 border border-white/15">👤 Customizado</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[90vh] p-6 rounded-3xl bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl flex flex-col space-y-4 text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Biblioteca de Presets de Fine-Tuning</h3>
              <p className="text-xs text-white/50">Gerencie, aplique, duplique, exporte ou importe perfis de hiperparâmetros</p>
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

        {/* Toolbar: Search, Filters, Export, Import */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou descrição..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-black/40 border border-white/15 text-xs text-white/80 focus:outline-none focus:border-amber-400"
            >
              <option value="all" className="bg-slate-900">Todas as Categorias</option>
              <option value="economy" className="bg-slate-900">🌿 Economia</option>
              <option value="precision" className="bg-slate-900">🎯 Alta Precisão</option>
              <option value="balanced" className="bg-slate-900">⚖️ Equilibrado</option>
              <option value="speed" className="bg-slate-900">⚡ Rápido</option>
              <option value="code" className="bg-slate-900">💻 Código</option>
              <option value="custom" className="bg-slate-900">👤 Customizado</option>
            </select>

            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all"
              title="Exportar todos os presets em arquivo JSON"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Exportar JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all"
              title="Importar presets de arquivo JSON"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden md:inline">Importar</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
          </div>
        </div>

        {/* Notificação de Status de Importação */}
        {importStatus && (
          <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 flex-shrink-0 animate-fadeIn ${
            importStatus.success
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {importStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setImportStatus(null)}
              className="text-white/60 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Lista de Presets */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredPresets.length === 0 ? (
            <div className="p-8 text-center bg-black/20 rounded-2xl border border-white/10 text-white/50 text-xs">
              Nenhum perfil encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredPresets.map((preset) => {
              const isActive = preset.id === activePresetId;
              const isDeleting = confirmDeleteId === preset.id;

              return (
                <div
                  key={preset.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-amber-400/10 border-amber-400/50 shadow-lg shadow-amber-400/5'
                      : 'bg-black/20 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-sm text-white truncate">{preset.name}</h4>
                        {getCategoryBadge(preset.category)}
                        {preset.isBuiltin ? (
                          <span className="text-[10px] uppercase font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                            Nativo
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            Custom
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] font-black uppercase text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-full shadow-sm">
                            Ativo Agora
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 line-clamp-1">{preset.description}</p>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onDuplicatePreset(preset)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-xs transition-all"
                        title="Duplicar preset como cópia customizada"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {!preset.isBuiltin && (
                        <>
                          {isDeleting ? (
                            <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-500/50 p-1 rounded-xl animate-fadeIn">
                              <span className="text-[11px] text-rose-200 px-1 font-bold">Excluir?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeletePreset(preset.id);
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
                              onClick={() => setConfirmDeleteId(preset.id)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white text-xs transition-all"
                              title="Excluir preset customizado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onApplyPreset(preset);
                          onClose();
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-white/15 text-white/50 cursor-default'
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md hover:scale-105'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Aplicado
                          </>
                        ) : (
                          <>
                            Aplicar <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Resumo dos Parâmetros em Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 mt-2.5 border-t border-white/5 text-[11px] font-mono text-white/60">
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase">LoRA Rank / Alpha</span>
                      <span className="text-white font-bold">r={preset.config.loraRank} (α={preset.config.loraAlpha})</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase">Quant / Precisão</span>
                      <span className="text-white font-bold">{preset.config.quantization} ({preset.config.adapterPrecision.toUpperCase()})</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase">Contexto / Cutoff</span>
                      <span className="text-white font-bold">{preset.config.maxSeqLength} tokens</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase">Otimizador / Batch</span>
                      <span className="text-white font-bold">{preset.config.optimizer.split('_')[0]} • {preset.config.microBatchSize}x{preset.config.gradientAccumulationSteps}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Reset & Info */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={onResetToDefaults}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Presets Originais de Fábrica
          </button>

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

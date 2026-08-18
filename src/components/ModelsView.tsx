import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import { ModelItem, ModelType } from '../types';

interface ModelsViewProps {
  models: ModelItem[];
  onDownloadModel: (modelId: string) => void;
  onUseModel: (modelName: string) => void;
}

export const ModelsView: React.FC<ModelsViewProps> = ({
  models,
  onDownloadModel,
  onUseModel,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'installed' | 'available'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredModels = models.filter((m) => {
    if (activeTab === 'installed' && !m.installed) return false;
    if (activeTab === 'available' && m.installed) return false;
    if (selectedType !== 'all' && m.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.display.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.quantization.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="view-models">
      {/* Top Header & Search Bar */}
      <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl shadow-black/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-400" />
              Catálogo de Modelos LLM & Formatos GGUF
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Gerencie modelos para execução no Ollama, llama.cpp ou divisão de Tensores
            </p>
          </div>

          {/* Abas Instalados vs Disponíveis */}
          <div className="flex rounded-full bg-black/30 p-1 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'all' ? 'bg-white text-slate-950 shadow-md font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              Todos ({models.length})
            </button>
            <button
              onClick={() => setActiveTab('installed')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'installed' ? 'bg-white text-slate-950 shadow-md font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              Instalados ({models.filter((m) => m.installed).length})
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'available' ? 'bg-white text-slate-950 shadow-md font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              Disponíveis ({models.filter((m) => !m.installed).length})
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, parâmetros (8B, 70B), quantização (Q4_K_M) ou propósito..."
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
              <option value="inference" className="bg-slate-900">Inferência Geral (LLaMA, Mistral)</option>
              <option value="code" className="bg-slate-900">Código & Programação (DeepSeek)</option>
              <option value="lightweight" className="bg-slate-900">Leves para Celular (Phi-3, TinyLLaMA)</option>
              <option value="multimodal" className="bg-slate-900">Visão & Multimodal (LLaVA)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Modelos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className={`rounded-3xl bg-white/[0.05] backdrop-blur-xl border transition-all p-6 flex flex-col justify-between shadow-xl relative overflow-hidden ${
              model.installed
                ? 'border-white/10 hover:border-indigo-400/50'
                : 'border-white/5 opacity-90 hover:border-white/15'
            }`}
          >
            <div>
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-base text-white">{model.display}</h3>
                  <div className="text-xs font-mono text-indigo-300 mt-0.5">{model.name}</div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border flex-shrink-0 backdrop-blur-md ${
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
              <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-black/25 border border-white/10 mb-4 text-xs font-mono backdrop-blur-md">
                <div>
                  <span className="text-white/40 text-[10px] block uppercase">Tamanho em Disco</span>
                  <span className="text-white font-semibold">{model.size}</span>
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
                  <span className="text-amber-300 font-semibold">{model.recommended_ram_gb} GB</span>
                </div>
              </div>
            </div>

            {/* Ações do Card */}
            <div>
              {model.is_downloading && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs font-mono text-white/80 mb-1">
                    <span>Baixando camadas GGUF...</span>
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

              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                {model.installed ? (
                  <button
                    onClick={() => onUseModel(model.name)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
                    Usar na Inferência
                  </button>
                ) : (
                  <button
                    onClick={() => onDownloadModel(model.id)}
                    disabled={model.is_downloading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs transition-all disabled:opacity-50 backdrop-blur-md"
                  >
                    {model.is_downloading ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        Baixando para o Cluster...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Baixar no Master ({model.size})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

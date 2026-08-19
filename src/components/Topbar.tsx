import React, { useState } from 'react';
import { 
  KeyRound, 
  RotateCw, 
  Sun, 
  Moon, 
  Radio, 
  Sparkles,
  Wifi,
  Layers,
  Leaf,
  Zap,
  Box,
  ChevronDown,
  Check
} from 'lucide-react';
import { AppTheme, AppView, ModelItem } from '../types';

interface TopbarProps {
  currentView: AppView;
  onlineCount: number;
  totalCount: number;
  criticalCount?: number;
  models?: ModelItem[];
  selectedModelName?: string;
  onSelectModel?: (name: string) => void;
  onNavigateToModels?: () => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  powerSaveMode: boolean;
  onTogglePowerSave: () => void;
  onOpenPairing: () => void;
  onRefresh: () => void;
  onNavigateToCluster?: () => void;
  isRefreshing: boolean;
}

const VIEW_TITLES: Record<AppView, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Motor Único — Visão Consolidada',
    subtitle: 'Capacidade agregada de computação e telemetria em tempo real',
  },
  cluster: {
    title: 'Cluster de Dispositivos',
    subtitle: 'Gerenciamento de nós Android (Termux), Windows e Linux',
  },
  inference: {
    title: 'Inferência Distribuída',
    subtitle: 'Distribuição de prompts e camadas de tensores no cluster',
  },
  finetune: {
    title: 'Treinamento & Fine-Tuning',
    subtitle: 'Divisão de datasets em shards e ajuste fino LoRA paralelo',
  },
  models: {
    title: 'Catálogo de Modelos LLM',
    subtitle: 'Modelos GGUF, Ollama e llama.cpp prontos para execução',
  },
  tasks: {
    title: 'Fila de Tarefas & Jobs',
    subtitle: 'Acompanhamento de processos, benchmarks e downloads',
  },
  servodash: {
    title: 'Mini-Dashboard do Servo (:5001)',
    subtitle: 'Visão ultra-leve em execução nos nós escravos',
  },
  scripts: {
    title: 'Scripts de Instalação "Zero-Touch"',
    subtitle: 'Comandos automáticos para Termux, PowerShell e Bash',
  },
  settings: {
    title: 'Configurações do Master',
    subtitle: 'Parâmetros de rede, portas, backends e personalização',
  },
};

export const Topbar: React.FC<TopbarProps> = ({
  currentView,
  onlineCount,
  totalCount,
  criticalCount = 0,
  models = [],
  selectedModelName,
  onSelectModel,
  onNavigateToModels,
  theme,
  onThemeChange,
  powerSaveMode,
  onTogglePowerSave,
  onOpenPairing,
  onRefresh,
  onNavigateToCluster,
  isRefreshing,
}) => {
  const [showModelMenu, setShowModelMenu] = useState(false);
  const installedModels = models.filter((m) => m.installed);
  const currentModel = models.find((m) => m.name === selectedModelName) || models[0];

  const currentInfo = VIEW_TITLES[currentView] || {
    title: 'Painel de Controle',
    subtitle: 'LLM Cluster Trainer V3',
  };

  return (
    <header
      id="app-topbar"
      className="sticky top-0 z-30 h-16 bg-white/[0.03] backdrop-blur-xl border-b border-white/10 px-6 flex items-center justify-between transition-all"
    >
      {/* Title & Subtitle */}
      <div className="flex flex-col min-w-0 pr-4">
        <h1 className="text-base font-bold text-white flex items-center gap-2 truncate tracking-tight">
          {currentInfo.title}
        </h1>
        <p className="text-xs text-white/50 truncate font-normal">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-3">
        {/* Seletor Rápido de Modelo Ativo */}
        {selectedModelName && onSelectModel && (
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-xs font-mono transition-all"
              title="Modelo ativo no cluster. Clique para alternar."
            >
              <Box className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-white font-semibold max-w-[140px] truncate">
                {currentModel?.display || selectedModelName}
              </span>
              <ChevronDown className="w-3 h-3 text-white/50" />
            </button>

            {showModelMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 p-2 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/20 shadow-2xl z-50 space-y-1 animate-fadeIn">
                <div className="px-2 py-1 text-[10px] font-bold text-white/40 uppercase font-mono border-b border-white/10 mb-1 flex justify-between items-center">
                  <span>Modelo Ativo</span>
                  {onNavigateToModels && (
                    <button
                      onClick={() => { setShowModelMenu(false); onNavigateToModels(); }}
                      className="text-indigo-300 hover:underline"
                    >
                      + Catálogo
                    </button>
                  )}
                </div>
                {installedModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.name);
                      setShowModelMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-mono transition-all ${
                      m.name === selectedModelName
                        ? 'bg-indigo-600/40 text-white font-bold'
                        : 'hover:bg-white/5 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="truncate">
                      <div>{m.display}</div>
                      <div className="text-[10px] text-white/40">{m.quantization} • {m.size}</div>
                    </div>
                    {m.name === selectedModelName && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alerta de Nós Críticos */}
        {criticalCount > 0 && (
          <button
            onClick={onNavigateToCluster}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/25 border border-rose-500/60 text-rose-200 hover:bg-rose-500 hover:text-white text-xs font-bold shadow-lg shadow-rose-900/40 animate-pulse transition-all"
            title={`${criticalCount} nó(s) com temperatura >85°C ou VRAM >90%. Clique para abrir o cluster.`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span>{criticalCount} {criticalCount === 1 ? 'Nó Crítico' : 'Nós Críticos'}</span>
          </button>
        )}

        {/* Status do Motor */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              onlineCount > 0 ? 'bg-emerald-400' : 'bg-rose-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              onlineCount > 0 ? 'bg-emerald-400' : 'bg-rose-400'
            }`} />
          </span>
          <span className="font-semibold text-white/90">
            {onlineCount > 0 ? `${onlineCount}/${totalCount} Nós Ativos` : 'Aguardando Servos'}
          </span>
        </div>

        {/* Botão de Modo Economia de Energia */}
        <button
          id="topbar-powersave-btn"
          onClick={onTogglePowerSave}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
            powerSaveMode
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
          }`}
          title={
            powerSaveMode
              ? 'Modo Economia ATIVO: telemetria a cada 10s e animações reduzidas. Clique para desativar.'
              : 'Modo Normal (2.5s). Clique para ativar o Modo Economia de Energia (10s e menos CPU/GPU).'
          }
        >
          <Leaf className={`w-3.5 h-3.5 ${powerSaveMode ? 'text-emerald-400' : 'text-white/60'}`} />
          <span className="hidden sm:inline">{powerSaveMode ? 'Eco: 10s' : 'Eco Mode'}</span>
        </button>

        {/* Botão de Emparelhamento Rápido */}
        <button
          id="topbar-pair-btn"
          onClick={onOpenPairing}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Gerar código de 6 dígitos para conectar celulares ou PCs"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Emparelhar</span> 6 Dígitos
        </button>

        {/* Botão de Atualizar */}
        <button
          id="topbar-refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors text-xs flex items-center justify-center disabled:opacity-50"
          title="Atualizar telemetria do cluster"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        {/* Theme Toggle Button */}
        <button
          id="topbar-theme-btn"
          onClick={() => {
            const themes: AppTheme[] = ['dark', 'midnight', 'forest', 'light'];
            const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
            onThemeChange(themes[nextIdx]);
          }}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors text-xs flex items-center gap-1.5"
          title={`Tema atual: ${theme}. Clique para alternar.`}
        >
          {theme === 'light' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-300" />
          )}
          <span className="text-[11px] font-mono capitalize hidden lg:inline">{theme}</span>
        </button>
      </div>
    </header>
  );
};

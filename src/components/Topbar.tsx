import React from 'react';
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
  Zap
} from 'lucide-react';
import { AppTheme, AppView } from '../types';

interface TopbarProps {
  currentView: AppView;
  onlineCount: number;
  totalCount: number;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  powerSaveMode: boolean;
  onTogglePowerSave: () => void;
  onOpenPairing: () => void;
  onRefresh: () => void;
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
  theme,
  onThemeChange,
  powerSaveMode,
  onTogglePowerSave,
  onOpenPairing,
  onRefresh,
  isRefreshing,
}) => {
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

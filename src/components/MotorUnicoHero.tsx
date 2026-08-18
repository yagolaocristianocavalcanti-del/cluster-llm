import React from 'react';
import { 
  Cpu, 
  HardDrive, 
  Zap, 
  Activity, 
  Plus, 
  Sparkles, 
  Dumbbell,
  ShieldCheck,
  Smartphone,
  Layers,
  Flame
} from 'lucide-react';
import { ClusterMetricsSummary, ClusterNode } from '../types';

interface MotorUnicoHeroProps {
  summary: ClusterMetricsSummary;
  nodes: ClusterNode[];
  onOpenPairing: () => void;
  onGoInference: () => void;
  onGoFinetune: () => void;
}

export const MotorUnicoHero: React.FC<MotorUnicoHeroProps> = ({
  summary,
  nodes,
  onOpenPairing,
  onGoInference,
  onGoFinetune,
}) => {
  return (
    <div
      id="motor-unico-container"
      className="relative overflow-hidden rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/15 p-6 md:p-8 shadow-2xl shadow-black/20 transition-all"
    >
      {/* Decorative Glow Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header do Motor */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            Motor Único de IA • V3 Zero-Touch
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Supercomputador Virtual Distribuído
          </h2>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Todos os seus celulares Android, PCs Windows e Linux unificados em uma única máquina de inferência e treinamento.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="motor-hero-pair-btn"
            onClick={onOpenPairing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs md:text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Conectar Novo Nó
          </button>
          <button
            id="motor-hero-inference-btn"
            onClick={onGoInference}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-400/30 font-semibold text-xs md:text-sm backdrop-blur-md shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Zap className="w-4 h-4 text-indigo-200" />
            Inferência
          </button>
          <button
            id="motor-hero-finetune-btn"
            onClick={onGoFinetune}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 font-semibold text-xs md:text-sm backdrop-blur-md transition-all"
          >
            <Dumbbell className="w-4 h-4 text-amber-300" />
            Fine-Tuning
          </button>
        </div>
      </div>

      {/* Main Core & Metrics Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
        {/* Visual Central Core Circle */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4">
          <div className="relative flex items-center justify-center">
            {/* Outer Orbit Rings */}
            <div className="absolute w-44 h-44 rounded-full border border-dashed border-indigo-400/30 animate-[spin_20s_linear_infinite]" />
            <div className="absolute w-36 h-36 rounded-full border border-indigo-300/20 animate-[spin_12s_linear_infinite_reverse]" />
            
            {/* Core Circle */}
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-950 via-indigo-900 to-violet-800 border-2 border-indigo-400/60 flex flex-col items-center justify-center shadow-2xl shadow-indigo-500/40 z-10">
              <span className="text-3xl font-black text-white font-mono tracking-tight">
                {summary.online_nodes}
              </span>
              <span className="text-[10px] uppercase font-bold text-indigo-200/80 tracking-wider">
                Nós Ativos
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Cluster {summary.cluster_health_pct}% Operacional
            </div>
            <p className="text-xs text-white/50 mt-1.5 font-mono">
              {summary.total_cores} Cores Totais • {nodes.filter(n => n.transport === 'termux' || n.transport === 'usb').length} Celulares Conectados
            </p>
          </div>
        </div>

        {/* Aggregated Stats Cards */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Card 1: CPU Total */}
          <div className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex flex-col justify-between hover:bg-white/[0.07] transition-all">
            <div className="flex items-center justify-between text-white/60 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">CPU Total</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="my-1">
              <span className="text-2xl font-black text-white font-mono">
                {summary.avg_cpu_pct}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.avg_cpu_pct}%` }}
              />
            </div>
            <span className="text-[11px] text-white/50 mt-1 font-mono">
              {summary.total_cores} Núcleos
            </span>
          </div>

          {/* Card 2: RAM Total */}
          <div className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex flex-col justify-between hover:bg-white/[0.07] transition-all">
            <div className="flex items-center justify-between text-white/60 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">RAM Total</span>
              <HardDrive className="w-4 h-4 text-violet-400" />
            </div>
            <div className="my-1">
              <span className="text-2xl font-black text-white font-mono">
                {summary.total_ram_gb} <span className="text-xs font-normal text-white/50">GB</span>
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-violet-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.avg_ram_pct}%` }}
              />
            </div>
            <span className="text-[11px] text-white/50 mt-1 font-mono truncate">
              {summary.used_ram_gb.toFixed(1)} GB em uso ({summary.avg_ram_pct}%)
            </span>
          </div>

          {/* Card 3: Aceleração GPU / VRAM */}
          <div className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex flex-col justify-between hover:bg-white/[0.07] transition-all">
            <div className="flex items-center justify-between text-white/60 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">GPU / VRAM</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-1">
              <span className="text-2xl font-black text-amber-200 font-mono">
                {summary.total_vram_gb} <span className="text-xs font-normal text-white/50">GB</span>
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${summary.avg_gpu_pct}%` }}
              />
            </div>
            <span className="text-[11px] text-white/50 mt-1 font-mono">
              Carga Média: {summary.avg_gpu_pct}%
            </span>
          </div>

          {/* Card 4: Throughput */}
          <div className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex flex-col justify-between hover:bg-white/[0.07] transition-all">
            <div className="flex items-center justify-between text-white/60 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Throughput</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-1">
              <span className="text-2xl font-black text-emerald-300 font-mono">
                ~{summary.estimated_throughput_tps}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(summary.estimated_throughput_tps * 2, 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-white/50 mt-1 font-mono">
              tokens por segundo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

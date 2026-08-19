import React from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Zap, 
  Server, 
  Smartphone, 
  Monitor, 
  Play, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  Layers,
  Flame
} from 'lucide-react';
import { ClusterMetricsSummary, ClusterNode, ModelItem, TaskItem, AppView } from '../types';
import { MotorUnicoHero } from './MotorUnicoHero';

interface DashboardViewProps {
  summary: ClusterMetricsSummary;
  nodes: ClusterNode[];
  models: ModelItem[];
  tasks: TaskItem[];
  cpuHistory: number[];
  ramHistory: number[];
  onOpenPairing: () => void;
  onNavigate: (view: AppView) => void;
  onQuickInference: (modelName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  nodes,
  models,
  tasks,
  cpuHistory,
  ramHistory,
  onOpenPairing,
  onNavigate,
  onQuickInference,
}) => {
  const installedModels = models.filter((m) => m.installed);
  const recentTasks = tasks.slice(0, 4);

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="view-dashboard">
      {/* 1. Hero do Motor Único */}
      <MotorUnicoHero
        summary={summary}
        nodes={nodes}
        onOpenPairing={onOpenPairing}
        onGoInference={() => onNavigate('inference')}
        onGoFinetune={() => onNavigate('finetune')}
      />

      {/* 2. Grid de Telemetria e Carga em Tempo Real */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráficos de Histórico de Carga CPU / RAM */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 backdrop-blur-md">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Telemetria de Carga em Tempo Real</h3>
                <p className="text-xs text-white/50">Oscilação sincronizada de todos os nós (amostragem 1s)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-indigo-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" /> CPU: {summary.avg_cpu_pct}%
              </span>
              <span className="flex items-center gap-1 text-violet-300">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" /> RAM: {summary.avg_ram_pct}%
              </span>
            </div>
          </div>

          {/* Canvas-like Visualizador SVG */}
          <div className="h-44 w-full relative bg-black/30 rounded-2xl p-3 border border-white/10 overflow-hidden flex flex-col justify-end backdrop-blur-md">
            <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
              <div className="border-b border-white/20 w-full" />
              <div className="border-b border-white/20 w-full" />
              <div className="border-b border-white/20 w-full" />
            </div>

            {/* Barras de Histórico */}
            <div className="flex items-end justify-between gap-1.5 h-32 z-10">
              {cpuHistory.map((cpuVal, idx) => {
                const ramVal = ramHistory[idx] || 30;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex gap-0.5 items-end justify-center h-full">
                      {/* Barra CPU */}
                      <div
                        className="w-1/2 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all duration-300 group-hover:brightness-125 shadow-sm shadow-indigo-500/20"
                        style={{ height: `${Math.max(cpuVal, 5)}%` }}
                        title={`CPU: ${cpuVal}%`}
                      />
                      {/* Barra RAM */}
                      <div
                        className="w-1/2 bg-gradient-to-t from-violet-600 to-violet-400 rounded-t transition-all duration-300 group-hover:brightness-125 shadow-sm shadow-violet-500/20"
                        style={{ height: `${Math.max(ramVal, 5)}%` }}
                        title={`RAM: ${ramVal}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-[10px] text-white/50 font-mono mt-2 pt-1 border-t border-white/10">
              <span>-30s atrás</span>
              <span>-15s atrás</span>
              <span className="text-indigo-300 font-bold">Agora (Live)</span>
            </div>
          </div>

          {/* Breakdown por Dispositivo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-white/10">
            {nodes.slice(0, 4).map((node) => (
              <div key={node.node_id} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition-all">
                <div className="flex items-center justify-between text-[11px] font-semibold text-white/90 truncate">
                  <span className="truncate">{node.device_name.split(' ')[0]}</span>
                  <span className="text-indigo-300 font-mono">{node.cpu_usage}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-400 h-full rounded-full transition-all"
                    style={{ width: `${node.cpu_usage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição de Memória e Shards */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 backdrop-blur-md">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white">Memória por Dispositivo</h3>
              </div>
              <button 
                onClick={() => onNavigate('cluster')}
                className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {nodes.map((node) => (
                <div key={node.node_id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition-all">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-white flex items-center gap-1.5 truncate">
                      {node.platform === 'Android' ? (
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Monitor className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{node.device_name}</span>
                    </span>
                    <span className="font-mono text-white/60 text-[11px]">
                      {node.ram_used_gb.toFixed(1)} / {node.ram_total_gb} GB
                    </span>
                  </div>

                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        node.ram_usage > 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-400 to-violet-400'
                      }`}
                      style={{ width: `${node.ram_usage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-white/50 mt-1.5 font-mono">
                    <span>{node.backend_type}</span>
                    <span className={node.status === 'online' ? 'text-emerald-400' : 'text-white/40'}>
                      ● {node.latency_ms}ms latência
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 mt-4 flex items-center gap-2.5 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>Divisão inteligente de camadas LoRA e KV Cache ativa entre todos os nós.</span>
          </div>
        </div>
      </div>

      {/* 3. Seção: Modelos Prontos & Tarefas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Modelos Instalados Prontos */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">Modelos Carregados no Motor</h3>
            </div>
            <button
              onClick={() => onNavigate('models')}
              className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              Catálogo completo <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {installedModels.map((model) => (
              <div
                key={model.id}
                className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.08] transition-all flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white truncate">{model.display}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {model.quantization}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 truncate mt-0.5">{model.description}</p>
                </div>

                <button
                  onClick={() => onQuickInference(model.name)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-slate-900 text-xs font-bold border border-white/15 transition-all flex-shrink-0 group-hover:scale-105 shadow-md"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Testar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Fila de Tarefas Recentes */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-violet-400" />
              <h3 className="font-bold text-sm text-white">Tarefas & Histórico do Cluster</h3>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              Ver todas ({tasks.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentTasks.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
              <Clock className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white/70">Nenhuma tarefa em execução</p>
              <p className="text-xs text-white/40 mt-1">Inicie uma inferência ou treinamento LoRA para ver o histórico em tempo real.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTasks.map((task) => (
                <div
                  key={task.task_id}
                  className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 hover:bg-white/[0.07] transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white capitalize">
                        {task.task_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">#{task.task_id}</span>
                    </div>
                    <p className="text-[11px] text-white/50 truncate mt-0.5">
                      {task.params.model || task.params.model_name || task.params.dataset_name || 'Execução distribuída'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-white/50 block">{task.progress}%</span>
                      <div className="w-16 bg-white/10 rounded-full h-1 mt-0.5 overflow-hidden">
                        <div
                          className="bg-indigo-400 h-full rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>

                    {task.status === 'completed' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        Concluído
                      </span>
                    )}
                    {task.status === 'running' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 animate-pulse">
                        Em Execução
                      </span>
                    )}
                    {task.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

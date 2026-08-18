import React, { useState } from 'react';
import { 
  ListOrdered, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  StopCircle, 
  Terminal, 
  Calendar, 
  Layers, 
  Server, 
  FileText,
  Search
} from 'lucide-react';
import { TaskItem, TaskStatus, TaskType } from '../types';

interface TasksViewProps {
  tasks: TaskItem[];
  onCancelTask: (taskId: string) => void;
  onRefreshTasks: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onCancelTask,
  onRefreshTasks,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTaskForLogs, setSelectedTaskForLogs] = useState<TaskItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.task_id.toLowerCase().includes(q) ||
        t.task_type.toLowerCase().includes(q) ||
        (t.params.model && t.params.model.toLowerCase().includes(q)) ||
        (t.params.dataset_name && t.params.dataset_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 backdrop-blur-md">
            <CheckCircle2 className="w-3 h-3" /> Concluído
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 animate-pulse backdrop-blur-md">
            <RotateCw className="w-3 h-3 animate-spin" /> Em Execução
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 backdrop-blur-md">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs font-bold border border-white/10 backdrop-blur-md">
            Cancelado
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 backdrop-blur-md">
            <AlertCircle className="w-3 h-3" /> Falhou
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="view-tasks">
      {/* Header & Filter Controls */}
      <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-indigo-400" />
              Fila de Tarefas do Cluster ({tasks.length} Total)
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Acompanhe benchmarks, jobs de fine-tuning, downloads e inferências distribuídas
            </p>
          </div>

          <button
            onClick={onRefreshTasks}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition-all self-start sm:self-auto backdrop-blur-md"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Atualizar Fila
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ID, modelo ou parâmetros da tarefa..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 backdrop-blur-md"
            />
          </div>

          <div className="flex rounded-full bg-black/30 p-1 border border-white/10 overflow-x-auto backdrop-blur-md">
            {['all', 'running', 'completed', 'pending', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                  filterStatus === st ? 'bg-white text-slate-950 font-bold shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                {st === 'all' ? 'Todas' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.task_id}
              className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 hover:border-indigo-400/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
            >
              {/* Task Details */}
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-sm text-white capitalize">
                    {task.task_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-300 border border-white/10">
                    #{task.task_id}
                  </span>
                  {getStatusBadge(task.status)}
                </div>

                <div className="text-xs text-white/70 font-mono flex items-center gap-3 flex-wrap">
                  {task.params.model && <span>Modelo: <strong className="text-indigo-200">{task.params.model}</strong></span>}
                  {task.params.dataset_name && <span>Dataset: <strong className="text-amber-300">{task.params.dataset_name}</strong></span>}
                  <span>Nós: <strong>{task.assigned_nodes.length || 'Auto'}</strong></span>
                </div>

                <div className="text-[11px] text-white/40 flex items-center gap-2">
                  <span>Criado: {new Date(task.created_at).toLocaleTimeString()}</span>
                  {task.finished_at && <span>• Finalizado: {new Date(task.finished_at).toLocaleTimeString()}</span>}
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="w-32 text-right">
                  <div className="text-xs font-mono font-bold text-white/90 mb-1">
                    {task.progress}%
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-indigo-400 to-violet-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTaskForLogs(task)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white hover:text-slate-900 text-white border border-white/15 text-xs font-bold transition-all shadow-sm"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Logs
                  </button>

                  {(task.status === 'running' || task.status === 'pending') && (
                    <button
                      onClick={() => onCancelTask(task.task_id)}
                      className="p-2 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs transition-colors border border-rose-500/30"
                      title="Cancelar tarefa"
                    >
                      <StopCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 text-white/40 text-sm">
            Nenhuma tarefa encontrada com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Modal Logs da Tarefa */}
      {selectedTaskForLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Logs da Tarefa #{selectedTaskForLogs.task_id} ({selectedTaskForLogs.task_type})
                  </h3>
                  <p className="text-xs text-white/50 font-mono">Status: {selectedTaskForLogs.status} • {selectedTaskForLogs.progress}%</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTaskForLogs(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/40 rounded-2xl p-4 font-mono text-xs text-emerald-300 h-72 overflow-y-auto border border-white/10 space-y-1.5 backdrop-blur-md">
              {selectedTaskForLogs.logs.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTaskForLogs(null)}
                className="px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-lg transition-all"
              >
                Fechar Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

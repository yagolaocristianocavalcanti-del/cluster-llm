import React, { useState } from 'react';
import { 
  Smartphone, 
  Monitor, 
  RotateCw, 
  CheckCircle2, 
  ExternalLink, 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Terminal,
  Layers,
  Sparkles
} from 'lucide-react';
import { ClusterNode } from '../types';

interface ServoMiniDashViewProps {
  nodes: ClusterNode[];
}

export const ServoMiniDashViewProps: React.FC<ServoMiniDashViewProps> = ({ nodes }) => {
  const [selectedNodeId, setSelectedNodeId] = useState(nodes[1]?.node_id || nodes[0]?.node_id);
  const selectedNode = nodes.find((n) => n.node_id === selectedNodeId) || nodes[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="view-servodash">
      {/* Header Info */}
      <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl shadow-black/20">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            Mini-Dashboard Ultra-Leve do Servo (Porta :5001)
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Interface web que roda em background em cada celular Android ou PC secundário conectado
          </p>
        </div>

        {/* Node Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60 font-semibold">Visualizar Servo:</span>
          <select
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            className="px-4 py-2 rounded-2xl bg-black/30 border border-white/15 text-xs text-indigo-200 font-bold focus:outline-none focus:border-indigo-400 backdrop-blur-md"
          >
            {nodes.map((n) => (
              <option key={n.node_id} value={n.node_id} className="bg-slate-900 text-white">
                {n.device_name} ({n.platform})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulador Central de Visualização do Servo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Mockup do Mini Dashboard (Estilo Terminal / Mobile) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-white/15 p-7 shadow-2xl text-center space-y-5">
            {/* Header Mini Dash */}
            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mx-auto flex items-center justify-center mb-3 shadow-lg">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">LLM Cluster — Servo</h3>
              <p className="text-xs font-mono text-white/50 mt-0.5">
                {selectedNode.device_name} ({selectedNode.platform} • {selectedNode.arch})
              </p>
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ● Conectado ao Mestre (:5000)
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-1">
                  CPU
                </span>
                <span className="text-2xl font-black text-indigo-300 font-mono">
                  {selectedNode.cpu_usage}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-1">
                  RAM
                </span>
                <span className="text-2xl font-black text-violet-300 font-mono">
                  {selectedNode.ram_usage}%
                </span>
              </div>
            </div>

            {/* Backend & Shard Status */}
            <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-left text-xs font-mono space-y-1.5 text-white/80 backdrop-blur-md">
              <div className="flex justify-between">
                <span className="text-white/40">Daemon:</span>
                <span className="text-indigo-300 font-semibold">{selectedNode.backend_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Latência:</span>
                <span className="text-emerald-300 font-semibold">{selectedNode.latency_ms}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Shards Atribuídos:</span>
                <span className="text-amber-300 font-semibold">{selectedNode.assigned_shards?.join(', ') || 'Nenhum'}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 text-xs text-white/40 border-t border-white/10">
              Rodando em background via Termux / Socket.IO client
            </div>
          </div>
        </div>

        {/* Right Explanations */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-3 shadow-2xl shadow-black/20">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Como Funciona o Mini-Dashboard Ultra-Leve?
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Nos dispositivos escravos (como celulares com Android no Termux ou PCs Windows em segundo plano), o script <code className="text-indigo-300 font-mono bg-white/10 px-1.5 py-0.5 rounded-lg border border-white/10">worker.py</code> sobe um servidor web mínimo na porta <strong>5001</strong> com consumo quase nulo de memória.
            </p>
            <ul className="text-xs text-white/70 space-y-2 list-disc pl-4">
              <li>Permite ao usuário abrir o navegador no próprio celular (<code className="text-indigo-300 font-mono bg-white/10 px-1 rounded">http://localhost:5001</code>) e verificar se o aparelho está de fato operando no cluster.</li>
              <li>Recebe comandos automáticos de download de dependências (Ollama / llama.cpp) disparados pelo Master.</li>
              <li>Envia batimentos cardíacos (heartbeat) a cada 5 segundos com métricas de CPU, RAM e bateria.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

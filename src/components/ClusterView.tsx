import React, { useState } from 'react';
import { 
  Network, 
  Smartphone, 
  Monitor, 
  Plus, 
  RotateCw, 
  KeyRound, 
  Layers, 
  Trash2, 
  Activity, 
  Terminal, 
  Flame, 
  Battery, 
  Cpu, 
  HardDrive,
  Download,
  Wifi,
  Usb,
  ShieldCheck,
  Zap,
  Play,
  Gauge,
  ShieldAlert
} from 'lucide-react';
import { ClusterNode, TransportType } from '../types';

interface ClusterViewProps {
  nodes: ClusterNode[];
  onOpenPairing: () => void;
  onScanCluster: () => void;
  onPushDependencies: (nodeIds?: string[]) => void;
  onAddManualNode: (address: string, port: number, name: string) => void;
  onRemoveNode: (nodeId: string) => void;
  onBenchmarkNode: (nodeId: string) => void;
  onEmergencyIntervene?: (nodeId: string) => void;
  onSimulateCriticalNode?: (nodeId?: string) => void;
  onOpenBenchmark?: () => void;
  onOpenLoadBalancer?: () => void;
  isScanning: boolean;
}

export const ClusterView: React.FC<ClusterViewProps> = ({
  nodes,
  onOpenPairing,
  onScanCluster,
  onPushDependencies,
  onAddManualNode,
  onRemoveNode,
  onBenchmarkNode,
  onEmergencyIntervene,
  onSimulateCriticalNode,
  onOpenBenchmark,
  onOpenLoadBalancer,
  isScanning,
}) => {
  const [filterTransport, setFilterTransport] = useState<string>('all');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [manualPort, setManualPort] = useState('5001');
  const [manualName, setManualName] = useState('');
  const [selectedNodeLogs, setSelectedNodeLogs] = useState<ClusterNode | null>(null);

  const filteredNodes = nodes.filter((n) => {
    if (filterTransport === 'all') return true;
    if (filterTransport === 'android') return n.platform === 'Android' || n.transport === 'termux' || n.transport === 'usb';
    if (filterTransport === 'windows') return n.platform === 'Windows';
    if (filterTransport === 'linux') return n.platform === 'Linux';
    return n.transport === filterTransport;
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp) return;
    onAddManualNode(manualIp, parseInt(manualPort) || 5001, manualName || `Nó ${manualIp}`);
    setShowManualModal(false);
    setManualIp('');
    setManualName('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="view-cluster">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Network className="w-5 h-5 text-indigo-400" />
            Topologia do Cluster ({nodes.length} Dispositivos Registrados)
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Gerencie e monitore cada servo via Socket.IO, Wi-Fi local e USB/ADB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenBenchmark && (
            <button
              onClick={onOpenBenchmark}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg transition-all"
              title="Executa micro-benchmarking de 30s nos nós conectados para medir FLOPS e sugerir divisão de camadas"
            >
              <Gauge className="w-4 h-4" />
              Diagnóstico de Performance
            </button>
          )}

          {onOpenLoadBalancer && (
            <button
              onClick={onOpenLoadBalancer}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-semibold backdrop-blur-md transition-all shadow-sm"
              title="Configurar failover e auto-relocação de shards"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Load Balancer
            </button>
          )}

          <button
            onClick={onOpenPairing}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg transition-all"
          >
            <KeyRound className="w-4 h-4" />
            Código 6 Dígitos
          </button>

          <button
            onClick={onScanCluster}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-400/30 text-xs font-semibold backdrop-blur-md transition-all disabled:opacity-50"
            title="Escanear rede local e conexões USB via ADB"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-white' : ''}`} />
            {isScanning ? 'Varrendo...' : 'Escanear ADB/Rede'}
          </button>

          <button
            onClick={() => onPushDependencies()}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold backdrop-blur-md transition-all"
            title="Enviar pacotes Ollama e llama.cpp para todos os nós"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            Auto-Setup Ollama
          </button>

          {onSimulateCriticalNode && (
            <button
              onClick={() => onSimulateCriticalNode()}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-semibold backdrop-blur-md transition-all shadow-sm"
              title="Injetar telemetria de sobrecarga (>85°C / 94% VRAM) para testar o sistema de alerta e intervenção"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400 fill-current" />
              Simular Carga Crítica
            </button>
          )}

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold backdrop-blur-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            IP Manual
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `Todos (${nodes.length})` },
          { id: 'android', label: `Android / Termux (${nodes.filter(n => n.platform === 'Android').length})` },
          { id: 'windows', label: `Windows (${nodes.filter(n => n.platform === 'Windows').length})` },
          { id: 'linux', label: `Linux (${nodes.filter(n => n.platform === 'Linux').length})` },
          { id: 'usb', label: `USB / ADB (${nodes.filter(n => n.transport === 'usb').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTransport(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all backdrop-blur-md ${
              filterTransport === tab.id
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid de Cards dos Nós */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredNodes.map((node) => {
          const isCritical = (node.temperature_c ?? 0) > 85 || (node.gpu_usage ?? 0) > 90 || (node.ram_usage ?? 0) > 90;

          return (
            <div
              key={node.node_id}
              className={`rounded-3xl backdrop-blur-xl border transition-all p-5 flex flex-col justify-between shadow-xl relative overflow-hidden ${
                isCritical
                  ? 'bg-rose-950/30 border-rose-500/80 shadow-rose-950/70 ring-2 ring-rose-500/40'
                  : node.is_master
                  ? 'bg-white/[0.05] border-indigo-400/50 shadow-indigo-500/10'
                  : node.status === 'online'
                  ? 'bg-white/[0.05] border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                  : 'bg-white/[0.05] border-rose-500/20 opacity-70'
              }`}
            >
              {/* Top Row: Device Icon, Name, Platform, Status */}
              <div>
                {/* Banner de Condição Crítica */}
                {isCritical && (
                  <div className="mb-3.5 p-3 rounded-2xl bg-rose-950/90 border border-rose-500/70 text-rose-200 flex items-center justify-between gap-2 shadow-lg animate-pulse">
                    <div className="flex items-center gap-2 min-w-0">
                      <Flame className="w-4 h-4 text-rose-400 flex-shrink-0 animate-bounce" />
                      <span className="text-xs font-black uppercase tracking-wider text-rose-200 truncate">
                        Sobrecarga Crítica (&gt;90% ou &gt;85°C)
                      </span>
                    </div>
                    {onEmergencyIntervene && (
                      <button
                        onClick={() => onEmergencyIntervene(node.node_id)}
                        className="px-3 py-1 rounded-full bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-md shadow-rose-600/30 flex-shrink-0 transition-transform active:scale-95"
                      >
                        <Zap className="w-3 h-3 fill-current" /> Intervir
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                        : node.is_master
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : node.platform === 'Android'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    }`}>
                      {node.platform === 'Android' ? (
                        <Smartphone className="w-6 h-6" />
                      ) : (
                        <Monitor className="w-6 h-6" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-white truncate">{node.device_name}</h3>
                        {node.is_master && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500 text-white shadow-sm">
                            MASTER
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-white/50 flex items-center gap-2 mt-0.5">
                        <span>{node.address}:{node.port}</span>
                        <span>•</span>
                        <span className="text-white/70">{node.arch}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      isCritical
                        ? 'bg-rose-500/30 text-rose-200 border-rose-500/60 animate-pulse'
                        : node.status === 'online'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      ● {isCritical ? 'CRÍTICO' : node.status}
                    </span>
                    <span className="text-[10px] font-mono text-white/50 flex items-center gap-1">
                      {node.transport === 'usb' ? <Usb className="w-3 h-3 text-amber-300" /> : <Wifi className="w-3 h-3 text-indigo-300" />}
                      {node.transport.toUpperCase()}
                    </span>
                  </div>
                </div>

              {/* Badges Extras (GPU, Bateria, Backend) */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {node.gpu_name && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/30 text-[10px] font-mono truncate max-w-full">
                    🎮 {node.gpu_name}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/15 text-[10px] font-mono">
                  ⚙️ {node.backend_type}
                </span>
                {node.battery_pct !== undefined && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                    <Battery className="w-3 h-3" /> {node.battery_pct}%
                  </span>
                )}
                {node.temperature_c && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-mono flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {node.temperature_c}°C
                  </span>
                )}
              </div>

              {/* Telemetry Metrics Progress Bars */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-md">
                {/* CPU */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/60 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" /> CPU
                    </span>
                    <span className="font-mono text-indigo-300 font-bold">{node.cpu_usage}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-400 h-full rounded-full transition-all"
                      style={{ width: `${node.cpu_usage}%` }}
                    />
                  </div>
                </div>

                {/* RAM */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/60 flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-violet-400" /> RAM ({node.ram_used_gb.toFixed(1)} / {node.ram_total_gb} GB)
                    </span>
                    <span className="font-mono text-violet-300 font-bold">{node.ram_usage}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-violet-400 h-full rounded-full transition-all"
                      style={{ width: `${node.ram_usage}%` }}
                    />
                  </div>
                </div>

                {/* GPU (se houver) */}
                {node.gpu_usage > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/60 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-400" /> GPU Load
                      </span>
                      <span className="font-mono text-amber-200 font-bold">{node.gpu_usage}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all"
                        style={{ width: `${node.gpu_usage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/10">
              <span className="text-[11px] font-mono text-white/50">
                Ping: <strong className="text-emerald-400">{node.latency_ms}ms</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onBenchmarkNode(node.node_id)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white hover:text-slate-900 text-white text-xs transition-all shadow-sm"
                  title="Executar Benchmark Rápido"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setSelectedNodeLogs(node)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white hover:text-slate-900 text-white text-xs transition-all shadow-sm"
                  title="Ver Terminal e Logs do Nó"
                >
                  <Terminal className="w-3.5 h-3.5" />
                </button>

                {!node.is_master && (
                  <button
                    onClick={() => onRemoveNode(node.node_id)}
                    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-xs transition-all shadow-sm border border-rose-500/30"
                    title="Remover nó do cluster"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>

      {/* Modal Adicionar Nó Manual */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a]/90 backdrop-blur-2xl border border-white/15 p-6 shadow-2xl text-white">
            <h3 className="font-bold text-base text-white mb-1">Adicionar Nó Manualmente</h3>
            <p className="text-xs text-white/50 mb-4">Insira o endereço IP e porta do servo na rede local</p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">Nome do Dispositivo</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Ex: Xiaomi Redmi Termux"
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-white/80 block mb-1">Endereço IP</label>
                  <input
                    type="text"
                    required
                    value={manualIp}
                    onChange={(e) => setManualIp(e.target.value)}
                    placeholder="192.168.1.150"
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">Porta</label>
                  <input
                    type="number"
                    value={manualPort}
                    onChange={(e) => setManualPort(e.target.value)}
                    placeholder="5001"
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-5 py-2 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/15 border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/25"
                >
                  Conectar Nó
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Logs / Terminal do Nó */}
      {selectedNodeLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl bg-[#0f172a]/90 backdrop-blur-2xl border border-white/15 p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">{selectedNodeLogs.device_name}</h3>
                  <p className="text-xs text-white/50 font-mono">ID: {selectedNodeLogs.node_id} • {selectedNodeLogs.address}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNodeLogs(null)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/40 rounded-2xl p-4 font-mono text-xs text-emerald-300 h-64 overflow-y-auto border border-white/10 space-y-1.5 backdrop-blur-md">
              <div>[INFO] Conectado ao daemon Socket.IO do nó escravo.</div>
              <div>[HEARTBEAT] CPU: {selectedNodeLogs.cpu_usage}% | RAM: {selectedNodeLogs.ram_used_gb}GB/{selectedNodeLogs.ram_total_gb}GB</div>
              <div>[BACKEND] Executando backend: {selectedNodeLogs.backend_type} (versão compilada com OpenMP/CL)</div>
              <div>[NETWORK] Latência de roundtrip: {selectedNodeLogs.latency_ms}ms (Excelente para pipeline parallelism)</div>
              <div>[MEMORY] Alocação de Shards: {selectedNodeLogs.assigned_shards ? `Shards [${selectedNodeLogs.assigned_shards.join(', ')}]` : 'Standby aguardando job'}</div>
              <div>[STATUS] Dispositivo saudável. Sem throttled térmico detectado.</div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedNodeLogs(null)}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white hover:text-slate-900 text-white font-bold text-xs border border-white/10 transition-all"
              >
                Fechar Terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

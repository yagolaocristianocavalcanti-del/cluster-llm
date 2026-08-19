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
  ShieldAlert,
  TrendingUp,
  Radio,
  Cloud,
  Thermometer,
  Eye,
  AlertTriangle,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { ClusterNode, TransportType, DormantNodeWOL, CloudBurstInstanceConfig } from '../types';
import { AutoScalingModal } from './AutoScalingModal';

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
  onSyncAllDevices?: () => Promise<void> | void;
  onPingAllNodes?: () => Promise<void> | void;
  onPushShards?: (model?: string, totalLayers?: number) => Promise<void> | void;
  onTriggerWOL?: (dormantNode: DormantNodeWOL) => Promise<boolean>;
  onSpawnCloudNode?: (config: CloudBurstInstanceConfig) => Promise<boolean>;
  onTerminateCloudNode?: (nodeId: string) => Promise<boolean>;
  autoScaleEnabled?: boolean;
  onToggleAutoScale?: (enabled: boolean) => void;
  autoSyncActive?: boolean;
  onToggleAutoSync?: () => void;
  lastSyncTime?: string;
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
  onSyncAllDevices,
  onPingAllNodes,
  onPushShards,
  onTriggerWOL,
  onSpawnCloudNode,
  onTerminateCloudNode,
  autoScaleEnabled = true,
  onToggleAutoScale,
  autoSyncActive = true,
  onToggleAutoSync,
  lastSyncTime,
  isScanning,
}) => {
  const [filterTransport, setFilterTransport] = useState<string>('all');
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAutoScalingModal, setShowAutoScalingModal] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [manualPort, setManualPort] = useState('5001');
  const [manualName, setManualName] = useState('');
  const [selectedNodeLogs, setSelectedNodeLogs] = useState<ClusterNode | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [isSharding, setIsSharding] = useState(false);

  // Estados do Heatmap Overlay / Cluster Health View
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [heatmapMetric, setHeatmapMetric] = useState<'combined' | 'thermal' | 'ram' | 'gpu'>('combined');

  const onlineNodes = nodes.filter((n) => n.status === 'online');
  const cloudNodes = onlineNodes.filter((n) => n.node_id.startsWith('cloud_'));
  
  // Cálculo de Carga Média e Demanda
  const avgCpu = onlineNodes.length > 0
    ? Math.round(onlineNodes.reduce((acc, n) => acc + (n.cpu_usage || 0), 0) / onlineNodes.length)
    : 0;
  const avgRam = onlineNodes.length > 0
    ? Math.round(onlineNodes.reduce((acc, n) => acc + (n.ram_usage || 0), 0) / onlineNodes.length)
    : 0;
  const demandScore = Math.min(100, Math.round(avgCpu * 0.5 + avgRam * 0.5));
  const isHighDemand = demandScore >= 75 || avgCpu >= 75;

  // Helpers do Heatmap & Stress
  const getNodeTemp = (node: ClusterNode): number => {
    if (node.temperature_c !== undefined) return node.temperature_c;
    if (node.cpu_usage > 80) return 76;
    if (node.cpu_usage > 50) return 58;
    return 42;
  };

  const getNodeStress = (node: ClusterNode): number => {
    const temp = getNodeTemp(node);
    const tempStress = Math.min(100, Math.max(0, Math.round(((temp - 30) / (90 - 30)) * 100)));
    const ramStress = node.ram_usage || 0;
    const gpuStress = node.gpu_usage || 0;
    return Math.round(tempStress * 0.45 + ramStress * 0.35 + gpuStress * 0.20);
  };

  const getNodeHealthScore = (node: ClusterNode): number => {
    if (node.status !== 'online') return 0;
    const stress = getNodeStress(node);
    return Math.max(0, Math.min(100, 100 - stress));
  };

  const getNodeHeatLevel = (node: ClusterNode, metric: 'combined' | 'thermal' | 'ram' | 'gpu'): 'cool' | 'warm' | 'hot' | 'critical' => {
    if (node.status !== 'online') return 'cool';
    if (metric === 'thermal') {
      const temp = getNodeTemp(node);
      if (temp >= 82) return 'critical';
      if (temp >= 70) return 'hot';
      if (temp >= 52) return 'warm';
      return 'cool';
    }
    if (metric === 'ram') {
      const ram = node.ram_usage || 0;
      if (ram >= 90) return 'critical';
      if (ram >= 80) return 'hot';
      if (ram >= 60) return 'warm';
      return 'cool';
    }
    if (metric === 'gpu') {
      const gpu = node.gpu_usage || 0;
      if (gpu >= 90) return 'critical';
      if (gpu >= 75) return 'hot';
      if (gpu >= 40) return 'warm';
      return 'cool';
    }
    // Combined
    const stress = getNodeStress(node);
    if (stress >= 80 || (node.temperature_c && node.temperature_c > 85)) return 'critical';
    if (stress >= 65) return 'hot';
    if (stress >= 42) return 'warm';
    return 'cool';
  };

  // Estatísticas de Saúde do Cluster
  const clusterAvgHealth = onlineNodes.length > 0
    ? Math.round(onlineNodes.reduce((acc, n) => acc + getNodeHealthScore(n), 0) / onlineNodes.length)
    : 100;
  const criticalCount = onlineNodes.filter(n => getNodeHeatLevel(n, heatmapMetric) === 'critical').length;
  const hotCount = onlineNodes.filter(n => getNodeHeatLevel(n, heatmapMetric) === 'hot').length;
  const warmCount = onlineNodes.filter(n => getNodeHeatLevel(n, heatmapMetric) === 'warm').length;
  const coolCount = onlineNodes.filter(n => getNodeHeatLevel(n, heatmapMetric) === 'cool').length;

  const handleSyncClick = async () => {
    if (!onSyncAllDevices || isSyncing) return;
    setIsSyncing(true);
    try {
      await onSyncAllDevices();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handlePingClick = async () => {
    if (!onPingAllNodes || isPinging) return;
    setIsPinging(true);
    try {
      await onPingAllNodes();
    } finally {
      setTimeout(() => setIsPinging(false), 500);
    }
  };

  const handlePushShardsClick = async () => {
    if (!onPushShards || isSharding) return;
    setIsSharding(true);
    try {
      await onPushShards();
    } finally {
      setTimeout(() => setIsSharding(false), 500);
    }
  };

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
          {/* Toggle Heatmap Overlay */}
          <button
            onClick={() => setHeatmapEnabled(!heatmapEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs shadow-lg transition-all border ${
              heatmapEnabled
                ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 text-white border-orange-300 shadow-orange-500/25 ring-2 ring-orange-400/40'
                : 'bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border-white/15 backdrop-blur-md'
            }`}
            title="Ativar/Desativar Heatmap de Saúde, Estresse Térmico e Saturação de RAM"
          >
            <Flame className={`w-4 h-4 ${heatmapEnabled ? 'text-amber-200 fill-current animate-pulse' : 'text-orange-400'}`} />
            Heatmap Saúde {heatmapEnabled ? '(LIGADO)' : '(DESLIGADO)'}
          </button>

          <button
            onClick={() => setShowAutoScalingModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs shadow-lg transition-all border ${
              isHighDemand
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white border-amber-300 animate-pulse shadow-amber-500/30 ring-2 ring-amber-400/40'
                : 'bg-indigo-500/20 hover:bg-indigo-500 text-indigo-200 hover:text-white border-indigo-500/40 backdrop-blur-md'
            }`}
            title="Auto-Scaling Inteligente: Despertar computadores via Wake-on-LAN ou instanciar nós GPU em nuvem"
          >
            <TrendingUp className={`w-4 h-4 ${isHighDemand ? 'animate-bounce text-amber-200' : 'text-indigo-400'}`} />
            Auto-Scaling & WOL
            {isHighDemand && (
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            )}
          </button>

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

      {/* Painel de Sincronização & Distribuição de Dispositivos */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/80 backdrop-blur-xl border border-indigo-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Zap className="w-5 h-5 fill-current text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Sincronização & Sharding em Tempo Real</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                  {onlineNodes.length}/{nodes.length} Conectados
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {lastSyncTime ? `Última sincronização completa às ${lastSyncTime}` : 'Dispositivos pareados via Socket.IO e REST heartbeat'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSyncAllDevices && (
              <button
                onClick={handleSyncClick}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Envia solicitação de sincronização e atualiza telemetria de todos os nós conectados"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Nós Agora'}
              </button>
            )}

            {onPingAllNodes && (
              <button
                onClick={handlePingClick}
                disabled={isPinging}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all backdrop-blur-md disabled:opacity-50"
                title="Mede latência roundtrip e estabilidade de conexão de cada dispositivo"
              >
                <Activity className={`w-3.5 h-3.5 text-emerald-400 ${isPinging ? 'animate-pulse' : ''}`} />
                {isPinging ? 'Medindo Ping...' : 'Testar Ping'}
              </button>
            )}

            {onPushShards && (
              <button
                onClick={handlePushShardsClick}
                disabled={isSharding}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-purple-600/80 hover:bg-purple-500 text-white border border-purple-400/30 font-semibold text-xs shadow-md transition-all disabled:opacity-50"
                title="Distribui proporcionalmente as camadas de tensores do modelo nos dispositivos"
              >
                <Layers className={`w-3.5 h-3.5 ${isSharding ? 'animate-spin' : ''}`} />
                {isSharding ? 'Distribuindo...' : 'Distribuir Camadas'}
              </button>
            )}

            {onToggleAutoSync && (
              <button
                onClick={onToggleAutoSync}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-mono font-semibold border transition-all ${
                  autoSyncActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                }`}
                title="Ativa o monitoramento contínuo de status dos nós a cada 10 segundos"
              >
                <span className={`w-2 h-2 rounded-full ${autoSyncActive ? 'bg-emerald-400 animate-ping' : 'bg-white/30'}`} />
                Auto-Sync: {autoSyncActive ? 'ATIVO (10s)' : 'PAUSADO'}
              </button>
            )}
          </div>
        </div>

        {/* Mapa Visual de Distribuição de Camadas (Shards Map) */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/60 mb-2">
            <span className="flex items-center gap-1.5 text-indigo-300 font-bold">
              <Layers className="w-3.5 h-3.5" />
              Mapa de Partição de Camadas (Tensor Shards V3)
            </span>
            <span>Total: 32 Camadas Alocadas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {nodes.map((node) => {
              const isOnline = node.status === 'online';
              const pingColor = (node.latency_ms ?? 20) < 15 ? 'text-emerald-400' : (node.latency_ms ?? 20) < 45 ? 'text-amber-400' : 'text-rose-400';

              return (
                <div
                  key={node.node_id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    isOnline
                      ? 'bg-white/[0.04] border-white/15'
                      : 'bg-white/[0.01] border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-400' : 'bg-white/30'}`} />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate text-[11px]">{node.name}</div>
                      <div className="text-[10px] text-indigo-300 font-mono">
                        {node.assigned_layers || 'Shards automáticos'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 font-mono text-[10px]">
                    <div className={pingColor}>{node.latency_ms ? `${node.latency_ms}ms` : '—'}</div>
                    <div className="text-white/40">{node.platform}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PAINEL HEATMAP OVERLAY & CLUSTER HEALTH MATRIX */}
      {/* ===================================================================== */}
      {heatmapEnabled && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900/90 via-purple-950/30 to-slate-900/90 backdrop-blur-xl border border-orange-500/40 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500/30 to-rose-500/30 border border-orange-400/40 text-orange-300 shadow-md">
                <HeartPulse className="w-5 h-5 text-orange-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    Heatmap de Saúde & Estresse Térmico do Cluster
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    clusterAvgHealth >= 75
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : clusterAvgHealth >= 50
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  }`}>
                    {clusterAvgHealth}% Saúde Global
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Visualização termográfica com gradiente espectral em tempo real de CPU, RAM e temperatura de junção
                </p>
              </div>
            </div>

            {/* Seletor de Métrica do Heatmap */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 self-start lg:self-auto">
              {[
                { id: 'combined', label: 'Saúde Global', icon: HeartPulse },
                { id: 'thermal', label: 'Estresse Térmico (°C)', icon: Thermometer },
                { id: 'ram', label: 'Saturação RAM (%)', icon: HardDrive },
                { id: 'gpu', label: 'Carga GPU (%)', icon: Flame },
              ].map((m) => {
                const IconComponent = m.icon;
                const isSelected = heatmapMetric === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setHeatmapMetric(m.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mini Matrix Termográfica dos Dispositivos (Heatmap Strip) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-white/60">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Matriz Térmica dos Nós ({onlineNodes.length} ativos):
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> {coolCount} Frios (&lt;50°C)
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> {warmCount} Morno
                </span>
                <span className="flex items-center gap-1 text-orange-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-orange-400" /> {hotCount} Aquecido
                </span>
                {criticalCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> {criticalCount} Crítico!
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {nodes.map((node) => {
                const heat = getNodeHeatLevel(node, heatmapMetric);
                const temp = getNodeTemp(node);
                const isOnline = node.status === 'online';
                
                const tileColor = !isOnline
                  ? 'bg-slate-900/60 border-white/5 text-white/30'
                  : heat === 'critical'
                  ? 'bg-rose-600 text-white border-rose-300 shadow-lg shadow-rose-600/50 animate-pulse ring-2 ring-rose-400'
                  : heat === 'hot'
                  ? 'bg-orange-500 text-white border-orange-300 shadow-md shadow-orange-500/40'
                  : heat === 'warm'
                  ? 'bg-amber-500/80 text-slate-950 border-amber-300'
                  : 'bg-emerald-600/80 text-white border-emerald-400/50';

                return (
                  <div
                    key={node.node_id}
                    className={`p-2 rounded-xl border flex flex-col justify-between text-xs font-mono transition-all ${tileColor}`}
                    title={`${node.device_name}: Temp ${temp}°C, RAM ${node.ram_usage}%, CPU ${node.cpu_usage}%`}
                  >
                    <div className="truncate font-bold text-[11px]">{node.name}</div>
                    <div className="flex items-center justify-between text-[10px] mt-1 font-semibold">
                      <span>{heatmapMetric === 'ram' ? `${node.ram_usage}%` : `${temp}°C`}</span>
                      <span className="text-[9px] opacity-80">{node.platform.substring(0, 3)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barra de Espectro / Legenda Visual */}
          <div className="p-3 rounded-2xl bg-black/30 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-white/60 font-mono text-[11px]">
              Espectro Térmico & RAM:
            </span>
            <div className="flex-1 max-w-md w-full flex items-center gap-1">
              <div className="flex-1 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-rose-600 border border-white/20 shadow-inner" />
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-white/60">
              <span className="text-emerald-300">&lt;45°C / 40%</span>
              <span className="text-amber-300">60°C / 65%</span>
              <span className="text-orange-300">75°C / 80%</span>
              <span className="text-rose-400 font-bold">&gt;85°C / 90%</span>
            </div>
          </div>
        </div>
      )}

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
          const heatLevel = getNodeHeatLevel(node, heatmapMetric);
          const healthScore = getNodeHealthScore(node);
          const temp = getNodeTemp(node);
          const stress = getNodeStress(node);

          // Estilização dinâmica por Heatmap
          let cardBgStyle = 'bg-white/[0.05] border-white/10 hover:border-white/20 hover:bg-white/[0.07]';
          if (isCritical) {
            cardBgStyle = 'bg-rose-950/40 border-rose-500/80 shadow-rose-950/70 ring-2 ring-rose-500/40';
          } else if (heatmapEnabled && node.status === 'online') {
            if (heatLevel === 'critical') {
              cardBgStyle = 'bg-gradient-to-br from-rose-950/80 via-red-950/60 to-purple-950/80 border-rose-500 ring-2 ring-rose-500/50 shadow-2xl shadow-rose-950/80 animate-pulse';
            } else if (heatLevel === 'hot') {
              cardBgStyle = 'bg-gradient-to-br from-orange-950/70 via-amber-950/40 to-slate-900/80 border-orange-500/80 ring-1 ring-orange-500/30 shadow-xl shadow-orange-950/50';
            } else if (heatLevel === 'warm') {
              cardBgStyle = 'bg-gradient-to-br from-amber-950/50 via-yellow-950/20 to-slate-900/80 border-amber-500/50 shadow-lg shadow-amber-950/30';
            } else {
              cardBgStyle = 'bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-slate-900/80 border-emerald-500/40 shadow-md shadow-emerald-950/20';
            }
          } else if (node.is_master) {
            cardBgStyle = 'bg-white/[0.05] border-indigo-400/50 shadow-indigo-500/10';
          } else if (node.status !== 'online') {
            cardBgStyle = 'bg-white/[0.05] border-rose-500/20 opacity-70';
          }

          return (
            <div
              key={node.node_id}
              className={`rounded-3xl backdrop-blur-xl border transition-all p-5 flex flex-col justify-between shadow-xl relative overflow-hidden ${cardBgStyle}`}
            >
              {/* Top Row: Device Icon, Name, Platform, Status */}
              <div>
                {/* Heatmap Overlay Pill Indicator */}
                {heatmapEnabled && node.status === 'online' && (
                  <div className="mb-3 p-2.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-2 shadow-inner">
                    <div className="flex items-center gap-2 min-w-0">
                      {heatLevel === 'critical' ? (
                        <Flame className="w-4 h-4 text-rose-400 fill-current animate-bounce flex-shrink-0" />
                      ) : heatLevel === 'hot' ? (
                        <Thermometer className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      ) : heatLevel === 'warm' ? (
                        <Activity className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      <div className="text-[11px] font-mono leading-tight truncate">
                        <span className="font-bold text-white">
                          {heatmapMetric === 'thermal'
                            ? `Térmico: ${temp}°C`
                            : heatmapMetric === 'ram'
                            ? `RAM: ${node.ram_usage}%`
                            : heatmapMetric === 'gpu'
                            ? `GPU: ${node.gpu_usage}%`
                            : `Estresse: ${stress}%`}
                        </span>
                        <span className="text-white/50 text-[10px] ml-1.5">
                          {heatLevel === 'critical'
                            ? '🔴 Risco Throttling'
                            : heatLevel === 'hot'
                            ? '🟠 Alerta Térmico/RAM'
                            : heatLevel === 'warm'
                            ? '🟡 Moderado'
                            : '🟢 Estável'}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase flex-shrink-0 ${
                      healthScore >= 75
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : healthScore >= 50
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {healthScore}% Saúde
                    </span>
                  </div>
                )}

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
                    <span className={`font-mono font-bold ${node.cpu_usage >= 80 ? 'text-rose-400 animate-pulse' : 'text-indigo-300'}`}>
                      {node.cpu_usage}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        node.cpu_usage >= 85
                          ? 'bg-gradient-to-r from-orange-500 to-rose-600'
                          : node.cpu_usage >= 65
                          ? 'bg-gradient-to-r from-indigo-500 to-amber-400'
                          : 'bg-indigo-400'
                      }`}
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
                    <span className={`font-mono font-bold ${node.ram_usage >= 85 ? 'text-rose-400 animate-pulse' : 'text-violet-300'}`}>
                      {node.ram_usage}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        node.ram_usage >= 85
                          ? 'bg-gradient-to-r from-amber-500 to-rose-600 shadow-sm shadow-rose-500/50'
                          : node.ram_usage >= 70
                          ? 'bg-gradient-to-r from-violet-500 to-amber-400'
                          : 'bg-violet-400'
                      }`}
                      style={{ width: `${node.ram_usage}%` }}
                    />
                  </div>
                </div>

                {/* Thermal Stress Bar (Heatmap Mode) */}
                {heatmapEnabled && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/60 flex items-center gap-1">
                        <Thermometer className={`w-3.5 h-3.5 ${temp >= 75 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                        Stress Térmico ({temp}°C)
                      </span>
                      <span className="font-mono text-[11px] text-white/50">
                        {temp >= 85 ? '⚠️ THROTTLING' : `Headroom: +${Math.max(0, 85 - temp)}°C`}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          temp >= 80
                            ? 'bg-gradient-to-r from-orange-500 to-rose-600 shadow-sm shadow-rose-500/50'
                            : temp >= 65
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-400 to-teal-300'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, Math.round(((temp - 25) / (90 - 25)) * 100)))}%` }}
                      />
                    </div>
                  </div>
                )}

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

      {/* Modal de Auto-Scaling e Wake-on-LAN */}
      <AutoScalingModal
        isOpen={showAutoScalingModal}
        onClose={() => setShowAutoScalingModal(false)}
        nodes={nodes}
        onTriggerWOL={onTriggerWOL || (async () => true)}
        onSpawnCloudNode={onSpawnCloudNode || (async () => true)}
        onTerminateCloudNode={onTerminateCloudNode || (async () => true)}
        autoScaleEnabled={autoScaleEnabled}
        onToggleAutoScale={onToggleAutoScale || (() => {})}
      />
    </div>
  );
};

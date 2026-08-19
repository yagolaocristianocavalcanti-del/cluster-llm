import React, { useState } from 'react';
import {
  TrendingUp,
  Radio,
  Cloud,
  Zap,
  Power,
  X,
  Server,
  Activity,
  Cpu,
  HardDrive,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { DormantNodeWOL, CloudBurstInstanceConfig, AutoScalingStatus, AutoScalingEvent, ClusterNode } from '../types';
import { INITIAL_DORMANT_WOL_NODES, CLOUD_BURST_PRESETS } from '../data/mockData';

interface AutoScalingModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: ClusterNode[];
  onTriggerWOL: (dormantNode: DormantNodeWOL) => Promise<boolean>;
  onSpawnCloudNode: (config: CloudBurstInstanceConfig) => Promise<boolean>;
  onTerminateCloudNode: (nodeId: string) => Promise<boolean>;
  autoScaleEnabled: boolean;
  onToggleAutoScale: (enabled: boolean) => void;
}

export const AutoScalingModal: React.FC<AutoScalingModalProps> = ({
  isOpen,
  onClose,
  nodes,
  onTriggerWOL,
  onSpawnCloudNode,
  onTerminateCloudNode,
  autoScaleEnabled,
  onToggleAutoScale,
}) => {
  const [dormantNodes, setDormantNodes] = useState<DormantNodeWOL[]>(() => {
    const saved = localStorage.getItem('llm_cluster_wol_nodes_v3');
    return saved ? JSON.parse(saved) : INITIAL_DORMANT_WOL_NODES;
  });

  const [activeTab, setActiveTab] = useState<'monitor' | 'wol' | 'cloud' | 'events'>('monitor');
  const [cpuThreshold, setCpuThreshold] = useState<number>(75);
  const [ramThreshold, setRamThreshold] = useState<number>(80);
  const [wakingNodeId, setWakingNodeId] = useState<string | null>(null);
  const [spawningProvider, setSpawningProvider] = useState<string | null>(null);
  const [terminatingNodeId, setTerminatingNodeId] = useState<string | null>(null);

  // Formulário de novo nó WOL
  const [showAddWol, setShowAddWol] = useState(false);
  const [newWolName, setNewWolName] = useState('');
  const [newWolMac, setNewWolMac] = useState('');
  const [newWolIp, setNewWolIp] = useState('');
  const [newWolSpecs, setNewWolSpecs] = useState('');

  // Eventos de auto-scaling
  const [events, setEvents] = useState<AutoScalingEvent[]>([
    {
      id: 'evt-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      event_type: 'wol_wake',
      target_name: 'Workstation RTX 4090',
      reason: 'Pico de demanda de inferência (>82% de carga)',
      status: 'completed'
    },
    {
      id: 'evt-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      event_type: 'cloud_burst_spawn',
      target_name: 'GCP Cloud Run GPU (NVIDIA L4)',
      reason: 'Absorção de fine-tuning distribuído',
      status: 'completed'
    }
  ]);

  if (!isOpen) return null;

  // Métricas do Cluster
  const onlineNodes = nodes.filter(n => n.status === 'online');
  const cloudNodes = onlineNodes.filter(n => n.node_id.startsWith('cloud_'));
  const avgCpu = onlineNodes.length > 0
    ? Math.round(onlineNodes.reduce((acc, n) => acc + (n.cpu_usage || 0), 0) / onlineNodes.length)
    : 0;
  const avgRam = onlineNodes.length > 0
    ? Math.round(onlineNodes.reduce((acc, n) => acc + (n.ram_usage || 0), 0) / onlineNodes.length)
    : 0;
  const demandScore = Math.min(100, Math.round(avgCpu * 0.5 + avgRam * 0.5));

  const isCritical = demandScore >= 85 || avgCpu >= cpuThreshold;
  const isElevated = demandScore >= 70 && !isCritical;
  const isOptimal = demandScore >= 35 && demandScore < 70;

  const handleSendWOL = async (dormant: DormantNodeWOL) => {
    setWakingNodeId(dormant.id);
    try {
      const success = await onTriggerWOL(dormant);
      if (success) {
        setDormantNodes(prev => {
          const updated = prev.map(n => n.id === dormant.id ? { ...n, status: 'online' as const, last_woken: new Date().toISOString() } : n);
          localStorage.setItem('llm_cluster_wol_nodes_v3', JSON.stringify(updated));
          return updated;
        });

        setEvents(prev => [
          {
            id: `evt-${Date.now()}`,
            timestamp: new Date().toISOString(),
            event_type: 'wol_wake',
            target_name: dormant.name,
            reason: `Disparo manual/automático de Wake-on-LAN para ${dormant.mac_address}`,
            status: 'completed'
          },
          ...prev
        ]);
      }
    } finally {
      setTimeout(() => setWakingNodeId(null), 1000);
    }
  };

  const handleSpawnCloud = async (config: CloudBurstInstanceConfig) => {
    setSpawningProvider(config.provider);
    try {
      const success = await onSpawnCloudNode(config);
      if (success) {
        setEvents(prev => [
          {
            id: `evt-${Date.now()}`,
            timestamp: new Date().toISOString(),
            event_type: 'cloud_burst_spawn',
            target_name: config.name,
            reason: `Instância GPU provisionada sob demanda (${config.gpu_type})`,
            status: 'completed'
          },
          ...prev
        ]);
      }
    } finally {
      setTimeout(() => setSpawningProvider(null), 1000);
    }
  };

  const handleTerminateCloud = async (nodeId: string, nodeName: string) => {
    setTerminatingNodeId(nodeId);
    try {
      const success = await onTerminateCloudNode(nodeId);
      if (success) {
        setEvents(prev => [
          {
            id: `evt-${Date.now()}`,
            timestamp: new Date().toISOString(),
            event_type: 'cloud_burst_terminate',
            target_name: nodeName,
            reason: 'Encerramento de nó cloud para contenção de custos',
            status: 'completed'
          },
          ...prev
        ]);
      }
    } finally {
      setTimeout(() => setTerminatingNodeId(null), 800);
    }
  };

  const handleAddWolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWolName || !newWolMac) return;

    const newNode: DormantNodeWOL = {
      id: `wol_${Date.now()}`,
      name: newWolName,
      mac_address: newWolMac.trim().toUpperCase(),
      ip_address: newWolIp.trim() || '192.168.1.255',
      platform: 'Windows',
      specs_summary: newWolSpecs.trim() || 'Workstation local registrada para WOL',
      wake_port: 9,
      status: 'sleeping'
    };

    const updated = [newNode, ...dormantNodes];
    setDormantNodes(updated);
    localStorage.setItem('llm_cluster_wol_nodes_v3', JSON.stringify(updated));

    setNewWolName('');
    setNewWolMac('');
    setNewWolIp('');
    setNewWolSpecs('');
    setShowAddWol(false);
  };

  const handleDeleteWolNode = (id: string) => {
    const updated = dormantNodes.filter(n => n.id !== id);
    setDormantNodes(updated);
    localStorage.setItem('llm_cluster_wol_nodes_v3', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900/95 border border-white/15 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white">Auto-Scaling Inteligente & Despertar de Nós (WOL)</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  autoScaleEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/10 text-white/50 border-white/15'
                }`}>
                  {autoScaleEnabled ? 'Piloto Automático Ativo' : 'Manual'}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Monitora a carga média do cluster e desperta nós físicos via Wake-on-LAN ou provisiona GPU em nuvem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleAutoScale(!autoScaleEnabled)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                autoScaleEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/5 text-white/60 hover:text-white border-white/10'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              Auto-Scale: {autoScaleEnabled ? 'LIGADO' : 'DESLIGADO'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5 bg-black/20">
          {[
            { id: 'monitor', label: 'Monitor de Demanda', icon: Activity },
            { id: 'wol', label: `Wake-on-LAN (${dormantNodes.length} Nós)`, icon: Radio },
            { id: 'cloud', label: `Cloud Bursting (${cloudNodes.length} Ativos)`, icon: Cloud },
            { id: 'events', label: `Histórico (${events.length})`, icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10 rounded-t-xl'
                    : 'border-transparent text-white/50 hover:text-white hover:bg-white/5 rounded-t-xl'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* TAB 1: MONITOR DE DEMANDA */}
          {activeTab === 'monitor' && (
            <div className="space-y-6">
              {/* Recommendation Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                isCritical
                  ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                  : isElevated
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                  : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
              }`}>
                <div className="p-2 rounded-xl bg-white/10 flex-shrink-0 mt-0.5">
                  {isCritical ? (
                    <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                  ) : isElevated ? (
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {isCritical ? 'Demanda Crítica Detectada (>85%)' : isElevated ? 'Demanda Elevada (>70%)' : 'Cluster Estável e Otimizado'}
                    </h4>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 font-bold">
                      Nível de Stress: {isCritical ? 'Crítico' : isElevated ? 'Elevado' : 'Ideal'}
                    </span>
                  </div>
                  <p className="text-xs opacity-80 mt-1 leading-relaxed">
                    {isCritical
                      ? 'O cluster está operando próximo ao limite térmico e de memória. Recomenda-se acordar imediatamente nós dormindo via WOL ou instanciar nós GPU em nuvem.'
                      : isElevated
                      ? 'O throughput de inferência pode apresentar enfileiramento. Dispare nós auxiliares para desafogar as camadas iniciais do LLM.'
                      : 'Todos os nós operam com folga de VRAM e barramento de dados balanceado.'}
                  </p>
                </div>
              </div>

              {/* Gauge & Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                    <span className="font-semibold">Score de Demanda Global</span>
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="flex items-baseline gap-2 my-2">
                    <span className="text-3xl font-black text-white font-mono">{demandScore}%</span>
                    <span className="text-xs text-white/40">/ 100%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical ? 'bg-rose-500' : isElevated ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${demandScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                    <span className="font-semibold">CPU Média dos Nós</span>
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="flex items-baseline gap-2 my-2">
                    <span className="text-3xl font-black text-white font-mono">{avgCpu}%</span>
                    <span className="text-xs text-white/40">Gatilho: {cpuThreshold}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${avgCpu}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                    <span className="font-semibold">RAM / VRAM Média</span>
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="flex items-baseline gap-2 my-2">
                    <span className="text-3xl font-black text-white font-mono">{avgRam}%</span>
                    <span className="text-xs text-white/40">Gatilho: {ramThreshold}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${avgRam}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Threshold Sliders */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Limiares de Ativação Automática (Triggers)
                  </h4>
                  <span className="text-[11px] text-white/40 font-mono">Dispara WOL se excedido por &gt;10s</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 font-semibold">Gatilho de CPU: {cpuThreshold}%</span>
                      <span className="text-indigo-400 font-mono">Recomendado: 75%</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="95"
                      value={cpuThreshold}
                      onChange={(e) => setCpuThreshold(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 font-semibold">Gatilho de RAM: {ramThreshold}%</span>
                      <span className="text-indigo-400 font-mono">Recomendado: 80%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={ramThreshold}
                      onChange={(e) => setRamThreshold(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WAKE-ON-LAN (WOL) */}
          {activeTab === 'wol' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    Nós Físicos Registrados para Wake-on-LAN
                  </h3>
                  <p className="text-xs text-white/50">
                    Transmite Magic Packet UDP (Porta 9) para acordar PCs e Servidores na rede local
                  </p>
                </div>

                <button
                  onClick={() => setShowAddWol(!showAddWol)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddWol ? 'Cancelar' : 'Cadastrar MAC'}
                </button>
              </div>

              {/* Formulário de Cadastro WOL */}
              {showAddWol && (
                <form onSubmit={handleAddWolSubmit} className="p-4 rounded-2xl bg-black/50 border border-indigo-500/40 space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-indigo-300">Novo Dispositivo Wake-on-LAN</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-white/50 block mb-1">Nome do Computador</label>
                      <input
                        type="text"
                        placeholder="Ex: PC Gamer RTX 3080"
                        value={newWolName}
                        onChange={(e) => setNewWolName(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/50 block mb-1">MAC Address (Hexadecimal)</label>
                      <input
                        type="text"
                        placeholder="00:1B:44:11:3A:B7"
                        value={newWolMac}
                        onChange={(e) => setNewWolMac(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/50 block mb-1">IP de Broadcast / Rede</label>
                      <input
                        type="text"
                        placeholder="192.168.1.180"
                        value={newWolIp}
                        onChange={(e) => setNewWolIp(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-white/50 block mb-1">Especificações de Hardware</label>
                    <input
                      type="text"
                      placeholder="Ex: Core i7 13700K, 32GB RAM, RTX 3080 10GB"
                      value={newWolSpecs}
                      onChange={(e) => setNewWolSpecs(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddWol(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
                    >
                      Salvar Dispositivo
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Nós WOL */}
              <div className="space-y-3">
                {dormantNodes.map((dormant) => {
                  const isWaking = wakingNodeId === dormant.id;
                  const isOnline = dormant.status === 'online' || nodes.some(n => n.node_id === dormant.id && n.status === 'online');

                  return (
                    <div
                      key={dormant.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl border mt-0.5 flex-shrink-0 ${
                          isOnline
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-white/5 border-white/10 text-white/40'
                        }`}>
                          <Server className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">{dormant.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              isOnline
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {isOnline ? 'Ativo no Cluster' : 'Dormindo (Standby)'}
                            </span>
                            <span className="text-[10px] text-white/40 font-mono">
                              Porta {dormant.wake_port || 9}
                            </span>
                          </div>
                          <p className="text-xs text-white/60 mt-0.5 truncate">{dormant.specs_summary}</p>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-white/40 mt-1">
                            <span>MAC: {dormant.mac_address}</span>
                            <span>IP: {dormant.ip_address}</span>
                            <span>OS: {dormant.platform}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleSendWOL(dormant)}
                          disabled={isWaking || isOnline}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all shadow-md ${
                            isOnline
                              ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-105 active:scale-95'
                          }`}
                        >
                          <Power className={`w-3.5 h-3.5 ${isWaking ? 'animate-spin' : ''}`} />
                          {isWaking ? 'Transmitindo...' : isOnline ? 'Já Conectado' : 'Despertar via WOL'}
                        </button>

                        <button
                          onClick={() => handleDeleteWolNode(dormant.id)}
                          className="p-2 rounded-full text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Remover nó"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CLOUD BURSTING */}
          {activeTab === 'cloud' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  Instâncias em Nuvem Sob Demanda (Cloud Bursting)
                </h3>
                <p className="text-xs text-white/50">
                  Provisione aceleradores GPU em nuvem instantaneamente para picos de carga e absorção de lotes pesados
                </p>
              </div>

              {/* Instâncias Cloud Ativas */}
              {cloudNodes.length > 0 && (
                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Nós Cloud Ativos no Cluster ({cloudNodes.length})
                    </span>
                    <span className="text-[11px] text-white/50 font-mono">Cobrança sob demanda ativa</span>
                  </div>

                  <div className="space-y-2">
                    {cloudNodes.map((cn) => {
                      const isTerminating = terminatingNodeId === cn.node_id;
                      return (
                        <div
                          key={cn.node_id}
                          className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">{cn.device_name}</div>
                            <div className="text-[11px] text-cyan-300 font-mono mt-0.5">
                              {cn.gpu_name || 'GPU Cloud'} | Latência: {cn.latency_ms}ms
                            </div>
                          </div>

                          <button
                            onClick={() => handleTerminateCloud(cn.node_id, cn.device_name)}
                            disabled={isTerminating}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-500/40 font-semibold text-xs transition-all"
                          >
                            {isTerminating ? 'Encerrando...' : 'Desativar (Economizar)'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Presets de Provedores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CLOUD_BURST_PRESETS.map((preset) => {
                  const isSpawning = spawningProvider === preset.provider;

                  return (
                    <div
                      key={preset.provider}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
                            {preset.provider.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-mono text-[10px]">
                            ${preset.cost_per_hour_usd}/h
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white leading-tight">{preset.name}</h4>
                        <div className="text-xs text-white/50 mt-1.5 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Auto-desliga em {preset.auto_terminate_idle_min}m ociosos</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSpawnCloud(preset)}
                        disabled={isSpawning}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSpawning ? 'Provisionando...' : 'Ativar Instância Cloud'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: HISTÓRICO DE EVENTOS */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Registro de Atividades do Auto-Scaler
                </h3>
                <span className="text-xs text-white/40 font-mono">{events.length} Ações Registradas</span>
              </div>

              <div className="space-y-2">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border flex-shrink-0 ${
                        evt.event_type === 'wol_wake'
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                          : evt.event_type === 'cloud_burst_spawn'
                          ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                          : 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                      }`}>
                        {evt.event_type === 'wol_wake' ? (
                          <Radio className="w-4 h-4" />
                        ) : (
                          <Cloud className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white">{evt.target_name}</div>
                        <div className="text-[11px] text-white/50 mt-0.5">{evt.reason}</div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 font-mono text-[10px]">
                      <div className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3 h-3" />
                        {evt.status}
                      </div>
                      <div className="text-white/40 mt-0.5">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/40">
          <div className="text-xs text-white/50 font-mono">
            Demanda Atual: <span className="text-white font-bold">{demandScore}%</span> | Limite Crítico: <span className="text-rose-400 font-bold">{cpuThreshold}%</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

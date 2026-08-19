import React, { useState } from 'react';
import { 
  Flame, 
  X, 
  BatteryLow, 
  ShieldAlert, 
  Cpu, 
  Smartphone, 
  Monitor, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Zap, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { ClusterNode, LoadBalancerConfig, LoadBalancerEvent } from '../types';

interface DynamicLoadBalancerModalProps {
  config: LoadBalancerConfig;
  events: LoadBalancerEvent[];
  nodes: ClusterNode[];
  onUpdateConfig: (newConfig: LoadBalancerConfig) => void;
  onSimulateEmergencyMigration: (nodeId: string) => void;
  onClose: () => void;
}

export const DynamicLoadBalancerModal: React.FC<DynamicLoadBalancerModalProps> = ({
  config,
  events,
  nodes,
  onUpdateConfig,
  onSimulateEmergencyMigration,
  onClose,
}) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [tempThreshold, setTempThreshold] = useState(config.temperatureThreshold);
  const [batteryThreshold, setBatteryThreshold] = useState(config.batteryThreshold);
  const [vramThreshold, setVramThreshold] = useState(config.vramThreshold);
  const [migrationStrategy, setMigrationStrategy] = useState(config.migrationStrategy);

  const onlineNodes = nodes.filter((n) => n.status === 'online');
  const mobileNodes = onlineNodes.filter((n) => n.platform === 'Android');

  const handleSave = () => {
    onUpdateConfig({
      enabled,
      temperatureThreshold: tempThreshold,
      batteryThreshold,
      vramThreshold,
      migrationStrategy,
      autoCooldownPauseSec: config.autoCooldownPauseSec || 15,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[92vh] p-6 rounded-3xl bg-slate-900/95 border border-white/20 backdrop-blur-2xl shadow-2xl flex flex-col space-y-4 text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Dynamic Load Balancer & Auto-Relocação de Camadas
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Zero-Downtime Sharding
                </span>
              </h3>
              <p className="text-xs text-white/50">
                Se um celular esquentar (&gt; {tempThreshold}°C) ou a bateria descer (&lt; {batteryThreshold}%), as camadas são transferidas sem parar o treino
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form de Configuração dos Gatilhos de Failover */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lb-enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-amber-400 bg-black/40 border-white/20 focus:ring-0"
              />
              <label htmlFor="lb-enabled" className="text-xs font-bold text-white cursor-pointer">
                Ativar Dynamic Load Balancer e Proteção Térmica Automática
              </label>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              enabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/10 text-white/40 border-white/10'
            }`}>
              {enabled ? 'SISTEMA ATIVO' : 'DESATIVADO'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Temp. Limite
                </span>
                <span className="font-mono font-bold text-rose-300">{tempThreshold}°C</span>
              </div>
              <input
                type="range"
                min={70}
                max={90}
                value={tempThreshold}
                onChange={(e) => setTempThreshold(Number(e.target.value))}
                className="w-full accent-rose-400 h-1.5 bg-black/40 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-white/40 block">Padrão seguro: 80°C</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 flex items-center gap-1.5">
                  <BatteryLow className="w-3.5 h-3.5 text-amber-400" />
                  Bateria Mínima
                </span>
                <span className="font-mono font-bold text-amber-300">{batteryThreshold}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={30}
                value={batteryThreshold}
                onChange={(e) => setBatteryThreshold(Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-black/40 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-white/40 block">Evita shutdown abrupto</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  VRAM Máxima
                </span>
                <span className="font-mono font-bold text-indigo-300">{vramThreshold}%</span>
              </div>
              <input
                type="range"
                min={80}
                max={98}
                value={vramThreshold}
                onChange={(e) => setVramThreshold(Number(e.target.value))}
                className="w-full accent-indigo-400 h-1.5 bg-black/40 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-white/40 block">Evita Out-Of-Memory (OOM)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
            <span className="text-white/70">Estratégia de Relocação de Camadas:</span>
            <select
              value={migrationStrategy}
              onChange={(e) => setMigrationStrategy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white/90 focus:outline-none focus:border-amber-400"
            >
              <option value="failover_to_master" className="bg-slate-900">Transferir Imediatamente para o Master PC</option>
              <option value="spread_across_healthy" className="bg-slate-900">Distribuir entre Outros Nós Saudáveis</option>
              <option value="fallback_cpu" className="bg-slate-900">Mover para CPU RAM Local com Offload</option>
            </select>
          </div>
        </div>

        {/* Ferramenta de Teste de Simulação em Tempo Real */}
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2.5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Teste de Resiliência: Simular Superaquecimento / Falha em Tempo Real
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mobileNodes.length > 0 ? (
              mobileNodes.map((node) => (
                <button
                  key={node.node_id}
                  type="button"
                  onClick={() => onSimulateEmergencyMigration(node.node_id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-bold transition-all shadow-sm"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Simular {node.device_name.split(' ')[0]} em 82°C (Auto-Migrar Shards)
                </button>
              ))
            ) : (
              onlineNodes.map((node) => (
                <button
                  key={node.node_id}
                  type="button"
                  onClick={() => onSimulateEmergencyMigration(node.node_id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-bold transition-all shadow-sm"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Simular Sobrecarga em {node.device_name.split(' ')[0]}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Histórico / Linha do Tempo de Relocações Dinâmicas */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          <span className="text-xs font-bold text-white/70 block uppercase tracking-wide">
            Histórico de Migrações em Tempo Real (Zero-Downtime)
          </span>

          {events.length === 0 ? (
            <div className="p-6 text-center bg-black/20 rounded-2xl border border-white/10 text-white/50 text-xs">
              Nenhuma migração de emergência disparada. O cluster opera com cargas perfeitamente balanceadas.
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-2xl bg-black/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fadeIn"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center flex-shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{ev.trigger_device_name}</span>
                      <span className="text-[10px] font-mono text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                        {ev.trigger_metric_value}
                      </span>
                      <ArrowRight className="w-3 h-3 text-white/40" />
                      <span className="text-xs font-bold text-emerald-300">{ev.target_device_name}</span>
                    </div>
                    <p className="text-[11px] text-white/60 pt-0.5">{ev.message}</p>
                  </div>
                </div>

                <div className="text-right self-end sm:self-center flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✓ Migrado sem Perda
                  </span>
                  <span className="block text-[10px] text-white/40 font-mono mt-0.5">
                    {new Date(ev.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-lg shadow-amber-400/20 transition-all hover:scale-105 active:scale-95"
          >
            Salvar Configuração do Balancer
          </button>
        </div>
      </div>
    </div>
  );
};

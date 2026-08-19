import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Check, 
  Sliders, 
  Palette, 
  Radio, 
  ShieldCheck, 
  HardDrive, 
  Layers,
  Sparkles,
  Leaf,
  Zap
} from 'lucide-react';
import { AppTheme } from '../types';

interface SettingsViewProps {
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  powerSaveMode: boolean;
  onTogglePowerSave: () => void;
  mdnsOllamaDiscovery?: boolean;
  onToggleMdnsDiscovery?: () => void;
  onResetCluster: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onThemeChange,
  powerSaveMode,
  onTogglePowerSave,
  mdnsOllamaDiscovery = true,
  onToggleMdnsDiscovery,
  onResetCluster,
}) => {
  const [masterPort, setMasterPort] = useState('5000');
  const [workerPort, setWorkerPort] = useState('5001');
  const [heartbeatInterval, setHeartbeatInterval] = useState('5');
  const [timeoutInterval, setTimeoutInterval] = useState('15');
  const [defaultBackend, setDefaultBackend] = useState<'ollama' | 'llama.cpp' | 'auto'>('auto');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="view-settings">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Header Info */}
        <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl shadow-black/20">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Configurações do Master & Parâmetros do Cluster
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Ajuste portas, intervalos de verificação de vida e preferências de interface
            </p>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4 text-slate-900" />}
            {savedSuccess ? 'Configurações Salvas!' : 'Salvar Alterações'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rede e Portas */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Radio className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">Parâmetros de Rede & Portas</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1.5">
                  Porta Master (Painel Web)
                </label>
                <input
                  type="number"
                  value={masterPort}
                  onChange={(e) => setMasterPort(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-white font-mono focus:outline-none focus:border-indigo-400 backdrop-blur-md"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1.5">
                  Porta Padrão dos Servos
                </label>
                <input
                  type="number"
                  value={workerPort}
                  onChange={(e) => setWorkerPort(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-white font-mono focus:outline-none focus:border-indigo-400 backdrop-blur-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1.5">
                  Intervalo Heartbeat (segundos)
                </label>
                <input
                  type="number"
                  value={heartbeatInterval}
                  onChange={(e) => setHeartbeatInterval(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-white font-mono focus:outline-none focus:border-indigo-400 backdrop-blur-md"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1.5">
                  Timeout de Inatividade (segundos)
                </label>
                <input
                  type="number"
                  value={timeoutInterval}
                  onChange={(e) => setTimeoutInterval(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-white font-mono focus:outline-none focus:border-indigo-400 backdrop-blur-md"
                />
              </div>
            </div>
          </div>

          {/* Motores & Backends */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <HardDrive className="w-4 h-4 text-violet-400" />
              <h3 className="font-bold text-sm text-white">Preferência de Motor de Inferência</h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1.5">
                Backend Preferencial para Dispositivos
              </label>
              <select
                value={defaultBackend}
                onChange={(e) => setDefaultBackend(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-indigo-200 font-semibold focus:outline-none focus:border-indigo-400 backdrop-blur-md"
              >
                <option value="auto" className="bg-slate-900 text-white">Detecção Automática (Ollama no PC, llama.cpp no Android)</option>
                <option value="ollama" className="bg-slate-900 text-white">Forçar Ollama HTTP Daemon</option>
                <option value="llama.cpp" className="bg-slate-900 text-white">Forçar llama.cpp CLI Nativo (C++ compilado)</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-xs text-white/60 space-y-1 backdrop-blur-md">
              <span className="font-bold text-white/90 block">Modo Anti-Burro Automático:</span>
              <p>O master verifica automaticamente a arquitetura do servo e seleciona a compilação mais eficiente (NEON no ARM64, AVX2 no x86_64, CUDA na NVIDIA).</p>
            </div>
          </div>

          {/* Tema e Estética */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Palette className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">Aparência & Tema Visual</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'dark', label: 'Frosted Dark', color: 'bg-white/20 border-white/40' },
                { id: 'midnight', label: 'Midnight Blue', color: 'bg-blue-600/30 border-blue-400' },
                { id: 'forest', label: 'Forest Emerald', color: 'bg-emerald-600/30 border-emerald-400' },
                { id: 'light', label: 'Frosted Light', color: 'bg-white/40 border-white text-slate-950' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onThemeChange(t.id as AppTheme)}
                  className={`p-3.5 rounded-2xl border text-center text-xs font-bold transition-all ${
                    theme === t.id
                      ? `${t.color} text-white shadow-xl scale-[1.02]`
                      : 'bg-black/30 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descoberta mDNS Automática de Ollama */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-indigo-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Enable mDNS Ollama Discovery</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                mdnsOllamaDiscovery ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-white/10 text-white/60'
              }`}>
                {mdnsOllamaDiscovery ? 'Polling 15s (Ativo)' : 'Desativado'}
              </span>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Executa polling em segundo plano com varredura multicast mDNS e detecção de instâncias do Ollama na sub-rede local (portas 11434 / LAN). Adiciona automaticamente novos nós e sincroniza os modelos disponíveis.
            </p>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onToggleMdnsDiscovery}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs transition-all border ${
                  mdnsOllamaDiscovery
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {mdnsOllamaDiscovery ? 'mDNS Discovery: LIGADO' : 'mDNS Discovery: DESLIGADO'}
              </button>
            </div>
          </div>

          {/* Modo de Economia de Energia */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Modo Economia de Energia</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                powerSaveMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-white/60'
              }`}>
                {powerSaveMode ? '10s (Ativo)' : '2.5s (Tempo Real)'}
              </span>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Reduz a frequência de atualização da telemetria de 2.5s para 10s e diminui animações contínuas, poupando bateria em dispositivos móveis e reduzindo o consumo de CPU.
            </p>

            <button
              type="button"
              onClick={onTogglePowerSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs transition-all border ${
                powerSaveMode
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              <Leaf className="w-4 h-4" />
              {powerSaveMode ? 'Desativar Modo Economia' : 'Ativar Modo Economia (10s)'}
            </button>
          </div>

          {/* Zona de Manutenção do Cluster */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-rose-500/20 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-sm text-white">Manutenção & Reset</h3>
            </div>

            <p className="text-xs text-white/50 leading-relaxed">
              Restaura a lista inicial de nós simulados e limpa o cache de telemetria caso ocorra alguma inconsistência.
            </p>

            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja resetar o cluster para o estado padrão?')) {
                  onResetCluster();
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-500/30 text-xs font-bold transition-all shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Dados Padrão do Cluster
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

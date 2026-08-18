import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  Copy, 
  Check, 
  Smartphone, 
  Monitor, 
  Terminal, 
  Sparkles, 
  RotateCw,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PairingCodeInfo, ClusterNode } from '../types';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairingInfo: PairingCodeInfo;
  onRegenerateCode: () => void;
  onSimulateConnect: (deviceType: 'android' | 'windows' | 'linux') => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  pairingInfo,
  onRegenerateCode,
  onSimulateConnect,
}) => {
  const [activeTab, setActiveTab] = useState<'termux' | 'windows' | 'linux'>('termux');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(pairingInfo.expires_in_sec);

  useEffect(() => {
    setTimeLeft(pairingInfo.expires_in_sec);
  }, [pairingInfo]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const commands = {
    termux: `python backend/worker.py --master ${pairingInfo.master_ip} --code ${pairingInfo.code}`,
    windows: `python backend\\worker.py --master ${pairingInfo.master_ip} --code ${pairingInfo.code}`,
    linux: `python3 backend/worker.py --master ${pairingInfo.master_ip} --code ${pairingInfo.code}`,
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="pairing-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        id="pairing-modal-content"
        className="w-full max-w-xl rounded-3xl bg-[#0f172a]/90 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden text-white animate-scaleUp"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Emparelhamento Seguro de 6 Dígitos</h3>
              <p className="text-xs text-white/50">Conecte novos celulares ou PCs em segundos sem IP manual</p>
            </div>
          </div>
          <button
            id="close-pairing-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Box do Código Grande */}
          <div className="relative rounded-3xl bg-white/[0.04] backdrop-blur-md border-2 border-dashed border-indigo-400/40 p-6 text-center shadow-inner">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 block mb-1">
              Código de Conexão Rápida
            </span>
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-[0.3em] text-white select-all my-2 drop-shadow-md">
              {pairingInfo.code}
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-white/50 mt-2 font-mono">
              <span>IP Master: <strong className="text-white font-semibold">{pairingInfo.master_ip}:{pairingInfo.master_port}</strong></span>
              <span>•</span>
              <span className={`font-semibold ${timeLeft < 60 ? 'text-rose-400 animate-pulse' : 'text-indigo-300'}`}>
                Expira em: {formattedTime}
              </span>
            </div>

            <button
              onClick={onRegenerateCode}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-white border border-white/10 transition-all shadow-sm"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Gerar Novo Código
            </button>
          </div>

          {/* Abas de Plataforma */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/50 block mb-2">
              Comando para rodar no dispositivo escravo:
            </label>
            <div className="flex rounded-2xl bg-black/20 p-1 border border-white/10 mb-3">
              <button
                onClick={() => setActiveTab('termux')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'termux' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25' : 'text-white/60 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Android (Termux)
              </button>
              <button
                onClick={() => setActiveTab('windows')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'windows' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25' : 'text-white/60 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
                Windows (CMD/PS)
              </button>
              <button
                onClick={() => setActiveTab('linux')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'linux' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25' : 'text-white/60 hover:text-white'
                }`}
              >
                <Terminal className="w-4 h-4" />
                Linux
              </button>
            </div>

            {/* Caixa de Código Copiável */}
            <div className="relative rounded-2xl bg-black/30 border border-white/10 p-3.5 font-mono text-xs text-indigo-200 break-all pr-12 backdrop-blur-md">
              <code>{commands[activeTab]}</code>
              <button
                onClick={() => handleCopy(commands[activeTab])}
                className="absolute right-2 top-2.5 p-2 rounded-xl bg-white/10 hover:bg-white hover:text-slate-900 text-white transition-all shadow-md"
                title="Copiar comando"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Simulador Rápido de Demonstração */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-2">
              <Sparkles className="w-4 h-4" />
              Teste Rápido no Preview (Simular Conexão de Servo)
            </div>
            <p className="text-xs text-white/60 mb-3">
              Não tem um segundo aparelho agora? Clique para simular a entrada imediata de um nó no cluster:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  onSimulateConnect('android');
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white hover:text-slate-900 text-xs font-semibold text-white border border-white/10 transition-all shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5" />
                + Simular Celular Termux
              </button>
              <button
                onClick={() => {
                  onSimulateConnect('windows');
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white hover:text-slate-900 text-xs font-semibold text-white border border-white/10 transition-all shadow-sm"
              >
                <Monitor className="w-3.5 h-3.5" />
                + Simular PC Gamer (RTX)
              </button>
              <button
                onClick={() => {
                  onSimulateConnect('linux');
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white hover:text-slate-900 text-xs font-semibold text-white border border-white/10 transition-all shadow-sm"
              >
                <Terminal className="w-3.5 h-3.5" />
                + Simular Raspberry Pi / Linux
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between text-xs text-white/50">
          <span>Auto-Setup do Ollama / llama.cpp iniciado automaticamente após o pareamento.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white/10 hover:bg-white hover:text-slate-900 text-white font-semibold transition-all border border-white/10"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

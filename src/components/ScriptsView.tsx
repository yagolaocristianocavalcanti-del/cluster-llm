import React, { useState } from 'react';
import { 
  Terminal, 
  Smartphone, 
  Monitor, 
  Copy, 
  Check, 
  Download, 
  KeyRound, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { PairingCodeInfo } from '../types';
import { SCRIPT_TEMPLATES } from '../data/mockData';

interface ScriptsViewProps {
  pairingInfo: PairingCodeInfo;
}

export const ScriptsView: React.FC<ScriptsViewProps> = ({ pairingInfo }) => {
  const [activeTab, setActiveTab] = useState<'termux' | 'windows' | 'linux'>('termux');
  const [copied, setCopied] = useState(false);

  const rawScript = SCRIPT_TEMPLATES[activeTab]
    .replace(/\{\{MASTER_IP\}\}/g, pairingInfo.master_ip)
    .replace(/\{\{PAIRING_CODE\}\}/g, pairingInfo.code);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab === 'windows' ? 'install_worker.ps1' : 'install_worker.sh';
    const blob = new Blob([rawScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="view-scripts">
      {/* Header Info */}
      <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl shadow-black/20">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            Scripts de Instalação & Auto-Setup "Zero-Touch"
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Comandos pré-configurados com seu IP local ({pairingInfo.master_ip}) e Código de 6 Dígitos ({pairingInfo.code})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-900" />}
            {copied ? 'Copiado!' : 'Copiar Script Completo'}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold transition-all backdrop-blur-md"
          >
            <Download className="w-4 h-4" />
            Baixar Arquivo
          </button>

          <a
            href="/api/worker.py"
            download="worker.py"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600/80 hover:bg-indigo-500 text-white font-semibold text-xs border border-indigo-400/30 transition-all backdrop-blur-md shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            Baixar worker.py
          </a>
        </div>
      </div>

      {/* Guia Anti-Burro Passo a Passo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 flex items-start gap-3.5 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
            1
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">Abra o Terminal no Dispositivo</h4>
            <p className="text-[11px] text-white/50 mt-0.5">
              No Android abra o <strong>Termux</strong>. No Windows abra o <strong>PowerShell</strong> como Admin. No Linux abra o Terminal.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 flex items-start gap-3.5 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
            2
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">Cole e Execute o Script</h4>
            <p className="text-[11px] text-white/50 mt-0.5">
              O script instala Python, dependências do Socket.IO e se conecta automaticamente ao Mestre usando o código de 6 dígitos.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 flex items-start gap-3.5 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
            3
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">Pronto! Motor Único Ativo</h4>
            <p className="text-[11px] text-white/50 mt-0.5">
              O aparelho vira um servo de computação e suas métricas aparecem instantaneamente no painel do Mestre.
            </p>
          </div>
        </div>
      </div>

      {/* Editor & Abas de Scripts */}
      <div className="rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Tab Headers */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/20 overflow-x-auto backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('termux')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'termux'
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Android (Termux / F-Droid)
            </button>

            <button
              onClick={() => setActiveTab('windows')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'windows'
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Windows (PowerShell 7 / CMD)
            </button>

            <button
              onClick={() => setActiveTab('linux')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'linux'
                  ? 'bg-white text-slate-950 shadow-md font-bold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Terminal className="w-4 h-4" />
              Linux (Ubuntu / Debian / Arch / RPi)
            </button>
          </div>

          <div className="text-[11px] font-mono text-indigo-300 hidden md:block pr-3">
            Código Injetado: <strong>{pairingInfo.code}</strong>
          </div>
        </div>

        {/* Script Code Area */}
        <div className="p-6 bg-black/40 font-mono text-xs text-indigo-200 overflow-x-auto whitespace-pre leading-relaxed border-b border-white/10 backdrop-blur-md">
          {rawScript}
        </div>

        {/* Explicações Adicionais */}
        <div className="p-4 bg-black/20 flex items-center justify-between text-xs text-white/50 backdrop-blur-md">
          <span>O script detecta se você possui GPU NVIDIA (CUDA) ou OpenCL (Snapdragon Adreno) e ativa os drivers automaticamente.</span>
          <button
            onClick={handleCopy}
            className="text-indigo-300 hover:text-white font-semibold underline"
          >
            Copiar Código
          </button>
        </div>
      </div>
    </div>
  );
};

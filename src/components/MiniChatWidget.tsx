import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  Trash2, 
  Sparkles, 
  Zap, 
  Bot, 
  User, 
  Copy, 
  Check, 
  ChevronDown, 
  Sliders, 
  RotateCw,
  Box,
  Layers,
  Smartphone,
  Monitor
} from 'lucide-react';
import { ClusterNode, ModelItem } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  model?: string;
  tokensPerSec?: number;
  timeSec?: number;
  nodesUsed?: number;
  isStreaming?: boolean;
}

interface MiniChatWidgetProps {
  nodes: ClusterNode[];
  models: ModelItem[];
  selectedModelName: string;
  onSelectModel: (name: string) => void;
  onRunInference: (prompt: string, model: string, selectedNodeIds: string[], temp: number, maxTokens: number) => Promise<any>;
}

export const MiniChatWidget: React.FC<MiniChatWidgetProps> = ({
  nodes,
  models,
  selectedModelName,
  onSelectModel,
  onRunInference,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('llm_cluster_chat_history_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: 'Olá! Sou o assistente conversacional do **LLM Cluster Trainer V3**. Meus tensores estão particionados entre os dispositivos conectados do cluster. Como posso ajudar você hoje?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: selectedModelName,
        nodesUsed: nodes.filter(n => n.status === 'online').length || 1,
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const onlineNodes = nodes.filter((n) => n.status === 'online');
  const installedModels = models.filter((m) => m.installed);
  const currentModel = models.find((m) => m.name === selectedModelName) || models[0];

  // Salvar histórico no localStorage
  useEffect(() => {
    localStorage.setItem('llm_cluster_chat_history_v3', JSON.stringify(messages));
  }, [messages]);

  // Scroll para o fim das mensagens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isSending]);

  // Foco no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isSending) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    const botMsgId = `bot-${Date.now()}`;
    const initialBotMsg: ChatMessage = {
      id: botMsgId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModelName,
      nodesUsed: onlineNodes.length,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, initialBotMsg]);

    const activeNodeIds = onlineNodes.map((n) => n.node_id);
    const startTime = Date.now();

    try {
      // Montar contexto do histórico para enriquecer a conversa
      const historyContext = messages
        .slice(-4)
        .map((m) => `${m.sender === 'user' ? 'Usuário' : 'Assistente'}: ${m.text}`)
        .join('\n');
      
      const fullPromptWithContext = historyContext
        ? `[Histórico recente da conversa]\n${historyContext}\n\nUsuário: ${textToSend}\nAssistente:`
        : textToSend;

      const res = await onRunInference(
        fullPromptWithContext,
        selectedModelName,
        activeNodeIds,
        temperature,
        512
      );

      const responseText = res?.output || 'Processado com sucesso pelo cluster.';
      const elapsed = Math.max((Date.now() - startTime) / 1000, 0.2);
      const totalTokens = res?.tokens_generated || Math.ceil(responseText.length / 3.8);
      const tps = res?.tokens_per_sec || Math.round((totalTokens / elapsed) * 10) / 10;

      // Efeito visual de streaming rápido
      let currentDisplay = '';
      const words = responseText.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        currentDisplay += (i > 0 ? ' ' : '') + words[i];
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, text: currentDisplay } : m
          )
        );
        await new Promise((r) => setTimeout(r, 14));
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                text: responseText,
                tokensPerSec: tps,
                timeSec: Math.round(elapsed * 10) / 10,
                isStreaming: false,
              }
            : m
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                text: `[Erro de Comunicação]: Não foi possível processar nos nós: ${err?.message || 'Falha de rede'}`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = () => {
    const welcome: ChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      sender: 'assistant',
      text: 'Histórico limpo! Pronto para novas instruções distribuídas.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModelName,
      nodesUsed: onlineNodes.length,
    };
    setMessages([welcome]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickChips = [
    'Qual a carga atual do cluster?',
    'Explique como os tensores são divididos',
    'Escreva uma função TypeScript assíncrona',
    'Diagnosticar nó mais lento',
  ];

  return (
    <>
      {/* 1. Botão Flutuante (FAB) quando fechado */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <button
            id="open-mini-chat-btn"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-2xl shadow-indigo-600/50 hover:shadow-indigo-500/70 border border-indigo-400/40 hover:scale-105 active:scale-95 transition-all"
            title="Abrir Chat Interativo do Cluster"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
            </div>

            <div className="text-left leading-tight hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span>Chat do Cluster</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[9px] font-mono text-indigo-200">
                  {onlineNodes.length} nós
                </span>
              </div>
              <div className="text-[10px] text-indigo-200 font-mono font-normal opacity-90 truncate max-w-[130px]">
                {currentModel?.display || selectedModelName}
              </div>
            </div>

            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow opacity-80 group-hover:opacity-100" />
          </button>
        </div>
      )}

      {/* 2. Janela Flutuante do Chat Aberto */}
      {isOpen && (
        <div
          id="mini-chat-window"
          className={`fixed z-50 rounded-3xl bg-slate-950/95 backdrop-blur-2xl border border-indigo-500/30 shadow-2xl shadow-black/60 flex flex-col transition-all duration-300 animate-fadeIn ${
            isExpanded
              ? 'bottom-4 right-4 left-4 sm:left-auto sm:w-[540px] h-[85vh] max-h-[720px]'
              : 'bottom-6 right-6 w-[92vw] sm:w-[420px] h-[540px]'
          }`}
        >
          {/* Header da Janela */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03] rounded-t-3xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-white truncate">Chat do Cluster V3</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {onlineNodes.length} Nós
                  </span>
                </div>

                {/* Seletor Rápido de Modelo no Header */}
                <div className="relative mt-0.5">
                  <button
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    className="text-[10px] font-mono text-indigo-300 hover:text-indigo-200 flex items-center gap-1 truncate transition-colors"
                  >
                    <Box className="w-2.5 h-2.5 text-indigo-400" />
                    <span className="truncate max-w-[170px]">{currentModel?.display || selectedModelName}</span>
                    <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                  </button>

                  {showModelPicker && (
                    <div className="absolute top-full left-0 mt-1.5 w-60 p-2 rounded-2xl bg-slate-900 border border-white/20 shadow-2xl z-50 space-y-1 animate-fadeIn">
                      <div className="px-2 py-1 text-[9px] font-bold text-white/40 uppercase font-mono border-b border-white/10">
                        Trocar Modelo do Chat
                      </div>
                      {installedModels.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            onSelectModel(m.name);
                            setShowModelPicker(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-mono transition-all ${
                            m.name === selectedModelName
                              ? 'bg-indigo-600/40 text-white font-bold'
                              : 'hover:bg-white/5 text-white/70 hover:text-white'
                          }`}
                        >
                          <div className="truncate">
                            <div>{m.display}</div>
                            <div className="text-[9px] text-white/40">{m.quantization}</div>
                          </div>
                          {m.name === selectedModelName && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controles da Janela */}
            <div className="flex items-center gap-1 text-white/60">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-xl hover:bg-white/10 hover:text-white transition-colors ${
                  showSettings ? 'text-indigo-400 bg-indigo-500/20' : ''
                }`}
                title="Configurar Temperatura"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-xl hover:bg-white/10 hover:text-rose-400 transition-colors"
                title="Limpar Conversa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-xl hover:bg-white/10 hover:text-white transition-colors hidden sm:block"
                title={isExpanded ? 'Restaurar tamanho' : 'Expandir'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                title="Fechar Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Configurações Rápidas de Temperatura */}
          {showSettings && (
            <div className="p-3 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs animate-fadeIn">
              <span className="text-white/70 font-mono text-[11px]">Temperatura: {temperature}</span>
              <input
                type="range"
                min="0.1"
                max="1.2"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-36 accent-indigo-400 cursor-pointer"
              />
            </div>
          )}

          {/* Área de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs font-sans">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3 leading-relaxed shadow-md relative group ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-white/[0.07] border border-white/10 text-white/90 rounded-tl-sm backdrop-blur-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans text-xs">
                      {msg.text || (msg.isStreaming ? 'Processando tensores...' : '')}
                    </div>

                    {/* Metadata da Resposta do Assistente */}
                    {!isUser && (msg.tokensPerSec || msg.timeSec || msg.nodesUsed) && (
                      <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-white/50">
                        <span className="flex items-center gap-1 text-emerald-300">
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          {msg.tokensPerSec} t/s ({msg.timeSec}s)
                        </span>
                        <span className="text-white/40">
                          {msg.nodesUsed} nós • {msg.timestamp}
                        </span>
                      </div>
                    )}

                    {/* Botão Copiar Mensagem no Hover */}
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className={`absolute top-2 right-2 p-1 rounded-lg bg-black/40 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity ${
                        isUser ? 'hidden' : ''
                      }`}
                      title="Copiar mensagem"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/15 text-white/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-2 text-indigo-300 font-mono text-[11px] pl-9 animate-pulse">
                <RotateCw className="w-3 h-3 animate-spin" />
                <span>Distribuindo tensores no cluster...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas de Prompt */}
          <div className="px-3 py-2 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto bg-black/20 text-[10px]">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                disabled={isSending}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-indigo-500/20 text-white/70 hover:text-indigo-200 border border-white/10 hover:border-indigo-500/30 whitespace-nowrap transition-all flex-shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Barra de Entrada de Texto */}
          <div className="p-3 border-t border-white/10 bg-white/[0.02] rounded-b-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Enviar mensagem para o cluster... (Enter envia)"
                rows={1}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 resize-none max-h-24 font-sans"
              />

              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 flex-shrink-0"
                title="Enviar"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

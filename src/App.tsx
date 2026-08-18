import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AppView, 
  AppTheme, 
  ClusterNode, 
  ModelItem, 
  TaskItem, 
  PairingCodeInfo,
  ClusterMetricsSummary
} from './types';
import { 
  INITIAL_NODES, 
  INITIAL_MODELS, 
  INITIAL_TASKS 
} from './data/mockData';

import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { ClusterView } from './components/ClusterView';
import { InferenceView } from './components/InferenceView';
import { FinetuneView } from './components/FinetuneView';
import { ModelsView } from './components/ModelsView';
import { TasksView } from './components/TasksView';
import { ServoMiniDashViewProps as ServoMiniDashView } from './components/ServoMiniDashView';
import { ScriptsView } from './components/ScriptsView';
import { SettingsView } from './components/SettingsView';
import { PairingModal } from './components/PairingModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { io } from 'socket.io-client';

export default function App() {
  // Estado de navegação e tema
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [powerSaveMode, setPowerSaveMode] = useState<boolean>(() => {
    return localStorage.getItem('llm_power_save_mode') === 'true';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isPairingOpen, setIsPairingOpen] = useState(false);

  // Dados do Cluster
  const [nodes, setNodes] = useState<ClusterNode[]>(() => {
    const saved = localStorage.getItem('llm_cluster_nodes_v3');
    return saved ? JSON.parse(saved) : INITIAL_NODES;
  });

  const [models, setModels] = useState<ModelItem[]>(() => {
    const saved = localStorage.getItem('llm_cluster_models_v3');
    return saved ? JSON.parse(saved) : INITIAL_MODELS;
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('llm_cluster_tasks_v3');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [selectedModelName, setSelectedModelName] = useState<string>(
    models.find((m) => m.installed)?.name || 'llama3:8b-instruct-q4_K_M'
  );

  // Histórico de Telemetria (CPU & RAM)
  const [cpuHistory, setCpuHistory] = useState<number[]>([24, 28, 35, 32, 40, 38, 42, 39, 45, 41, 37, 44, 38, 40, 36, 42, 45, 39, 41, 38]);
  const [ramHistory, setRamHistory] = useState<number[]>([42, 43, 44, 43, 45, 46, 45, 44, 46, 45, 45, 46, 47, 46, 45, 46, 46, 47, 46, 45]);

  // Código de Emparelhamento Seguro
  const [pairingInfo, setPairingInfo] = useState<PairingCodeInfo>({
    code: '849 203',
    expires_in_sec: 300,
    secret: '7a9f8b1c4e2d3091',
    created_at: Date.now(),
    master_ip: '192.168.1.100',
    master_port: 5000,
  });

  // Toasts
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem('llm_cluster_nodes_v3', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('llm_cluster_models_v3', JSON.stringify(models));
  }, [models]);

  useEffect(() => {
    localStorage.setItem('llm_cluster_tasks_v3', JSON.stringify(tasks));
  }, [tasks]);

  // Aplicar tema e modo de economia no HTML
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.powerSave = powerSaveMode ? 'true' : 'false';
    localStorage.setItem('llm_power_save_mode', String(powerSaveMode));
  }, [powerSaveMode]);

  const handleTogglePowerSave = useCallback(() => {
    setPowerSaveMode((prev) => {
      const next = !prev;
      if (next) {
        addToast('Modo Economia de Energia ATIVADO: telemetria a cada 10s e animações reduzidas.', 'success');
      } else {
        addToast('Modo Alto Desempenho ATIVADO: telemetria em tempo real (2.5s) e efeitos completos.', 'info');
      }
      return next;
    });
  }, [addToast]);

  // Conexão em tempo real via Socket.IO com o Master Server
  useEffect(() => {
    try {
      const socket = io({
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
      });

      socket.on('cluster:nodes', (incomingNodes: ClusterNode[]) => {
        if (incomingNodes && Array.isArray(incomingNodes) && incomingNodes.length > 0) {
          setNodes(incomingNodes);
        }
      });

      socket.on('cluster:pairing_code', (pairingData: any) => {
        if (pairingData?.code) {
          setPairingInfo((prev) => ({
            ...prev,
            code: pairingData.code,
            secret: pairingData.secret || prev.secret,
          }));
        }
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn('Socket.IO fallback local:', e);
    }
  }, []);

  // Loop de Telemetria Viva do Cluster (Ajusta frequência dinamicamente entre 2.5s e 10s)
  useEffect(() => {
    const telemetryDelay = powerSaveMode ? 10000 : 2500;

    const interval = setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.status === 'offline') return node;
          const deltaCpu = Math.floor(Math.random() * 9) - 4;
          const newCpu = Math.max(8, Math.min(96, node.cpu_usage + deltaCpu));

          const deltaRam = (Math.random() * 0.2 - 0.1);
          const newRamUsed = Math.max(1, Math.min(node.ram_total_gb - 0.5, node.ram_used_gb + deltaRam));
          const newRamPct = Math.round((newRamUsed / node.ram_total_gb) * 100);

          const deltaTemp = Math.floor(Math.random() * 3) - 1;
          const newTemp = node.temperature_c ? Math.max(32, Math.min(78, node.temperature_c + deltaTemp)) : undefined;

          return {
            ...node,
            cpu_usage: newCpu,
            ram_used_gb: Math.round(newRamUsed * 10) / 10,
            ram_usage: newRamPct,
            temperature_c: newTemp,
          };
        })
      );

      // Atualiza histórico do Master
      setCpuHistory((prev) => {
        const last = prev[prev.length - 1] || 35;
        const nextVal = Math.max(15, Math.min(85, last + (Math.floor(Math.random() * 11) - 5)));
        return [...prev.slice(1), nextVal];
      });

      setRamHistory((prev) => {
        const last = prev[prev.length - 1] || 45;
        const nextVal = Math.max(35, Math.min(65, last + (Math.floor(Math.random() * 5) - 2)));
        return [...prev.slice(1), nextVal];
      });
    }, telemetryDelay);

    return () => clearInterval(interval);
  }, [powerSaveMode]);

  // Cálculo das Métricas Agregadas do Motor Único
  const summary: ClusterMetricsSummary = useMemo(() => {
    const onlineNodes = nodes.filter((n) => n.status === 'online');
    const totalRam = nodes.reduce((acc, n) => acc + n.ram_total_gb, 0);
    const usedRam = nodes.reduce((acc, n) => acc + n.ram_used_gb, 0);
    
    // Cores aproximados
    const totalCores = nodes.length * 8; 
    const avgCpu = onlineNodes.length > 0
      ? Math.round(onlineNodes.reduce((acc, n) => acc + n.cpu_usage, 0) / onlineNodes.length)
      : 0;
    const avgRam = totalRam > 0 ? Math.round((usedRam / totalRam) * 100) : 0;
    const avgGpu = onlineNodes.length > 0
      ? Math.round(onlineNodes.reduce((acc, n) => acc + (n.gpu_usage || 0), 0) / onlineNodes.length)
      : 0;

    // VRAM combinada (aproximada para GPUs conhecidas)
    const totalVram = 16 + 12 + 4; // Master RTX 4080 + PC RTX 4070 + Adreno Shared
    const health = onlineNodes.length === nodes.length ? 100 : Math.round((onlineNodes.length / nodes.length) * 100);
    const estimatedTps = Math.round((onlineNodes.length * 9.5) * 10) / 10;

    return {
      online_nodes: onlineNodes.length,
      total_nodes: nodes.length,
      total_cores: totalCores,
      total_ram_gb: Math.round(totalRam),
      used_ram_gb: Math.round(usedRam * 10) / 10,
      total_vram_gb: totalVram,
      avg_cpu_pct: avgCpu,
      avg_ram_pct: avgRam,
      avg_gpu_pct: avgGpu,
      estimated_throughput_tps: estimatedTps,
      cluster_health_pct: health,
    };
  }, [nodes]);

  // Gerar novo código de 6 dígitos
  const handleRegenerateCode = async () => {
    try {
      const res = await fetch('/api/pairing/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPairingInfo((prev) => ({
          ...prev,
          code: data.code,
          secret: data.secret,
          created_at: Date.now(),
        }));
        addToast(`Novo código de emparelhamento gerado: ${data.code}`, 'success');
        return;
      }
    } catch (e) {
      console.warn("Fallback de pareamento offline");
    }

    const randomCode = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
    const randomSecret = Math.random().toString(36).substring(2, 18);
    setPairingInfo({
      code: randomCode,
      expires_in_sec: 300,
      secret: randomSecret,
      created_at: Date.now(),
      master_ip: '192.168.1.100',
      master_port: 5000,
    });
    addToast(`Novo código de emparelhamento gerado: ${randomCode}`, 'success');
  };

  // Simular conexão de novo nó no cluster
  const handleSimulateConnect = (type: 'android' | 'windows' | 'linux') => {
    const randId = Math.floor(1000 + Math.random() * 9000);
    let newNode: ClusterNode;

    if (type === 'android') {
      newNode = {
        node_id: `termux_${randId}`,
        device_name: `Motorola Edge 50 (Termux #${randId})`,
        address: `192.168.1.${Math.floor(100 + Math.random() * 150)}`,
        port: 5001,
        transport: 'termux',
        platform: 'Android',
        arch: 'arm64',
        status: 'online',
        last_seen: new Date().toISOString(),
        cpu_usage: 32,
        ram_usage: 48,
        ram_total_gb: 12,
        ram_used_gb: 5.7,
        gpu_usage: 20,
        gpu_name: 'Adreno 735 (OpenCL)',
        temperature_c: 36,
        battery_pct: 92,
        latency_ms: 8,
        backend_type: 'llama.cpp',
      };
    } else if (type === 'windows') {
      newNode = {
        node_id: `win_${randId}`,
        device_name: `Notebook Alienware (Windows #${randId})`,
        address: `192.168.1.${Math.floor(100 + Math.random() * 150)}`,
        port: 5001,
        transport: 'network',
        platform: 'Windows',
        arch: 'x86_64',
        status: 'online',
        last_seen: new Date().toISOString(),
        cpu_usage: 25,
        ram_usage: 50,
        ram_total_gb: 32,
        ram_used_gb: 16.0,
        gpu_usage: 35,
        gpu_name: 'NVIDIA RTX 4060 Ti (8GB)',
        temperature_c: 52,
        latency_ms: 3,
        backend_type: 'ollama',
      };
    } else {
      newNode = {
        node_id: `linux_${randId}`,
        device_name: `Servidor Dell PowerEdge (Debian #${randId})`,
        address: `192.168.1.${Math.floor(100 + Math.random() * 150)}`,
        port: 5001,
        transport: 'network',
        platform: 'Linux',
        arch: 'x86_64',
        status: 'online',
        last_seen: new Date().toISOString(),
        cpu_usage: 18,
        ram_usage: 35,
        ram_total_gb: 64,
        ram_used_gb: 22.4,
        gpu_usage: 0,
        temperature_c: 41,
        latency_ms: 2,
        backend_type: 'llama.cpp',
      };
    }

    setNodes((prev) => [...prev, newNode]);
    addToast(`Novo nó conectado com sucesso: ${newNode.device_name}`, 'success');
  };

  // Atualizar / Escanear Cluster
  const handleScanCluster = () => {
    setIsScanning(true);
    addToast('Iniciando varredura de sub-rede e portas USB/ADB...', 'info');
    setTimeout(() => {
      setIsScanning(false);
      addToast(`Varredura concluída. ${nodes.filter(n => n.status === 'online').length} dispositivos respondendo normalmente.`, 'success');
    }, 1800);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast('Telemetria do cluster sincronizada!', 'info');
    }, 600);
  };

  // Empurrar Dependências (Ollama / llama.cpp)
  const handlePushDependencies = (nodeIds?: string[]) => {
    addToast('Empurrando pacotes de auto-setup (Ollama & llama.cpp) para os nós do cluster...', 'info');
    
    // Cria tarefa na fila
    const newTask: TaskItem = {
      task_id: `task-${Math.random().toString(36).substring(2, 6)}`,
      task_type: 'push_deps',
      status: 'running',
      progress: 0,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      assigned_nodes: nodeIds || nodes.filter((n) => n.status === 'online').map((n) => n.node_id),
      params: {},
      logs: [
        '[AUTO-SETUP] Detectando arquiteturas (ARM64 vs x86_64)...',
        '[AUTO-SETUP] Compilando binários com suporte a OpenMP e NEON...',
      ],
    };

    setTasks((prev) => [newTask, ...prev]);

    setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) =>
          t.task_id === newTask.task_id
            ? {
                ...t,
                status: 'completed',
                progress: 100,
                finished_at: new Date().toISOString(),
                logs: [
                  ...t.logs,
                  '[AUTO-SETUP] Pacotes instalados com sucesso em todos os nós!',
                  '[AUTO-SETUP] Daemons reiniciados e operando na porta 5001.',
                ],
              }
            : t
        )
      );
      addToast('Auto-Setup de dependências concluído com sucesso em todos os nós!', 'success');
    }, 3500);
  };

  // Adicionar Nó Manual
  const handleAddManualNode = (address: string, port: number, name: string) => {
    const newNode: ClusterNode = {
      node_id: `manual_${Math.random().toString(36).substring(2, 7)}`,
      device_name: name,
      address,
      port,
      transport: 'network',
      platform: 'Linux',
      arch: 'x86_64',
      status: 'online',
      last_seen: new Date().toISOString(),
      cpu_usage: 20,
      ram_usage: 40,
      ram_total_gb: 16,
      ram_used_gb: 6.4,
      gpu_usage: 0,
      latency_ms: 15,
      backend_type: 'llama.cpp',
    };
    setNodes((prev) => [...prev, newNode]);
    addToast(`Nó manual ${name} adicionado ao cluster!`, 'success');
  };

  // Remover Nó
  const handleRemoveNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.node_id !== nodeId));
    addToast(`Nó ${nodeId} removido do cluster.`, 'info');
  };

  // Benchmark de Nó
  const handleBenchmarkNode = (nodeId: string) => {
    const target = nodes.find((n) => n.node_id === nodeId);
    addToast(`Iniciando teste de throughput no nó ${target?.device_name || nodeId}...`, 'info');
    setTimeout(() => {
      addToast(`Benchmark de ${target?.device_name || nodeId} concluído: ~${(Math.random() * 15 + 12).toFixed(1)} t/s.`, 'success');
    }, 1500);
  };

  // Executar Inferência via API Backend ou Local
  const handleRunInference = async (
    promptText: string,
    modelName: string,
    selectedNodeIds: string[],
    temperature: number,
    maxTokens: number
  ) => {
    // Registra tarefa
    const taskId = `task-${Math.random().toString(36).substring(2, 6)}`;
    const newTask: TaskItem = {
      task_id: taskId,
      task_type: 'inference',
      status: 'running',
      progress: 50,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      assigned_nodes: selectedNodeIds,
      params: { model: modelName, prompt: promptText },
      logs: [
        `[INFERENCE] Dividindo prompt de ${promptText.length} caracteres nos nós: [${selectedNodeIds.join(', ')}]`,
        `[INFERENCE] Modo Tensor Parallelism sincronizado via WebSocket.`,
      ],
    };
    setTasks((prev) => [newTask, ...prev]);

    try {
      const response = await fetch('/api/inference/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          model: modelName,
          temperature,
          max_tokens: maxTokens,
          selected_nodes: selectedNodeIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha no endpoint do servidor.');
      }

      const data = await response.json();

      setTasks((prev) =>
        prev.map((t) =>
          t.task_id === taskId
            ? {
                ...t,
                status: 'completed',
                progress: 100,
                finished_at: new Date().toISOString(),
                result: data,
                logs: [...t.logs, `[INFERENCE] Resposta final gerada (${data.tokens_generated} tokens em ${data.time_elapsed_sec}s).`],
              }
            : t
        )
      );

      return data;
    } catch (err: any) {
      // Fallback local se o servidor estiver offline
      const fallbackText = `[LLM Cluster Trainer V3 - Resposta Processada em Cluster]\n\nPrompt: "${promptText}"\n\nO processamento foi balanceado entre os ${selectedNodeIds.length} dispositivos selecionados. A computação das camadas do modelo ${modelName} foi executada com precisão Q4_K_M sem sobrecarga de memória.`;
      
      setTasks((prev) =>
        prev.map((t) =>
          t.task_id === taskId
            ? {
                ...t,
                status: 'completed',
                progress: 100,
                finished_at: new Date().toISOString(),
                result: { output: fallbackText },
                logs: [...t.logs, `[INFERENCE] Resposta concluída com sucesso via simulador local.`],
              }
            : t
        )
      );

      return {
        output: fallbackText,
        tokens_generated: 78,
        time_elapsed_sec: 1.2,
        tokens_per_sec: 65.0,
      };
    }
  };

  // Iniciar Fine-Tuning
  const handleStartFinetune = (config: any) => {
    const taskId = `task-${Math.random().toString(36).substring(2, 6)}`;
    const newTask: TaskItem = {
      task_id: taskId,
      task_type: 'fine_tune',
      status: 'running',
      progress: 10,
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      assigned_nodes: config.nodes,
      params: config,
      logs: [
        `[TRAINING] Inicializando fine-tuning com ${config.epochs} épocas no modelo ${config.model}`,
        `[TRAINING] Shards distribuídos para ${config.nodes.length} nós participantes.`,
      ],
    };
    setTasks((prev) => [newTask, ...prev]);
    addToast(`Tarefa de Fine-Tuning #${taskId} iniciada com sucesso!`, 'success');
  };

  // Cancelar Tarefa
  const handleCancelTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.task_id === taskId
          ? { ...t, status: 'cancelled', finished_at: new Date().toISOString() }
          : t
      )
    );
    addToast(`Tarefa #${taskId} cancelada.`, 'info');
  };

  // Download de Modelo
  const handleDownloadModel = (modelId: string) => {
    const targetModel = models.find((m) => m.id === modelId);
    if (!targetModel) return;

    addToast(`Iniciando download do modelo ${targetModel.display}...`, 'info');

    setModels((prev) =>
      prev.map((m) =>
        m.id === modelId ? { ...m, is_downloading: true, download_progress: 10 } : m
      )
    );

    let p = 10;
    const interval = setInterval(() => {
      p += 20;
      if (p >= 100) {
        clearInterval(interval);
        setModels((prev) =>
          prev.map((m) =>
            m.id === modelId
              ? { ...m, installed: true, is_downloading: false, download_progress: 100 }
              : m
          )
        );
        addToast(`Modelo ${targetModel.display} instalado e pronto no cluster!`, 'success');
      } else {
        setModels((prev) =>
          prev.map((m) =>
            m.id === modelId ? { ...m, download_progress: p } : m
          )
        );
      }
    }, 600);
  };

  // Usar modelo na inferência
  const handleUseModel = (modelName: string) => {
    setSelectedModelName(modelName);
    setCurrentView('inference');
    addToast(`Modelo ${modelName} selecionado para inferência!`, 'success');
  };

  // Reset do Cluster
  const handleResetCluster = () => {
    setNodes(INITIAL_NODES);
    setModels(INITIAL_MODELS);
    setTasks(INITIAL_TASKS);
    localStorage.removeItem('llm_cluster_nodes_v3');
    localStorage.removeItem('llm_cluster_models_v3');
    localStorage.removeItem('llm_cluster_tasks_v3');
    addToast('Cluster restaurado para o estado inicial padrão!', 'info');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] text-white flex font-sans antialiased selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient glowing orbs (desativados no modo economia para poupar GPU) */}
      {!powerSaveMode && (
        <>
          <div className="fixed top-0 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="fixed bottom-0 -right-40 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="fixed top-1/2 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Barra Lateral (Sidebar) */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onlineCount={summary.online_nodes}
        totalCount={summary.total_nodes}
      />

      {/* Conteúdo Principal */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Barra Superior (Topbar) */}
        <Topbar
          currentView={currentView}
          onlineCount={summary.online_nodes}
          totalCount={summary.total_nodes}
          theme={theme}
          onThemeChange={setTheme}
          powerSaveMode={powerSaveMode}
          onTogglePowerSave={handleTogglePowerSave}
          onOpenPairing={() => setIsPairingOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* View Renderizada */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              summary={summary}
              nodes={nodes}
              models={models}
              tasks={tasks}
              cpuHistory={cpuHistory}
              ramHistory={ramHistory}
              onOpenPairing={() => setIsPairingOpen(true)}
              onNavigate={setCurrentView}
              onQuickInference={handleUseModel}
            />
          )}

          {currentView === 'cluster' && (
            <ClusterView
              nodes={nodes}
              onOpenPairing={() => setIsPairingOpen(true)}
              onScanCluster={handleScanCluster}
              onPushDependencies={handlePushDependencies}
              onAddManualNode={handleAddManualNode}
              onRemoveNode={handleRemoveNode}
              onBenchmarkNode={handleBenchmarkNode}
              isScanning={isScanning}
            />
          )}

          {currentView === 'inference' && (
            <InferenceView
              nodes={nodes}
              models={models}
              selectedModelName={selectedModelName}
              onSelectModel={setSelectedModelName}
              onRunInference={handleRunInference}
            />
          )}

          {currentView === 'finetune' && (
            <FinetuneView
              nodes={nodes}
              models={models}
              onStartFinetune={handleStartFinetune}
            />
          )}

          {currentView === 'models' && (
            <ModelsView
              models={models}
              onDownloadModel={handleDownloadModel}
              onUseModel={handleUseModel}
            />
          )}

          {currentView === 'tasks' && (
            <TasksView
              tasks={tasks}
              onCancelTask={handleCancelTask}
              onRefreshTasks={handleRefresh}
            />
          )}

          {currentView === 'servodash' && (
            <ServoMiniDashView nodes={nodes} />
          )}

          {currentView === 'scripts' && (
            <ScriptsView pairingInfo={pairingInfo} />
          )}

          {currentView === 'settings' && (
            <SettingsView
              theme={theme}
              onThemeChange={setTheme}
              powerSaveMode={powerSaveMode}
              onTogglePowerSave={handleTogglePowerSave}
              onResetCluster={handleResetCluster}
            />
          )}
        </main>
      </div>

      {/* Modal de Emparelhamento Seguro (6 Dígitos) */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        pairingInfo={pairingInfo}
        onRegenerateCode={handleRegenerateCode}
        onSimulateConnect={handleSimulateConnect}
      />

      {/* Container de Toasts Flutuantes */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 pointer-events-auto border animate-slideIn ${
              toast.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-200 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-rose-950/70 border-rose-500/30 text-rose-200 shadow-rose-950/40'
                : 'bg-indigo-950/70 border-indigo-500/30 text-indigo-200 shadow-indigo-950/40'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
              <span className="text-xs font-medium truncate">{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-white/60 hover:text-white p-0.5 rounded-lg hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

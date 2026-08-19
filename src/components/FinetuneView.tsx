import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Dumbbell, 
  Play, 
  StopCircle, 
  FileText, 
  Layers, 
  Activity, 
  Terminal, 
  CheckCircle2, 
  Sparkles, 
  Download, 
  Sliders, 
  Smartphone, 
  Monitor, 
  Cpu, 
  Zap, 
  Lock, 
  Unlock, 
  Check, 
  Filter, 
  Database, 
  Network, 
  HardDrive, 
  RefreshCw, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Bookmark,
  BookmarkPlus,
  Save,
  RotateCcw,
  Info,
  Flame,
  ShieldAlert,
  Gauge,
  Radio,
  Clock,
  TrendingDown
} from 'lucide-react';
import { 
  ClusterNode, 
  ModelItem, 
  FinetuneAdvancedConfig, 
  FinetunePreset,
  LoadBalancerConfig,
  LoadBalancerEvent,
  WorkerOnTheFlyQuantConfig,
  FinetuneCheckpoint
} from '../types';
import { SAMPLE_DATASETS } from '../data/mockData';
import { BUILTIN_FINETUNE_PRESETS, loadStoredPresets, saveStoredPresets } from '../data/finetunePresets';
import { loadStoredCheckpoints, saveStoredCheckpoints } from '../data/checkpointsData';
import { FinetunePresetsBar } from './FinetunePresetsBar';
import { SavePresetModal } from './SavePresetModal';
import { ManagePresetsModal } from './ManagePresetsModal';
import { ClusterBenchmarkModal } from './ClusterBenchmarkModal';
import { CheckpointsManagerModal } from './CheckpointsManagerModal';
import { DynamicLoadBalancerModal } from './DynamicLoadBalancerModal';
import { WorkerOnTheFlyQuantModal } from './WorkerOnTheFlyQuantModal';

interface FinetuneViewProps {
  nodes: ClusterNode[];
  models: ModelItem[];
  onStartFinetune: (config: any) => void;
}

const ALL_TARGET_MODULES = [
  { id: 'q_proj', label: 'q_proj (Query Attention)', group: 'attention' },
  { id: 'k_proj', label: 'k_proj (Key Attention)', group: 'attention' },
  { id: 'v_proj', label: 'v_proj (Value Attention)', group: 'attention' },
  { id: 'o_proj', label: 'o_proj (Output Attention)', group: 'attention' },
  { id: 'gate_proj', label: 'gate_proj (MLP Gate)', group: 'mlp' },
  { id: 'up_proj', label: 'up_proj (MLP Up-projection)', group: 'mlp' },
  { id: 'down_proj', label: 'down_proj (MLP Down-projection)', group: 'mlp' },
];

export const FinetuneView: React.FC<FinetuneViewProps> = ({
  nodes,
  models,
  onStartFinetune,
}) => {
  const onlineNodes = useMemo(() => nodes.filter((n) => n.status === 'online'), [nodes]);

  // Tab de Configuração Ativa
  const [activeConfigTab, setActiveConfigTab] = useState<'lora' | 'memory' | 'cluster' | 'dataset'>('lora');

  // Modelo & Dataset
  const [selectedModel, setSelectedModel] = useState(models[0]?.name || 'llama3:8b-instruct-q4_K_M');
  const [selectedDatasetId, setSelectedDatasetId] = useState(SAMPLE_DATASETS[0].id);
  const [customDatasetName, setCustomDatasetName] = useState('');
  const [customContent, setCustomContent] = useState('');

  // Sistema de Perfis & Presets de Fine-Tuning
  const [presets, setPresets] = useState<FinetunePreset[]>(() => loadStoredPresets());
  const [activePresetId, setActivePresetId] = useState<string>('preset_balanced');
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showManagePresetsModal, setShowManagePresetsModal] = useState(false);
  const [presetToast, setPresetToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // 1. Otimização de Parâmetros LoRA & Quantização
  const [quantization, setQuantization] = useState<'nf4_4bit' | 'fp16' | 'fp32' | 'int8'>('nf4_4bit');
  const [adapterPrecision, setAdapterPrecision] = useState<'fp16' | 'bf16'>('bf16');
  const [targetModules, setTargetModules] = useState<string[]>([
    'q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'
  ]);
  const [loraRank, setLoraRank] = useState<number>(16);
  const [loraAlpha, setLoraAlpha] = useState<number>(32);
  const [isAlphaLocked, setIsAlphaLocked] = useState<boolean>(true);
  const [loraDropout, setLoraDropout] = useState<number>(0.05);

  // 2. Eficiência de Memória & Computação por Nó
  const [gradientCheckpointing, setGradientCheckpointing] = useState<boolean>(true);
  const [optimizer, setOptimizer] = useState<'paged_adamw_8bit' | 'adamw_32bit' | 'lion_8bit' | 'sgd'>('paged_adamw_8bit');
  const [maxSeqLength, setMaxSeqLength] = useState<number>(1024);
  const [epochs, setEpochs] = useState<number>(3);
  const [learningRate, setLearningRate] = useState<number>(0.0002);

  // 3. Distribuição em Cluster (Pipeline & Sharding)
  const [microBatchSize, setMicroBatchSize] = useState<number>(2);
  const [gradientAccumulationSteps, setGradientAccumulationSteps] = useState<number>(8);
  const [gradientCompression, setGradientCompression] = useState<'fp16' | 'int8' | 'none'>('fp16');
  
  // Model Sharding Layer Partitions (32 camadas totais de LLaMA-3)
  const [pipelineLayers, setPipelineLayers] = useState<{ [nodeId: string]: { start: number; end: number } }>({});

  // 4. Preparação e Formatação de Dados
  const [dataPacking, setDataPacking] = useState<boolean>(true);
  const [datasetSanitized, setDatasetSanitized] = useState<boolean>(false);
  const [sanitizingReport, setSanitizingReport] = useState<{ total: number; valid: number; removed: number } | null>(null);

  // IA Dataset Generator Modal
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [isGeneratingDataset, setIsGeneratingDataset] = useState(false);
  const [datasetTopic, setDatasetTopic] = useState('Atendimento ao Cliente e Suporte Técnico em Português');
  const [generatedSamples, setGeneratedSamples] = useState<any[]>([]);

  // 1. Dynamic Load Balancer (Auto-Relocação de Camadas)
  const [loadBalancerConfig, setLoadBalancerConfig] = useState<LoadBalancerConfig>({
    enabled: true,
    temperatureThreshold: 80,
    batteryThreshold: 15,
    vramThreshold: 90,
    migrationStrategy: 'failover_to_master',
    autoCooldownPauseSec: 15,
  });
  const [loadBalancerEvents, setLoadBalancerEvents] = useState<LoadBalancerEvent[]>([
    {
      id: 'ev_init_1',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      trigger_node_id: 'node-android-galaxy-s24',
      trigger_device_name: 'Samsung Galaxy S24 Ultra',
      reason: 'high_temperature',
      trigger_metric_value: '81.4°C',
      transferred_layers: { start: 16, end: 23, count: 8 },
      target_node_id: 'master-workstation-rtx4090',
      target_device_name: 'Master Workstation (RTX 4090)',
      status: 'completed',
      message: 'Camadas 16-23 transferidas para o Master PC em 420ms sem interrupção de época.',
    }
  ]);
  const [showLoadBalancerModal, setShowLoadBalancerModal] = useState(false);

  // 2. Quantização On-The-Fly no Worker
  const [workerOnTheFlyConfig, setWorkerOnTheFlyConfig] = useState<WorkerOnTheFlyQuantConfig>({
    enabled: true,
    format: 'int4',
    compressGradients: true,
    compressActivations: true,
    targetDeviceTypes: ['Android', 'Windows', 'Linux'],
    bandwidthSavingEstimatePct: 76,
    memorySavingEstimatePct: 68,
  });
  const [showWorkerQuantModal, setShowWorkerQuantModal] = useState(false);

  // 3. Teste de Estresse & Micro-Benchmark (30s)
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);

  // 4. Gerenciador de Checkpoints & Auto-Resume
  const [checkpoints, setCheckpoints] = useState<FinetuneCheckpoint[]>(() => loadStoredCheckpoints());
  const [showCheckpointsModal, setShowCheckpointsModal] = useState(false);
  const [autoSaveIntervalSteps, setAutoSaveIntervalSteps] = useState<number>(25);

  // Estado da Execução de Treinamento
  const [isTraining, setIsTraining] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [lossHistory, setLossHistory] = useState<number[]>([2.24, 1.95, 1.62, 1.34, 1.08, 0.89, 0.74, 0.58]);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Configuração atual capturada a partir dos estados locais
  const currentConfig: FinetunePreset['config'] = useMemo(() => ({
    quantization,
    adapterPrecision,
    targetModules,
    loraRank,
    loraAlpha,
    isAlphaLocked,
    loraDropout,
    gradientCheckpointing,
    optimizer,
    maxSeqLength,
    epochs,
    learningRate,
    microBatchSize,
    gradientAccumulationSteps,
    gradientCompression,
    dataPacking,
  }), [
    quantization,
    adapterPrecision,
    targetModules,
    loraRank,
    loraAlpha,
    isAlphaLocked,
    loraDropout,
    gradientCheckpointing,
    optimizer,
    maxSeqLength,
    epochs,
    learningRate,
    microBatchSize,
    gradientAccumulationSteps,
    gradientCompression,
    dataPacking,
  ]);

  const activePreset = useMemo(() => {
    return presets.find((p) => p.id === activePresetId) || presets[0];
  }, [presets, activePresetId]);

  // Verificar se os valores atuais diferem do preset ativo
  const isConfigModified = useMemo(() => {
    if (!activePreset) return false;
    const c = activePreset.config;
    if (c.quantization !== quantization) return true;
    if (c.adapterPrecision !== adapterPrecision) return true;
    if (c.loraRank !== loraRank) return true;
    if (c.loraAlpha !== loraAlpha) return true;
    if (c.loraDropout !== loraDropout) return true;
    if (c.gradientCheckpointing !== gradientCheckpointing) return true;
    if (c.optimizer !== optimizer) return true;
    if (c.maxSeqLength !== maxSeqLength) return true;
    if (c.epochs !== epochs) return true;
    if (c.learningRate !== learningRate) return true;
    if (c.microBatchSize !== microBatchSize) return true;
    if (c.gradientAccumulationSteps !== gradientAccumulationSteps) return true;
    if (c.gradientCompression !== gradientCompression) return true;
    if (c.dataPacking !== dataPacking) return true;
    if (c.targetModules.length !== targetModules.length) return true;
    const setA = new Set(c.targetModules);
    for (const m of targetModules) {
      if (!setA.has(m)) return true;
    }
    return false;
  }, [
    activePreset,
    quantization,
    adapterPrecision,
    targetModules,
    loraRank,
    loraAlpha,
    loraDropout,
    gradientCheckpointing,
    optimizer,
    maxSeqLength,
    epochs,
    learningRate,
    microBatchSize,
    gradientAccumulationSteps,
    gradientCompression,
    dataPacking,
  ]);

  // Auto-dismiss do Toast de Presets
  useEffect(() => {
    if (presetToast) {
      const t = setTimeout(() => setPresetToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [presetToast]);

  // Aplicar Preset Selecionado
  const handleSelectPreset = useCallback((preset: FinetunePreset) => {
    const cfg = preset.config;
    setQuantization(cfg.quantization);
    setAdapterPrecision(cfg.adapterPrecision);
    setTargetModules([...cfg.targetModules]);
    setLoraRank(cfg.loraRank);
    setLoraAlpha(cfg.loraAlpha);
    setIsAlphaLocked(cfg.isAlphaLocked ?? true);
    setLoraDropout(cfg.loraDropout);
    setGradientCheckpointing(cfg.gradientCheckpointing);
    setOptimizer(cfg.optimizer);
    setMaxSeqLength(cfg.maxSeqLength);
    setEpochs(cfg.epochs);
    setLearningRate(cfg.learningRate);
    setMicroBatchSize(cfg.microBatchSize);
    setGradientAccumulationSteps(cfg.gradientAccumulationSteps);
    setGradientCompression(cfg.gradientCompression);
    setDataPacking(cfg.dataPacking);

    setActivePresetId(preset.id);
    setPresetToast({
      message: `Perfil '${preset.name}' aplicado com sucesso!`,
      type: 'success',
    });
  }, []);

  // Reverter alterações para os parâmetros do preset ativo
  const handleRevertToPreset = useCallback(() => {
    if (activePreset) {
      handleSelectPreset(activePreset);
      setPresetToast({
        message: `Parâmetros restaurados para o perfil '${activePreset.name}'.`,
        type: 'info',
      });
    }
  }, [activePreset, handleSelectPreset]);

  // Salvar novo Preset Personalizado
  const handleSaveNewPreset = useCallback((newPresetData: Omit<FinetunePreset, 'id' | 'created_at'>) => {
    const newId = `preset_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newPreset: FinetunePreset = {
      ...newPresetData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    setPresets((prev) => {
      const updated = [...prev, newPreset];
      saveStoredPresets(updated);
      return updated;
    });

    setActivePresetId(newId);
    setShowSavePresetModal(false);
    setPresetToast({
      message: `Perfil '${newPreset.name}' salvo com sucesso!`,
      type: 'success',
    });
  }, []);

  // Sobrescrever Preset Customizado Ativo
  const handleQuickUpdatePreset = useCallback(() => {
    if (!activePreset || activePreset.isBuiltin) return;

    setPresets((prev) => {
      const updated = prev.map((p) => (p.id === activePreset.id ? { ...p, config: { ...currentConfig } } : p));
      saveStoredPresets(updated);
      return updated;
    });

    setPresetToast({
      message: `Preset '${activePreset.name}' atualizado com as alterações atuais!`,
      type: 'success',
    });
  }, [activePreset, currentConfig]);

  // Excluir Preset Customizado
  const handleDeletePreset = useCallback((presetId: string) => {
    setPresets((prev) => {
      const updated = prev.filter((p) => p.id !== presetId);
      saveStoredPresets(updated);
      return updated;
    });

    if (activePresetId === presetId) {
      setActivePresetId('preset_balanced');
      const balanced = presets.find((p) => p.id === 'preset_balanced') || BUILTIN_FINETUNE_PRESETS[0];
      if (balanced) {
        handleSelectPreset(balanced);
      }
    }

    setPresetToast({
      message: 'Preset excluído com sucesso.',
      type: 'info',
    });
  }, [activePresetId, presets, handleSelectPreset]);

  // Duplicar Preset
  const handleDuplicatePreset = useCallback((preset: FinetunePreset) => {
    const newId = `preset_copy_${Date.now()}`;
    const duplicated: FinetunePreset = {
      id: newId,
      name: `${preset.name} (Cópia)`,
      description: `Cópia baseada em ${preset.name}. ${preset.description}`,
      isBuiltin: false,
      category: preset.category || 'custom',
      created_at: new Date().toISOString(),
      config: { ...preset.config, targetModules: [...preset.config.targetModules] },
    };

    setPresets((prev) => {
      const updated = [...prev, duplicated];
      saveStoredPresets(updated);
      return updated;
    });

    setActivePresetId(newId);
    setPresetToast({
      message: `Preset duplicado como '${duplicated.name}' e ativado!`,
      type: 'success',
    });
  }, []);

  // Importar Presets de JSON
  const handleImportPresets = useCallback((imported: FinetunePreset[]) => {
    setPresets((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const normalizedImported = imported.map((imp) => {
        let finalId = imp.id;
        if (!finalId || existingIds.has(finalId)) {
          finalId = `preset_imported_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        }
        return {
          ...imp,
          id: finalId,
          isBuiltin: false,
          created_at: imp.created_at || new Date().toISOString(),
        };
      });

      const updated = [...prev, ...normalizedImported];
      saveStoredPresets(updated);
      return updated;
    });
  }, []);

  // Restaurar Padrões de Fábrica
  const handleResetToDefaults = useCallback(() => {
    setPresets(BUILTIN_FINETUNE_PRESETS);
    saveStoredPresets(BUILTIN_FINETUNE_PRESETS);
    setActivePresetId('preset_balanced');
    handleSelectPreset(BUILTIN_FINETUNE_PRESETS[0]);
    setPresetToast({
      message: 'Presets restaurados para as configurações padrão de fábrica.',
      type: 'info',
    });
  }, [handleSelectPreset]);

  // Sincronizar Alpha automaticamente quando Rank mudar e estiver travado
  const handleRankChange = (newRank: number) => {
    setLoraRank(newRank);
    if (isAlphaLocked) {
      setLoraAlpha(newRank * 2);
    }
  };

  // Calcular Particionamento Automático de Camadas de Acordo com a RAM/VRAM de Cada Nó
  useEffect(() => {
    if (onlineNodes.length === 0) return;
    const totalLayers = 32; // Ex: LLaMA 3 8B tem 32 transformer blocks
    const totalScore = onlineNodes.reduce((acc, n) => {
      const weight = n.platform === 'Android' ? (n.ram_total_gb * 0.7) : (n.ram_total_gb * 1.5 + (n.gpu_name ? 10 : 0));
      return acc + weight;
    }, 0);

    let currentLayer = 0;
    const newPartition: { [nodeId: string]: { start: number; end: number } } = {};

    onlineNodes.forEach((node, index) => {
      const weight = node.platform === 'Android' ? (node.ram_total_gb * 0.7) : (node.ram_total_gb * 1.5 + (node.gpu_name ? 10 : 0));
      const layerCount = index === onlineNodes.length - 1 
        ? (totalLayers - currentLayer) 
        : Math.max(2, Math.round((weight / totalScore) * totalLayers));
      
      const endLayer = Math.min(totalLayers - 1, currentLayer + layerCount - 1);
      newPartition[node.node_id] = { start: currentLayer, end: endLayer };
      currentLayer = endLayer + 1;
    });

    setPipelineLayers(newPartition);
  }, [onlineNodes]);

  // Cálculo do Batch Size Efetivo Global
  const effectiveBatchSize = useMemo(() => {
    return microBatchSize * gradientAccumulationSteps * Math.max(1, onlineNodes.length);
  }, [microBatchSize, gradientAccumulationSteps, onlineNodes.length]);

  // Estimativa de Economia de Memória
  const memorySavings = useMemo(() => {
    let savedPct = 0;
    if (quantization === 'nf4_4bit') savedPct += 65;
    else if (quantization === 'int8') savedPct += 45;
    if (gradientCheckpointing) savedPct += 15;
    if (optimizer === 'paged_adamw_8bit') savedPct += 8;
    return Math.min(88, savedPct);
  }, [quantization, gradientCheckpointing, optimizer]);

  // Estimador de Memória de Atenção com base no Cutoff
  const attentionVramEstMb = useMemo(() => {
    // Estimativa O(N^2) para LLaMA 3 8B
    const ratio = Math.pow(maxSeqLength / 1024, 2);
    return Math.round(180 * ratio * microBatchSize);
  }, [maxSeqLength, microBatchSize]);

  // Simulação de Treinamento Distribuído com Auto-Checkpointing
  useEffect(() => {
    let timer: any;
    if (isTraining && progressPct < 100) {
      timer = setInterval(() => {
        setProgressPct((prev) => {
          const next = prev + 2.5;
          const totalSteps = 120;
          const stepNum = Math.floor((next / 100) * totalSteps);
          setCurrentStep(stepNum);

          if (next >= 100) {
            setIsTraining(false);
            setIsCompleted(true);
            setTrainingLogs((l) => [
              ...l,
              `[${new Date().toLocaleTimeString()}] ✅ Treinamento concluído com sucesso em todos os ${onlineNodes.length} nós!`,
              `[${new Date().toLocaleTimeString()}] 💾 Adaptadores QLoRA mesclados salvos em 'adapter_lora_nf4_final.gguf'`,
              `[${new Date().toLocaleTimeString()}] 📊 Perda final convergida: 0.4812 | Throughput médio: 42.6 tokens/s`,
            ]);
            return 100;
          }

          const ep = Math.min(epochs, Math.floor((next / 100) * epochs) + 1);
          setCurrentEpoch(ep);

          const currentLoss = Math.max(0.48, 2.25 - (next / 100) * 1.75 + (Math.random() * 0.05 - 0.025));
          setLossHistory((lh) => [...lh.slice(-18), Math.round(currentLoss * 10000) / 10000]);

          if (Math.floor(next) % 10 === 0) {
            const syncType = workerOnTheFlyConfig.enabled 
              ? `On-The-Fly ${workerOnTheFlyConfig.format.toUpperCase()} (Wi-Fi -${workerOnTheFlyConfig.bandwidthSavingEstimatePct}%)`
              : (gradientCompression === 'none' ? 'FP32 Completo' : `${gradientCompression.toUpperCase()} Comprimido`);
            
            setTrainingLogs((l) => [
              ...l,
              `[${new Date().toLocaleTimeString()}] Época ${ep}/${epochs} | Step ${stepNum}/${totalSteps} | Loss: ${currentLoss.toFixed(4)} | Sincronização (${syncType}) via Socket.IO OK`,
            ]);
          }

          // Auto-Checkpointing a cada N steps
          if (stepNum > 0 && stepNum % autoSaveIntervalSteps === 0 && Math.floor(next) % 5 === 0) {
            const newChkId = `chk_auto_step_${stepNum}_${Date.now()}`;
            const newChk: FinetuneCheckpoint = {
              id: newChkId,
              name: `Auto-Checkpoint Step ${stepNum} (Loss ${currentLoss.toFixed(3)})`,
              created_at: new Date().toISOString(),
              step: stepNum,
              total_steps: totalSteps,
              epoch: ep,
              total_epochs: epochs,
              loss: Number(currentLoss.toFixed(4)),
              learning_rate: learningRate,
              model_name: selectedModel,
              dataset_name: 'Dataset Ativo',
              adapter_size_mb: 28.4,
              storage_location: 'local_cluster',
              can_resume: true,
              active_nodes_count: onlineNodes.length,
              config_snapshot: currentConfig,
              loss_history_snapshot: [...lossHistory, currentLoss],
            };

            setCheckpoints((prev) => {
              const updated = [newChk, ...prev.slice(0, 15)];
              saveStoredCheckpoints(updated);
              return updated;
            });

            setTrainingLogs((l) => [
              ...l,
              `[${new Date().toLocaleTimeString()}] 💾 [AUTO-CHECKPOINT] Pesos LoRA e estados do otimizador salvos com sucesso no Step ${stepNum}.`,
            ]);
          }

          return next;
        });
      }, 700);
    }
    return () => clearInterval(timer);
  }, [
    isTraining, 
    progressPct, 
    epochs, 
    onlineNodes.length, 
    gradientCompression, 
    autoSaveIntervalSteps, 
    currentConfig, 
    learningRate, 
    selectedModel, 
    workerOnTheFlyConfig
  ]);

  // 1. Handler para Simulação de Falha / Auto-Relocação de Camadas (Dynamic Load Balancer)
  const handleSimulateEmergencyMigration = useCallback((nodeId?: string) => {
    const targetNode = nodes.find((n) => n.node_id === nodeId) || nodes.find((n) => n.platform === 'Android') || onlineNodes[0];
    if (!targetNode) return;

    const masterNode = nodes.find((n) => n.platform === 'Windows' || n.platform === 'Linux') || onlineNodes[0];
    const originalPartition = pipelineLayers[targetNode.node_id] || { start: 16, end: 23 };
    const layerCount = originalPartition.end - originalPartition.start + 1;

    // Atualiza Shards no pipeline
    setPipelineLayers((prev) => {
      const updated = { ...prev };
      if (masterNode && masterNode.node_id !== targetNode.node_id) {
        const masterPartition = updated[masterNode.node_id] || { start: 0, end: 15 };
        updated[masterNode.node_id] = {
          start: Math.min(masterPartition.start, originalPartition.start),
          end: Math.max(masterPartition.end, originalPartition.end),
        };
      }
      updated[targetNode.node_id] = { start: 0, end: 0 }; // esvaziado para resfriamento
      return updated;
    });

    const newEvent: LoadBalancerEvent = {
      id: `ev_mig_${Date.now()}`,
      timestamp: new Date().toISOString(),
      trigger_node_id: targetNode.node_id,
      trigger_device_name: targetNode.device_name,
      reason: 'high_temperature',
      trigger_metric_value: '82.8°C',
      transferred_layers: { start: originalPartition.start, end: originalPartition.end, count: layerCount },
      target_node_id: masterNode?.node_id || 'master',
      target_device_name: masterNode?.device_name || 'Master Workstation',
      status: 'completed',
      message: `Camadas ${originalPartition.start}-${originalPartition.end} transferidas sem parar o treino. Nó em modo resfriamento.`,
    };

    setLoadBalancerEvents((prev) => [newEvent, ...prev]);

    setTrainingLogs((l) => [
      ...l,
      `[${new Date().toLocaleTimeString()}] ⚠️ [DYNAMIC LOAD BALANCER] Nó '${targetNode.device_name}' ultrapassou 80°C (82.8°C).`,
      `[${new Date().toLocaleTimeString()}] 🔀 [FAILOVER ZERO-DOWNTIME] Transferindo ${layerCount} camadas (${originalPartition.start}-${originalPartition.end}) para '${masterNode?.device_name || 'Master'}'...`,
      `[${new Date().toLocaleTimeString()}] ✅ [AUTO-RELOCATION SUCESSO] Sharding redistribuído em 310ms. Treinamento prossegue sem interrupção!`,
    ]);

    setPresetToast({
      message: `⚠️ Dynamic Load Balancer: Shards de ${targetNode.device_name.split(' ')[0]} migrados para o Master sem interrupção!`,
      type: 'info',
    });
  }, [nodes, onlineNodes, pipelineLayers]);

  // 2. Handler para Aplicação de Partição Ótima de Shards (Micro-Benchmark de 30s)
  const handleApplyOptimalSharding = useCallback((partition: { [nodeId: string]: { start: number; end: number } }) => {
    setPipelineLayers(partition);
    setPresetToast({
      message: '✨ Divisão de camadas calibrada com sucesso via Micro-Benchmark de 30s!',
      type: 'success',
    });
    setTrainingLogs((l) => [
      ...l,
      `[${new Date().toLocaleTimeString()}] 🏆 [BENCHMARK] Partição ótima de camadas aplicada a todos os nós online.`,
    ]);
  }, []);

  // 3. Handler para Auto-Resume de Checkpoint
  const handleAutoResumeCheckpoint = useCallback((checkpoint: FinetuneCheckpoint) => {
    setCurrentStep(checkpoint.step);
    setCurrentEpoch(checkpoint.epoch);
    setLossHistory(checkpoint.loss_history_snapshot && checkpoint.loss_history_snapshot.length > 0
      ? checkpoint.loss_history_snapshot
      : [2.25, 1.8, 1.4, checkpoint.loss]);
    
    const pct = Math.min(99, Math.round((checkpoint.step / checkpoint.total_steps) * 100));
    setProgressPct(pct);
    setIsCompleted(false);

    // Restaura configurações se disponíveis
    if (checkpoint.config_snapshot) {
      handleSelectPreset({
        id: `preset_resumed_${checkpoint.id}`,
        name: `Config Checkpoint Step ${checkpoint.step}`,
        description: 'Configuração restaurada do checkpoint',
        isBuiltin: false,
        created_at: new Date().toISOString(),
        config: checkpoint.config_snapshot,
      });
    }

    setTrainingLogs((l) => [
      ...l,
      `[${new Date().toLocaleTimeString()}] 🔄 [AUTO-RESUME] Estado do treinamento restaurado a partir do '${checkpoint.name}'`,
      `[${new Date().toLocaleTimeString()}] 📍 Retomando do Step ${checkpoint.step}/${checkpoint.total_steps} (Época ${checkpoint.epoch}/${epochs}) com Loss inicial ${checkpoint.loss.toFixed(4)}.`,
      `[${new Date().toLocaleTimeString()}] 🚀 Pronto para continuar o processamento de gradientes.`,
    ]);

    setPresetToast({
      message: `🔄 Checkpoint restaurado! Pronto para continuar a partir do Step ${checkpoint.step}.`,
      type: 'success',
    });
  }, [epochs, handleSelectPreset]);

  // 4. Criar Checkpoint Manual
  const handleCreateManualCheckpoint = useCallback(() => {
    const step = currentStep || 10;
    const loss = lossHistory[lossHistory.length - 1] || 1.15;
    const newChk: FinetuneCheckpoint = {
      id: `chk_manual_${Date.now()}`,
      name: `Checkpoint Manual - Step ${step} (Loss ${loss.toFixed(3)})`,
      created_at: new Date().toISOString(),
      step,
      total_steps: 120,
      epoch: currentEpoch,
      total_epochs: epochs,
      loss: Number(loss.toFixed(4)),
      learning_rate: learningRate,
      model_name: selectedModel,
      dataset_name: 'Dataset Atual',
      adapter_size_mb: 28.4,
      storage_location: 'local_cluster',
      can_resume: true,
      active_nodes_count: onlineNodes.length,
      config_snapshot: currentConfig,
      loss_history_snapshot: [...lossHistory],
    };

    setCheckpoints((prev) => {
      const updated = [newChk, ...prev];
      saveStoredCheckpoints(updated);
      return updated;
    });

    setPresetToast({
      message: `💾 Checkpoint do Step ${step} gravado com sucesso!`,
      type: 'success',
    });

    setTrainingLogs((l) => [
      ...l,
      `[${new Date().toLocaleTimeString()}] 💾 [CHECKPOINT MANUAL] Adaptadores LoRA salvos localmente com sucesso.`,
    ]);
  }, [currentStep, lossHistory, currentEpoch, epochs, learningRate, selectedModel, onlineNodes.length, currentConfig]);

  // Excluir Checkpoint
  const handleDeleteCheckpoint = useCallback((checkpointId: string) => {
    setCheckpoints((prev) => {
      const updated = prev.filter((c) => c.id !== checkpointId);
      saveStoredCheckpoints(updated);
      return updated;
    });
  }, []);

  const handleStartTraining = () => {
    const dataset = SAMPLE_DATASETS.find((d) => d.id === selectedDatasetId);
    const dName = dataset ? dataset.name : customDatasetName || 'Dataset Customizado';

    setIsTraining(true);
    setIsCompleted(false);
    setProgressPct(0);
    setCurrentEpoch(1);
    setCurrentStep(0);
    setLossHistory([2.25]);

    const targetList = targetModules.join(', ');
    setTrainingLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Inicializando pipeline de Fine-Tuning QLoRA distribuído...`,
      `[${new Date().toLocaleTimeString()}] 📦 Modelo Base: ${selectedModel} carregado em ${quantization === 'nf4_4bit' ? '4-bit NF4 (NormalFloat4)' : quantization}`,
      `[${new Date().toLocaleTimeString()}] 🧬 LoRA Config: Rank=${loraRank}, Alpha=${loraAlpha}, Dropout=${loraDropout}, Precisão=${adapterPrecision}`,
      `[${new Date().toLocaleTimeString()}] 🎯 Target Modules ativos: [${targetList}]`,
      `[${new Date().toLocaleTimeString()}] ⚡ Memória: Gradient Checkpointing=${gradientCheckpointing ? 'ATIVADO' : 'DESATIVADO'} | Otimizador=${optimizer}`,
      `[${new Date().toLocaleTimeString()}] 🔀 Pipeline Parallelism: Dividindo 32 camadas entre ${onlineNodes.length} nós ativos`,
      `[${new Date().toLocaleTimeString()}] 📦 Batch Size Efetivo: ${effectiveBatchSize} (Micro-batch: ${microBatchSize} x Steps: ${gradientAccumulationSteps} x ${onlineNodes.length} nós)`,
      `[${new Date().toLocaleTimeString()}] 🗜️ Compressão de Gradientes: ${gradientCompression.toUpperCase()} | Data Packing: ${dataPacking ? 'ATIVO (<|endoftext|>)' : 'INATIVO'}`,
    ]);

    onStartFinetune({
      model: selectedModel,
      dataset_name: dName,
      epochs,
      learning_rate: learningRate,
      lora_rank: loraRank,
      lora_alpha: loraAlpha,
      target_modules: targetModules,
      quantization,
      gradient_checkpointing: gradientCheckpointing,
      optimizer,
      max_seq_length: maxSeqLength,
      effective_batch_size: effectiveBatchSize,
      nodes: onlineNodes.map((n) => n.node_id),
    });
  };

  const handleStopTraining = () => {
    setIsTraining(false);
    setTrainingLogs((l) => [
      ...l, 
      `[${new Date().toLocaleTimeString()}] 🛑 Treinamento interrompido pelo usuário. Checkpoints intermediários preservados.`
    ]);
  };

  const handleSanitizeDataset = () => {
    // Simulação do sanitizador de dataset
    const dataset = SAMPLE_DATASETS.find((d) => d.id === selectedDatasetId);
    const count = parseInt(dataset?.samples_count.replace(/\D/g, '') || '1000', 10);
    const removed = Math.floor(Math.random() * 25) + 12;
    const valid = count - removed;
    
    setSanitizingReport({ total: count, valid, removed });
    setDatasetSanitized(true);
  };

  const handlePresetTarget = (type: 'all' | 'attention' | 'mlp') => {
    if (type === 'all') {
      setTargetModules(['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj']);
    } else if (type === 'attention') {
      setTargetModules(['q_proj', 'v_proj', 'k_proj', 'o_proj']);
    } else if (type === 'mlp') {
      setTargetModules(['gate_proj', 'up_proj', 'down_proj']);
    }
  };

  const handleToggleTargetModule = (modId: string) => {
    if (targetModules.includes(modId)) {
      if (targetModules.length > 1) {
        setTargetModules(targetModules.filter((m) => m !== modId));
      }
    } else {
      setTargetModules([...targetModules, modId]);
    }
  };

  const handleGenerateDatasetAI = async () => {
    if (!datasetTopic.trim()) return;
    setIsGeneratingDataset(true);
    try {
      const res = await fetch('/api/finetune/generate-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: datasetTopic, count: 6 })
      });
      const data = await res.json();
      if (data.success && data.dataset) {
        setGeneratedSamples(data.dataset);
        setCustomContent(JSON.stringify(data.dataset, null, 2));
        setCustomDatasetName(`Dataset IA: ${datasetTopic.slice(0, 24)}...`);
      }
    } catch (e) {
      console.warn("Erro ao gerar dataset:", e);
    } finally {
      setIsGeneratingDataset(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16" id="view-finetune">
      {/* Top Banner de Status do Fine-Tuning */}
      <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Estúdio de Fine-Tuning Distribuído & QLoRA
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Motor V3
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Otimização QLoRA NF4, Dynamic Load Balancer, Quantização On-The-Fly e Checkpoints Auto-Resume
              </p>
            </div>
          </div>
        </div>

        {/* Resumo Rápido de Otimização */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-black/30 border border-emerald-500/30 text-right">
            <span className="text-[10px] text-white/50 uppercase font-mono block">Economia de VRAM</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">~{memorySavings}% economizados</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-black/30 border border-indigo-500/30 text-right">
            <span className="text-[10px] text-white/50 uppercase font-mono block">Batch Efetivo Global</span>
            <span className="text-xs font-bold text-indigo-300 font-mono">{effectiveBatchSize} micro-steps</span>
          </div>
        </div>
      </div>

      {/* Barra de Ações Rápidas: Load Balancer, Quantização Worker, Benchmark 30s & Checkpoints */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Dynamic Load Balancer */}
        <button
          type="button"
          onClick={() => setShowLoadBalancerModal(true)}
          className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-300/80 block">Dynamic Load Balancer</span>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                Auto-Relocação {loadBalancerConfig.enabled ? '(Ativa)' : '(Desat.)'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30 hidden sm:inline-block">
            &gt;{loadBalancerConfig.temperatureThreshold}°C
          </span>
        </button>

        {/* 2. Quantização On-The-Fly no Worker */}
        <button
          type="button"
          onClick={() => setShowWorkerQuantModal(true)}
          className="p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-300/80 block">Worker Quantization</span>
              <span className="text-xs font-bold text-white uppercase font-mono">
                {workerOnTheFlyConfig.format} On-the-Fly
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30 hidden sm:inline-block">
            -{workerOnTheFlyConfig.bandwidthSavingEstimatePct}% Wi-Fi
          </span>
        </button>

        {/* 3. Micro-Benchmark 30s */}
        <button
          type="button"
          onClick={() => setShowBenchmarkModal(true)}
          className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-300/80 block">Performance</span>
              <span className="text-xs font-bold text-white">Micro-Benchmark (30s)</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 hidden sm:inline-block">
            Partição Ótima
          </span>
        </button>

        {/* 4. Gerenciador de Checkpoints & Auto-Resume */}
        <button
          type="button"
          onClick={() => setShowCheckpointsModal(true)}
          className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center group-hover:scale-110 transition-transform">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300/80 block">Checkpoints</span>
              <span className="text-xs font-bold text-white">Auto-Resume ({checkpoints.length})</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 hidden sm:inline-block">
            a cada {autoSaveIntervalSteps} st
          </span>
        </button>
      </div>

      {/* Barra de Perfis & Presets de Fine-Tuning */}
      <FinetunePresetsBar
        presets={presets}
        activePresetId={activePresetId}
        isModified={isConfigModified}
        onSelectPreset={handleSelectPreset}
        onOpenSaveModal={() => setShowSavePresetModal(true)}
        onOpenManageModal={() => setShowManagePresetsModal(true)}
        onRevertToPreset={handleRevertToPreset}
        onQuickUpdatePreset={handleQuickUpdatePreset}
        isTraining={isTraining}
      />

      {/* Notificação Toast Flutuante de Presets */}
      {presetToast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-2.5 text-xs font-bold ${
            presetToast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-400/50 text-emerald-200 shadow-emerald-950/50'
              : presetToast.type === 'error'
              ? 'bg-rose-950/90 border-rose-400/50 text-rose-200 shadow-rose-950/50'
              : 'bg-indigo-950/90 border-indigo-400/50 text-indigo-200 shadow-indigo-950/50'
          }`}>
            {presetToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {presetToast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
            {presetToast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
            <span>{presetToast.message}</span>
            <button
              onClick={() => setPresetToast(null)}
              className="ml-2 text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Grid Principal: Configurações em Abas (Esquerda) vs Monitor & Logs (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 4 Pilares de Configuração */}
        <div className="lg:col-span-6 space-y-5">
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-5 shadow-2xl shadow-black/20">
            
            {/* Navegação das 4 Abas dos Pilares */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveConfigTab('lora')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  activeConfigTab === 'lora'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                1. QLoRA & LoRA
              </button>

              <button
                type="button"
                onClick={() => setActiveConfigTab('memory')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  activeConfigTab === 'memory'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                2. Memória & Nó
              </button>

              <button
                type="button"
                onClick={() => setActiveConfigTab('cluster')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  activeConfigTab === 'cluster'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                3. Sharding & Rede
              </button>

              <button
                type="button"
                onClick={() => setActiveConfigTab('dataset')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  activeConfigTab === 'dataset'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                4. Dados & Packing
              </button>
            </div>

            {/* ABA 1: QLoRA & Parâmetros LoRA */}
            {activeConfigTab === 'lora' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Seleção de Modelo Base */}
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1.5">
                    Modelo Base do Cluster
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isTraining}
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-sm text-indigo-200 font-semibold focus:outline-none focus:border-indigo-400 backdrop-blur-md"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.name} className="bg-slate-900 text-white">
                        {m.display} ({m.parameters}) — {m.quantization}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantização Base QLoRA NF4 & Precisão dos Adaptadores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/80 block mb-1">
                      Tipo de Quantização do Modelo Base
                    </label>
                    <select
                      value={quantization}
                      onChange={(e) => setQuantization(e.target.value as any)}
                      disabled={isTraining}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option value="nf4_4bit" className="bg-slate-900">4-bit NF4 (NormalFloat4 - QLoRA)</option>
                      <option value="int8" className="bg-slate-900">8-bit (LLM.int8())</option>
                      <option value="fp16" className="bg-slate-900">FP16 (Half Precision)</option>
                      <option value="fp32" className="bg-slate-900">FP32 (Full Precision - Alto Consumo)</option>
                    </select>
                    <span className="text-[10px] text-emerald-400 mt-1 block">
                      ✓ Reduz drasticamente VRAM mantendo qualidade FP16
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-white/80 block mb-1">
                      Precisão dos Adaptadores LoRA
                    </label>
                    <select
                      value={adapterPrecision}
                      onChange={(e) => setAdapterPrecision(e.target.value as any)}
                      disabled={isTraining}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                    >
                      <option value="bf16" className="bg-slate-900">BF16 (Bfloat16 - Estabilidade Numérica)</option>
                      <option value="fp16" className="bg-slate-900">FP16 (Padrão para GPUs NVIDIA/Adreno)</option>
                    </select>
                  </div>
                </div>

                {/* Target Modules Seletivos (Attention & Feed-Forward) */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-white block">
                        Módulos Alvo (Target Modules)
                      </label>
                      <span className="text-[11px] text-white/50">
                        Aplicar LoRA em projeções de atenção e Feed-Forward (MLP)
                      </span>
                    </div>

                    {/* Presets Rápidos */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePresetTarget('all')}
                        className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-[10px] font-bold transition-all"
                      >
                        All-Linear (Recomendado)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetTarget('attention')}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-[10px] font-semibold transition-all"
                      >
                        Atenção
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetTarget('mlp')}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-[10px] font-semibold transition-all"
                      >
                        MLP
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {ALL_TARGET_MODULES.map((mod) => {
                      const isSelected = targetModules.includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          disabled={isTraining}
                          onClick={() => handleToggleTargetModule(mod.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-amber-400/20 border-amber-400/60 text-amber-200 font-bold shadow-sm'
                              : 'bg-white/[0.02] border-white/10 text-white/40 hover:border-white/20'
                          }`}
                        >
                          <span className="font-mono text-xs truncate">{mod.id}</span>
                          {isSelected ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <div className="w-3.5 h-3.5 rounded border border-white/20" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hiperparâmetros Recomendados: Rank (r), Alpha (α = 2*r) e Dropout */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-white/80 block mb-1">
                      Rank ($r$)
                    </label>
                    <select
                      value={loraRank}
                      onChange={(e) => handleRankChange(parseInt(e.target.value))}
                      disabled={isTraining}
                      className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    >
                      <option value="8" className="bg-slate-900">r=8 (Econômico)</option>
                      <option value="16" className="bg-slate-900">r=16 (Ótimo)</option>
                      <option value="32" className="bg-slate-900">r=32 (Complexo)</option>
                      <option value="64" className="bg-slate-900">r=64 (Alto VRAM)</option>
                    </select>
                    <span className="text-[10px] text-white/40 mt-0.5 block font-mono">
                      8–16 ideal
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-white/80">Alpha ($\alpha$)</label>
                      <button
                        type="button"
                        onClick={() => setIsAlphaLocked(!isAlphaLocked)}
                        title={isAlphaLocked ? "Alpha travado como 2x Rank" : "Alpha livre"}
                        className="text-white/50 hover:text-amber-400"
                      >
                        {isAlphaLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={loraAlpha}
                      onChange={(e) => setLoraAlpha(parseInt(e.target.value) || 1)}
                      disabled={isTraining || isAlphaLocked}
                      className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[10px] text-white/40 mt-0.5 block font-mono">
                      {isAlphaLocked ? 'Regra: α = 2 × r' : 'Manual'}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs text-white/80 block mb-1">
                      LoRA Dropout
                    </label>
                    <select
                      value={loraDropout}
                      onChange={(e) => setLoraDropout(parseFloat(e.target.value))}
                      disabled={isTraining}
                      className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    >
                      <option value="0.0" className="bg-slate-900">0.0 (Sem dropout)</option>
                      <option value="0.05" className="bg-slate-900">0.05 (Padrão)</option>
                      <option value="0.1" className="bg-slate-900">0.10 (Regularização)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: Eficiência de Memória & Computação */}
            {activeConfigTab === 'memory' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Gradient Checkpointing Toggle */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white">Gradient Checkpointing</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Economiza ~60% VRAM
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-1">
                      Salva apenas ativações essenciais e recalcula no backpropagation. Troca 20% de overhead computacional por imensa economia de memória.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGradientCheckpointing(!gradientCheckpointing)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                      gradientCheckpointing ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        gradientCheckpointing ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Otimizadores Leves: Paged AdamW 8-bit */}
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1.5">
                    Algoritmo do Otimizador
                  </label>
                  <select
                    value={optimizer}
                    onChange={(e) => setOptimizer(e.target.value as any)}
                    disabled={isTraining}
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/30 border border-white/15 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="paged_adamw_8bit" className="bg-slate-900">
                      🏆 Paged AdamW 8-bit (bitsandbytes - Paginação em RAM se pico de VRAM)
                    </option>
                    <option value="lion_8bit" className="bg-slate-900">
                      🚀 Lion 8-bit (Menor consumo de estados de momento)
                    </option>
                    <option value="adamw_32bit" className="bg-slate-900">
                      ⚙️ AdamW Padrão (32-bit - 8 bytes/parâmetro)
                    </option>
                    <option value="sgd" className="bg-slate-900">
                      ⚡ SGD com Momentum (Mais rápido, convergência mais lenta)
                    </option>
                  </select>
                  <span className="text-[11px] text-white/50 mt-1 block">
                    {optimizer === 'paged_adamw_8bit' && (
                      <strong className="text-emerald-400 font-normal">
                        ✓ O Paged AdamW previne erros OOM (Out Of Memory) alocando temporariamente na RAM do sistema.
                      </strong>
                    )}
                  </span>
                </div>

                {/* Comprimento de Sequência (Context Cutoff) */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-white block">
                        Comprimento Máximo de Sequência (max_seq_length)
                      </label>
                      <span className="text-[11px] text-white/50">
                        Cutoff de tokens para evitar explosão quadrática $O(N^2)$ na atenção
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs">
                      {maxSeqLength} tokens
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {[512, 1024, 2048, 4096].map((len) => (
                      <button
                        key={len}
                        type="button"
                        onClick={() => setMaxSeqLength(len)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                          maxSeqLength === len
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-white/50 pt-2 border-t border-white/10">
                    <span>VRAM estimada de Atenção:</span>
                    <span className="text-amber-300 font-bold">~{attentionVramEstMb} MB por micro-batch</span>
                  </div>
                </div>

                {/* Épocas e Taxa de Aprendizado (LR) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/80 block mb-1">Épocas de Treinamento</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={epochs}
                      onChange={(e) => setEpochs(parseInt(e.target.value) || 1)}
                      disabled={isTraining}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/80 block mb-1">Learning Rate (LR)</label>
                    <input
                      type="text"
                      value={learningRate}
                      onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0.0002)}
                      disabled={isTraining}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: Pipeline Parallelism, Sharding & Rede */}
            {activeConfigTab === 'cluster' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Particionamento Visual de Camadas (Model Sharding) */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        Model Sharding (Pipeline Parallelism 32 Camadas)
                      </h4>
                      <p className="text-[11px] text-white/50">
                        Distribuição das camadas profundas do modelo entre nós heterogêneos
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBenchmarkModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-400/30 transition-all"
                      title="Executar teste de estresse de 30s e calcular divisão perfeita"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      Calcular Divisão Perfeita (30s)
                    </button>
                  </div>

                  {/* Visual Shard Layer Allocator */}
                  <div className="space-y-2.5 pt-1">
                    {onlineNodes.map((node, idx) => {
                      const partition = pipelineLayers[node.node_id] || { start: 0, end: 7 };
                      const layerCount = partition.end - partition.start + 1;
                      const pct = Math.round((layerCount / 32) * 100);

                      return (
                        <div key={node.node_id} className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white flex items-center gap-2">
                              {node.platform === 'Android' ? (
                                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                              <span className="truncate max-w-[150px]">{node.device_name}</span>
                            </span>
                            <span className="font-mono text-amber-300 font-bold text-[11px]">
                              Camadas {partition.start}–{partition.end} ({layerCount} layers / {pct}%)
                            </span>
                          </div>

                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                node.platform === 'Android' ? 'bg-emerald-400' : 'bg-indigo-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Load Balancer - Painel de Proteção Térmica e Failover */}
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          Dynamic Load Balancer (Auto-Relocação de Camadas)
                        </h4>
                        <span className="text-[10px] text-white/50 block">
                          Transfere shards sem abortar a tarefa caso um celular esquente (&gt;{loadBalancerConfig.temperatureThreshold}°C)
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLoadBalancerModal(true)}
                      className="px-3 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white text-xs font-bold border border-rose-500/40 transition-all"
                    >
                      Configurar Regras
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="text-xs space-y-0.5">
                      <span className="text-white/70 block">Gatilho de Emergência Ativo:</span>
                      <span className="font-mono font-bold text-rose-300">
                        Temp &gt; {loadBalancerConfig.temperatureThreshold}°C • Bateria &lt; {loadBalancerConfig.batteryThreshold}% • VRAM &gt; {loadBalancerConfig.vramThreshold}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSimulateEmergencyMigration()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      Simular Sobrecarga (82°C)
                    </button>
                  </div>
                </div>

                {/* Gradient Accumulation & Micro-Batch */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/80 block mb-1">
                      Micro-Batch por Dispositivo
                    </label>
                    <select
                      value={microBatchSize}
                      onChange={(e) => setMicroBatchSize(parseInt(e.target.value))}
                      disabled={isTraining}
                      className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    >
                      <option value="1" className="bg-slate-900">1 (Mínimo consumo)</option>
                      <option value="2" className="bg-slate-900">2 (Recomendado)</option>
                      <option value="4" className="bg-slate-900">4 (GPUs fortes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/80 block mb-1">
                      Passos de Acumulação (Steps)
                    </label>
                    <select
                      value={gradientAccumulationSteps}
                      onChange={(e) => setGradientAccumulationSteps(parseInt(e.target.value))}
                      disabled={isTraining}
                      className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    >
                      <option value="4" className="bg-slate-900">4 passos</option>
                      <option value="8" className="bg-slate-900">8 passos</option>
                      <option value="16" className="bg-slate-900">16 passos (Simula batch 64)</option>
                      <option value="32" className="bg-slate-900">32 passos (Simula batch 128)</option>
                    </select>
                  </div>
                </div>

                {/* Compressão de Gradientes na Rede Local */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-white block">
                        Compressão de Gradientes (Socket.IO / LAN)
                      </label>
                      <span className="text-[11px] text-white/50">
                        Reduz gargalos de banda Wi-Fi/Ethernet ao sincronizar os nós
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {gradientCompression === 'none' ? 'Sem Compressão' : `${gradientCompression.toUpperCase()} (Economia de Banda)`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { id: 'fp16', label: 'FP16 (50% economia)', desc: 'Recomendado' },
                      { id: 'int8', label: 'INT8 (75% economia)', desc: 'Ultra leve' },
                      { id: 'none', label: 'FP32 (Original)', desc: 'Sem perda' },
                    ].map((comp) => (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => setGradientCompression(comp.id as any)}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          gradientCompression === comp.id
                            ? 'bg-amber-400/20 border-amber-400 text-amber-200 font-bold'
                            : 'bg-white/5 border-white/10 text-white/50'
                        }`}
                      >
                        <div className="text-xs font-mono">{comp.label}</div>
                        <div className="text-[10px] text-white/40">{comp.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 4: Preparação e Formatação de Dados */}
            {activeConfigTab === 'dataset' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Seleção de Dataset */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-white/80">
                      Dataset de Instruções (JSONL / TXT)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDatasetModal(true)}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Gerar com Gemini IA
                    </button>
                  </div>

                  <div className="space-y-2">
                    {SAMPLE_DATASETS.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => !isTraining && setSelectedDatasetId(d.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all backdrop-blur-md ${
                          selectedDatasetId === d.id
                            ? 'bg-indigo-500/20 border-indigo-400/50 text-white shadow-md'
                            : 'bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                          <span className="text-white">{d.name}</span>
                          <span className="text-[10px] font-mono text-indigo-300">{d.samples_count}</span>
                        </div>
                        <p className="text-[11px] text-white/50 line-clamp-1">{d.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Packing (Concatenação até max_seq_length com delimitador) */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white">Data Packing (Empacotamento de Amostras)</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Até 2x mais rápido
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-1">
                      Concatena múltiplos exemplos curtos usando o token delimitador <code className="font-mono text-amber-300">&lt;|endoftext|&gt;</code>, eliminando zero-padding desnecessário.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDataPacking(!dataPacking)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                      dataPacking ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        dataPacking ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sanitização e Filtragem Prévia de Dados */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Filter className="w-4 h-4 text-emerald-400" />
                        Sanitização & Filtragem Prévia
                      </h4>
                      <p className="text-[11px] text-white/50">
                        Descarta exemplos vazios, repetidos ou com sintaxe JSON incorreta
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSanitizeDataset}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/15"
                    >
                      <Filter className="w-3.5 h-3.5 text-emerald-400" />
                      Sanitizar Dataset
                    </button>
                  </div>

                  {sanitizingReport && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>
                          <strong>{sanitizingReport.valid}</strong> exemplos válidos mantidos ({sanitizingReport.removed} descartados por anomalias/duplicações).
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[10px] text-emerald-300">100% Sanitizado</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Iniciar / Interromper Treinamento */}
            <div className="pt-2">
              {!isTraining ? (
                <button
                  id="start-finetune-btn"
                  onClick={handleStartTraining}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-xl shadow-amber-400/20 transition-all hover:scale-[1.01]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Iniciar Treinamento QLoRA Distribuído ({onlineNodes.length} Nós)
                </button>
              ) : (
                <button
                  id="stop-finetune-btn"
                  onClick={handleStopTraining}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/20 transition-all"
                >
                  <StopCircle className="w-4 h-4" />
                  Interromper Treinamento
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Monitor, Loss Curve & Real-Time Logs */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card de Curva de Perda & Métricas */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">Curva de Perda (Loss Curve)</h3>
                  <p className="text-xs text-white/50">Convergência em tempo real via Paged AdamW</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Época: {currentEpoch}/{epochs}
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Loss: {lossHistory[lossHistory.length - 1]?.toFixed(4) || '—'}
                </span>
              </div>
            </div>

            {/* Barra Geral de Progresso */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-white/80 mb-1.5">
                <span>Progresso Geral do Fine-Tuning</span>
                <span className="font-mono text-indigo-300 font-bold">{Math.round(progressPct)}%</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-3 p-0.5 border border-white/10 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Gráfico Visual de Loss SVG e Controles de Checkpoint */}
            <div className="h-44 w-full bg-black/30 rounded-2xl p-4 border border-white/10 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
                <div className="border-b border-white/20 w-full" />
                <div className="border-b border-white/20 w-full" />
                <div className="border-b border-white/20 w-full" />
              </div>

              {/* Linhas e Pontos de Loss */}
              <div className="relative h-28 w-full flex items-end justify-between px-2 z-10">
                {lossHistory.map((lossVal, idx) => {
                  const maxLoss = 2.6;
                  const normalizedHeight = Math.max(10, Math.min(95, ((maxLoss - lossVal) / maxLoss) * 100));
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 group flex-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50 group-hover:scale-125 transition-transform"
                        style={{ marginBottom: `${normalizedHeight}%` }}
                        title={`Step: Loss ${lossVal}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[10px] text-white/50 font-mono pt-1 border-t border-white/10">
                <span>Início (Loss: 2.25)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateManualCheckpoint}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Salvar Checkpoint
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setShowCheckpointsModal(true)}
                    className="text-[10px] font-bold text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Auto-Resume ({checkpoints.length})
                  </button>
                </div>
                <span>Convergência (&lt;0.50)</span>
              </div>
            </div>

            {/* Progresso por Nó do Cluster */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-white/60 block uppercase font-mono">
                Sincronização de Shards por Dispositivo:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {onlineNodes.map((node, i) => {
                  const shardProgress = Math.min(100, Math.max(0, Math.round(progressPct + (i % 2 === 0 ? 1 : -1))));
                  return (
                    <div key={node.node_id} className="p-3 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-md">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-white flex items-center gap-1.5 truncate">
                          {node.platform === 'Android' ? (
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                          <span className="truncate">{node.device_name.split(' ')[0]}</span>
                        </span>
                        <span className="font-mono text-indigo-300 text-[11px]">
                          {shardProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${shardProgress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Terminal de Logs ao Vivo */}
          <div className="p-6 rounded-3xl bg-white/[0.05] backdrop-blur-xl border border-white/10 space-y-3 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Console do Pipeline Distribuído</h3>
              </div>
              {isCompleted && (
                <button
                  onClick={() => alert("Adaptador 'adapter_lora_nf4_final.gguf' exportado com sucesso!")}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold shadow-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Adaptador .GGUF
                </button>
              )}
            </div>

            <div className="bg-black/30 rounded-2xl p-4 font-mono text-xs text-emerald-300 h-60 overflow-y-auto border border-white/10 space-y-1.5 backdrop-blur-md">
              {trainingLogs.length > 0 ? (
                trainingLogs.map((log, idx) => <div key={idx}>{log}</div>)
              ) : (
                <div className="text-white/40 italic">
                  Aguardando início do treinamento QLoRA. Os logs de sincronização de tensores e backward pass aparecerão aqui...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Gerador de Dataset Sintético com IA */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900/90 border border-white/20 backdrop-blur-2xl shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Gerador de Dataset Sintético (Gemini AI)</h3>
              </div>
              <button
                onClick={() => setShowDatasetModal(false)}
                className="text-white/60 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-white/80 font-semibold block mb-1">
                  Qual é o tema ou domínio do Fine-Tuning?
                </label>
                <input
                  type="text"
                  value={datasetTopic}
                  onChange={(e) => setDatasetTopic(e.target.value)}
                  placeholder="Ex: Respostas médicas para triagem, Código TypeScript limpo..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDatasetModal(false)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isGeneratingDataset || !datasetTopic.trim()}
                  onClick={handleGenerateDatasetAI}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-lg disabled:opacity-50"
                >
                  {isGeneratingDataset ? (
                    <span>Gerando Pares...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Gerar com Gemini</span>
                    </>
                  )}
                </button>
              </div>

              {generatedSamples.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">
                      ✓ {generatedSamples.length} Amostras JSONL Geradas
                    </span>
                    <button
                      onClick={() => setShowDatasetModal(false)}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold text-[11px]"
                    >
                      Aplicar ao Treinamento
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto bg-black/40 rounded-xl p-3 font-mono text-[11px] text-white/80 space-y-2">
                    {generatedSamples.map((sample, idx) => (
                      <div key={idx} className="pb-1 border-b border-white/5">
                        <span className="text-amber-400">Instrução:</span> {sample.instruction}
                        <br />
                        <span className="text-emerald-400">Resposta:</span> {sample.output}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Salvar Novo Preset de Fine-Tuning */}
      {showSavePresetModal && (
        <SavePresetModal
          currentConfig={currentConfig}
          existingPresetNames={presets.map((p) => p.name)}
          onSave={handleSaveNewPreset}
          onClose={() => setShowSavePresetModal(false)}
        />
      )}

      {/* Modal Biblioteca & Gerenciamento de Presets */}
      {showManagePresetsModal && (
        <ManagePresetsModal
          presets={presets}
          activePresetId={activePresetId}
          onApplyPreset={handleSelectPreset}
          onDeletePreset={handleDeletePreset}
          onDuplicatePreset={handleDuplicatePreset}
          onImportPresets={handleImportPresets}
          onResetToDefaults={handleResetToDefaults}
          onClose={() => setShowManagePresetsModal(false)}
        />
      )}

      {/* 1. Modal Dynamic Load Balancer & Auto-Relocação */}
      {showLoadBalancerModal && (
        <DynamicLoadBalancerModal
          config={loadBalancerConfig}
          onUpdateConfig={setLoadBalancerConfig}
          events={loadBalancerEvents}
          nodes={nodes}
          pipelineLayers={pipelineLayers}
          onSimulateFailover={handleSimulateEmergencyMigration}
          onClose={() => setShowLoadBalancerModal(false)}
        />
      )}

      {/* 2. Modal Quantização On-The-Fly no Worker */}
      {showWorkerQuantModal && (
        <WorkerOnTheFlyQuantModal
          config={workerOnTheFlyConfig}
          onUpdateConfig={setWorkerOnTheFlyConfig}
          nodes={nodes}
          onClose={() => setShowWorkerQuantModal(false)}
        />
      )}

      {/* 3. Modal Teste de Estresse & Benchmark Automático (30s) */}
      {showBenchmarkModal && (
        <ClusterBenchmarkModal
          nodes={nodes}
          onApplyOptimalSharding={handleApplyOptimalSharding}
          onClose={() => setShowBenchmarkModal(false)}
        />
      )}

      {/* 4. Modal Gerenciador de Checkpoints & Auto-Resume */}
      {showCheckpointsModal && (
        <CheckpointsManagerModal
          checkpoints={checkpoints}
          autoSaveIntervalSteps={autoSaveIntervalSteps}
          onUpdateAutoSaveInterval={setAutoSaveIntervalSteps}
          onResumeCheckpoint={handleAutoResumeCheckpoint}
          onDeleteCheckpoint={handleDeleteCheckpoint}
          onCreateManualCheckpoint={handleCreateManualCheckpoint}
          isTraining={isTraining}
          currentStep={currentStep}
          totalSteps={120}
          onClose={() => setShowCheckpointsModal(false)}
        />
      )}
    </div>
  );
};

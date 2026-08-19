export type TransportType = 'network' | 'usb' | 'termux' | 'local' | 'socketio';
export type PlatformType = 'Android' | 'Windows' | 'Linux' | 'macOS';
export type NodeStatus = 'online' | 'busy' | 'training' | 'offline';

export interface ClusterNode {
  node_id: string;
  device_name: string;
  address: string;
  port: number;
  transport: TransportType;
  platform: PlatformType;
  arch: string;
  status: NodeStatus;
  last_seen: string;
  cpu_usage: number; // 0-100%
  ram_usage: number; // 0-100%
  ram_total_gb: number;
  ram_used_gb: number;
  gpu_usage: number; // 0-100%
  gpu_name?: string;
  temperature_c?: number;
  battery_pct?: number; // Para celulares Android
  latency_ms: number;
  backend_type: 'ollama' | 'llama.cpp' | 'vllm' | 'native_cpu';
  assigned_shards?: number[];
  current_task_id?: string;
  is_master?: boolean;
}

export interface ClusterMetricsSummary {
  online_nodes: number;
  total_nodes: number;
  total_cores: number;
  total_ram_gb: number;
  used_ram_gb: number;
  total_vram_gb: number;
  avg_cpu_pct: number;
  avg_ram_pct: number;
  avg_gpu_pct: number;
  estimated_throughput_tps: number;
  cluster_health_pct: number;
}

export type ModelType = 'inference' | 'code' | 'multimodal' | 'lightweight' | 'embedding';

export interface ModelItem {
  id: string;
  name: string;
  display: string;
  size: string;
  type: ModelType;
  quantization: string;
  parameters: string;
  context_length: string;
  installed: boolean;
  download_progress?: number;
  is_downloading?: boolean;
  description: string;
  recommended_ram_gb: number;
}

export type TaskType = 'inference' | 'fine_tune' | 'benchmark' | 'download_model' | 'push_deps';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskItem {
  task_id: string;
  task_type: TaskType;
  status: TaskStatus;
  progress: number;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  assigned_nodes: string[];
  params: {
    model?: string;
    prompt?: string;
    dataset?: string;
    dataset_name?: string;
    epochs?: number;
    batch_size?: number;
    learning_rate?: number;
    lora_rank?: number;
    model_name?: string;
    [key: string]: any;
  };
  result?: any;
  error?: string;
  logs: string[];
}

export interface PairingCodeInfo {
  code: string;
  expires_in_sec: number;
  secret: string;
  created_at: number;
  master_ip: string;
  master_port: number;
}

export interface FinetuneAdvancedConfig {
  quantization: 'nf4_4bit' | 'fp16' | 'fp32' | 'int8';
  adapterPrecision: 'fp16' | 'bf16';
  loraRank: number;
  loraAlpha: number;
  loraDropout: number;
  targetModules: string[];
  gradientCheckpointing: boolean;
  optimizer: 'paged_adamw_8bit' | 'adamw_32bit' | 'lion_8bit' | 'sgd';
  maxSeqLength: number;
  microBatchSize: number;
  gradientAccumulationSteps: number;
  gradientCompression: 'fp16' | 'int8' | 'none';
  dataPacking: boolean;
  filterCleanDataset: boolean;
  pipelineSharding: {
    nodeId: string;
    deviceName: string;
    layerStart: number;
    layerEnd: number;
    totalLayers: number;
    allocatedVramEstMb: number;
  }[];
}

export interface FinetunePreset {
  id: string;
  name: string;
  description: string;
  isBuiltin?: boolean;
  category?: 'economy' | 'precision' | 'balanced' | 'speed' | 'code' | 'custom';
  created_at?: string;
  config: {
    quantization: 'nf4_4bit' | 'fp16' | 'fp32' | 'int8';
    adapterPrecision: 'fp16' | 'bf16';
    targetModules: string[];
    loraRank: number;
    loraAlpha: number;
    isAlphaLocked: boolean;
    loraDropout: number;
    gradientCheckpointing: boolean;
    optimizer: 'paged_adamw_8bit' | 'adamw_32bit' | 'lion_8bit' | 'sgd';
    maxSeqLength: number;
    epochs: number;
    learningRate: number;
    microBatchSize: number;
    gradientAccumulationSteps: number;
    gradientCompression: 'fp16' | 'int8' | 'none';
    dataPacking: boolean;
  };
}

export interface FinetuneEpochLoss {
  epoch: number;
  step: number;
  train_loss: number;
  val_loss: number;
  learning_rate: number;
  tokens_per_sec: number;
}

// 1. Dynamic Load Balancer (Auto-Relocação de Camadas)
export interface LoadBalancerConfig {
  enabled: boolean;
  temperatureThreshold: number; // ex: 80°C
  batteryThreshold: number; // ex: 15%
  vramThreshold: number; // ex: 90%
  migrationStrategy: 'failover_to_master' | 'spread_across_healthy' | 'fallback_cpu';
  autoCooldownPauseSec: number;
}

export interface LoadBalancerEvent {
  id: string;
  timestamp: string;
  trigger_node_id: string;
  trigger_device_name: string;
  reason: 'high_temperature' | 'low_battery' | 'vram_exhaustion' | 'node_disconnect' | 'manual';
  trigger_metric_value: string;
  transferred_layers: { start: number; end: number; count: number };
  target_node_id: string;
  target_device_name: string;
  status: 'completed' | 'in_progress' | 'failed';
  message: string;
}

// 2. Quantização On-The-Fly no Worker
export interface WorkerOnTheFlyQuantConfig {
  enabled: boolean;
  format: 'int4' | 'int8' | 'nf4' | 'fp8_e4m3';
  compressGradients: boolean;
  compressActivations: boolean;
  targetDeviceTypes: ('Android' | 'Windows' | 'Linux')[];
  bandwidthSavingEstimatePct: number;
  memorySavingEstimatePct: number;
}

// 3. Teste de Estresse & Benchmark Automático do Cluster
export interface NodeBenchmarkScore {
  node_id: string;
  device_name: string;
  platform: PlatformType;
  cpu_gflops: number;
  gpu_tflops?: number;
  ram_bandwidth_mbps: number;
  network_throughput_mbps: number;
  vram_free_gb: number;
  temperature_c: number;
  composite_score: number; // 0 - 1000
  suggested_layer_share_pct: number;
  suggested_layers: { start: number; end: number; count: number };
  is_optimal_for_lora: boolean;
}

export interface ClusterBenchmarkResult {
  benchmark_id: string;
  timestamp: string;
  duration_sec: number;
  total_cluster_gflops: number;
  total_throughput_gbps: number;
  optimal_layers_total: number;
  node_scores: NodeBenchmarkScore[];
  recommended_config: {
    recommended_batch_size: number;
    recommended_grad_accum: number;
    recommended_quant: 'nf4_4bit' | 'int8' | 'fp16';
    estimated_tokens_per_sec: number;
  };
}

// 4. Gerenciador de Checkpoints com Auto-Resume
export interface FinetuneCheckpoint {
  id: string;
  name: string;
  created_at: string;
  step: number;
  total_steps: number;
  epoch: number;
  total_epochs: number;
  loss: number;
  learning_rate: number;
  model_name: string;
  dataset_name: string;
  adapter_size_mb: number;
  storage_location: 'local_cluster' | 'cloud_sync';
  can_resume: boolean;
  active_nodes_count: number;
  config_snapshot: FinetunePreset['config'];
  loss_history_snapshot: number[];
}

export type AppView = 'dashboard' | 'cluster' | 'inference' | 'finetune' | 'models' | 'tasks' | 'servodash' | 'scripts' | 'settings';
export type AppTheme = 'dark' | 'midnight' | 'light' | 'forest';

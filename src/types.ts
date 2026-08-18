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

export interface FinetuneEpochLoss {
  epoch: number;
  step: number;
  train_loss: number;
  val_loss: number;
  learning_rate: number;
  tokens_per_sec: number;
}

export type AppView = 'dashboard' | 'cluster' | 'inference' | 'finetune' | 'models' | 'tasks' | 'servodash' | 'scripts' | 'settings';
export type AppTheme = 'dark' | 'midnight' | 'light' | 'forest';

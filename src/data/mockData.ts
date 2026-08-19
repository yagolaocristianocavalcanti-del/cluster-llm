import { ClusterNode, ModelItem, TaskItem } from '../types';

export const INITIAL_NODES: ClusterNode[] = [
  {
    node_id: 'master',
    device_name: 'Master Workstation (Ubuntu 24.04)',
    address: '192.168.1.100',
    port: 5000,
    transport: 'local',
    platform: 'Linux',
    arch: 'x86_64',
    status: 'online',
    last_seen: new Date().toISOString(),
    cpu_usage: 24,
    ram_usage: 42,
    ram_total_gb: 32,
    ram_used_gb: 13.4,
    gpu_usage: 18,
    gpu_name: 'NVIDIA RTX 4080 (16GB)',
    temperature_c: 48,
    latency_ms: 1,
    backend_type: 'ollama',
    is_master: true,
  },
  {
    node_id: 'node_win_pc',
    device_name: 'PC Desktop Gamer (Windows 11)',
    address: '192.168.1.105',
    port: 5001,
    transport: 'network',
    platform: 'Windows',
    arch: 'x86_64',
    status: 'online',
    last_seen: new Date().toISOString(),
    cpu_usage: 38,
    ram_usage: 55,
    ram_total_gb: 32,
    ram_used_gb: 17.6,
    gpu_usage: 45,
    gpu_name: 'NVIDIA RTX 4070 Super (12GB)',
    temperature_c: 56,
    latency_ms: 4,
    backend_type: 'ollama',
    assigned_shards: [0, 1],
  },
  {
    node_id: 'node_termux_s24',
    device_name: 'Samsung Galaxy S24 Ultra (Termux)',
    address: '192.168.1.142',
    port: 5001,
    transport: 'termux',
    platform: 'Android',
    arch: 'arm64',
    status: 'online',
    last_seen: new Date().toISOString(),
    cpu_usage: 52,
    ram_usage: 68,
    ram_total_gb: 12,
    ram_used_gb: 8.1,
    gpu_usage: 30,
    gpu_name: 'Adreno 750 (OpenCL)',
    temperature_c: 39,
    battery_pct: 88,
    latency_ms: 9,
    backend_type: 'llama.cpp',
    assigned_shards: [2],
  },
  {
    node_id: 'node_termux_redmi',
    device_name: 'Xiaomi Redmi Note 12 (USB/ADB)',
    address: 'usb:f83b9a12',
    port: 5001,
    transport: 'usb',
    platform: 'Android',
    arch: 'arm64',
    status: 'online',
    last_seen: new Date().toISOString(),
    cpu_usage: 41,
    ram_usage: 62,
    ram_total_gb: 8,
    ram_used_gb: 4.9,
    gpu_usage: 15,
    gpu_name: 'Adreno 619',
    temperature_c: 37,
    battery_pct: 95,
    latency_ms: 2,
    backend_type: 'llama.cpp',
    assigned_shards: [3],
  },
  {
    node_id: 'node_linux_rpi5',
    device_name: 'Raspberry Pi 5 (Debian Arm64)',
    address: '192.168.1.180',
    port: 5001,
    transport: 'network',
    platform: 'Linux',
    arch: 'arm64',
    status: 'online',
    last_seen: new Date().toISOString(),
    cpu_usage: 28,
    ram_usage: 45,
    ram_total_gb: 8,
    ram_used_gb: 3.6,
    gpu_usage: 0,
    temperature_c: 44,
    latency_ms: 12,
    backend_type: 'llama.cpp',
  },
];

export const INITIAL_MODELS: ModelItem[] = [
  {
    id: 'm1',
    name: 'llama3:8b-instruct-q4_K_M',
    display: 'LLaMA 3 8B Instruct',
    size: '4.7 GB',
    type: 'inference',
    quantization: 'Q4_K_M (GGUF)',
    parameters: '8.03B',
    context_length: '8,192 tokens',
    installed: true,
    description: 'Excelente para raciocínio geral, conversação em português e código rápido.',
    recommended_ram_gb: 6,
  },
  {
    id: 'm2',
    name: 'mistral:7b-instruct-v0.3-q4_K_M',
    display: 'Mistral 7B Instruct v0.3',
    size: '4.1 GB',
    type: 'inference',
    quantization: 'Q4_K_M',
    parameters: '7.24B',
    context_length: '32,768 tokens',
    installed: true,
    description: 'Janela de contexto longa, ótimo para análise de documentos extensos.',
    recommended_ram_gb: 5.5,
  },
  {
    id: 'm3',
    name: 'phi3:3.8b-mini-128k',
    display: 'Phi-3 Mini 3.8B (128k)',
    size: '2.3 GB',
    type: 'lightweight',
    quantization: 'Q4_K_M',
    parameters: '3.82B',
    context_length: '128,000 tokens',
    installed: true,
    description: 'Ultra leve, perfeito para nós Android / Termux com menos de 8GB de RAM.',
    recommended_ram_gb: 3.5,
  },
  {
    id: 'm4',
    name: 'deepseek-coder:6.7b-instruct',
    display: 'DeepSeek Coder 6.7B',
    size: '3.8 GB',
    type: 'code',
    quantization: 'Q4_K_M',
    parameters: '6.7B',
    context_length: '16,384 tokens',
    installed: false,
    description: 'Especialista em geração, refatoração e depuração de código em Python/TS/Rust.',
    recommended_ram_gb: 5,
  },
  {
    id: 'm5',
    name: 'gemma2:9b-instruct-q4_K_M',
    display: 'Gemma 2 9B Instruct',
    size: '5.4 GB',
    type: 'inference',
    quantization: 'Q4_K_M',
    parameters: '9.24B',
    context_length: '8,192 tokens',
    installed: false,
    description: 'Arquitetura de última geração do Google com alto poder de síntese.',
    recommended_ram_gb: 7,
  },
  {
    id: 'm6',
    name: 'tinyllama:1.1b-chat-v1.0',
    display: 'TinyLLaMA 1.1B Chat',
    size: '638 MB',
    type: 'lightweight',
    quantization: 'Q4_K_M',
    parameters: '1.10B',
    context_length: '2,048 tokens',
    installed: true,
    description: 'Extremamente rápido para testes de latência e nós móveis fracos.',
    recommended_ram_gb: 1.5,
  },
  {
    id: 'm7',
    name: 'qwen2.5:7b-instruct',
    display: 'Qwen 2.5 7B Instruct',
    size: '4.4 GB',
    type: 'inference',
    quantization: 'Q4_K_M',
    parameters: '7.61B',
    context_length: '32,768 tokens',
    installed: false,
    description: 'Líder em benchmarks multilíngues, matemática e seguimento rigoroso de regras.',
    recommended_ram_gb: 6,
  },
  {
    id: 'm8',
    name: 'llava:7b-v1.6-vicuna',
    display: 'LLaVA 7B (Visão + Texto)',
    size: '4.5 GB',
    type: 'multimodal',
    quantization: 'Q4_K_M',
    parameters: '7.0B',
    context_length: '4,096 tokens',
    installed: false,
    description: 'Capacidade de interpretar imagens e diagramas de forma distribuída.',
    recommended_ram_gb: 6.5,
  },
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    task_id: 'task-a8f1',
    task_type: 'inference',
    status: 'completed',
    progress: 100,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    started_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    finished_at: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    assigned_nodes: ['master', 'node_win_pc', 'node_termux_s24'],
    params: {
      model: 'llama3:8b-instruct-q4_K_M',
      prompt: 'Explique como funciona a inferência distribuída em clusters heterogêneos.',
    },
    result: {
      tokens_generated: 284,
      throughput_tps: 34.2,
      latency_ms: 120,
    },
    logs: [
      '[12:28:01] Iniciando divisão do grafo de computação em 3 nós...',
      '[12:28:02] Tensor Paralelism: Camadas 0-10 -> Master, Camadas 11-22 -> Windows PC, Camadas 23-32 -> Galaxy S24.',
      '[12:28:03] Sincronização KV Cache completada via SocketIO WebSocket.',
      '[12:28:05] Inferência concluída com sucesso. 284 tokens gerados.',
    ],
  },
  {
    task_id: 'task-c39b',
    task_type: 'fine_tune',
    status: 'completed',
    progress: 100,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    started_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    finished_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    assigned_nodes: ['master', 'node_win_pc', 'node_termux_s24', 'node_termux_redmi'],
    params: {
      model: 'llama3:8b-instruct-q4_K_M',
      dataset_name: 'atendimento_sac_suporte.jsonl',
      epochs: 3,
      batch_size: 4,
      learning_rate: 0.0002,
      lora_rank: 16,
    },
    result: {
      final_loss: 0.6214,
      shards_completed: 4,
      adapter_saved: 'lora_sac_v1.gguf',
    },
    logs: [
      '[11:55:10] Carregando dataset (1.200 amostras)...',
      '[11:55:12] Distribuindo 4 shards para nós: [Master, WinPC, GalaxyS24, RedmiNote12]',
      '[11:57:00] Época 1/3 - Loss média: 1.4820',
      '[12:02:15] Época 2/3 - Loss média: 0.9412',
      '[12:08:40] Época 3/3 - Loss média: 0.6214',
      '[12:10:00] Pesos LoRA mesclados e salvos com sucesso em lora_sac_v1.gguf.',
    ],
  },
];

export const SAMPLE_DATASETS = [
  {
    id: 'sac_ptbr',
    name: 'Atendimento & Suporte Técnico (PT-BR)',
    samples_count: '1.450 exemplos',
    size: '890 KB',
    description: 'Perfeito para criar um chatbot de suporte técnico empático e resolutivo em português.',
    content: `{"instruction": "Meu aplicativo fecha sozinho ao abrir a câmera no Android.", "response": "Olá! Para resolver isso, vá em Configurações > Aplicativos > Nosso App > Permissões e confirme se a permissão de Câmera está ativa. Limpar o cache em Armazenamento também costuma resolver."}
{"instruction": "Como cancelar minha assinatura?", "response": "Você pode cancelar a qualquer momento em Meu Perfil > Assinatura > Cancelar Plano. Não há taxas de cancelamento."}
{"instruction": "Qual a velocidade recomendada de internet para o cluster?", "response": "Recomendamos conexões Wi-Fi 5GHz ou cabo Ethernet com pelo menos 100 Mbps de largura de banda e latência abaixo de 20ms para sincronização ótima."}`,
  },
  {
    id: 'code_python',
    name: 'Especialista em Python & Automação',
    samples_count: '2.800 exemplos',
    size: '1.9 MB',
    description: 'Instruções para geração de scripts assíncronos, FastAPI, PyTorch e paralelismo.',
    content: `{"instruction": "Crie uma função em Python para calcular média móvel ponderada.", "response": "def weighted_moving_average(data, weights):\n    import numpy as np\n    weights = np.array(weights)\n    return np.convolve(data, weights[::-1], mode='valid') / weights.sum()"}
{"instruction": "Como enviar um heartbeat via socket em Python?", "response": "import socket, json\nsock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)\nsock.sendto(json.dumps({'status': 'online'}).encode(), ('192.168.1.100', 55555))"}`,
  },
  {
    id: 'cyberpunk_persona',
    name: 'Persona IA Cyberpunk & Terminal Hacker',
    samples_count: '950 exemplos',
    size: '620 KB',
    description: 'Tom sarcástico, técnico e futurista para assistentes de linha de comando.',
    content: `{"instruction": "Quem é você?", "response": "[NEURAL_LINK]: Sou a matriz distribuída do LLM Cluster Trainer V3. Meus núcleos residem nos seus terminais."}
{"instruction": "Qual o status do nó 4?", "response": "[TELEMETRY_SCAN]: Nó 4 operando a 39°C, 88% de bateria, 0 gargalos no barramento DMA."}`,
  },
];

export const SCRIPT_TEMPLATES = {
  termux: `# ============================================================
# LLM Cluster Trainer V3 - Script Automático para Termux (Android)
# Aceleração OpenCL + QLoRA Sharding + Socket.IO Daemon
# ============================================================
pkg update -y && pkg upgrade -y
pkg install -y python git clang cmake make opencl-headers libandroid-support
python -m pip install --upgrade pip
pip install python-socketio psutil requests

# Baixar e iniciar worker com suporte a Sharding & QLoRA
curl -sSL http://{{MASTER_IP}}:3000/api/worker.py -o worker.py
python worker.py --master-ip {{MASTER_IP}} --code {{PAIRING_CODE}}
`,
  windows: `# ============================================================
# LLM Cluster Trainer V3 - Script PowerShell (Windows 10/11)
# Suporte a CUDA, bitsandbytes (Paged AdamW) e QLoRA NF4
# ============================================================
Write-Host "Iniciando Servo LLM Cluster V3 (QLoRA & Pipeline Worker)..." -ForegroundColor Cyan

if (!(Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Python 3.11 via Winget..." -ForegroundColor Yellow
    winget install Python.Python.3.11 --silent
}

pip install --upgrade pip
pip install python-socketio psutil requests torch bitsandbytes peft transformers

# Baixar e conectar daemon do Worker
Invoke-WebRequest -Uri "http://{{MASTER_IP}}:3000/api/worker.py" -OutFile "worker.py"
python worker.py
`,
  linux: `# ============================================================
# LLM Cluster Trainer V3 - Script Bash (Linux / Ubuntu / Debian / RPi)
# Pipeline Parallelism + Paged AdamW 8-bit + Gradient Checkpointing
# ============================================================
sudo apt update && sudo apt install -y python3 python3-pip python3-venv git curl
pip3 install --upgrade pip
pip3 install python-socketio psutil requests torch bitsandbytes peft transformers

# Executar Servo em background
curl -sSL http://{{MASTER_IP}}:3000/api/worker.py -o worker.py
python3 worker.py &
echo "Servo QLoRA iniciado com sucesso! Mini-dashboard: http://localhost:5001"
`,
};

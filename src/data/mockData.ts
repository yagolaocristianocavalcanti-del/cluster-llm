import { ClusterNode, ModelItem, TaskItem, DormantNodeWOL, CloudBurstInstanceConfig } from '../types';

export const INITIAL_NODES: ClusterNode[] = [
  {
    node_id: 'master_host',
    device_name: 'Master Host (Orquestrador Central)',
    address: '127.0.0.1',
    port: 3000,
    transport: 'local',
    platform: 'Linux',
    arch: 'x86_64',
    status: 'online',
    last_seen: new Date().toISOString(),
    cpu_usage: 12,
    ram_usage: 32,
    ram_total_gb: 16,
    ram_used_gb: 5.1,
    gpu_usage: 0,
    gpu_name: 'Acelerador Integrado (Vulkan / CPU)',
    temperature_c: 42,
    latency_ms: 1,
    backend_type: 'ollama',
    is_master: true,
    assigned_layers: 'Full Model Graph',
    assigned_shards: [0, 1, 2, 3]
  }
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
    description: 'Modelo de referência para raciocínio geral, conversação em português e código rápido.',
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
    description: 'Janela de contexto longa, ótimo para análise de documentos extensos e extração estruturada.',
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
    description: 'Ultra leve e eficiente, ideal para nós Android / Termux e dispositivos com menos de 8GB de RAM.',
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
    description: 'Especialista em geração, refatoração e depuração de código em Python, TypeScript e Rust.',
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
    description: 'Arquitetura de última geração do Google com alto poder de síntese e raciocínio lógico.',
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
    description: 'Extremamente compacto para testes rápidos de latência e execução em nós móveis.',
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
    description: 'Líder em benchmarks multilíngues, matemática e seguimento rigoroso de regras estruturadas.',
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

export const INITIAL_TASKS: TaskItem[] = [];

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

// Nós Dormindo Registrados com Suporte a Wake-on-LAN (WOL)
export const INITIAL_DORMANT_WOL_NODES: DormantNodeWOL[] = [
  {
    id: 'wol_desktop_4090',
    name: 'Workstation RTX 4090 (Laboratório)',
    mac_address: '00:1B:44:11:3A:B7',
    ip_address: '192.168.1.180',
    platform: 'Windows',
    specs_summary: 'Ryzen 9 7950X, 64GB DDR5, RTX 4090 24GB (CUDA 12.4)',
    wake_port: 9,
    status: 'sleeping',
  },
  {
    id: 'wol_server_dell',
    name: 'Dell PowerEdge R740 (Rack Local)',
    mac_address: 'D8:9D:67:23:44:8C',
    ip_address: '192.168.1.200',
    platform: 'Linux',
    specs_summary: '2x Xeon Gold 6248, 128GB ECC RAM, 2x Tesla T4 16GB',
    wake_port: 9,
    status: 'sleeping',
  },
  {
    id: 'wol_mac_studio',
    name: 'Mac Studio M2 Ultra (Sala de Criação)',
    mac_address: 'A4:83:E7:99:1C:2F',
    ip_address: '192.168.1.155',
    platform: 'macOS',
    specs_summary: 'Apple M2 Ultra 24-core, 64GB Memória Unificada (Metal GPU)',
    wake_port: 9,
    status: 'sleeping',
  },
];

// Presets de Instâncias Cloud Spot para Bursting Sob Demanda
export const CLOUD_BURST_PRESETS: CloudBurstInstanceConfig[] = [
  {
    provider: 'gcp_cloud_run',
    name: 'GCP Cloud Run GPU (NVIDIA L4 24GB)',
    gpu_type: 'NVIDIA L4 (24GB)',
    cost_per_hour_usd: 0.65,
    location: 'us-central1 (Iowa)',
    auto_terminate_idle_min: 15,
  },
  {
    provider: 'runpod_spot',
    name: 'RunPod Spot Instance (NVIDIA A10G 24GB)',
    gpu_type: 'NVIDIA A10G (24GB)',
    cost_per_hour_usd: 0.39,
    location: 'US-East (Virginia)',
    auto_terminate_idle_min: 10,
  },
  {
    provider: 'lambda_labs',
    name: 'Lambda Labs On-Demand (NVIDIA A100 80GB SXM4)',
    gpu_type: 'NVIDIA A100 (80GB)',
    cost_per_hour_usd: 1.49,
    location: 'us-west-1 (Texas)',
    auto_terminate_idle_min: 20,
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

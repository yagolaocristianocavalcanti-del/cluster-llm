# 🚀 LLM Cluster Trainer V3 (Motor Único)

> **Supercomputador Virtual Distribuído de IA**: Unifique celulares Android (Termux), PCs Windows, servidores Linux e instâncias em nuvem em um **único cluster de alta performance** para inferência e treinamento (LoRA/Fine-Tuning) de modelos de linguagem de grande porte (LLMs).

---

## 📋 Índice
1. [Visão Geral e Arquitetura](#-visão-geral-e-arquitetura)
2. [Requisitos do Sistema](#-requisitos-do-sistema)
3. [Instalação Rápida (Passo a Passo)](#-instalação-rápida-passo-a-passo)
4. [Como Executar o Servidor Mestre](#-como-executar-o-servidor-mestre)
5. [Como Gerar o Executável Standalone (.EXE para Windows)](#-como-gerar-o-executável-standalone-exe-para-windows)
6. [Como Conectar Dispositivos Servos (Zero-Touch)](#-como-conectar-dispositivos-servos-zero-touch)
   - [Android via Termux](#1-celular-android-via-termux)
   - [PC Windows Secundário](#2-pc-windows-secundário)
   - [Linux / Raspberry Pi](#3-linux--raspberry-pi)
7. [Recursos e Funcionalidades Principais](#-recursos-e-funcionalidades-principais)
8. [Estrutura de Arquivos](#-estrutura-de-arquivos)
9. [Solução de Problemas Comuns (FAQ)](#-solução-de-problemas-comuns-faq)

---

## 🧠 Visão Geral e Arquitetura

O **LLM Cluster Trainer V3** resolve a limitação de memória VRAM/RAM dividindo tensores e camadas de modelos (como LLaMA 3 8B, Mistral 7B, Gemma 2 e Qwen 2.5) entre múltiplos dispositivos heterogêneos conectados na rede local (Wi-Fi/Ethernet) ou cabo USB.

```
       ┌────────────────────────────────────────────────────────┐
       │             Nó Mestre (Orquestrador Central)           │
       │    Node.js + Express + WebSocket (Socket.IO) + React   │
       └──────────────────────────┬─────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │ (Wi-Fi/LAN)            │ (USB / ADB)            │ (Rede Local / Cloud)
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Android Termux  │    │  Android USB/ADB │    │  PC Windows/GPU  │
│  (Snapdragon)    │    │  (llama.cpp)     │    │  (RTX / Ollama)  │
│  Shards 0 - 8    │    │  Shards 9 - 16   │    │  Shards 17 - 32  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 💻 Requisitos do Sistema

### Para o Nó Mestre (Servidor):
- **Node.js**: Versão `18.x`, `20.x` ou `22.x` ([Baixar Node.js](https://nodejs.org/))
- **NPM**: Versão `9.x` ou superior (incluso com o Node.js)
- **Sistema Operacional**: Windows 10/11, Ubuntu/Debian Linux, ou macOS

### Opcional (para aceleração local):
- **Ollama**: Para rodar modelos open-weights locais ([ollama.com](https://ollama.com/))
- **Chave de API Gemini**: Definida em `.env` como `GEMINI_API_KEY` para aceleração híbrida e geração sintética de datasets.

---

## ⚡ Instalação Rápida (Passo a Passo)

### 1. Clonar ou Baixar o Projeto
Abra o terminal (PowerShell, Prompt de Comando ou Bash) e execute:
```bash
git clone https://github.com/seu-usuario/llm-cluster-trainer.git
cd llm-cluster-trainer
```

### 2. Instalar as Dependências do Projeto
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo para criar seu `.env`:

**No Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**No Linux / macOS:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` para inserir sua chave da API Gemini (opcional, mas recomendado):
```env
GEMINI_API_KEY="sua_chave_aqui"
PORT=3000
```

---

## ▶️ Como Executar o Servidor Mestre

### Modo de Desenvolvimento (Hot-Reloading e logs ao vivo):
```bash
npm run dev
```
Após executar, acesse no navegador:
👉 **`http://localhost:3000`** (ou `http://SEU_IP_LOCAL:3000` a partir de outros dispositivos da sua rede).

### Modo de Produção:
```bash
# 1. Compilar o frontend e o backend
npm run build

# 2. Iniciar o servidor de produção
npm start
```

---

## 📦 Como Gerar o Executável Standalone (.EXE para Windows)

Se você deseja rodar a aplicação como um programa `.exe` independente no Windows **sem precisar ter o Node.js instalado** na máquina final:

### Método 1: Usando o comando integrado (Recomendado)

O projeto já possui o script configurado para compilar o executável com `@yao-pkg/pkg`:

```bash
npm run build:exe
```

O arquivo compilado será gerado na pasta:
📁 **`bin/server.exe`** (para Windows) e **`bin/server`** (para Linux).

Basta dar dois cliques em `bin/server.exe` e o servidor iniciará automaticamente!

---

### Método 2: Gerando manualmente com `pkg`

1. Compile o projeto:
```bash
npm run build
```

2. Gere o `.exe` direcionado para Windows x64:
```bash
npx @yao-pkg/pkg dist/server.cjs --target node18-win-x64 --output LLM-Cluster-Trainer.exe --compress GZip
```

3. Pronto! O arquivo `LLM-Cluster-Trainer.exe` está pronto para distribuição.

---

### Método 3: Criar um Inicializador em Lote (`iniciar.bat`) para Windows

Se preferir manter o projeto em código e rodar com 1 clique no Windows, crie um arquivo chamado `iniciar.bat` na raiz do projeto com o conteúdo:

```bat
@echo off
title LLM Cluster Trainer V3
echo ===================================================
echo   Iniciando LLM Cluster Trainer V3 (Motor Unico)
echo ===================================================
echo.
npm run build
start http://localhost:3000
npm start
pause
```

---

## 📱 Como Conectar Dispositivos Servos (Zero-Touch)

O orquestrador gera automaticamente um código de pareamento seguro de 6 dígitos. Você pode conectar nós de diferentes formas:

### 1. Celular Android via Termux
1. Instale o app [Termux](https://f-droid.org/en/packages/com.termux/) no celular.
2. Abra o Termux e execute o comando abaixo (substitua pelo IP do seu PC Mestre):
```bash
pkg update -y && pkg install python curl -y
curl -sSL http://IP_DO_SEU_PC:3000/api/worker.py | python3
```
3. O celular se registrará instantaneamente no cluster e aparecerá no painel visual.

---

### 2. PC Windows Secundário
No PowerShell do PC secundário:
```powershell
irm http://IP_DO_SEU_PC:3000/api/worker.ps1 | iex
```
Ou usando Python no Windows:
```powershell
python -c "import urllib.request; exec(urllib.request.urlopen('http://IP_DO_SEU_PC:3000/api/worker.py').read())"
```

---

### 3. Linux / Raspberry Pi
No terminal do Linux:
```bash
curl -sSL http://IP_DO_SEU_PC:3000/api/worker.py | python3
```

---

## ✨ Recursos e Funcionalidades Principais

| Recurso | Descrição |
| :--- | :--- |
| 🌐 **Motor Único de IA** | Unifica RAM e processamento de todos os nós em uma interface central. |
| 🌡️ **Heatmap de Saúde Térmica/RAM** | Monitoramento visual com alerta de *Thermal Throttling* (>85°C) e sobrecarga de VRAM (>90%). |
| ⚡ **Auto-Scaling & Wake-on-LAN (WOL)** | Liga nós hibernantes automaticamente enviando pacotes mágicos UDP quando a carga do cluster atinge o limite. |
| ☁️ **Cloud Bursting Sob Demanda** | Conecta instâncias GPU externas (RunPod / Vast.ai) dinamicamente para picos de trabalho. |
| 📡 **mDNS Ollama Discovery** | Varre a sub-rede local em busca de instâncias Ollama rodando em outros computadores. |
| 📊 **Benchmark Real de FLOPS** | Executa multiplicação de matrizes densas para medir GFLOPS e taxa real de tokens/segundo. |
| 🎯 **LoRA Fine-Tuning Distribuído** | Treinamento colaborativo de adaptadores com cálculo de perda e validação em tempo real. |

---

## 📁 Estrutura de Arquivos

```
llm-cluster-trainer/
├── server.ts                  # Servidor Backend Express + Socket.IO + Proxy Ollama/Gemini
├── src/
│   ├── App.tsx                # Componente raiz, controle de estado global e sockets
│   ├── components/
│   │   ├── MotorUnicoHero.tsx # Hero visual com métricas agregadas do cluster
│   │   ├── ClusterView.tsx    # Gerenciamento de nós, Heatmap, WOL e Cloud Bursting
│   │   ├── DashboardView.tsx  # Telemetria em tempo real, CPU/RAM charts e nós ativos
│   │   ├── InferenceView.tsx  # Playground de inferência distribuída
│   │   ├── FinetuneView.tsx   # Treinador distribuído de LoRA
│   │   ├── ModelsCatalog.tsx  # Catálogo de modelos GGUF/Ollama
│   │   └── TasksView.tsx      # Fila de tarefas, benchmarks e logs
│   ├── data/
│   │   └── mockData.ts        # Modelos padrão e templates de dados
│   ├── types.ts               # Tipagens TypeScript completas do sistema
│   └── main.tsx               # Entry point do React
├── package.json               # Dependências e scripts de build
├── vite.config.ts             # Configuração do Vite + Tailwind CSS
└── README.md                  # Este manual de instruções
```

---

## ❓ Solução de Problemas Comuns (FAQ)

### 1. Meu celular Android não consegue conectar ao nó mestre.
- **Causa**: O PC mestre e o celular precisam estar conectados na **mesma rede Wi-Fi**.
- **Solução**: Verifique se o Firewall do Windows não está bloqueando a porta `3000`. No Windows Defender Firewall, permita o tráfego de entrada para o Node.js ou para a porta TCP 3000.

### 2. O Ollama local não é detectado.
- **Causa**: O Ollama por padrão escuta apenas em `127.0.0.1`.
- **Solução**: Para permitir que outros computadores da rede acessem o Ollama, defina a variável de ambiente:
  - No Windows: `set OLLAMA_HOST=0.0.0.0:11434`
  - No Linux: `export OLLAMA_HOST=0.0.0.0:11434` e reinicie o serviço `ollama serve`.

### 3. Como limpar o cache do cluster e redefinir nós?
- No navegador, basta recarregar a página com `Ctrl + F5` ou clicar no botão **"Sincronizar Cluster"** no cabeçalho da aplicação.

---

## 📜 Licença
Projeto distribuído sob a licença **MIT**. Sinta-se livre para usar, estudar, modificar e distribuir.

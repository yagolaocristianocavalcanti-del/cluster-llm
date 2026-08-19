import { FinetunePreset } from '../types';

export const BUILTIN_FINETUNE_PRESETS: FinetunePreset[] = [
  {
    id: 'preset_balanced',
    name: 'Configuração Equilibrada (Padrão Recomendado)',
    description: 'Equilíbrio ótimo entre velocidade de convergência, uso de memória VRAM e capacidade de generalização.',
    isBuiltin: true,
    category: 'balanced',
    config: {
      quantization: 'nf4_4bit',
      adapterPrecision: 'bf16',
      targetModules: ['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'],
      loraRank: 16,
      loraAlpha: 32,
      isAlphaLocked: true,
      loraDropout: 0.05,
      gradientCheckpointing: true,
      optimizer: 'paged_adamw_8bit',
      maxSeqLength: 1024,
      epochs: 3,
      learningRate: 0.0002,
      microBatchSize: 2,
      gradientAccumulationSteps: 8,
      gradientCompression: 'fp16',
      dataPacking: true,
    },
  },
  {
    id: 'preset_economy',
    name: 'Configuração Economia (Mobile & VRAM Baixa)',
    description: 'Maximização de eficiência para celulares (Termux), GPUs integradas e dispositivos com pouca VRAM. Rank 8 e INT8.',
    isBuiltin: true,
    category: 'economy',
    config: {
      quantization: 'nf4_4bit',
      adapterPrecision: 'fp16',
      targetModules: ['q_proj', 'v_proj', 'k_proj', 'o_proj'],
      loraRank: 8,
      loraAlpha: 16,
      isAlphaLocked: true,
      loraDropout: 0.05,
      gradientCheckpointing: true,
      optimizer: 'paged_adamw_8bit',
      maxSeqLength: 512,
      epochs: 3,
      learningRate: 0.0002,
      microBatchSize: 1,
      gradientAccumulationSteps: 8,
      gradientCompression: 'int8',
      dataPacking: true,
    },
  },
  {
    id: 'preset_high_precision',
    name: 'Configuração Alta Precisão (Qualidade Máxima)',
    description: 'Adapta todas as projeções de atenção e MLP com Rank 32 e contexto de 2048 tokens para máxima retenção semântica.',
    isBuiltin: true,
    category: 'precision',
    config: {
      quantization: 'nf4_4bit',
      adapterPrecision: 'bf16',
      targetModules: ['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'],
      loraRank: 32,
      loraAlpha: 64,
      isAlphaLocked: true,
      loraDropout: 0.05,
      gradientCheckpointing: true,
      optimizer: 'paged_adamw_8bit',
      maxSeqLength: 2048,
      epochs: 4,
      learningRate: 0.0001,
      microBatchSize: 2,
      gradientAccumulationSteps: 16,
      gradientCompression: 'fp16',
      dataPacking: true,
    },
  },
  {
    id: 'preset_speed_prototype',
    name: 'Configuração Treino Rápido & Prototipagem',
    description: 'Ideal para testar e validar datasets rapidamente em 1 época com alta taxa de aprendizado e steps condensados.',
    isBuiltin: true,
    category: 'speed',
    config: {
      quantization: 'nf4_4bit',
      adapterPrecision: 'fp16',
      targetModules: ['q_proj', 'v_proj'],
      loraRank: 8,
      loraAlpha: 16,
      isAlphaLocked: true,
      loraDropout: 0.0,
      gradientCheckpointing: true,
      optimizer: 'paged_adamw_8bit',
      maxSeqLength: 512,
      epochs: 1,
      learningRate: 0.0003,
      microBatchSize: 2,
      gradientAccumulationSteps: 4,
      gradientCompression: 'int8',
      dataPacking: true,
    },
  },
  {
    id: 'preset_deep_reasoning',
    name: 'Configuração Código & Raciocínio Profundo',
    description: 'Rank 64 com dropout 0.1 e regularização intensa, calibrado para tarefas de codificação, matemática e raciocínio lógico.',
    isBuiltin: true,
    category: 'code',
    config: {
      quantization: 'nf4_4bit',
      adapterPrecision: 'bf16',
      targetModules: ['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'],
      loraRank: 64,
      loraAlpha: 128,
      isAlphaLocked: true,
      loraDropout: 0.1,
      gradientCheckpointing: true,
      optimizer: 'paged_adamw_8bit',
      maxSeqLength: 2048,
      epochs: 5,
      learningRate: 0.00015,
      microBatchSize: 1,
      gradientAccumulationSteps: 16,
      gradientCompression: 'fp16',
      dataPacking: true,
    },
  },
];

const STORAGE_KEY = 'motor_finetune_presets_v1';

export function loadStoredPresets(): FinetunePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return BUILTIN_FINETUNE_PRESETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge built-ins to ensure built-ins are always present even after updates
      const userCustom = parsed.filter((p: FinetunePreset) => !p.isBuiltin);
      const mergedBuiltins = BUILTIN_FINETUNE_PRESETS.map((builtin) => {
        const existing = parsed.find((p: FinetunePreset) => p.id === builtin.id);
        return existing || builtin;
      });
      return [...mergedBuiltins, ...userCustom];
    }
  } catch (err) {
    console.warn('Erro ao carregar presets do localStorage:', err);
  }
  return BUILTIN_FINETUNE_PRESETS;
}

export function saveStoredPresets(presets: FinetunePreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.warn('Erro ao salvar presets no localStorage:', err);
  }
}

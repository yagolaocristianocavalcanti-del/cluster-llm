import { FinetuneCheckpoint } from '../types';
import { BUILTIN_FINETUNE_PRESETS } from './finetunePresets';

const STORAGE_KEY = 'motor_v3_finetune_checkpoints';

export const INITIAL_CHECKPOINTS: FinetuneCheckpoint[] = [
  {
    id: 'chk_step_150_epoch_2',
    name: 'Checkpoint Época 2 - Step 150 (Loss 0.742)',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    step: 150,
    total_steps: 300,
    epoch: 2,
    total_epochs: 3,
    loss: 0.742,
    learning_rate: 0.00014,
    model_name: 'llama3:8b-instruct-q4_K_M',
    dataset_name: 'Instruções em Português BR (Sintético)',
    adapter_size_mb: 28.4,
    storage_location: 'local_cluster',
    can_resume: true,
    active_nodes_count: 3,
    config_snapshot: BUILTIN_FINETUNE_PRESETS[0].config,
    loss_history_snapshot: [2.24, 1.95, 1.62, 1.34, 1.08, 0.89, 0.74],
  },
  {
    id: 'chk_step_75_epoch_1',
    name: 'Checkpoint Época 1 - Step 75 (Loss 1.340)',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    step: 75,
    total_steps: 300,
    epoch: 1,
    total_epochs: 3,
    loss: 1.34,
    learning_rate: 0.00018,
    model_name: 'llama3:8b-instruct-q4_K_M',
    dataset_name: 'Instruções em Português BR (Sintético)',
    adapter_size_mb: 28.4,
    storage_location: 'local_cluster',
    can_resume: true,
    active_nodes_count: 3,
    config_snapshot: BUILTIN_FINETUNE_PRESETS[0].config,
    loss_history_snapshot: [2.24, 1.95, 1.62, 1.34],
  },
];

export function loadStoredCheckpoints(): FinetuneCheckpoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CHECKPOINTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Erro ao carregar checkpoints de fine-tuning:', e);
  }
  return INITIAL_CHECKPOINTS;
}

export function saveStoredCheckpoints(checkpoints: FinetuneCheckpoint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkpoints));
  } catch (e) {
    console.warn('Erro ao salvar checkpoints de fine-tuning:', e);
  }
}

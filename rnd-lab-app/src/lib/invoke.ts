import { invoke as tauriInvoke } from '@tauri-apps/api/core';

// Thin wrapper around Tauri invoke for type safety
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return tauriInvoke<T>(cmd, args);
}

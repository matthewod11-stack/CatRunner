import { useState, useCallback } from 'react';
import { TuningProfile, DEFAULT_TUNING } from './defaultTuning';

const STORAGE_KEY = 'beach-cat-dev-tuning';
const PRESETS_KEY = 'beach-cat-dev-tuning-presets';

function loadTuning(): TuningProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_TUNING, ...JSON.parse(raw) };
  } catch { /* ignore corrupt data */ }
  return { ...DEFAULT_TUNING };
}

function loadPresets(): Record<string, TuningProfile> {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return {};
}

export function useTuningStore() {
  const [tuning, setTuningState] = useState<TuningProfile>(loadTuning);
  const [presets, setPresetsState] = useState<Record<string, TuningProfile>>(loadPresets);

  const setTuning = useCallback((updates: Partial<TuningProfile>) => {
    setTuningState(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setTuningState({ ...DEFAULT_TUNING });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const savePreset = useCallback((name: string) => {
    setPresetsState(prev => {
      const next = { ...prev, [name]: { ...tuning } };
      localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
      return next;
    });
  }, [tuning]);

  const loadPreset = useCallback((name: string) => {
    const preset = presets[name];
    if (preset) {
      setTuningState({ ...preset });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
    }
  }, [presets]);

  const deletePreset = useCallback((name: string) => {
    setPresetsState(prev => {
      const next = { ...prev };
      delete next[name];
      localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { tuning, setTuning, resetToDefaults, presets, savePreset, loadPreset, deletePreset };
}

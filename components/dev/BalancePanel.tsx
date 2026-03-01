import React, { useState } from 'react';
import { useTuningStore } from '../../systems/tuning/useTuningStore';
import { TuningProfile, DEFAULT_TUNING, TUNING_RANGES } from '../../systems/tuning/defaultTuning';
import { TelemetryEvent, exportTelemetryJson } from '../../systems/telemetry/runTelemetry';

interface BalancePanelProps {
  getTelemetryEvents?: () => TelemetryEvent[];
}

const GROUPS: Record<string, (keyof TuningProfile)[]> = {
  Physics: ['gravity', 'jumpForce', 'bounceForce', 'initialSpeed', 'speedIncrement'],
  Spawning: ['spawnBaseMs', 'spawnMinMs', 'spawnJitterMs', 'patternEndGapMs', 'harmfulCooldownMs'],
  Difficulty: ['bossThreshold', 'powerupThreshold', 'streakRequired'],
  Assist: ['lowLivesThreshold', 'criticalLivesThreshold', 'hitSpawnGraceMs', 'startSpawnGraceMs'],
  Boss: ['bossIntroEaseMs', 'invincibilityDurationMs'],
};

const BalancePanel: React.FC<BalancePanelProps> = ({ getTelemetryEvents }) => {
  const { tuning, setTuning, resetToDefaults, presets, savePreset, loadPreset, deletePreset } = useTuningStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [presetName, setPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');

  const toggleSection = (name: string) => {
    setCollapsed(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const resetGroup = (keys: (keyof TuningProfile)[]) => {
    const resets: Partial<TuningProfile> = {};
    for (const key of keys) {
      resets[key] = DEFAULT_TUNING[key];
    }
    setTuning(resets);
  };

  const presetNames = Object.keys(presets);

  return (
    <div className="fixed top-2 right-2 z-50 w-80 max-h-[90vh] overflow-y-auto bg-gray-900/90 backdrop-blur-sm text-white rounded-xl border border-gray-700 shadow-2xl">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-amber-400">Balance Panel</h2>
        <button
          onClick={resetToDefaults}
          className="text-[10px] font-bold uppercase tracking-wider bg-red-600/80 hover:bg-red-600 px-2 py-1 rounded transition-colors"
        >
          Reset All
        </button>
      </div>

      <div className="px-4 py-2 space-y-1">
        {/* Tuning Groups */}
        {Object.entries(GROUPS).map(([groupName, keys]) => (
          <div key={groupName} className="border-b border-gray-800 pb-2">
            <button
              onClick={() => toggleSection(groupName)}
              className="w-full flex items-center justify-between py-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
            >
              <span>{collapsed[groupName] ? '\u25B6' : '\u25BC'} {groupName}</span>
              <button
                onClick={(e) => { e.stopPropagation(); resetGroup(keys); }}
                className="text-[9px] font-bold bg-gray-700 hover:bg-gray-600 px-1.5 py-0.5 rounded transition-colors"
              >
                Reset
              </button>
            </button>

            {!collapsed[groupName] && (
              <div className="space-y-2 pb-2">
                {keys.map(key => {
                  const [min, max, step] = TUNING_RANGES[key];
                  const isModified = tuning[key] !== DEFAULT_TUNING[key];
                  return (
                    <div key={key}>
                      <label className="flex items-center justify-between text-xs text-gray-300">
                        <span className={isModified ? 'text-amber-300 font-bold' : ''}>{key}</span>
                        <span className="tabular-nums">
                          {tuning[key]}{' '}
                          <span className="text-gray-600">({DEFAULT_TUNING[key]})</span>
                        </span>
                      </label>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={tuning[key]}
                        onChange={e => setTuning({ [key]: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-gray-700 rounded appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Presets */}
        <div className="border-b border-gray-800 pb-3 pt-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Presets</h3>
          <div className="flex gap-1 mb-2">
            <input
              type="text"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              placeholder="Preset name..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => { if (presetName.trim()) { savePreset(presetName.trim()); setPresetName(''); } }}
              disabled={!presetName.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-bold px-2 py-1 rounded transition-colors"
            >
              Save
            </button>
          </div>
          {presetNames.length > 0 && (
            <div className="flex gap-1">
              <select
                value={selectedPreset}
                onChange={e => setSelectedPreset(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Select preset...</option>
                {presetNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button
                onClick={() => { if (selectedPreset) loadPreset(selectedPreset); }}
                disabled={!selectedPreset}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-bold px-2 py-1 rounded transition-colors"
              >
                Load
              </button>
              <button
                onClick={() => { if (selectedPreset) { deletePreset(selectedPreset); setSelectedPreset(''); } }}
                disabled={!selectedPreset}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-bold px-1.5 py-1 rounded transition-colors"
              >
                X
              </button>
            </div>
          )}
        </div>

        {/* Telemetry Export */}
        <div className="pt-2 pb-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Telemetry</h3>
          <button
            onClick={() => getTelemetryEvents && exportTelemetryJson(getTelemetryEvents())}
            disabled={!getTelemetryEvents}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-bold py-2 px-3 rounded transition-colors"
          >
            Export Telemetry JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalancePanel;

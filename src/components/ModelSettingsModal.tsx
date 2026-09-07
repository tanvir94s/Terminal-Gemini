import React from 'react';
import { X, Sliders, Cpu, Palette, Volume2, Tv, Sparkles } from 'lucide-react';
import { TerminalSettings, TerminalTheme, TerminalThemeId } from '../types';
import { THEMES, AVAILABLE_MODELS } from '../utils/themes';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TerminalSettings;
  onUpdateSettings: (newSettings: Partial<TerminalSettings>) => void;
  theme: TerminalTheme;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  theme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Box */}
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-lg border shadow-2xl overflow-hidden font-mono text-xs z-10"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Sliders size={15} style={{ color: theme.accent }} />
            <span className="font-bold tracking-wider text-sm" style={{ color: theme.promptUser }}>
              TERMINAL & MODEL CONFIGURATION
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Model Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.accent }}>
              <Cpu size={14} />
              <span>ACTIVE GEMINI MODEL</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_MODELS.map((m) => {
                const isSelected = settings.model === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onUpdateSettings({ model: m.id })}
                    className={`text-left p-3 rounded border transition-all ${
                      isSelected ? 'ring-1' : 'hover:bg-white/5'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.2)',
                      borderColor: isSelected ? theme.accent : theme.border,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs" style={{ color: isSelected ? theme.promptUser : theme.text }}>
                        {m.name}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          backgroundColor: isSelected ? theme.accent : 'rgba(255,255,255,0.08)',
                          color: isSelected ? '#0a0d14' : theme.textMuted,
                        }}
                      >
                        {m.badge}
                      </span>
                    </div>
                    <div className="text-[11px] opacity-70 mt-1">{m.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Instruction / Persona */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.accent }}>
              <span className="flex items-center gap-2">
                <Sparkles size={14} />
                <span>SYSTEM INSTRUCTION / CLI PERSONA</span>
              </span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ systemInstruction: '' })}
                className="text-[10px] opacity-60 hover:opacity-100 underline"
              >
                Reset
              </button>
            </label>
            <textarea
              rows={3}
              value={settings.systemInstruction}
              onChange={(e) => onUpdateSettings({ systemInstruction: e.target.value })}
              placeholder="e.g. You are a senior Unix systems engineer. Keep your responses concise, actionable, and formatted in terminal monospace with code blocks."
              className="w-full p-2.5 rounded border outline-none font-mono text-xs leading-relaxed resize-y"
              style={{
                backgroundColor: 'rgba(0,0,0,0.25)',
                borderColor: theme.border,
                color: theme.text,
              }}
            />
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.accent }}>
              <span>TEMPERATURE: {settings.temperature.toFixed(2)}</span>
              <span className="text-[10px] opacity-60">
                {settings.temperature < 0.4 ? 'Focused & Precise' : settings.temperature > 1.2 ? 'Highly Creative' : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] opacity-50 mt-1">
              <span>0.0 (Strict / Code)</span>
              <span>1.0 (Standard)</span>
              <span>2.0 (Creative)</span>
            </div>
          </div>

          {/* Terminal Theme */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.accent }}>
              <Palette size={14} />
              <span>TERMINAL PALETTE / COLOR THEME</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(THEMES) as TerminalThemeId[]).map((thId) => {
                const t = THEMES[thId];
                const isSelected = settings.theme === thId;
                return (
                  <button
                    key={thId}
                    type="button"
                    onClick={() => onUpdateSettings({ theme: thId })}
                    className={`p-2 rounded border text-left transition-all ${
                      isSelected ? 'ring-2' : 'hover:bg-white/5'
                    }`}
                    style={{
                      backgroundColor: t.surface,
                      borderColor: isSelected ? t.accent : theme.border,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.accent }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.promptUser }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.text }} />
                    </div>
                    <div className="font-bold text-xs truncate" style={{ color: t.promptUser }}>
                      {t.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio & Display Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Scanlines */}
            <div
              className="flex items-center justify-between p-3 rounded border"
              style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderColor: theme.border,
              }}
            >
              <div className="flex items-center gap-2">
                <Tv size={15} style={{ color: theme.accent }} />
                <div>
                  <div className="font-bold text-xs">CRT Scanlines</div>
                  <div className="text-[10px] opacity-60">Retro CRT phosphor lines</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.scanlines}
                onChange={(e) => onUpdateSettings({ scanlines: e.target.checked })}
                className="w-4 h-4 accent-sky-400 cursor-pointer"
              />
            </div>

            {/* Typing Sound */}
            <div
              className="flex items-center justify-between p-3 rounded border"
              style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderColor: theme.border,
              }}
            >
              <div className="flex items-center gap-2">
                <Volume2 size={15} style={{ color: theme.accent }} />
                <div>
                  <div className="font-bold text-xs">Key Sounds</div>
                  <div className="text-[10px] opacity-60">Synthesized terminal audio</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-sky-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t text-right" style={{ borderColor: theme.border }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded font-semibold border hover:bg-white/10 transition-colors"
            style={{
              backgroundColor: theme.accent,
              borderColor: theme.border,
              color: '#0a0d14',
            }}
          >
            APPLY SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
};

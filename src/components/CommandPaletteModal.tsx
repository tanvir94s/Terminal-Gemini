import React from 'react';
import { X, Terminal, Keyboard } from 'lucide-react';
import { COMMANDS } from '../utils/commands';
import { TerminalTheme } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (cmd: string) => void;
  theme: TerminalTheme;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  theme,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Enter', desc: 'Send prompt or execute command' },
    { key: 'Shift + Enter', desc: 'Insert multiline line break' },
    { key: 'Arrow Up (↑)', desc: 'Recall previous prompt from history' },
    { key: 'Arrow Down (↓)', desc: 'Next prompt in history' },
    { key: 'Tab', desc: 'Autocomplete command name' },
    { key: 'Ctrl + C', desc: 'Abort current streaming response' },
    { key: 'Ctrl + L', desc: 'Clear visible terminal output' },
    { key: 'Ctrl + K', desc: 'Create a new conversation session' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Box */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg border shadow-2xl overflow-hidden font-mono text-xs z-10"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Terminal size={15} style={{ color: theme.accent }} />
            <span className="font-bold tracking-wider text-sm" style={{ color: theme.promptUser }}>
              MANUAL / CLI REFERENCE
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* CLI Commands List */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2" style={{ color: theme.accent }}>
              <span>TERMINAL COMMANDS</span>
              <span className="text-[10px] opacity-60">(Type in prompt or click to run)</span>
            </div>

            <div className="rounded border overflow-hidden" style={{ borderColor: theme.border }}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-[11px] select-none" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: theme.border }}>
                    <th className="py-2 px-3 font-semibold">Command</th>
                    <th className="py-2 px-3 font-semibold">Args / Syntax</th>
                    <th className="py-2 px-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme.border }}>
                  {COMMANDS.map((cmd) => (
                    <tr
                      key={cmd.command}
                      onClick={() => {
                        onExecuteCommand(cmd.command);
                        onClose();
                      }}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-3 font-bold">
                        <span className="underline" style={{ color: theme.promptUser }}>
                          {cmd.command}
                        </span>
                        {cmd.alias && <span className="text-[10px] opacity-50 ml-1.5">({cmd.alias})</span>}
                      </td>
                      <td className="py-2 px-3 opacity-60 text-[11px]">{cmd.args || '-'}</td>
                      <td className="py-2 px-3 opacity-85 text-[11px]">{cmd.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2" style={{ color: theme.accent }}>
              <Keyboard size={13} />
              <span>KEYBOARD SHORTCUTS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {shortcuts.map((sc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded border"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderColor: theme.border,
                  }}
                >
                  <kbd
                    className="px-2 py-0.5 rounded font-bold text-[11px] border"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderColor: theme.border,
                      color: theme.accent,
                    }}
                  >
                    {sc.key}
                  </kbd>
                  <span className="text-[11px] opacity-75 text-right">{sc.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div
            className="p-3 rounded border text-[11px] leading-relaxed"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderColor: theme.border,
            }}
          >
            <div className="font-bold mb-1" style={{ color: theme.promptGemini }}>
              ✦ MULTIMODAL GEMINI SUPPORT
            </div>
            <div>
              You can drag-and-drop any image file directly onto the terminal window, or click the paperclip icon in the prompt line. Gemini will inspect the visual contents in real time!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t text-right" style={{ borderColor: theme.border }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded font-semibold border hover:bg-white/10 transition-colors"
            style={{ borderColor: theme.border }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

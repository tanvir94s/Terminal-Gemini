import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  Paperclip,
  Square,
  X,
  FileImage,
  CornerDownLeft,
  Terminal,
} from 'lucide-react';
import { ImageAttachment, TerminalTheme } from '../types';
import { playKeyClickSound } from '../utils/audio';

interface TerminalPromptProps {
  input: string;
  setInput: (val: string) => void;
  onSubmit: () => void;
  onAbort: () => void;
  isStreaming: boolean;
  theme: TerminalTheme;
  soundEnabled: boolean;
  attachments: ImageAttachment[];
  onAddAttachment: (attachment: ImageAttachment) => void;
  onRemoveAttachment: (index: number) => void;
  commandHistory: string[];
}

export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
  input,
  setInput,
  onSubmit,
  onAbort,
  isStreaming,
  theme,
  soundEnabled,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  commandHistory,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [draftInput, setDraftInput] = useState<string>('');

  // Auto-focus input
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    playKeyClickSound(soundEnabled);

    // Enter to submit (Shift+Enter for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && (input.trim() || attachments.length > 0)) {
        setHistoryIndex(-1);
        setDraftInput('');
        onSubmit();
      }
      return;
    }

    // Ctrl+C to abort streaming
    if (e.ctrlKey && e.key === 'c') {
      if (isStreaming) {
        e.preventDefault();
        onAbort();
      }
      return;
    }

    // Up Arrow for command history
    if (e.key === 'ArrowUp' && textareaRef.current?.selectionStart === 0 && commandHistory.length > 0) {
      e.preventDefault();
      if (historyIndex === -1) {
        setDraftInput(input);
        const nextIdx = commandHistory.length - 1;
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      } else if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      }
      return;
    }

    // Down Arrow for command history
    if (e.key === 'ArrowDown' && historyIndex !== -1) {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      } else {
        setHistoryIndex(-1);
        setInput(draftInput);
      }
      return;
    }

    // Tab key completion for common commands
    if (e.key === 'Tab') {
      e.preventDefault();
      const trimmed = input.trim();
      const cliKeywords = ['help', 'clear', 'new', 'model', 'system', 'temp', 'theme', 'sessions', 'export', 'info', 'attach', 'scanlines', 'sound'];
      const match = cliKeywords.find((cmd) => cmd.startsWith(trimmed.toLowerCase()));
      if (match) {
        setInput(match + ' ');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      onAddAttachment({
        name: file.name,
        mimeType: file.type || 'image/jpeg',
        data: base64,
        previewUrl: result,
        sizeBytes: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div
      className="p-3 sm:p-4 border-t font-mono text-xs sm:text-sm z-20 transition-colors"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
      }}
    >
      {/* File Attachments List */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2.5 pb-2 border-b" style={{ borderColor: theme.border }}>
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded border text-xs"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: theme.border,
              }}
            >
              <FileImage size={13} style={{ color: theme.accent }} />
              <span className="truncate max-w-[140px]" style={{ color: theme.text }}>
                {att.name}
              </span>
              <span className="text-[10px] opacity-60">({Math.round(att.sizeBytes / 1024)}KB)</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(idx)}
                className="p-0.5 rounded hover:bg-white/20 transition-colors"
                title="Remove attachment"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Command Prompt Line */}
      <div className="flex items-start gap-2">
        {/* Terminal Prefix */}
        <div className="select-none shrink-0 pt-1 flex items-center gap-1 font-bold text-xs sm:text-sm" style={{ color: theme.promptUser }}>
          <Terminal size={14} className="opacity-80" />
          <span className="hidden sm:inline">user@gemini:~$</span>
          <span className="sm:hidden">&gt;</span>
        </div>

        {/* Text Input Area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isStreaming
                ? "Gemini is typing... [Ctrl+C to abort]"
                : "Ask Gemini anything, or type 'help' for terminal commands..."
            }
            className="w-full bg-transparent resize-none outline-none font-mono text-xs sm:text-sm leading-relaxed placeholder:opacity-40"
            style={{
              color: theme.text,
            }}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.txt,.json,.md,.csv,.py,.js,.ts"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            className="p-1.5 rounded transition-all hover:bg-white/10 active:scale-95 disabled:opacity-40"
            style={{ color: theme.textMuted }}
            title="Attach image or document (Multimodal analysis)"
          >
            <Paperclip size={15} />
          </button>

          {/* Stop / Abort Button (when streaming) */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onAbort}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-600/80 text-white font-mono text-xs font-semibold hover:bg-red-600 transition-all active:scale-95 animate-pulse"
              title="Stop streaming (Ctrl+C)"
            >
              <Square size={12} fill="currentColor" />
              <span className="hidden sm:inline">ABORT</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!input.trim() && attachments.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded font-mono text-xs font-bold transition-all disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: theme.accent,
                color: theme.bg === '#0a0d14' || theme.bg === '#040d06' || theme.bg === '#0f0a04' || theme.bg === '#0f081d' || theme.bg === '#141414' || theme.bg === '#002b36' ? '#0a0d14' : '#ffffff',
              }}
              title="Execute command (Enter)"
            >
              <span className="hidden sm:inline">EXEC</span>
              <CornerDownLeft size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Prompt Footer Tips */}
      <div className="flex flex-wrap items-center justify-between text-[10px] mt-2 select-none opacity-50 font-mono" style={{ color: theme.textMuted }}>
        <div className="flex items-center gap-3">
          <span>↵ Enter to submit</span>
          <span className="hidden sm:inline">⇧+↵ New line</span>
          <span className="hidden md:inline">↑/↓ History</span>
          <span className="hidden md:inline">Tab Autocomplete</span>
        </div>
        <div>
          <span>Gemini CLI Shell</span>
        </div>
      </div>
    </div>
  );
};

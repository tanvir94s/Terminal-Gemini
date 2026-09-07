import React from 'react';
import {
  Sliders,
  History,
  HelpCircle,
  Volume2,
  VolumeX,
  Tv,
  Plus,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { TerminalTheme, TerminalSettings } from '../types';

interface TerminalHeaderProps {
  theme: TerminalTheme;
  settings: TerminalSettings;
  sessionTitle: string;
  activeModel: string;
  isConnected: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onToggleDrawer: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onNewSession: () => void;
  onToggleSound: () => void;
  onToggleScanlines: () => void;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  theme,
  settings,
  sessionTitle,
  activeModel,
  isConnected,
  isFullscreen,
  onToggleFullscreen,
  onToggleDrawer,
  onOpenSettings,
  onOpenHelp,
  onNewSession,
  onToggleSound,
  onToggleScanlines,
}) => {
  return (
    <header
      className="flex flex-wrap items-center justify-between px-3 py-2 border-b select-none font-mono text-xs z-30 transition-colors"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
      }}
    >
      {/* Left: Window Controls + Session / Terminal Prompt info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block opacity-80 hover:opacity-100 cursor-pointer" title="Close / Reset" onClick={onNewSession} />
          <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block opacity-80 hover:opacity-100 cursor-pointer" title="Settings" onClick={onOpenSettings} />
          <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block opacity-80 hover:opacity-100 cursor-pointer" title="Fullscreen" onClick={onToggleFullscreen} />
        </div>

        <div className="h-4 w-[1px] bg-white/10 shrink-0" />

        <div className="flex items-center gap-2 truncate">
          <span className="flex items-center gap-1 font-bold tracking-wider" style={{ color: theme.promptUser }}>
            <Sparkles size={13} className="text-amber-400" />
            <span>GEMINI_CLI</span>
          </span>
          <span className="opacity-40">/</span>
          <span className="truncate font-medium max-w-[140px] sm:max-w-[260px]" style={{ color: theme.text }}>
            {sessionTitle || 'untitled_session'}
          </span>
          <span
            className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] tracking-wide border"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: theme.border,
              color: theme.accent,
            }}
          >
            {activeModel}
          </span>
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
        {/* Status indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/25 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-500'
            }`}
          />
          <span style={{ color: theme.textMuted }}>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>

        {/* New Session Button */}
        <button
          type="button"
          onClick={onNewSession}
          className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:bg-white/10 active:scale-95 border"
          style={{
            borderColor: theme.border,
            color: theme.text,
          }}
          title="New Chat Session (Ctrl+K / /new)"
        >
          <Plus size={13} style={{ color: theme.accent }} />
          <span className="hidden sm:inline text-[11px] font-semibold">NEW</span>
        </button>

        {/* Sessions Drawer Button */}
        <button
          type="button"
          onClick={onToggleDrawer}
          className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:bg-white/10 active:scale-95 border"
          style={{
            borderColor: theme.border,
            color: theme.text,
          }}
          title="View Sessions History"
        >
          <History size={13} style={{ color: theme.accent }} />
          <span className="hidden sm:inline text-[11px]">SESSIONS</span>
        </button>

        {/* CRT Scanline Toggle */}
        <button
          type="button"
          onClick={onToggleScanlines}
          className={`p-1 sm:px-2 sm:py-1 rounded transition-all border ${
            settings.scanlines ? 'bg-white/15' : 'hover:bg-white/10'
          }`}
          style={{
            borderColor: theme.border,
            color: settings.scanlines ? theme.accent : theme.textMuted,
          }}
          title={`Toggle CRT Scanlines (${settings.scanlines ? 'ON' : 'OFF'})`}
        >
          <Tv size={13} />
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          className={`p-1 sm:px-2 sm:py-1 rounded transition-all border ${
            settings.soundEnabled ? 'bg-white/15' : 'hover:bg-white/10'
          }`}
          style={{
            borderColor: theme.border,
            color: settings.soundEnabled ? theme.accent : theme.textMuted,
          }}
          title={`Toggle Mechanical Sound (${settings.soundEnabled ? 'ON' : 'OFF'})`}
        >
          {settings.soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1 sm:px-2 sm:py-1 rounded transition-all hover:bg-white/10 border"
          style={{
            borderColor: theme.border,
            color: theme.textMuted,
          }}
          title="Model & Terminal Settings"
        >
          <Sliders size={13} />
        </button>

        {/* Help Button */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="p-1 sm:px-2 sm:py-1 rounded transition-all hover:bg-white/10 border"
          style={{
            borderColor: theme.border,
            color: theme.textMuted,
          }}
          title="Terminal Manual / Help (?)"
        >
          <HelpCircle size={13} />
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="hidden sm:flex p-1 sm:px-2 sm:py-1 rounded transition-all hover:bg-white/10 border"
          style={{
            borderColor: theme.border,
            color: theme.textMuted,
          }}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>
    </header>
  );
};

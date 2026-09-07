import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatMessage,
  ChatSession,
  ImageAttachment,
  TerminalSettings,
  TerminalThemeId,
} from './types';
import { THEMES } from './utils/themes';
import { TerminalHeader } from './components/TerminalHeader';
import { TerminalOutput } from './components/TerminalOutput';
import { TerminalPrompt } from './components/TerminalPrompt';
import { SessionDrawer } from './components/SessionDrawer';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { playCommandSound, playDoneSound } from './utils/audio';

const STORAGE_KEY_SESSIONS = 'gemini_terminal_sessions_v1';
const STORAGE_KEY_SETTINGS = 'gemini_terminal_settings_v1';
const STORAGE_KEY_HISTORY = 'gemini_terminal_history_v1';

const DEFAULT_SETTINGS: TerminalSettings = {
  theme: 'gemini-dark',
  scanlines: false,
  soundEnabled: true,
  fontSize: 'sm',
  autoScroll: true,
  systemInstruction: 'You are Gemini, Google\'s state-of-the-art AI, running inside a command-line terminal environment. Respond directly, thoughtfully, and format code snippets in clean markdown code blocks with language identifiers.',
  model: 'gemini-3.8-flash',
  temperature: 0.7,
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export default function App() {
  // Settings State
  const [settings, setSettings] = useState<TerminalSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fall through to default
    }
    const initialSession: ChatSession = {
      id: generateId(),
      title: 'New Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: DEFAULT_SETTINGS.model,
      temperature: DEFAULT_SETTINGS.temperature,
    };
    return [initialSession];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions[0]?.id || generateId();
  });

  // UI States
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Command Recall History
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Active theme
  const currentTheme = THEMES[settings.theme] || THEMES['gemini-dark'];

  // Current session
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }, [settings]);

  // Persist sessions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions:', e);
    }
  }, [sessions]);

  // Persist command history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(commandHistory.slice(-50)));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [commandHistory]);

  // Health check on backend
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setIsConnected(data.status === 'ok');
      })
      .catch(() => {
        setIsConnected(false);
      });
  }, []);

  // Update session messages helper
  const updateCurrentSessionMessages = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id === currentSessionId) {
          const newMessages = updater(session.messages);
          return {
            ...session,
            messages: newMessages,
            updatedAt: Date.now(),
          };
        }
        return session;
      })
    );
  }, [currentSessionId]);

  // Create a new session
  const handleNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: settings.model,
      temperature: settings.temperature,
      systemInstruction: settings.systemInstruction,
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setInput('');
    setAttachments([]);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, [settings]);

  // Delete a session
  const handleDeleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh: ChatSession = {
          id: generateId(),
          title: 'New Session',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          model: settings.model,
          temperature: settings.temperature,
        };
        setCurrentSessionId(fresh.id);
        return [fresh];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(remaining[0].id);
      }
      return remaining;
    });
  }, [currentSessionId, settings]);

  // Rename session
  const handleRenameSession = useCallback((id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  }, []);

  // Export session transcript
  const handleExportSession = useCallback((session: ChatSession, format: 'md' | 'txt' | 'json' = 'md') => {
    let content = '';
    const dateStr = new Date(session.createdAt).toISOString();

    if (format === 'json') {
      content = JSON.stringify(session, null, 2);
    } else {
      content += `# ${session.title}\n`;
      content += `Date: ${dateStr}\n`;
      content += `Model: ${session.model}\n\n`;
      content += `----------------------------------------\n\n`;

      for (const m of session.messages) {
        const roleName = m.role === 'user' ? 'USER' : 'GEMINI';
        const time = new Date(m.timestamp).toLocaleTimeString();
        content += `[${time}] ${roleName}:\n${m.content}\n\n`;
      }
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-transcript-${session.id}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Add system message
  const addSystemNotice = useCallback((text: string) => {
    const notice: ChatMessage = {
      id: generateId(),
      role: 'system',
      content: text,
      timestamp: Date.now(),
    };
    updateCurrentSessionMessages((prev) => [...prev, notice]);
  }, [updateCurrentSessionMessages]);

  // Abort active streaming
  const handleAbort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    updateCurrentSessionMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
    addSystemNotice('Execution terminated by user interrupt (SIGINT / Ctrl+C).');
  }, [updateCurrentSessionMessages, addSystemNotice]);

  // Execute terminal CLI commands or send to Gemini
  const handleExecute = useCallback(async (customInput?: string) => {
    const text = (customInput !== undefined ? customInput : input).trim();
    const currentAttachments = [...attachments];

    if (!text && currentAttachments.length === 0) return;

    playCommandSound(settings.soundEnabled);

    // Record into command history
    if (text) {
      setCommandHistory((prev) => [...prev.filter((c) => c !== text), text]);
    }

    // Check if it's a CLI command
    const parts = text.split(' ');
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1).join(' ').trim();

    // 1. HELP command
    if (cmd === 'help' || cmd === '?' || cmd === '/help') {
      setIsHelpOpen(true);
      setInput('');
      return;
    }

    // 2. CLEAR command
    if (cmd === 'clear' || cmd === 'cls' || cmd === '/clear') {
      updateCurrentSessionMessages(() => []);
      setInput('');
      return;
    }

    // 3. NEW session command
    if (cmd === 'new' || cmd === 'reset' || cmd === '/new') {
      handleNewSession();
      return;
    }

    // 4. SESSIONS / HISTORY command
    if (cmd === 'sessions' || cmd === 'history' || cmd === '/sessions') {
      setIsDrawerOpen(true);
      setInput('');
      return;
    }

    // 5. THEME command
    if (cmd === 'theme' || cmd === '/theme') {
      const validThemes: TerminalThemeId[] = ['gemini-dark', 'matrix', 'amber-crt', 'cyberpunk', 'monokai', 'sol'];
      if (args && validThemes.includes(args as TerminalThemeId)) {
        setSettings((prev) => ({ ...prev, theme: args as TerminalThemeId }));
        addSystemNotice(`Terminal theme switched to '${args}'.`);
      } else {
        // Cycle theme
        const currentIndex = validThemes.indexOf(settings.theme);
        const nextTheme = validThemes[(currentIndex + 1) % validThemes.length];
        setSettings((prev) => ({ ...prev, theme: nextTheme }));
        addSystemNotice(`Terminal theme toggled to '${nextTheme}' (${THEMES[nextTheme].name}).`);
      }
      setInput('');
      return;
    }

    // 6. MODEL command
    if (cmd === 'model' || cmd === '/model') {
      if (args === 'gemini-3.8-flash' || args === 'gemini-3.1-flash-lite') {
        setSettings((prev) => ({ ...prev, model: args }));
        addSystemNotice(`Active model configured to '${args}'.`);
      } else if (args) {
        addSystemNotice(`Unknown model '${args}'. Supported: gemini-3.8-flash, gemini-3.1-flash-lite`);
      } else {
        addSystemNotice(`Current active model: ${settings.model}\nTo change, run: model gemini-3.1-flash-lite`);
      }
      setInput('');
      return;
    }

    // 7. SYSTEM prompt command
    if (cmd === 'system' || cmd === '/system') {
      if (args) {
        setSettings((prev) => ({ ...prev, systemInstruction: args }));
        addSystemNotice(`System instruction updated: "${args}"`);
      } else {
        addSystemNotice(`Current System Instruction:\n${settings.systemInstruction || '(None)'}`);
      }
      setInput('');
      return;
    }

    // 8. TEMP (temperature) command
    if (cmd === 'temp' || cmd === '/temp') {
      const num = parseFloat(args);
      if (!isNaN(num) && num >= 0 && num <= 2) {
        setSettings((prev) => ({ ...prev, temperature: num }));
        addSystemNotice(`Temperature set to ${num.toFixed(2)}`);
      } else {
        addSystemNotice(`Current temperature: ${settings.temperature}. Provide a value between 0.0 and 2.0 (e.g. temp 0.2)`);
      }
      setInput('');
      return;
    }

    // 9. SCANLINES toggle
    if (cmd === 'scanlines' || cmd === '/scanlines') {
      setSettings((prev) => {
        const next = !prev.scanlines;
        addSystemNotice(`CRT scanlines ${next ? 'ENABLED' : 'DISABLED'}.`);
        return { ...prev, scanlines: next };
      });
      setInput('');
      return;
    }

    // 10. SOUND toggle
    if (cmd === 'sound' || cmd === '/sound') {
      setSettings((prev) => {
        const next = !prev.soundEnabled;
        addSystemNotice(`Mechanical typing audio ${next ? 'ENABLED' : 'DISABLED'}.`);
        return { ...prev, soundEnabled: next };
      });
      setInput('');
      return;
    }

    // 11. EXPORT command
    if (cmd === 'export' || cmd === '/export') {
      const fmt = args.toLowerCase() === 'json' ? 'json' : args.toLowerCase() === 'txt' ? 'txt' : 'md';
      handleExportSession(currentSession, fmt);
      addSystemNotice(`Exported session '${currentSession.title}' as .${fmt}`);
      setInput('');
      return;
    }

    // 12. INFO command
    if (cmd === 'info' || cmd === '/info') {
      const msgCount = currentSession.messages.length;
      addSystemNotice(
        `--- TERMINAL SYSTEM SPECIFICATIONS ---\n` +
        `Client: Google Gemini CLI v3.8\n` +
        `Active Model: ${settings.model}\n` +
        `Temperature: ${settings.temperature}\n` +
        `Theme: ${currentTheme.name} (${settings.theme})\n` +
        `CRT Scanlines: ${settings.scanlines ? 'ON' : 'OFF'}\n` +
        `Sound FX: ${settings.soundEnabled ? 'ON' : 'OFF'}\n` +
        `Current Session: ${currentSession.title} (${currentSession.id})\n` +
        `Session Messages: ${msgCount}\n` +
        `Status: ${isConnected ? 'ONLINE (Cloud Run)' : 'OFFLINE'}`
      );
      setInput('');
      return;
    }

    // 13. ATTACH command
    if (cmd === 'attach' || cmd === '/attach') {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fileInput?.click();
      setInput('');
      return;
    }

    // Standard Gemini Chat Query
    setInput('');
    setAttachments([]);

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      images: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    const modelMessageId = generateId();
    const initialModelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      modelUsed: settings.model,
    };

    // Auto-update session title if it's the first prompt
    if (currentSession.messages.length === 0 && text) {
      const cleanTitle = text.slice(0, 32).trim() + (text.length > 32 ? '...' : '');
      setSessions((prev) =>
        prev.map((s) => (s.id === currentSessionId ? { ...s, title: cleanTitle } : s))
      );
    }

    // Append user message + initial model streaming message
    updateCurrentSessionMessages((prev) => [...prev, userMessage, initialModelMessage]);

    // Prepare payload for backend
    const allMessages = [...currentSession.messages, userMessage];
    const payloadMessages = allMessages.map((m) => ({
      role: m.role,
      content: m.content,
      images: m.images?.map((img) => ({
        mimeType: img.mimeType,
        data: img.data,
      })),
    }));

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: payloadMessages,
          model: settings.model,
          systemInstruction: settings.systemInstruction,
          temperature: settings.temperature,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable response stream.');

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const eventBlock of lines) {
          if (!eventBlock.trim()) continue;

          let eventType = 'chunk';
          let eventData = '';

          const eventLines = eventBlock.split('\n');
          for (const line of eventLines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6).trim();
            }
          }

          if (eventType === 'chunk' && eventData) {
            try {
              const parsed = JSON.parse(eventData);
              if (parsed.text) {
                accumulatedText += parsed.text;
                updateCurrentSessionMessages((prev) =>
                  prev.map((m) =>
                    m.id === modelMessageId
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );
              }
            } catch (e) {
              // Ignore parse error on partial chunks
            }
          } else if (eventType === 'error') {
            try {
              const parsed = JSON.parse(eventData);
              throw new Error(parsed.error || 'Stream error from Gemini');
            } catch (e: any) {
              throw new Error(e.message || 'Stream error from Gemini');
            }
          }
        }
      }

      // Completed
      updateCurrentSessionMessages((prev) =>
        prev.map((m) =>
          m.id === modelMessageId ? { ...m, isStreaming: false } : m
        )
      );
      playDoneSound(settings.soundEnabled);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User aborted, handled in handleAbort
        return;
      }
      console.error('Gemini request failed:', err);
      updateCurrentSessionMessages((prev) =>
        prev.map((m) =>
          m.id === modelMessageId
            ? {
                ...m,
                isStreaming: false,
                error: err.message || 'An error occurred while contacting the Gemini API.',
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [
    input,
    attachments,
    settings,
    currentSession,
    currentSessionId,
    currentTheme.name,
    isConnected,
    updateCurrentSessionMessages,
    handleNewSession,
    handleExportSession,
    addSystemNotice,
  ]);

  // Retry previous model response
  const handleRetry = useCallback((messageId: string) => {
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex <= 0) return;

    // Find the prior user message
    let priorUserMessage: ChatMessage | null = null;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        priorUserMessage = messages[i];
        break;
      }
    }

    if (!priorUserMessage) return;

    // Remove current model message and subsequent messages
    updateCurrentSessionMessages((prev) => prev.slice(0, msgIndex));

    // Re-run execution
    handleExecute(priorUserMessage.content);
  }, [messages, updateCurrentSessionMessages, handleExecute]);

  // Toggle Fullscreen
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      terminalRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K -> New Chat
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewSession();
      }
      // Ctrl+L -> Clear Screen
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        updateCurrentSessionMessages(() => []);
      }
      // Ctrl+B -> Toggle Drawer
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsDrawerOpen((prev) => !prev);
      }
      // Escape closes modals
      if (e.key === 'Escape') {
        setIsHelpOpen(false);
        setIsSettingsOpen(false);
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewSession, updateCurrentSessionMessages]);

  // Drag & drop file attachment support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type.startsWith('image/') || file.size < 5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1] || '';
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: file.type || 'image/jpeg',
              data: base64,
              previewUrl: result,
              sizeBytes: file.size,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div
      ref={terminalRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`h-screen w-screen flex flex-col overflow-hidden relative ${
        settings.scanlines ? 'crt-overlay crt-flicker' : ''
      }`}
      style={{
        backgroundColor: currentTheme.bg,
        color: currentTheme.text,
      }}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm border-4 border-dashed m-4 rounded-xl pointer-events-none"
          style={{ borderColor: currentTheme.accent }}
        >
          <div className="font-mono text-center p-6" style={{ color: currentTheme.promptUser }}>
            <div className="text-2xl font-bold mb-2">✦ ATTACH TO GEMINI CLI</div>
            <div className="text-sm opacity-80">Drop images or documents here to pass directly to Gemini.</div>
          </div>
        </div>
      )}

      {/* Terminal Window Header Bar */}
      <TerminalHeader
        theme={currentTheme}
        settings={settings}
        sessionTitle={currentSession?.title || 'untitled'}
        activeModel={settings.model}
        isConnected={isConnected}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onNewSession={handleNewSession}
        onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
        onToggleScanlines={() => setSettings((s) => ({ ...s, scanlines: !s.scanlines }))}
      />

      {/* Scrolling Command Lines & Response Stream */}
      <TerminalOutput
        messages={messages}
        theme={currentTheme}
        activeModel={settings.model}
        isStreaming={isStreaming}
        onRetry={handleRetry}
        onSuggestionClick={(suggestion) => handleExecute(suggestion)}
      />

      {/* Interactive Command Prompt Line */}
      <TerminalPrompt
        input={input}
        setInput={setInput}
        onSubmit={() => handleExecute()}
        onAbort={handleAbort}
        isStreaming={isStreaming}
        theme={currentTheme}
        soundEnabled={settings.soundEnabled}
        attachments={attachments}
        onAddAttachment={(att) => setAttachments((prev) => [...prev, att])}
        onRemoveAttachment={(idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
        commandHistory={commandHistory}
      />

      {/* Sessions History Drawer */}
      <SessionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onExportSession={(s) => handleExportSession(s)}
        theme={currentTheme}
      />

      {/* Manual / Command Help Modal */}
      <CommandPaletteModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onExecuteCommand={(cmd) => handleExecute(cmd)}
        theme={currentTheme}
      />

      {/* Model & Appearance Settings Modal */}
      <ModelSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
        theme={currentTheme}
      />
    </div>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import {
  Copy,
  Check,
  RotateCw,
  Volume2,
  VolumeX,
  ArrowDown,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage, TerminalTheme } from '../types';
import { TerminalCodeBlock } from './TerminalCodeBlock';

interface TerminalOutputProps {
  messages: ChatMessage[];
  theme: TerminalTheme;
  activeModel: string;
  isStreaming: boolean;
  onRetry: (messageId: string) => void;
  onSuggestionClick: (prompt: string) => void;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  messages,
  theme,
  activeModel,
  isStreaming,
  onRetry,
  onSuggestionClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // Auto-scroll handler
  useEffect(() => {
    if (!isUserScrolledUp && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isStreaming, isUserScrolledUp]);

  // Track scroll position
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isUp = distanceToBottom > 80;
    setIsUserScrolledUp(isUp);
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsUserScrolledUp(false);
      setShowScrollBottom(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const suggestions = [
    'Explain how transformer neural networks work with ASCII diagram',
    'Write a production-ready LRU cache in TypeScript with tests',
    'Debug: Why does setTimeout(fn, 0) execute after microtasks in JS?',
    'Create an ASCII art dashboard mockup for a server monitoring CLI',
  ];

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 font-mono text-xs sm:text-sm leading-relaxed relative select-text"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
      }}
    >
      {/* ASCII Logo and Terminal Greeting */}
      <div className="mb-6 select-none opacity-90">
        <pre
          className="text-[9px] sm:text-xs leading-none font-bold overflow-x-auto pb-1"
          style={{ color: theme.accent }}
        >
{`  ____ _____ __  __ ___ _   _ ___   ____ _     ___ 
 / ___| ____|  \\/  |_ _| \\ | |_ _| / ___| |   |_ _|
| |  _|  _| | |\\/| || ||  \\| || | | |   | |    | | 
| |_| | |___| |  | || || |\\  || | | |___| |___ | | 
 \\____|_____|_|  |_|___|_| \\_|___| \\____|_____|___|`}
        </pre>
        <div className="mt-2 text-[11px] sm:text-xs opacity-75 border-l-2 pl-3" style={{ borderColor: theme.accent }}>
          <div>Google Gemini AI Terminal Shell [v3.8-cli-preview]</div>
          <div>All prompts & responses stream directly to this command interface.</div>
          <div className="mt-1">
            Type <span className="font-bold underline" style={{ color: theme.promptUser }}>help</span> or{' '}
            <span className="font-bold underline" style={{ color: theme.promptUser }}>?</span> for available CLI commands. Active model:{' '}
            <span className="font-semibold" style={{ color: theme.accent }}>{activeModel}</span>
          </div>
        </div>

        {/* Suggestion Chips */}
        {messages.length === 0 && (
          <div className="mt-5">
            <div className="text-[11px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: theme.textMuted }}>
              <Sparkles size={13} style={{ color: theme.accent }} />
              <span>RECOMMENDED STARTER COMMANDS:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSuggestionClick(s)}
                  className="text-left px-3 py-2 rounded border transition-all hover:bg-white/5 active:scale-[0.99] group text-xs flex items-start gap-2"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    color: theme.text,
                  }}
                >
                  <span className="font-bold select-none text-[11px]" style={{ color: theme.promptUser }}>
                    &gt;
                  </span>
                  <span className="group-hover:translate-x-0.5 transition-transform">{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages Output Stream */}
      <div className="space-y-5">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="py-1.5 px-3 rounded border font-mono text-xs"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderColor: theme.border,
                  color: theme.textMuted,
                }}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1" style={{ color: theme.accent }}>
                  <span>[SYSTEM NOTICE]</span>
                  <span className="text-[10px] opacity-60">@{formatTime(msg.timestamp)}</span>
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`group transition-all rounded p-2.5 sm:p-3.5 border ${
                isUser ? 'border-dashed' : ''
              }`}
              style={{
                backgroundColor: isUser ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.25)',
                borderColor: isUser ? theme.border : 'transparent',
              }}
            >
              {/* Header / Prompt Prefix */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b text-[11px] select-none" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold tracking-tight"
                    style={{ color: isUser ? theme.promptUser : theme.promptGemini }}
                  >
                    {isUser ? 'user@gemini:~$' : `${msg.modelUsed || activeModel}:~$`}
                  </span>
                  <span className="opacity-40 text-[10px]">[{formatTime(msg.timestamp)}]</span>
                  {msg.isStreaming && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-semibold animate-pulse">
                      STREAMING...
                    </span>
                  )}
                </div>

                {/* Response Action Buttons */}
                {!isUser && !msg.isStreaming && msg.content && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 text-[10px] transition-colors"
                      style={{ color: copiedId === msg.id ? '#4ade80' : theme.textMuted }}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                      <span className="hidden sm:inline">{copiedId === msg.id ? 'COPIED' : 'COPY'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSpeak(msg.content, msg.id)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 text-[10px] transition-colors"
                      style={{ color: speakingId === msg.id ? theme.accent : theme.textMuted }}
                      title={speakingId === msg.id ? 'Stop reading' : 'Read aloud (TTS)'}
                    >
                      {speakingId === msg.id ? <VolumeX size={11} /> : <Volume2 size={11} />}
                      <span className="hidden sm:inline">{speakingId === msg.id ? 'STOP' : 'READ'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRetry(msg.id)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 text-[10px] transition-colors"
                      style={{ color: theme.textMuted }}
                      title="Regenerate this response"
                    >
                      <RotateCw size={11} />
                      <span className="hidden sm:inline">RETRY</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Attachments if any */}
              {msg.images && msg.images.length > 0 && (
                <div className="flex flex-wrap gap-2 my-2">
                  {msg.images.map((img, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-1.5 rounded border text-xs"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: theme.border,
                      }}
                    >
                      {img.previewUrl && (
                        <img
                          src={img.previewUrl}
                          alt={img.name}
                          className="w-10 h-10 object-cover rounded border border-white/10"
                        />
                      )}
                      <div className="text-[11px] truncate max-w-[180px]">
                        <div className="font-semibold truncate">{img.name}</div>
                        <div className="text-[10px] opacity-60">
                          {Math.round(img.sizeBytes / 1024)} KB ({img.mimeType})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              {isUser ? (
                <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed" style={{ color: theme.text }}>
                  {msg.content}
                </div>
              ) : (
                <div className="terminal-markdown">
                  {msg.error ? (
                    <div className="flex items-start gap-2 p-3 rounded bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                      <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                      <div>
                        <div className="font-bold mb-1">COMMAND EXECUTION ERROR</div>
                        <div className="font-mono">{msg.error}</div>
                        <div className="mt-2 text-[11px] opacity-80">
                          Tip: Check if your GEMINI_API_KEY is configured in Settings &gt; Secrets, or type{' '}
                          <code className="bg-black/40 px-1 py-0.5 rounded">/model gemini-3.8-flash</code>.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="markdown-body">
                      <Markdown
                        components={{
                          code({ className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeString = String(children).replace(/\n$/, '');
                            const isBlock = match || codeString.includes('\n');
                            if (isBlock) {
                              return (
                                <TerminalCodeBlock
                                  language={match ? match[1] : 'shell'}
                                  code={codeString}
                                  theme={theme}
                                />
                              );
                            }
                            return (
                              <code
                                className="px-1.5 py-0.5 rounded font-mono text-[11px] border"
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                  borderColor: theme.border,
                                  color: theme.accent,
                                }}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </Markdown>
                    </div>
                  )}

                  {/* Blinking cursor while response is streaming */}
                  {msg.isStreaming && (
                    <span
                      className="terminal-cursor ml-1"
                      style={{ backgroundColor: theme.cursorColor }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Jump to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="fixed bottom-20 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-lg font-mono text-xs font-semibold backdrop-blur-md transition-all hover:scale-105 active:scale-95 animate-bounce"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.accent,
            color: theme.accent,
          }}
        >
          <ArrowDown size={14} />
          <span>JUMP TO BOTTOM</span>
        </button>
      )}
    </div>
  );
};

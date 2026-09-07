import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { TerminalTheme } from '../types';

interface TerminalCodeBlockProps {
  language?: string;
  code: string;
  theme: TerminalTheme;
}

export const TerminalCodeBlock: React.FC<TerminalCodeBlockProps> = ({
  language = 'text',
  code,
  theme,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div
      className="my-3 rounded border overflow-hidden text-xs md:text-sm shadow-sm"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        borderColor: theme.border,
      }}
    >
      {/* Code Header Bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b select-none text-xs font-mono"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderColor: theme.border,
          color: theme.textMuted,
        }}
      >
        <div className="flex items-center gap-2">
          <Terminal size={13} style={{ color: theme.accent }} />
          <span className="font-semibold uppercase tracking-wider text-[11px]" style={{ color: theme.accent }}>
            {language}
          </span>
          <span className="text-[10px] opacity-60">
            ({lines.length} {lines.length === 1 ? 'line' : 'lines'})
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition-colors hover:bg-white/10 active:scale-95"
          style={{ color: copied ? '#4ade80' : theme.textMuted }}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={12} />
              <span>COPIED</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-3 overflow-x-auto font-mono leading-relaxed">
        <table className="border-collapse w-full">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td
                  className="pr-3 text-right select-none text-[11px] w-8 align-top opacity-35"
                  style={{ color: theme.textMuted }}
                >
                  {idx + 1}
                </td>
                <td className="whitespace-pre break-all pl-2 font-mono" style={{ color: theme.text }}>
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

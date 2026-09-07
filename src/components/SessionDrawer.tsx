import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  MessageSquare,
  FileDown,
} from 'lucide-react';
import { ChatSession, TerminalTheme } from '../types';

interface SessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onExportSession: (session: ChatSession) => void;
  theme: TerminalTheme;
}

export const SessionDrawer: React.FC<SessionDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onExportSession,
  theme,
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const startEditing = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveEditing = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Pane */}
      <div
        className="relative w-full max-w-sm sm:max-w-md h-full flex flex-col font-mono text-xs shadow-2xl border-r z-10 transition-transform"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-sm" style={{ color: theme.promptUser }}>
              SESSION_MANAGER
            </span>
            <span className="text-[10px] opacity-60">[{sessions.length} total]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-3 border-b space-y-2.5" style={{ borderColor: theme.border }}>
          <button
            type="button"
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded font-semibold transition-all border hover:scale-[1.01] active:scale-95"
            style={{
              backgroundColor: theme.accent,
              borderColor: theme.border,
              color: '#0a0d14',
            }}
          >
            <Plus size={14} />
            <span>+ NEW GEMINI SESSION</span>
          </button>

          {/* Search bar */}
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded border"
            style={{
              backgroundColor: 'rgba(0,0,0,0.25)',
              borderColor: theme.border,
            }}
          >
            <Search size={13} style={{ color: theme.textMuted }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chat history..."
              className="bg-transparent w-full outline-none text-xs placeholder:opacity-40"
              style={{ color: theme.text }}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="opacity-60 hover:opacity-100">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-10 opacity-50 font-mono text-xs">
              No sessions found matching query.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isCurrent = session.id === currentSessionId;
              const isEditingThis = editingId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className={`group p-2.5 rounded border transition-all cursor-pointer ${
                    isCurrent ? 'ring-1' : 'hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.15)',
                    borderColor: isCurrent ? theme.accent : theme.border,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <MessageSquare
                        size={14}
                        className="shrink-0 mt-0.5"
                        style={{ color: isCurrent ? theme.accent : theme.textMuted }}
                      />

                      {isEditingThis ? (
                        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 px-1.5 py-0.5 rounded text-xs outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditing(session.id, e);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => saveEditing(session.id, e)}
                            className="p-1 hover:bg-white/20 rounded text-emerald-400"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-xs" style={{ color: theme.text }}>
                            {session.title}
                          </div>
                          <div className="text-[10px] mt-0.5 flex items-center gap-2 opacity-50">
                            <span>{formatDate(session.updatedAt)}</span>
                            <span>•</span>
                            <span>{session.messages.length} lines</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {!isEditingThis && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => startEditing(session, e)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Rename session"
                          style={{ color: theme.textMuted }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExportSession(session);
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Export transcript"
                          style={{ color: theme.textMuted }}
                        >
                          <FileDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                          title="Delete session"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t text-[11px] opacity-60 text-center" style={{ borderColor: theme.border }}>
          <span>Commands: <code>/new</code>, <code>/rename</code>, <code>/export</code></span>
        </div>
      </div>
    </div>
  );
};

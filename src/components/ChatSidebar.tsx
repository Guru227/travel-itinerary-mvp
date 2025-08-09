import React, { useState } from 'react';
import { Plus, Edit3, Check, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { ChatSession } from '../types';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  isCollapsed,
  onToggleCollapse
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const saveEdit = () => {
    if (editingSessionId && editTitle.trim()) {
      onRenameSession(editingSessionId, editTitle.trim());
    }
    setEditingSessionId(null);
    setEditTitle('');
  };

  const cancelEdit = () => {
    setEditingSessionId(null);
    setEditTitle('');
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col">
        <button
          onClick={onToggleCollapse}
          className="p-3 hover:bg-gray-100 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5 text-secondary" />
        </button>
        <button
          onClick={onNewSession}
          className="p-3 hover:bg-gray-100 transition-colors"
          title="New chat"
        >
          <Plus className="w-5 h-5 text-secondary" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-poppins font-bold text-lg text-secondary">
            Chat History
          </h2>
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-secondary" />
          </button>
        </div>
        <button
          onClick={onNewSession}
          className="w-full flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-lato font-semibold">New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group p-3 rounded-lg border transition-colors cursor-pointer ${
                session.id === currentSessionId
                  ? 'bg-primary/10 border-primary/20'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              }`}
              onClick={() => onSessionSelect(session.id)}
            >
              <div className="flex items-center justify-between">
                {editingSessionId === session.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveEdit();
                      }}
                      className="p-1 hover:bg-green-100 rounded"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEdit();
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-lato font-semibold text-secondary truncate">
                        {session.title}
                      </h3>
                      {session.summary && (
                        <p className="text-xs text-gray-500 font-lato mt-1 line-clamp-2">
                          {session.summary}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 font-lato mt-1">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(session);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Rename chat"
                      >
                        <Edit3 className="w-3 h-3 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
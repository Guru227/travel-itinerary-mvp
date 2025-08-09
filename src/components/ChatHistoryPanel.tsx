import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Calendar, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ChatSession } from '../types';
import ConfirmModal from './ConfirmModal';

interface ChatHistoryPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  userId: string;
}

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  isCollapsed,
  onToggleCollapse,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  userId
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // FIXED: Only load sessions when userId changes, not on every render
  useEffect(() => {
    if (userId) {
      loadSessions();
    }
  }, [userId]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ADDED: Delete session functionality with cascading delete
  const handleDeleteSession = async (sessionId: string) => {
    setIsDeleting(true);
    try {
      // Call the delete_chat_session edge function for cascading delete
      const { error } = await supabase.functions.invoke('delete-chat-session', {
        body: { sessionId }
      });

      if (error) throw error;

      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If we deleted the current session, create a new one
      if (sessionId === currentSessionId) {
        onNewSession();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete travel plan. Please try again.');
    } finally {
      setIsDeleting(false);
      setSessionToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-80'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="font-poppins font-bold text-lg text-secondary">
              Travel Plans
            </h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* New Session Button */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={onNewSession}
              className="w-full flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-poppins font-semibold px-4 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Travel Plan
            </button>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {isCollapsed ? (
            <div className="p-2">
              <button
                onClick={onNewSession}
                className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="New Travel Plan"
              >
                <Plus className="w-4 h-4 text-gray-500 mx-auto" />
              </button>
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="font-lato text-sm text-gray-500">Loading plans...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="font-lato text-sm text-gray-500">No travel plans yet</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group relative rounded-lg transition-colors cursor-pointer ${
                        // ADDED: Visual highlighting for active session
                        session.id === currentSessionId
                          ? 'bg-primary/10 border border-primary/20 shadow-sm'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => onSessionSelect(session.id)}
                    >
                      <div className="p-3">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-lato text-sm truncate ${
                              // ADDED: Bolder text for active session
                              session.id === currentSessionId
                                ? 'font-bold text-primary'
                                : 'font-semibold text-secondary'
                            }`}>
                              {session.title || 'Untitled Plan'}
                            </h3>
                            {session.summary && (
                              <p className="font-lato text-xs text-gray-500 mt-1 line-clamp-2">
                                {session.summary}
                              </p>
                            )}
                            <p className="font-lato text-xs text-gray-400 mt-1">
                              {formatDate(session.updated_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* ADDED: Delete button - only visible on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(session.id);
                        }}
                        disabled={isDeleting}
                        className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all disabled:opacity-50"
                        title="Delete travel plan"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ADDED: Delete Confirmation Modal */}
      {sessionToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Travel Plan"
          message="Are you sure you want to delete this travel plan? This action cannot be undone and will remove all associated messages and itineraries."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={() => handleDeleteSession(sessionToDelete)}
          onCancel={() => setSessionToDelete(null)}
        />
      )}
    </>
  );
};

export default ChatHistoryPanel;
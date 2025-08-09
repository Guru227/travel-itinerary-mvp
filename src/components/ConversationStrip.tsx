import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Bot } from 'lucide-react';

interface ConversationStripProps {
  latestAiMessage: string;
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const ConversationStrip: React.FC<ConversationStripProps> = ({
  latestAiMessage,
  onSendMessage,
  isLoading,
  placeholder = "Tell me what you'd like to add or change...",
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 80; // Maximum height before scrolling
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || disabled) return;

    const message = inputValue.trim();
    setInputValue('');
    
    try {
      await onSendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message if sending failed
      setInputValue(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* AI Message Display */}
      {latestAiMessage && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-start gap-3 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
              <img 
                src="/images/nomad.png" 
                alt="Nomad's Compass Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="font-lato text-secondary leading-relaxed">
                  {latestAiMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Input Area */}
      <div className="px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-lato resize-none min-h-[48px] max-h-[80px] overflow-y-auto"
            disabled={isLoading || disabled}
            rows={1}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || disabled}
            className="bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center gap-2 font-poppins font-semibold"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Thinking...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 font-lato mt-2 text-center max-w-4xl mx-auto">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ConversationStrip;
import React from 'react';

interface ConversationStripProps {
  latestAiMessage: string;
}

// FIXED: Removed redundant input box - this component now only displays AI messages
const ConversationStrip: React.FC<ConversationStripProps> = ({
  latestAiMessage
}) => {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* AI Message Display - Only responsibility is showing the latest AI response */}
      {latestAiMessage && (
        <div className="px-6 py-4">
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
    </div>
  );
};

export default ConversationStrip;
import React from 'react';
import { Message } from '../types';

interface MessageProps {
  message: Message;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20">
          <img 
            src="/images/nomad.png" 
            alt="Nomad's Compass Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className={`max-w-3xl ${isUser ? 'ml-auto' : ''}`}>
        <div
          className={`p-4 rounded-xl ${
            isUser
              ? 'bg-primary text-white rounded-tr-none'
              : 'bg-beige text-secondary rounded-tl-none'
          }`}
        >
          <p className="font-lato leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <p className={`text-xs text-gray-500 font-lato mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default MessageComponent;
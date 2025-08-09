import React from 'react';
import { ContextualBubble } from '../types';

interface ContextualBubblesProps {
  bubbles: ContextualBubble[];
}

const ContextualBubbles: React.FC<ContextualBubblesProps> = ({ bubbles }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`absolute bg-primary text-white px-4 py-2 rounded-lg shadow-lg max-w-xs font-lato text-sm transition-all duration-500 transform ${
            bubble.visible 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-2 scale-95'
          }`}
          style={{
            left: Math.min(bubble.position.x, window.innerWidth - 300),
            top: Math.max(bubble.position.y, 10),
          }}
        >
          {/* Speech bubble arrow */}
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-primary"></div>
          
          <p className="leading-relaxed">{bubble.text}</p>
          
          {/* Animated dots to show AI is "thinking" */}
          <div className="flex items-center gap-1 mt-2">
            <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContextualBubbles;
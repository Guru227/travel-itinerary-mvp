import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { getActivePersona } from '../data/personas';

interface MessageProps {
  message: Message;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const activePersona = getActivePersona();

  // Custom components for markdown rendering
  const markdownComponents = {
    // Headers
    h1: ({ children }: any) => (
      <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h3>
    ),
    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="ml-2">{children}</li>
    ),
    // Paragraphs
    p: ({ children }: any) => (
      <p className="mb-3 last:mb-0">{children}</p>
    ),
    // Code
    code: ({ inline, children }: any) => 
      inline ? (
        <code className={`px-1 py-0.5 rounded text-sm font-mono ${
          isUser ? 'bg-white/20' : 'bg-gray-200'
        }`}>
          {children}
        </code>
      ) : (
        <code className={`block p-3 rounded-lg text-sm font-mono mb-3 ${
          isUser ? 'bg-white/20' : 'bg-gray-200'
        }`}>
          {children}
        </code>
      ),
    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className={`border-l-4 pl-4 mb-3 italic ${
        isUser ? 'border-white/40' : 'border-gray-400'
      }`}>
        {children}
      </blockquote>
    ),
    // Links
    a: ({ href, children }: any) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className={`underline hover:no-underline ${
          isUser ? 'text-white hover:text-white/80' : 'text-primary hover:text-primary/80'
        }`}
      >
        {children}
      </a>
    ),
    // Strong/Bold
    strong: ({ children }: any) => (
      <strong className="font-bold">{children}</strong>
    ),
    // Emphasis/Italic
    em: ({ children }: any) => (
      <em className="italic">{children}</em>
    ),
    // Horizontal rule
    hr: () => (
      <hr className={`my-4 border-t ${
        isUser ? 'border-white/30' : 'border-gray-300'
      }`} />
    ),
    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-3">
        <table className={`min-w-full border-collapse border ${
          isUser ? 'border-white/30' : 'border-gray-300'
        }`}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className={isUser ? 'bg-white/10' : 'bg-gray-100'}>
        {children}
      </thead>
    ),
    th: ({ children }: any) => (
      <th className={`border px-3 py-2 text-left font-semibold ${
        isUser ? 'border-white/30' : 'border-gray-300'
      }`}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className={`border px-3 py-2 ${
        isUser ? 'border-white/30' : 'border-gray-300'
      }`}>
        {children}
      </td>
    ),
  };
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20">
          <img 
            src={activePersona.avatarUrl} 
            alt={`${activePersona.name} Avatar`} 
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
          <div className="font-lato leading-relaxed prose prose-sm max-w-none">
            {isUser ? (
              // For user messages, keep simple text formatting
              <p className="whitespace-pre-wrap mb-0">{message.content}</p>
            ) : (
              // For AI messages, render markdown
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>
        <p className={`text-xs text-gray-500 font-lato mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default MessageComponent;
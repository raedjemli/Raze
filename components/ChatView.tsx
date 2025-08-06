
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import ChatMessage from './ChatMessage';

interface ChatViewProps {
  messages: Message[];
  streamingMessage: Message | null;
}

const ChatView: React.FC<ChatViewProps> = ({ messages, streamingMessage }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  return (
    <div className="flex-grow p-4 md:p-6 w-full">
      <div className="max-w-3xl mx-auto space-y-8">
        {messages.map((msg, index) => (
          <ChatMessage 
            key={index} 
            message={msg} 
            isStreaming={false}
          />
        ))}
        {streamingMessage && (
          <ChatMessage
            key="streaming"
            message={streamingMessage}
            isStreaming={true}
          />
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default ChatView;

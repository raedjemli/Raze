
import React, { useState, useRef, useEffect } from 'react';
import { MicIcon } from './icons/MicIcon';
import { SendIcon } from './icons/SendIcon';
import { StopIcon } from './icons/StopIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { BrowserIcon } from './icons/BrowserIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SlidersIcon } from './icons/SlidersIcon';
import { ImageIcon } from './icons/ImageIcon';
import { CpuIcon } from './icons/CpuIcon';
import { ActiveTool } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, image: { data: string, mimeType: string } | undefined, tool: ActiveTool) => void;
  isLoading: boolean;
  activeTool: ActiveTool;
  onSetTool: (tool: ActiveTool) => void;
  onStopStreaming: () => void;
}

const ToolBadge: React.FC<{ icon: React.ReactNode, label: string, onRemove: () => void }> = ({ icon, label, onRemove }) => (
    <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-300 rounded-full px-2.5 py-1 text-sm font-medium animate-fade-in-up">
        {icon}
        <span>{label}</span>
        <button onClick={onRemove} className="ml-1 p-0.5 rounded-full hover:bg-blue-500/30">
            <CloseIcon className="w-3.5 h-3.5" />
        </button>
    </div>
);

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, activeTool, onSetTool, onStopStreaming }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node) &&
            toolsButtonRef.current && !toolsButtonRef.current.contains(event.target as Node)
        ) {
            setIsToolsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSend = () => {
    if ((text.trim() || image) && !isLoading) {
      onSendMessage(text.trim(), image || undefined, activeTool);
      setText('');
      setImage(null);
      onSetTool('none'); // Reset tool after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage({
                data: reader.result as string,
                mimeType: file.type,
                name: file.name
            });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImage(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    containerRef.current.style.setProperty('--mouse-x', `${x}px`);
    containerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleToolToggle = (tool: ActiveTool) => {
    onSetTool(activeTool === tool ? 'none' : tool);
    setIsToolsMenuOpen(false);
  };
  
  const placeholderText: Record<ActiveTool, string> = {
    'none': 'Ask anything',
    'web-search': 'Search the web',
    'image': 'Describe an image to create...',
    'deep-thinking': 'Ask a complex question...',
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#171717] via-[#171717]/90 to-transparent px-4 pb-3 pt-8">
      <div className="relative max-w-3xl mx-auto">
        {isToolsMenuOpen && (
            <div
                ref={toolsMenuRef}
                className="absolute bottom-full mb-3 w-60 bg-[#282a2d] rounded-xl shadow-2xl border border-gray-700/80 animate-fade-in-up overflow-hidden"
            >
                <ul className="p-2 space-y-1 text-gray-300">
                <li>
                    <button
                    onClick={() => handleToolToggle('web-search')}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-700/70 transition-colors"
                    >
                    <BrowserIcon className={`w-5 h-5 transition-colors ${activeTool === 'web-search' ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span className="flex-grow text-left">Web Search</span>
                    {activeTool === 'web-search' && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
                    </button>
                </li>
                <li>
                    <button
                    onClick={() => handleToolToggle('image')}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-700/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <ImageIcon className={`w-5 h-5 transition-colors ${activeTool === 'image' ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span className="flex-grow text-left">Create an image</span>
                     {activeTool === 'image' && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
                    </button>
                </li>
                <li>
                    <button
                    disabled
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <CpuIcon className="w-5 h-5 text-gray-400" />
                    <span className="flex-grow text-left">Deep Thinking</span>
                    </button>
                </li>
                </ul>
            </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              className="input-spotlight-container bg-[#2a2a2a] rounded-2xl shadow-lg"
            >
              <div className="p-2 flex flex-col">
                {image && (
                  <div className="relative self-start m-2 bg-gray-700/50 p-1.5 rounded-lg">
                    {image.mimeType.startsWith('image/') ? (
                        <img src={image.data} alt="Preview" className="h-20 w-auto rounded-md object-cover" />
                    ) : (
                        <div className="h-20 w-32 p-2 flex flex-col items-center justify-center text-center text-gray-300">
                            <PaperclipIcon className="w-8 h-8 mb-1 text-gray-400" /> 
                            <span className="text-xs max-w-full truncate" title={image.name}>{image.name}</span>
                        </div>
                    )}
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-0.5 text-white hover:bg-gray-700"
                      aria-label="Remove image"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex-grow flex items-center">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholderText[activeTool]}
                        rows={1}
                        className="flex-grow bg-transparent text-lg text-gray-200 placeholder-gray-500 focus:outline-none resize-none w-full px-2 py-3 max-h-48"
                        style={{ scrollbarWidth: 'none' }}
                        disabled={isLoading}
                    />
                </div>
                <div className="flex items-center gap-2 px-2 pb-1">
                    <button type="button" onClick={handleAttachClick} className="p-2 rounded-full hover:bg-gray-700/70 transition-colors" aria-label="Attach file">
                        <PaperclipIcon className="w-6 h-6 text-gray-400" />
                    </button>
                    <button 
                      type="button"
                      ref={toolsButtonRef}
                      onClick={() => setIsToolsMenuOpen(prev => !prev)}
                      className={`p-2 rounded-full transition-colors ${isToolsMenuOpen ? 'bg-gray-700/70 text-gray-200' : 'text-gray-400 hover:bg-gray-700/70'}`}
                      aria-label="Tools"
                    >
                        <SlidersIcon className="w-6 h-6" />
                    </button>
                    <div className="flex-grow flex items-center gap-2">
                        {activeTool === 'web-search' && <ToolBadge icon={<BrowserIcon className="w-4 h-4" />} label="Search" onRemove={() => onSetTool('none')} />}
                        {activeTool === 'image' && <ToolBadge icon={<ImageIcon className="w-4 h-4" />} label="Image" onRemove={() => onSetTool('none')} />}
                    </div>
                    <button type="button" className="p-2 rounded-full hover:bg-gray-700/70 transition-colors" aria-label="Use microphone">
                        <MicIcon className="w-6 h-6 text-gray-400" />
                    </button>
                    {isLoading ? (
                        <button
                            type="button"
                            onClick={onStopStreaming}
                            className="p-2.5 rounded-full transition-all duration-200 ease-in-out bg-red-500 text-white enabled:hover:scale-110 enabled:active:scale-95 shadow-lg shadow-red-500/30"
                            aria-label="Stop generating"
                        >
                            <StopIcon className="w-6 h-6" />
                        </button>
                    ) : (
                        <button 
                            type="submit"
                            disabled={!text.trim() && !image}
                            className="p-2.5 rounded-full transition-all duration-200 ease-in-out bg-white text-black disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed enabled:hover:scale-110 enabled:active:scale-95"
                            aria-label="Send message"
                        >
                            <SendIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
              </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;

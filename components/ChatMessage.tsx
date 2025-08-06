import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { BrowserIcon } from './icons/BrowserIcon';
import CitationsPanel from './CitationsPanel';
import { PaperclipIcon } from './icons/PaperclipIcon';
import ImageGenerationLoader from './ImageGenerationLoader';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

declare var hljs: any; // Declare highlight.js for TypeScript

interface MarkdownRendererProps {
  content: string;
}

const parseInlineMarkdown = (text: string): React.ReactNode => {
    const markdownRegex = /(\*\*\*|___)(.+?)\1|(\*\*|__)(.+?)\3|(\*|_)(.+?)\5|(~~)(.+?)\7/g;

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    markdownRegex.lastIndex = 0;

    while ((match = markdownRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.substring(lastIndex, match.index));
        }

        if (match[2]) {
            nodes.push(<strong key={lastIndex}><em>{parseInlineMarkdown(match[2])}</em></strong>);
        } else if (match[4]) {
            nodes.push(<strong key={lastIndex}>{parseInlineMarkdown(match[4])}</strong>);
        } else if (match[6]) {
            nodes.push(<em key={lastIndex}>{parseInlineMarkdown(match[6])}</em>);
        } else if (match[8]) {
            nodes.push(<s key={lastIndex}>{parseInlineMarkdown(match[8])}</s>);
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        nodes.push(text.substring(lastIndex));
    }

    return nodes.map((node, index) => <React.Fragment key={index}>{node}</React.Fragment>);
};

const CodeBlock: React.FC<{ language: string; content: string; }> = ({ language, content }) => {
    const [isCopied, setIsCopied] = useState(false);
    const codeRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (codeRef.current) {
            // Tell highlight.js to syntax highlight this block
            hljs.highlightElement(codeRef.current);
        }
    }, [content, language]);

    const handleCopy = () => {
        navigator.clipboard.writeText(content).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    };

    return (
        <div className="bg-[#282c34] rounded-lg my-4 overflow-hidden border border-gray-700/80">
            <div className="flex justify-between items-center px-4 py-2 bg-black/20">
                <span className="text-sm text-gray-400 font-sans">{language || 'code'}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50" disabled={isCopied}>
                    {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            {/* The pre tag background will be set by the atom-one-dark theme */}
            <pre className="m-0">
                <code
                    ref={codeRef}
                    // The language class is how highlight.js knows what language to use
                    className={`${language ? `language-${language}` : ''}`}
                >
                    {content}
                </code>
            </pre>
        </div>
    );
};

const Blockquote: React.FC<{ lines: string[]; depth?: number }> = ({ lines, depth = 0 }) => {
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Check if the line starts a nested blockquote
        if (line.startsWith('>')) {
            const nestedLines: string[] = [];
            // Collect all contiguous lines of the nested block
            while (i < lines.length && lines[i].startsWith('>')) {
                // Strip one level of '>' for the child
                nestedLines.push(lines[i].replace(/^>\s?/, ''));
                i++;
            }
            elements.push(<Blockquote key={`bq-d${depth}-${i}`} lines={nestedLines} depth={depth + 1} />);
        } else {
            // It's a paragraph within the current quote level
            const pLines: string[] = [];
            // Collect all contiguous non-quote lines
            while (i < lines.length && !lines[i].startsWith('>')) {
                pLines.push(lines[i]);
                i++;
            }

            // Join the lines, split by blank lines to form paragraphs, and render
            const pText = pLines.join('\n');
            const paragraphs = pText.split(/\n\s*\n/).filter(p => p.trim());

            paragraphs.forEach((p, pIdx) => {
                const pContent = p.split('\n').map((l, lIdx, arr) => (
                    <React.Fragment key={lIdx}>
                        {parseInlineMarkdown(l)}
                        {lIdx < arr.length - 1 && <br />}
                    </React.Fragment>
                ));
                elements.push(<p key={`p-d${depth}-${i}-${pIdx}`}>{pContent}</p>);
            });
        }
    }

    if (depth === 0) {
        // New "cool minimal line" design
        return (
            <blockquote className="flex gap-3 my-4">
                <div className="w-1 bg-white rounded-full flex-shrink-0"></div>
                <div className="flex-grow space-y-2 text-gray-300">{elements}</div>
            </blockquote>
        );
    } else {
        // Nested design
        return (
            <blockquote className="mt-2 pl-4 border-l-2 border-gray-600">
                <div className="space-y-2 text-gray-400">{elements}</div>
            </blockquote>
        );
    }
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Priority 1: Code blocks (to preserve raw content)
    if (line.startsWith('```')) {
        const lang = line.substring(3).trim();
        const codeLines: string[] = [];
        i++; // Move past opening fence
        while (i < lines.length && !lines[i].startsWith('```')) {
            codeLines.push(lines[i]);
            i++;
        }
        elements.push(<CodeBlock key={`code-${i}`} language={lang} content={codeLines.join('\n')} />);
        i++; // Move past closing fence
        continue;
    }
    
    // Priority 2: Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const tag = `h${level}` as keyof JSX.IntrinsicElements;
        const classes = [
            "font-semibold", // base (unused index 0)
            "text-4xl mt-6 mb-3", // h1
            "text-3xl mt-5 mb-3", // h2
            "text-2xl mt-4 mb-2", // h3
            "text-xl mt-4 mb-2", // h4
            "text-lg mt-3 mb-1",  // h5
            "text-base mt-3 mb-1",// h6
        ];
        elements.push(React.createElement(tag, { key: `h-${i}`, className: classes[level] }, parseInlineMarkdown(text)));
        i++;
        continue;
    }

    // Priority 3: Horizontal Rules
    const hrRegex = /^(---|___|\*\*\*)\s*$/;
    if (hrRegex.test(line)) {
        elements.push(<div key={`hr-${i}`} className="h-px my-8 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />);
        i++;
        continue;
    }

    // Priority 4: Blockquotes
    if (line.startsWith('>')) {
        const bqLines: string[] = [];
        // A blockquote is contiguous lines starting with >
        while (i < lines.length && lines[i].startsWith('>')) {
             // Strip the *first* level of quote syntax before passing down.
            bqLines.push(lines[i].replace(/^>\s?/, ''));
            i++;
        }
        elements.push(<Blockquote key={`bq-${i}`} lines={bqLines} />);
        continue;
    }
    
    // Priority 5: Task Lists (more specific than Unordered Lists)
    const taskListRegex = /^- \[(x| )\] (.*)/i;
    if (taskListRegex.test(line)) {
        const items: { checked: boolean; content: string }[] = [];
        while (i < lines.length && lines[i].match(taskListRegex)) {
            const match = lines[i].match(taskListRegex)!;
            items.push({ checked: match[1].toLowerCase() === 'x', content: match[2] });
            i++;
        }
        elements.push(
            <ul key={`tl-${i}`} className="list-none space-y-2 my-4 ml-1">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start">
                        <input
                            type="checkbox"
                            checked={item.checked}
                            readOnly
                            disabled
                            className="mt-1 mr-3 h-4 w-4 rounded border-gray-500 bg-gray-700/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-transparent focus:ring-2 cursor-default disabled:opacity-100"
                        />
                        <label className={`flex-1 ${item.checked ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                            {parseInlineMarkdown(item.content)}
                        </label>
                    </li>
                ))}
            </ul>
        );
        continue;
    }

    // Priority 6: Unordered Lists (bullets)
    const ulRegex = /^(\*|-)\s+(.*)/;
    if (ulRegex.test(line)) {
        const items: string[] = [];
        while (i < lines.length) {
            const currentLine = lines[i];
            const match = currentLine.match(ulRegex);
            // Break if the line is not a list item or if it's a more specific task list item
            if (!match || taskListRegex.test(currentLine)) {
                break;
            }
            items.push(match[2]);
            i++;
        }
        if (items.length > 0) {
            elements.push(
                <ul key={`ul-${i}`} className="list-disc space-y-1 my-2 ml-6 text-gray-200">
                    {items.map((item, index) => (
                        <li key={index}>{parseInlineMarkdown(item)}</li>
                    ))}
                </ul>
            );
        }
        continue;
    }

    // Priority 7: Paragraphs (must be last)
    if (line.trim() !== '') {
        const pLines: string[] = [];
        const isNewBlock = (l: string) => /^(#|---|```|(\*|-) | - \[[ x]\]|>)/.test(l);
        
        while (i < lines.length && lines[i].trim() !== '' && !isNewBlock(lines[i])) {
            pLines.push(lines[i]);
            i++;
        }

        if (pLines.length > 0) {
            const pContent = pLines.map((pLine, idx) => (
                <React.Fragment key={idx}>
                    {parseInlineMarkdown(pLine)}
                    {idx < pLines.length - 1 && <br />}
                </React.Fragment>
            ));
            elements.push(<p key={`p-${i}`} className="my-2">{pContent}</p>);
        }
        continue;
    }
    
    // If we're here, it was a blank line. Skip it.
    i++;
  }

  return <>{elements}</>;
};

interface ChatMessageProps {
  message: Message;
  isStreaming: boolean;
}

const WebSearchIndicator: React.FC = () => (
    <div className="flex items-center gap-2 text-gray-400 mt-2">
        <BrowserIcon className="w-5 h-5 animate-pulse-glow" />
        <p className="text-sm">Searching the web...</p>
    </div>
);

const NormalResponseIndicator: React.FC = () => (
    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pump ml-1 mt-2"></div>
);

const SourcesButton: React.FC<{ chunks: NonNullable<Message['groundingChunks']>, onClick: () => void }> = ({ chunks, onClick }) => {
    const [erroredFavicons, setErroredFavicons] = useState<Set<string>>(new Set());

    const handleFaviconError = (hostname: string) => {
        setErroredFavicons(prev => new Set(prev).add(hostname));
    };

    const getHostname = (url: string) => {
        try {
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            return new URL(fullUrl).hostname.replace('www.', '');
        } catch (e) {
            return url.split('/')[0] || '';
        }
    };

    const processedChunks = chunks.slice(0, 3).map(chunk => {
        const isVertexChunk = chunk.web.uri.includes('vertexaisearch.cloud.google.com');
        const sourceIdentifier = (isVertexChunk && chunk.web.title) ? chunk.web.title : chunk.web.uri;
        const hostname = getHostname(sourceIdentifier);
        return {
            key: chunk.web.uri,
            hostname: hostname,
            faviconUrl: `https://www.google.com/s2/favicons?sz=32&domain=${hostname}`
        };
    }).filter(item => item.hostname);

    return (
        <button onClick={onClick} className="flex items-center gap-2.5 mt-4 px-3 py-1.5 rounded-full bg-[#272f3a] hover:bg-[#3c4658] transition-colors shadow-sm">
            <div className="flex items-center -space-x-3">
                {processedChunks.map((item) => (
                    <div key={item.key} className="w-6 h-6 rounded-full border-2 border-[#171717] bg-slate-700 flex items-center justify-center overflow-hidden">
                        {erroredFavicons.has(item.hostname) ? (
                            <BrowserIcon className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                            <img 
                                src={item.faviconUrl}
                                alt={`${item.hostname} favicon`}
                                className="w-full h-full object-cover"
                                onError={() => handleFaviconError(item.hostname)} 
                            />
                        )}
                    </div>
                ))}
            </div>
            <span className="text-sm font-medium text-gray-200">Sources</span>
        </button>
    );
};


const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming }) => {
  const isModel = message.role === 'model';
  const [isCitationsPanelOpen, setIsCitationsPanelOpen] = useState(false);
  
  const hasSources = message.groundingChunks && message.groundingChunks.length > 0;
  const streamingSource = isStreaming && hasSources ? 'web' : 'model';
  const isGeneratingImage = isStreaming && message.content.includes('Generating image...');

  if (isModel) {
    if (isGeneratingImage) {
        return (
            <div className="flex items-start">
                <ImageGenerationLoader />
            </div>
        );
    }

    return (
      <div className="flex items-start">
          <div className="max-w-full w-full">
              {message.image && (
                <div className="mb-2">
                    <p className="text-gray-400 text-sm mb-2 italic">"{message.content}"</p>
                    <img src={message.image} alt={message.content} className="rounded-lg max-w-sm border border-gray-700" />
                </div>
              )}

              <div className="text-gray-200 leading-relaxed">
                {!message.image && message.content && <MarkdownRenderer content={message.content} />}

                {isStreaming && streamingSource === 'web' && <WebSearchIndicator />}
                {isStreaming && streamingSource === 'model' && <NormalResponseIndicator />}
                
                {!isStreaming && hasSources && (
                    <SourcesButton chunks={message.groundingChunks} onClick={() => setIsCitationsPanelOpen(true)} />
                )}
              </div>
          </div>
          {isCitationsPanelOpen && hasSources && (
              <CitationsPanel chunks={message.groundingChunks} onClose={() => setIsCitationsPanelOpen(false)} />
          )}
      </div>
    );
  }

  // User message
  return (
    <div className="flex justify-end">
      <div className="flex flex-col items-end max-w-xl">
        {message.image && (
            <div className="mb-2">
                {(message.imageMimeType && message.imageMimeType.startsWith('image/')) || (!message.imageMimeType && message.image.startsWith('data:image/')) ? (
                    <img src={message.image} alt="User attachment" className="rounded-lg max-w-xs max-h-64 object-cover" />
                ) : (
                    <div className="p-3 bg-gray-700/50 rounded-lg flex items-center gap-3">
                        <PaperclipIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-300 text-sm truncate">Attached file</span>
                    </div>
                )}
            </div>
        )}
        {message.content && (
            <div className="bg-white rounded-2xl px-4 py-2.5 text-black">
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
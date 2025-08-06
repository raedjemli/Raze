
import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { LinkIcon } from './icons/LinkIcon';

interface CitationsPanelProps {
    chunks: NonNullable<Message['groundingChunks']>;
    onClose: () => void;
}

const formatRelativeDate = (date: { year?: number; month?: number; day?: number; } | undefined): string => {
    if (!date || typeof date.year !== 'number' || typeof date.month !== 'number' || typeof date.day !== 'number') {
        return '';
    }
    
    try {
        const now = new Date();
        const pastDate = new Date(date.year, date.month - 1, date.day);
        
        if (pastDate > now) return ''; 

        const diffTime = now.getTime() - pastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 1) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        }
        if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        }
        const years = Math.floor(diffDays / 365);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    } catch (e) {
        console.error("Error formatting date:", e);
        return '';
    }
};

const getHostname = (url: string) => {
    try {
        // Prepend protocol if missing for URL constructor
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        return new URL(fullUrl).hostname.replace('www.', '');
    } catch (e) {
        // Fallback for simple strings that are not valid hostnames after prepending protocol
        return url.split('/')[0];
    }
};


const CitationsPanel: React.FC<CitationsPanelProps> = ({ chunks, onClose }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [erroredFavicons, setErroredFavicons] = useState<Set<string>>(new Set());

    // Close panel on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    
    const handleFaviconError = (uri: string) => {
        setErroredFavicons(prev => new Set(prev).add(uri));
    };

    return (
        <div ref={panelRef} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#171717] border-l border-[#30363d] shadow-2xl z-50 flex flex-col animate-slide-in">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-[#30363d]">
                <h2 className="text-lg font-semibold text-gray-200">Citations</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-[#1c2128] transition-colors" aria-label="Close citations">
                    <CloseIcon className="w-5 h-5 text-gray-400" />
                </button>
            </header>
            <div className="flex-grow overflow-y-auto p-4">
                <ul className="space-y-4">
                    {chunks.map((chunk, index) => {
                        const isVertexChunk = chunk.web.uri.includes('vertexaisearch.cloud.google.com');
                        
                        // If it's a vertex chunk, the real source is in the title. Otherwise, use the URI.
                        const sourceIdentifier = (isVertexChunk && chunk.web.title) ? chunk.web.title : chunk.web.uri;
                        
                        const hostname = getHostname(sourceIdentifier);
                        const href = sourceIdentifier.startsWith('http') ? sourceIdentifier : `https://${sourceIdentifier}`;
                        const displayTitle = chunk.web.title || hostname;
                        
                        const relativeDate = formatRelativeDate(chunk.web.publishedDate);
                        const hasError = erroredFavicons.has(chunk.web.uri);

                        return (
                            <li key={index}>
                                <a 
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 rounded-lg hover:bg-[#1c2128] transition-colors group"
                                >
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <div className="flex-shrink-0 w-4 h-4 rounded-sm flex items-center justify-center bg-[#21262d] text-gray-400">
                                            {hasError ? (
                                                <LinkIcon className="w-3 h-3" />
                                            ) : (
                                                <img 
                                                    src={`https://www.google.com/s2/favicons?sz=32&domain=${hostname}`}
                                                    alt=""
                                                    className="w-full h-full object-contain"
                                                    onError={() => handleFaviconError(chunk.web.uri)} 
                                                />
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-400 truncate">{hostname}</span>
                                    </div>
                                    <h3 className="font-medium text-gray-200 group-hover:text-blue-400 transition-colors break-words">
                                        {displayTitle}
                                    </h3>
                                    {relativeDate && <p className="text-sm text-gray-500 mt-1">{relativeDate}</p>}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <style>
                {`
                @keyframes slide-in {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
                }
                `}
            </style>
        </div>
    );
};

export default CitationsPanel;

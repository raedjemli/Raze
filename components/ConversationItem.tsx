import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../types';
import { MoreHorizontalIcon } from './icons/MoreHorizontalIcon';
import { PinIcon } from './icons/PinIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onSelect: (id: string) => void;
    onPin: (id: string, pinned: boolean) => void;
    onRename: (id: string) => void;
    onDelete: (id: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
    conversation,
    isActive,
    onSelect,
    onPin,
    onRename,
    onDelete
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuAction = (action: (id: string) => void, id: string) => {
        action(id);
        setIsMenuOpen(false);
    };
    
    const handlePinAction = (id: string, pinned: boolean) => {
        onPin(id, !pinned);
        setIsMenuOpen(false);
    }

    return (
        <li
            className={`group relative rounded-md transition-colors ${isActive ? 'bg-[#21262d]' : 'hover:bg-[#1c2128]'}`}
        >
            <button 
                onClick={() => onSelect(conversation.id)} 
                className="w-full text-left px-3 py-2 truncate text-gray-300"
                title={conversation.title}
            >
                {conversation.title || 'New Conversation'}
            </button>
            <div className={`absolute right-2 top-1/2 -translate-y-1/2 transition-opacity opacity-0 group-hover:opacity-100 ${isMenuOpen ? '!opacity-100' : ''}`}>
                <button 
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    className="p-1 rounded-md hover:bg-gray-700"
                    aria-label="Conversation options"
                >
                    <MoreHorizontalIcon className="w-5 h-5 text-gray-400" />
                </button>
                {isMenuOpen && (
                    <div 
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 w-40 bg-[#1c2128] rounded-lg shadow-xl z-10 border border-[#30363d] overflow-hidden"
                    >
                        <ul className="text-sm text-gray-300">
                            <li><button onClick={() => handlePinAction(conversation.id, conversation.pinned)} className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-700"><PinIcon className="w-4 h-4" /> {conversation.pinned ? 'Unpin' : 'Pin'}</button></li>
                            <li><button onClick={() => handleMenuAction(onRename, conversation.id)} className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-700"><EditIcon className="w-4 h-4" /> Rename</button></li>
                            <li><button onClick={() => handleMenuAction(onDelete, conversation.id)} className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-700 text-red-400"><TrashIcon className="w-4 h-4" /> Delete</button></li>
                        </ul>
                    </div>
                )}
            </div>
        </li>
    );
};

export default ConversationItem;
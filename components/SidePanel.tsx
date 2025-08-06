import React from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { Conversation } from '../types';
import ConversationItem from './ConversationItem';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
    currentConversationId: string | null;
    onNewChat: () => void;
    onSelectConversation: (id: string) => void;
    onPinConversation: (id: string, pinned: boolean) => void;
    onRenameConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ 
    isOpen, 
    onClose, 
    conversations,
    currentConversationId,
    onNewChat,
    onSelectConversation,
    onPinConversation,
    onRenameConversation,
    onDeleteConversation
 }) => {
    const panelClasses = isOpen ? 'translate-x-0' : '-translate-x-full';

    const pinnedConversations = conversations.filter(c => c.pinned);
    const recentConversations = conversations.filter(c => !c.pinned);

    const renderList = (convos: Conversation[]) => (
        <ul className="space-y-1">
            {convos.map(conv => (
                <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === currentConversationId}
                    onSelect={onSelectConversation}
                    onPin={onPinConversation}
                    onRename={onRenameConversation}
                    onDelete={onDeleteConversation}
                />
            ))}
        </ul>
    );

    return (
        <>
            {/* Overlay */}
            <div 
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Sidebar Panel */}
            <aside 
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 flex flex-col
                    bg-[#171717] border-r border-[#30363d]
                    transition-transform duration-300 ease-in-out
                    ${panelClasses}
                `}
                aria-label="Conversation History"
            >
                {/* New Chat Button */}
                <div className="flex-shrink-0 p-3">
                     <button 
                        onClick={onNewChat}
                        className="flex items-center gap-3 w-full px-3 py-2 text-left rounded-md border border-gray-700 hover:bg-[#1c2128] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <PlusIcon className="w-5 h-5 flex-shrink-0 text-gray-300" />
                        <span className="font-medium text-gray-200">New Chat</span>
                    </button>
                </div>
                
                {/* Conversation History */}
                <div className="flex-grow overflow-y-auto px-2 pt-2 space-y-4">
                    {pinnedConversations.length > 0 && (
                        <section>
                            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pinned</h3>
                            {renderList(pinnedConversations)}
                        </section>
                    )}
                    
                    <section>
                        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent</h3>
                         {recentConversations.length > 0 ? (
                            renderList(recentConversations)
                         ) : (
                             <p className="px-3 text-sm text-gray-500">Chat history will appear here.</p>
                         )}
                    </section>
                </div>
            </aside>
        </>
    );
};

export default SidePanel;
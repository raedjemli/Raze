
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Part, GenerateContentConfig, Content, GroundingChunk, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Message, Conversation, ActiveTool } from './types';
import Header from './components/Header';
import ChatView from './components/ChatView';
import ChatInput from './components/ChatInput';
import WelcomeScreen from './components/WelcomeScreen';
import SidePanel from './components/SidePanel';

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const isLoading = streamingMessage !== null;
  const stopStreamingRef = useRef(false);

  useEffect(() => {
    try {
      if(process.env.API_KEY) {
        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        setAi(genAI);
      } else {
        setError("API_KEY environment variable not set.");
      }
    } catch (e: any) {
      setError(e.message);
      console.error(e);
    }
    
    // Load conversations from local storage
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      try {
        const parsedConvos = JSON.parse(savedConversations);
        if (Array.isArray(parsedConvos)) {
          setConversations(parsedConvos);
        }
      } catch (e) {
        console.error("Failed to parse conversations from local storage", e);
        localStorage.removeItem('conversations');
      }
    }
  }, []);
  
  // Save conversations to local storage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem('conversations', JSON.stringify(conversations));
      } catch (e) {
        console.error("Failed to save conversations to local storage", e);
        // This might happen with circular structures, which should be sanitized before setConversations
        setError("Could not save conversation. There might be an issue with the data.");
      }
    }
  }, [conversations]);

  const generateTitle = async (userContent: string, modelContent: string) => {
    if (!ai) return "New Chat";
    try {
      const prompt = `Generate a concise, four-word-or-less title for this conversation. The title should be plain text, without any quotes or special formatting.\n\nConversation:\nUser: ${userContent}\nModel: ${modelContent}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.trim().replace(/["']/g, '');
    } catch (error) {
      console.error("Error generating title:", error);
      return "New Chat";
    }
  };
  
  const handleNewChat = () => {
    setCurrentConversationId(null);
    setStreamingMessage(null);
    setError(null);
    setIsSidePanelOpen(false);
    setActiveTool('none');
  };
  
  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    setStreamingMessage(null);
    setError(null);
    setIsSidePanelOpen(false);
  };
  
  const handlePinConversation = (id: string, pinned: boolean) => {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, pinned } : c));
  };
  
  const handleRenameConversation = (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    const newTitle = prompt('Enter a new title:', conversation?.title);
    if (newTitle && newTitle.trim() !== '') {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle.trim() } : c));
    }
  };
  
  const handleDeleteConversation = (id: string) => {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
          setCurrentConversationId(null);
      }
  };

  const handleStopStreaming = () => {
    stopStreamingRef.current = true;
  };

  const handleSendMessage = async (text: string, image: { data: string; mimeType: string } | undefined, tool: ActiveTool) => {
    if (!ai || isLoading) return;

    if (tool === 'image') {
      await handleImageGeneration(text, image);
      return;
    }
    
    stopStreamingRef.current = false;

    const userMessage: Message = { 
      role: 'user', 
      content: text, 
      image: image?.data,
      imageMimeType: image?.mimeType
    };
    const isNewConversation = !currentConversationId;

    const historyForApi = [
        ...(isNewConversation ? [] : conversations.find(c => c.id === currentConversationId)?.messages || []),
    ];

    let conversationIdForUpdate = currentConversationId;
    if (isNewConversation) {
        const newId = Date.now().toString();
        conversationIdForUpdate = newId;
        const newConv: Conversation = { id: newId, title: 'New Conversation', messages: [userMessage], pinned: false };
        setConversations(prev => [newConv, ...prev]);
        setCurrentConversationId(newId);
    } else {
        setConversations(prev => prev.map(c => 
            c.id === conversationIdForUpdate ? { ...c, messages: [...c.messages, userMessage] } : c
        ));
    }

    setStreamingMessage({ role: 'model', content: '', groundingChunks: [] });
    setError(null);

    try {
      const apiContents: Content[] = [...historyForApi, userMessage].map((msg): Content => {
          const parts: Part[] = [];
          if (msg.content) {
              parts.push({ text: msg.content });
          }
          if (msg.role === 'user' && msg.image) {
              const [_header, data] = msg.image.split(',');
              const mimeType = msg.imageMimeType || 'image/png';
              parts.push({
                  inlineData: { data, mimeType }
              });
          }
          return { role: msg.role, parts };
      }).filter(content => content.parts.length > 0);

      if (apiContents.length === 0) {
        throw new Error("Cannot send an empty message.");
      }
      
      const config: GenerateContentConfig = {
        systemInstruction: 'You are a helpful and friendly AI assistant.',
      };

      if (tool === 'web-search') {
        config.tools = [{ googleSearch: {} }];
      }

      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: apiContents,
        config,
      });

      let finalMessage: Message = { role: 'model', content: '', groundingChunks: [] };

      for await (const chunk of stream) {
        if (stopStreamingRef.current) break;

        const chunkText = chunk.text ?? '';
        const rawGroundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((c: GroundingChunk): c is GroundingChunk & { web: { uri: string } } => typeof c.web?.uri === 'string') ?? [];

        // Sanitize grounding chunks to be plain objects to prevent circular JSON errors when saving to localStorage.
        const sanitizedGroundingChunks = rawGroundingChunks.map(c => {
          const web = c.web as any; // Cast to any to access potentially existing publishedDate
          return {
            web: {
              uri: web.uri,
              title: web.title,
              publishedDate: web.publishedDate ? {
                year: web.publishedDate.year,
                month: web.publishedDate.month,
                day: web.publishedDate.day,
              } : undefined,
            }
          };
        });

        finalMessage.content += chunkText;
        if (sanitizedGroundingChunks.length > 0) {
            const allChunks = [...(finalMessage.groundingChunks ?? []), ...sanitizedGroundingChunks];
            const uniqueChunksMap = new Map(allChunks.map(item => [item.web.uri, item]));
            finalMessage.groundingChunks = Array.from(uniqueChunksMap.values());
        }
        setStreamingMessage({ ...finalMessage });
      }
      
      if (isNewConversation && finalMessage.content) {
          const title = await generateTitle(text, finalMessage.content);
          setConversations(prev => prev.map(c => c.id === conversationIdForUpdate ? { ...c, messages: [userMessage, finalMessage], title } : c));
      } else {
          setConversations(prevConvos => {
            return prevConvos.map(c => 
                c.id === conversationIdForUpdate ? { ...c, messages: [...c.messages, finalMessage] } : c
            );
          });
      }

    } catch (e: any) {
      const message = (e?.message || '').toLowerCase();
      if (message.includes('rate limit') || message.includes('quota')) {
        setError("server is down!");
      } else {
        setError("Sorry, I couldn't get a response. Please try again.");
      }
      console.error(e);
       // Revert optimistic update on error
       setConversations(prev => prev.map(c => {
           if (c.id === conversationIdForUpdate) {
               return { ...c, messages: c.messages.slice(0, -1) };
           }
           return c;
       }));
    } finally {
        setStreamingMessage(null);
        stopStreamingRef.current = false;
    }
  };

  const handleImageGeneration = async (prompt: string, image: { data: string; mimeType: string } | undefined) => {
    if (!ai) return;
    if (!prompt && !image) {
      setError("Please provide a prompt or an image to generate a new image.");
      return;
    }
    
    stopStreamingRef.current = false;

    const userMessagePrompt = prompt || (image ? "Generate a new image based on this one." : "Missing prompt");
    const userMessage: Message = { 
      role: 'user', 
      content: userMessagePrompt, 
      image: image?.data,
      imageMimeType: image?.mimeType
    };
    
    const isNewConversation = !currentConversationId;
    let conversationIdForUpdate = currentConversationId;
    let conversationWithUserMessage: Conversation;
    
    if (isNewConversation) {
      const newId = Date.now().toString();
      conversationIdForUpdate = newId;
      conversationWithUserMessage = { id: newId, title: `Image: ${prompt.substring(0, 20)}...`, messages: [userMessage], pinned: false };
      setConversations(prev => [conversationWithUserMessage, ...prev]);
      setCurrentConversationId(newId);
    } else {
      const currentConv = conversations.find(c => c.id === conversationIdForUpdate);
      if (!currentConv) {
          setError("Could not find current conversation to update.");
          return;
      }
      conversationWithUserMessage = { ...currentConv, messages: [...currentConv.messages, userMessage] };
      setConversations(prev => prev.map(c => c.id === conversationIdForUpdate ? conversationWithUserMessage : c));
    }

    setStreamingMessage({ role: 'model', content: 'Generating image...' });
    setError(null);

    try {
        const parts: Part[] = [];
        if (prompt) {
            parts.push({ text: prompt });
        }
        if (image) {
            const [_header, data] = image.data.split(',');
            parts.push({
                inlineData: { data, mimeType: image.mimeType }
            });
        }
        
        const apiContents: Content[] = [{ role: 'user', parts }];

        const streamConfig: any = {
            responseMimeType: 'text/plain',
            responseModalities: ['IMAGE', 'TEXT'],
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        };
        
        const stream = await ai.models.generateContentStream({
            model: 'gemini-2.0-flash-preview-image-generation',
            contents: apiContents,
            config: streamConfig,
        });

        let finalModelMessage: Message | null = null;

        for await (const chunk of stream) {
            if (stopStreamingRef.current) break;
            
            const imagePart = chunk.candidates?.[0]?.content?.parts?.find(part => part.inlineData && part.inlineData.mimeType.startsWith('image/'));

            if (imagePart && imagePart.inlineData) {
                const base64ImageBytes = imagePart.inlineData.data;
                const mimeType = imagePart.inlineData.mimeType;
                const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
        
                finalModelMessage = {
                    role: 'model',
                    content: prompt, // Use original prompt as caption
                    image: imageUrl,
                    imageMimeType: mimeType
                };
                // Once we find an image, we can stop processing the stream.
                break;
            }
        }
        
        // If the loop completes and we haven't found an image, it means the model
        // either returned only text or nothing. In either case, show the failure message.
        if (!finalModelMessage) {
            finalModelMessage = { role: 'model', content: "Image generation failed. The model did not return an image." };
        }
        
        let finalConversationState = {
            ...conversationWithUserMessage,
            messages: [...conversationWithUserMessage.messages, finalModelMessage]
        };
        
        if (isNewConversation && finalModelMessage.image) {
            const title = await generateTitle(userMessagePrompt, "An image was generated.");
            finalConversationState.title = title;
        }
        
        setConversations(prev => prev.map(c => 
            c.id === conversationIdForUpdate ? finalConversationState : c
        ));

    } catch (e: any) {
        const message = (e?.message || '').toLowerCase();
        if (message.includes('rate limit') || message.includes('quota')) {
            setError("server is down!");
        } else {
            setError("Sorry, I couldn't generate the image. Please try again.");
        }
        console.error(e);
        // Revert optimistic update on error by removing the user message
        setConversations(prev => prev.map(c => {
            if (c.id === conversationIdForUpdate) {
                return { ...c, messages: c.messages.slice(0, -1) };
            }
            return c;
        }));
    } finally {
        setStreamingMessage(null);
        stopStreamingRef.current = false;
    }
  };

  const currentConversation = useMemo(() => {
    return conversations.find(c => c.id === currentConversationId);
  }, [conversations, currentConversationId]);
  
  const sortedConversations = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => {
        const timeA = parseInt(a.id, 10) || 0;
        const timeB = parseInt(b.id, 10) || 0;
        return timeB - timeA;
    });

    return sorted.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
    });
  }, [conversations]);

  return (
    <div className="h-screen w-screen bg-[#171717] text-gray-200 font-sans overflow-hidden">
      <SidePanel 
        isOpen={isSidePanelOpen} 
        onClose={() => setIsSidePanelOpen(false)}
        conversations={sortedConversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onPinConversation={handlePinConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <div className="flex flex-col h-full">
        <Header isOpen={isSidePanelOpen} onMenuClick={() => setIsSidePanelOpen(prev => !prev)} />
        
        <main className="flex-grow overflow-y-auto flex flex-col pb-48 md:pb-52">
          {!currentConversationId ? (
            <WelcomeScreen />
          ) : (
            <ChatView messages={currentConversation?.messages || []} streamingMessage={streamingMessage} />
          )}
          {error && <div className="text-red-500 text-center px-4 py-2">{error}</div>}
        </main>
        
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading}
          activeTool={activeTool}
          onSetTool={setActiveTool}
          onStopStreaming={handleStopStreaming}
        />
      </div>
    </div>
  );
};

export default App;


import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';
import { BotIcon, UserIcon, SpeakerIcon, PlayIcon, PauseIcon, ExternalLinkIcon, CopyIcon, CheckIcon } from './icons';
import ChoiceButton from './ChoiceButton';
import ReactMarkdown from 'react-markdown';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onChoiceClick: (payload: string) => void;
  language: 'en' | 'ar' | null;
  onToggleAudio: (text: string, messageId: number) => void;
  audioPlayback: { messageId: number | null; status: 'playing' | 'paused' };
  isAudioLoading: number | null;
  isSoundEnabled: boolean;
}

const AudioSpinner = () => (
    <div className="h-5 w-5 border-2 border-t-transparent border-brand-primary rounded-full animate-spin"></div>
);

const ChatBubble: React.FC<{
    message: Message;
    onChoiceClick: (payload: string) => void;
    onToggleAudio: (text: string, messageId: number) => void;
    language: 'en' | 'ar' | null;
    audioPlayback: { messageId: number | null; status: 'playing' | 'paused' };
    isAudioLoading: number | null;
    isSoundEnabled: boolean;
}> = ({ message, onChoiceClick, onToggleAudio, language, audioPlayback, isAudioLoading, isSoundEnabled }) => {
    const isAi = message.sender === 'ai';
    const [isCopied, setIsCopied] = React.useState(false);

    const containerClasses = `flex w-full my-2 ${isAi ? 'justify-start' : 'justify-end'}`;
    const contentClasses = `flex items-start gap-2.5 ${isAi ? 'flex-row' : 'flex-row-reverse'}`;
    const bubbleRadius = isAi ? 'rounded-tl-none' : 'rounded-tr-none';
    const bubbleColor = isAi ? 'bg-ai-bubble' : 'bg-user-bubble';
    const textContent = typeof message.text === 'string' ? message.text : ''; // Get string content for TTS

    const handleCopy = React.useCallback(() => {
        if (!textContent) return;
        navigator.clipboard.writeText(textContent).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error("Failed to copy text:", err);
        });
    }, [textContent]);

    const LinkRenderer = (props: any) => {
        const tooltipText = language === 'ar' ? 'يفتح في علامة تبويب جديدة' : 'Opens in a new tab';
        return (
            <a 
                href={props.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                title={tooltipText}
                className="inline-flex items-center gap-1 bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-secondary font-semibold py-1 px-2 rounded-md transition-colors"
            >
                <span>{props.children}</span>
                <ExternalLinkIcon />
            </a>
        );
    };

    const getAudioIcon = () => {
        if (isAudioLoading === message.id) {
            return <AudioSpinner />;
        }
        if (audioPlayback.messageId === message.id) {
            if (audioPlayback.status === 'playing') {
                return <PauseIcon />;
            }
            return <PlayIcon />; // Paused state
        }
        return <SpeakerIcon />; // Default state
    };
    
    return (
        <div className={containerClasses}>
            <div className={contentClasses}>
                {isAi ? <BotIcon /> : <UserIcon />}
                <div className={`flex flex-col max-w-sm md:max-w-md lg:max-w-lg ${isAi ? 'items-start' : 'items-end'}`}>
                    <div className={`relative flex flex-col ${isAi ? 'p-3 pb-8 pr-20' : 'p-3'} text-sm text-white ${bubbleColor} rounded-xl ${bubbleRadius}`}>
                        {typeof message.text === 'string' ? (
                            // FIX: The `className` prop is not valid for `ReactMarkdown`. Moved styles to a wrapper div.
                            <div className="prose prose-invert prose-p:my-1 prose-a:text-brand-accent prose-a:hover:underline">
                                <ReactMarkdown components={{ a: LinkRenderer }}>
                                    {message.text}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            message.text
                        )}
                        {isAi && (
                            <div className="absolute -bottom-2 -right-2 flex items-center gap-1">
                                {isSoundEnabled && textContent && (
                                    <button onClick={() => onToggleAudio(textContent, message.id)} className="p-1.5 bg-ai-bubble rounded-full hover:bg-brand-secondary/50 transition-colors" aria-label="Play audio">
                                        {getAudioIcon()}
                                    </button>
                                )}
                                <button onClick={handleCopy} className="p-1.5 bg-ai-bubble rounded-full hover:bg-brand-secondary/50 transition-colors" aria-label="Copy text">
                                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                                </button>
                            </div>
                        )}
                    </div>
                    {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400">
                            <h4 className="font-bold mb-1">{language === 'ar' ? 'المصادر' : 'Sources'}:</h4>
                            <ul className="flex flex-wrap gap-2">
                                {message.sources.map((source, index) => (
                                    <li key={index}>
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-secondary font-semibold py-1 px-2 rounded-md transition-colors inline-flex items-center gap-1">
                                            <span>{index + 1}. {source.title}</span>
                                            <ExternalLinkIcon />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {message.choices?.map((choice, index) => (
                            <ChoiceButton key={index} choice={choice} onClick={onChoiceClick} />
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{message.timestamp}</div>
                </div>
            </div>
        </div>
    );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  onChoiceClick,
  language,
  onToggleAudio,
  audioPlayback,
  isAudioLoading,
  isSoundEnabled,
}) => {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <ChatBubble
          key={message.id}
          message={message}
          onChoiceClick={onChoiceClick}
          onToggleAudio={onToggleAudio}
          language={language}
          audioPlayback={audioPlayback}
          isAudioLoading={isAudioLoading}
          isSoundEnabled={isSoundEnabled}
        />
      ))}
      {isLoading && (
        <div className="flex justify-start my-2">
          <div className="flex items-start gap-2.5">
            <BotIcon />
            <div className="flex items-center space-x-2 bg-ai-bubble p-3 rounded-xl rounded-tl-none">
              <span className="h-2 w-2 bg-brand-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="h-2 w-2 bg-brand-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="h-2 w-2 bg-brand-secondary rounded-full animate-bounce"></span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

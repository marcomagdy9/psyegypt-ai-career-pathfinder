import React, { useRef, useEffect } from 'react';
import { BotIcon, UserIcon, SpeakerIcon, PlayIcon, PauseIcon, ExternalLinkIcon, CopyIcon, CheckIcon, ThinkingIcon, ExploreIcon } from './icons';
import ChoiceButton from './ChoiceButton';
import ReactMarkdown from 'react-markdown';
import { SpecialtyId } from '../types';
import JobDossier from './JobDossier';

const AudioSpinner = () => (
    <div className="h-5 w-5 border-2 border-t-transparent border-brand-primary rounded-full animate-spin"></div>
);

// --- CONTROL ROOM HUD COMPONENTS ---

const Radar = () => (
    <div className="relative w-24 h-24 rounded-full border-2 border-green-500 bg-black/50 shadow-[0_0_15px_rgba(0,255,0,0.5)] flex items-center justify-center overflow-hidden">
        <div className="absolute w-full h-1 bg-green-500/50 animate-[spin_3s_linear_infinite]" style={{ transformOrigin: 'center' }}></div>
        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
        <div className="absolute top-2 right-4 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
    </div>
);

interface DeploymentCardProps {
    specialtyId: SpecialtyId;
    label: string;
    onClick: (id: SpecialtyId) => void;
}

const DeploymentCard: React.FC<DeploymentCardProps> = ({ specialtyId, label, onClick }) => (
    <button 
        onClick={() => onClick(specialtyId)}
        className="flex flex-col items-center justify-center p-3 bg-black/40 border border-green-500/30 hover:bg-green-500/20 hover:border-green-400 rounded-lg transition-all duration-200 group h-24"
    >
        <span className="text-xs text-green-300 font-mono mb-1 group-hover:text-white text-center">{label}</span>
        <div className="w-full h-1 bg-green-900 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-green-500 w-3/4"></div>
        </div>
    </button>
);

const SPECIALTY_MAP: Record<SpecialtyId, { en: string; ar: string }> = {
    SPORTS: { en: "Sports Psychology", ar: "علم النفس الرياضي" },
    FORENSIC: { en: "Forensic Psychology", ar: "علم النفس الجنائي" },
    CONSUMER: { en: "Consumer Psychology", ar: "علم النفس التجاري" },
    SCHOOL: { en: "School Psychology", ar: "علم النفس المدرسي" },
    MILITARY: { en: "Military Psychology", ar: "علم النفس العسكري" },
    COUNSELING: { en: "Counseling Psychology", ar: "علم النفس الإرشادي" },
    IO: { en: "I/O Psychology", ar: "علم النفس التنظيمي" }
};

const ControlRoomUI = ({ gameState, onDeploy, onNext, onExit, onBridge, onRetry, language }) => {
    const isAr = language === 'ar';

    if (gameState.loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-green-400 font-mono space-y-4">
                <Radar />
                <p className="animate-pulse">{isAr ? '...جاري تأمين الاتصال' : 'ESTABLISHING SECURE LINK...'}</p>
                <div className="text-xs text-green-600">{isAr ? 'PsyEgypt: جاري فك التشفير' : 'PsyEgypt CMD: DECRYPTION IN PROGRESS'}</div>
            </div>
        );
    }

    // SUCCESS STATE: Show the Job Dossier (Tactical Overlay)
    if (gameState.feedback && gameState.feedback.status === 'success') {
        return (
            <div className="h-full bg-gray-900">
                <JobDossier 
                    specialtyId={gameState.currentMission.target_id} 
                    language={language} 
                    onContinue={onNext} 
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full font-mono relative overflow-hidden">
            {/* HUD Header */}
            <div className="flex justify-between items-center p-4 border-b border-green-500/20 bg-black/20" dir="ltr">
                <div className="flex items-center gap-4">
                    <Radar />
                    <div>
                        <h2 className="text-xl text-green-400 font-bold tracking-widest">PsyEgypt COMMAND</h2>
                        <p className="text-xs text-green-600">SYS: ONLINE // OS v1.0</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl text-white font-bold">{gameState.score.toString().padStart(6, '0')}</div>
                    <div className="text-xs text-green-500">STREAK: {gameState.streak}</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center relative">
                
                {/* FAILURE OVERLAY (Mastery Loop) */}
                {gameState.feedback && gameState.feedback.status === 'failure' && (
                    <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                        <div className="bg-red-900/20 border border-red-500 p-6 rounded-lg max-w-lg w-full text-center">
                            <h2 className="text-2xl text-red-500 font-bold mb-4">
                                {isAr ? 'خطأ في النشر' : 'DEPLOYMENT ERROR'}
                            </h2>
                            <p className="text-gray-300 mb-6" dir={isAr ? 'rtl' : 'ltr'}>
                                {gameState.feedback.text}
                            </p>
                            <button 
                                onClick={onRetry}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded w-full"
                            >
                                {isAr ? 'المحاولة مرة أخرى' : 'RETRY MISSION'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Crisis Monitor */}
                <div className="w-full max-w-3xl bg-black/60 border border-green-500/50 p-6 rounded-xl shadow-lg mb-8 relative">
                    <div className="absolute top-2 left-2 text-xs text-red-500 animate-pulse">● LIVE SIGNAL</div>
                    <h3 className={`text-gray-400 text-sm mb-2 mt-2 ${isAr ? 'text-right' : 'text-left'}`}>
                        {isAr ? ':تقرير الأزمة الوارد' : 'INCOMING CRISIS REPORT:'}
                    </h3>
                    <p dir={isAr ? 'rtl' : 'ltr'} className="text-xl text-white leading-relaxed tracking-wide typing-effect">
                        {gameState.currentMission?.alert_text}
                    </p>
                </div>

                {/* Deployment Deck */}
                <div className="w-full max-w-4xl">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-green-500/80 text-sm tracking-widest">
                            {isAr ? '- نشر المتخصص -' : '- DEPLOY SPECIALIST -'}
                        </h3>
                        <button onClick={onExit} className="text-gray-500 text-xs hover:text-white underline">
                            {isAr ? 'خروج من النظام' : 'LOGOUT'}
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" dir={isAr ? 'rtl' : 'ltr'}>
                        {Object.entries(SPECIALTY_MAP).map(([id, labels]) => (
                            <DeploymentCard 
                                key={id} 
                                specialtyId={id as SpecialtyId} 
                                label={isAr ? labels.ar : labels.en} 
                                onClick={onDeploy} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- STANDARD CHAT COMPONENTS ---

const ChatBubble = (props) => {
    const { message, onChoiceClick, onToggleAudio, language, audioPlayback, isAudioLoading, isSoundEnabled, renderChoices } = props;
    const isAi = message.sender === 'ai';
    const [isCopied, setIsCopied] = React.useState(false);

    const containerClasses = `flex w-full my-2 ${isAi ? 'justify-start' : 'justify-end'} animate-slide-in-up`;
    const contentClasses = `flex items-start gap-2.5 ${isAi ? 'flex-row' : 'flex-row-reverse'}`;
    const bubbleRadius = isAi ? 'rounded-tl-none' : 'rounded-tr-none';
    const bubbleColor = isAi ? 'bg-ai-bubble backdrop-blur-sm' : 'bg-user-bubble';
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

    const LinkRenderer = (props) => {
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
                    <div className={`flex flex-col p-3 text-sm text-white ${bubbleColor} rounded-xl ${bubbleRadius}`}>
                        {typeof message.text === 'string' ? (
                            <div dir="auto" className="prose prose-invert prose-p:my-1 prose-a:text-brand-accent prose-a:hover:underline">
                                <ReactMarkdown components={{ a: LinkRenderer }}>
                                    {message.text}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            message.text
                        )}
                    </div>
                    
                    {isAi && (
                        <div className="mt-2 flex items-center gap-1 bg-ai-bubble/80 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
                            {isSoundEnabled && textContent && (
                                <button onClick={() => onToggleAudio(textContent, message.id)} className="p-1.5 rounded-full hover:bg-brand-secondary/20 transition-colors" aria-label="Play audio">
                                    {getAudioIcon()}
                                </button>
                            )}
                            <button onClick={handleCopy} className="p-1.5 rounded-full hover:bg-brand-secondary/20 transition-colors" aria-label="Copy text">
                                {isCopied ? <CheckIcon /> : <CopyIcon />}
                            </button>
                        </div>
                    )}

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
                        {renderChoices && message.choices?.map((choice, index) => (
                            <ChoiceButton key={index} choice={choice} onClick={onChoiceClick} />
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{message.timestamp}</div>
                </div>
            </div>
        </div>
    );
};

export const ChatWindow = ({
  messages,
  isLoading,
  onChoiceClick,
  language,
  onToggleAudio,
  audioPlayback,
  isAudioLoading,
  isSoundEnabled,
  quizProgressText,
  controlRoomState,
  onDeploy,
  onNextMission,
  onExitGame,
  retryMission
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // If Game Mode is active, render the HUD instead of standard chat
  if (controlRoomState && controlRoomState.active) {
      return (
        <div className="flex-1 relative bg-gray-900 border-x border-gray-800">
            <ControlRoomUI 
                gameState={controlRoomState} 
                onDeploy={onDeploy} 
                onNext={onNextMission} 
                onExit={onExitGame}
                onRetry={retryMission} // Pass the new retry function
                onBridge={(key) => onChoiceClick(`bridge_${key}`)}
                language={language}
            />
        </div>
      );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
      {quizProgressText && (
        <div className="sticky top-0 z-10 bg-brand-primary/80 backdrop-blur-sm p-2 mb-2 rounded-lg text-center text-sm font-semibold text-gray-300 shadow-md animate-fade-in">
          {quizProgressText}
        </div>
      )}
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
          renderChoices={messages.indexOf(message) === messages.length - 1 && !isLoading}
        />
      ))}
      {isLoading && (
        <div className="flex justify-start my-2 animate-slide-in-up">
          <div className="flex items-start gap-2.5">
            <BotIcon />
            <div className="flex items-center space-x-2 bg-ai-bubble p-3 rounded-xl rounded-tl-none">
              <ThinkingIcon />
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
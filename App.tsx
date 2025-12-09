
import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChatManager } from './hooks';
import { ChatWindow } from './components/ChatWindow';
import { RefreshIcon, SpeakerIcon, AudioOffIcon, LogoIcon, HomeIcon, ExploreIcon, TrainingIcon, BotIcon, ThinkingIcon, QnaIcon, DataIcon, ReportIcon } from './components/icons';
import ChoiceButton from './components/ChoiceButton';
import egyptArContent from './content/egypt-ar';
import egyptEnContent from './content/egypt-en';
import usaEnContent from './content/usa-en';

const App = () => {
  const [country, setCountry] = useState(null);
  const [language, setLanguage] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);

  const {
    messages,
    isLoading,
    quizState,
    handleChoice,
    startOver: resetChat,
    audioPlayback,
    isAudioLoading,
    isSoundEnabled,
    handleToggleAudio,
    setIsSoundEnabled,
    hakeemState
  } = useChatManager(currentContent);

  useEffect(() => {
    if (country && language) {
        const contentMap = {
            'egypt-ar': egyptArContent,
            'egypt-en': egyptEnContent,
            'usa-en': usaEnContent,
        };
        const key = `${country}-${language}`;
        const content = contentMap[key];
        setCurrentContent(content || null);
    }
  }, [country, language]);

  const startOver = useCallback(() => {
    setCountry(null);
    setLanguage(null);
    setCurrentContent(null);
    resetChat();
  }, [resetChat]);

  const quizProgressText = currentContent?.quizProgressText && quizState.active && quizState.educationLevel
    ? currentContent.quizProgressText
        .replace('{current}', (quizState.currentQuestion + 1).toString())
        .replace('{total}', currentContent.careerDiscoveryQuiz.questions.length.toString())
    : null;

  // Configuration for footer navigation buttons.
  // This makes the footer easier to manage and update.
  const footerButtons = [
    { id: 'main_menu', icon: <HomeIcon />, payload: 'main_menu', visible: true },
    { id: 'explore_paths', icon: <ExploreIcon />, payload: 'explore_paths', visible: true },
    { id: 'qna_start', icon: <QnaIcon />, payload: 'qna_start', visible: !!currentContent?.fixedQna },
    { id: 'career_insights', icon: <DataIcon />, payload: 'career_insights', visible: !!currentContent?.careerInsights },
    { id: 'workforce_data', icon: <DataIcon />, payload: 'workforce_data', visible: !!currentContent?.workforceData },
    { id: 'our_report', icon: <ReportIcon />, payload: 'our_report', visible: !!currentContent?.ourReport },
  ];

  if (!country || !language) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-primary p-4">
        <div className="text-center bg-black/20 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl max-w-lg w-full animate-fade-in">
          <div className="animate-pulse-logo">
            <LogoIcon />
          </div>
          <h1 className="text-3xl font-bold text-white">Psychology <span className="text-brand-secondary">Career Pathfinder</span></h1>
          <p className="text-gray-300 mt-2">Your guide to a future in psychology, powered by AI.</p>
          <p className="text-gray-400 mt-6 font-semibold">Please select your region to continue</p>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Egypt Card */}
            <div className="bg-brand-primary/50 p-4 rounded-lg border border-white/10">
              <h2 className="text-xl font-bold text-white mb-3">Egypt</h2>
              <div className="space-y-2">
                <button
                    onClick={() => { setCountry('egypt'); setLanguage('en'); }}
                    className="w-full bg-brand-secondary hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                    English
                </button>
                <button
                    onClick={() => { setCountry('egypt'); setLanguage('ar'); }}
                    className="w-full bg-brand-accent hover:bg-yellow-500 text-brand-primary font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                    العربية
                </button>
              </div>
            </div>
            {/* USA Card */}
            <div className="bg-brand-primary/50 p-4 rounded-lg border border-white/10 flex flex-col justify-center">
              <h2 className="text-xl font-bold text-white mb-3">United States</h2>
               <button
                    onClick={() => { setCountry('usa'); setLanguage('en'); }}
                    className="w-full bg-brand-secondary hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                    Continue in English
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentContent) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-brand-primary">
            <ThinkingIcon />
        </div>
    );
  }

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="flex flex-col h-screen bg-brand-primary font-sans">
      <header className="flex items-center justify-between p-3 bg-ai-bubble/80 backdrop-blur-sm shadow-md z-10 border-b border-white/10">
        <div className="flex items-center gap-3">
            <BotIcon />
            <div>
                <h1 className="text-lg font-bold text-white">{currentContent.headerTitle}</h1>
                <h2 className="text-sm text-brand-secondary">{currentContent.headerSubtitle}</h2>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsSoundEnabled(prev => !prev)} className="p-2 rounded-full hover:bg-brand-secondary/20 transition-colors" aria-label={isSoundEnabled ? "Disable sound" : "Enable sound"}>
                {isSoundEnabled ? <SpeakerIcon /> : <AudioOffIcon />}
            </button>
            <button onClick={startOver} className="p-2 rounded-full hover:bg-brand-secondary/20 transition-colors" aria-label="Start over">
                <RefreshIcon />
            </button>
        </div>
      </header>
      
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        onChoiceClick={handleChoice}
        language={language}
        onToggleAudio={handleToggleAudio}
        audioPlayback={audioPlayback}
        isAudioLoading={isAudioLoading}
        isSoundEnabled={isSoundEnabled}
        quizProgressText={quizProgressText}
      />
      
      <footer className="p-3 bg-ai-bubble/80 backdrop-blur-sm border-t border-white/10">
          <div className="flex items-center justify-center gap-2">
              {footerButtons.filter(btn => btn.visible).map(btn => (
                <ChoiceButton 
                    key={btn.id} 
                    choice={{ text: btn.icon, payload: btn.payload, type: 'secondary' }} 
                    onClick={handleChoice} 
                />
              ))}
          </div>
      </footer>
    </div>
  );
};

export default App;

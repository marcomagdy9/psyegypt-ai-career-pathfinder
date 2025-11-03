
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message, Choice, GroundingSource } from './types';
import { ChatWindow } from './components/ChatWindow';
import { getChatResponseStream, getAnalysisResponseStream, generateSpeech } from './services/geminiService';
import { SendIcon, RefreshIcon, SpeakerIcon, AudioOffIcon, LogoIcon, HomeIcon, ExploreIcon, QuizIcon, TrainingIcon, BotIcon, ThinkingIcon } from './components/icons';
import ChoiceButton from './components/ChoiceButton';
import egyptArContent from './content/egypt-ar';
import egyptEnContent from './content/egypt-en';
import usaEnContent from './content/usa-en';

const DISTRESS_KEYWORDS = ['depressed', 'suicidal', 'hopeless', 'can\'t go on', 'anxious', 'sad', 'hurting', 'kill myself', 'مكتئب', 'انتحار', 'يأس'];

// FIX: Added audio decoding functions as per Gemini API documentation for TTS.
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // FIX: Corrected typo from Int18Array to Int16Array.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

type AppMode = 'chat' | 'analysis';

const App: React.FC = () => {
  const [country, setCountry] = useState<'egypt' | 'usa' | null>(null);
  const [language, setLanguage] = useState<'en' | 'ar' | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AppMode>('chat');
  const [chatHistory, setChatHistory] = useState<{ role: string; parts: { text: string }[] }[]>([]);
  
  const [currentContent, setCurrentContent] = useState<any>(null);
  
  // Audio state
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [audioPlayback, setAudioPlayback] = useState<{messageId: number | null, status: 'playing' | 'paused'}>({ messageId: null, status: 'paused'});
  const [isAudioLoading, setIsAudioLoading] = useState<number | null>(null);

  // Quiz state
  const [quizState, setQuizState] = useState<{
    active: boolean;
    currentQuestion: number;
    answers: Record<string, number>;
    educationLevel: string | null;
  }>({
    active: false,
    currentQuestion: 0,
    answers: {},
    educationLevel: null,
  });

  useEffect(() => {
    if (country && language) {
        const contentMap = {
            'egypt-ar': egyptArContent,
            'egypt-en': egyptEnContent,
            'usa-en': usaEnContent,
        };
        const key = `${country}-${language}` as keyof typeof contentMap;
        const content = contentMap[key];

        if (content) {
            setCurrentContent(content);
        } else {
            console.error(`Failed to load content for ${country}-${language}`);
            setCurrentContent(null);
        }
    }
  }, [country, language]);


  const stopAudioPlayback = useCallback(() => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
    }
    setAudioPlayback({ messageId: null, status: 'paused' });
  }, []);

  const handleToggleAudio = useCallback(async (text: string, messageId: number) => {
      if (!isSoundEnabled) return;
      
      if (audioPlayback.messageId === messageId && audioPlayback.status === 'playing') {
          if (audioSourceRef.current) {
              audioSourceRef.current.stop();
          }
          setAudioPlayback({ messageId, status: 'paused' });
          return;
      }
      
      stopAudioPlayback();

      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      setIsAudioLoading(messageId);
      
      try {
          const base64Audio = await generateSpeech(text);
          const audioData = decode(base64Audio);
          const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
          
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          source.start(0);
          
          source.onended = () => {
              if (audioPlayback.messageId === messageId) {
                  setAudioPlayback({ messageId: null, status: 'paused' });
              }
          };

          audioSourceRef.current = source;
          setAudioPlayback({ messageId, status: 'playing' });
      } catch (error) {
          console.error("Failed to play audio:", error);
      } finally {
          setIsAudioLoading(null);
      }
  }, [isSoundEnabled, audioPlayback, stopAudioPlayback]);


  const addMessage = useCallback((text: Message['text'], sender: 'user' | 'ai', choices: Choice[] = [], sources: GroundingSource[] = []) => {
    const newMessage: Message = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      choices,
      sources,
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const getMainMenuMessage = useCallback((): Message => {
    const mainMenuChoices: Choice[] = [
      { text: currentContent.mainMenu.explore, payload: 'explore_paths' },
      { text: currentContent.mainMenu.discoveryQuiz, payload: 'discovery_quiz' },
      { text: currentContent.mainMenu.training, payload: 'career_training' },
      { text: currentContent.mainMenu.expertQuestion, payload: 'expert_question' },
      { text: currentContent.mainMenu.team, payload: 'team' },
      { text: currentContent.mainMenu.whatsNew, payload: 'whats_new' },
      { text: currentContent.mainMenu.aboutUs, payload: 'about_us' },
    ];
    const aiMessage: Message = {
      id: Date.now() + 1,
      text: currentContent.helpfulPrompt,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      choices: mainMenuChoices
    };
    return aiMessage;
  }, [currentContent]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || userInput;
    if (!textToSend.trim() || !language || !country) return;
    
    stopAudioPlayback();
    
    const lowercasedText = textToSend.toLowerCase();
    const isDistress = DISTRESS_KEYWORDS.some(keyword => lowercasedText.includes(keyword));

    if (isDistress) {
      addMessage(textToSend, 'user');
      addMessage(currentContent.distressMessage, 'ai');
      setUserInput('');
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    const aiMessageId = Date.now() + 1;
    const placeholderMessage: Message = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: [],
    };
    setMessages(prev => [...prev, placeholderMessage]);

    try {
        let fullText = '';
        let allSources: GroundingSource[] = [];

        if (currentMode === 'chat') {
            const stream = getChatResponseStream(chatHistory, textToSend, language, country);
            for await (const chunk of stream) {
                fullText += chunk.text;
                if (chunk.sources.length > 0) {
                    const newSources = chunk.sources.filter(
                        (s: GroundingSource) => !allSources.some(as => as.uri === s.uri)
                    );
                    allSources = [...allSources, ...newSources];
                }
                
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId ? { ...msg, text: fullText, sources: allSources } : msg
                ));
            }
        } else { // analysis mode
            const stream = getAnalysisResponseStream(textToSend, language, country);
            for await (const chunk of stream) {
                fullText += chunk;
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId ? { ...msg, text: fullText } : msg
                ));
            }
        }
        
        setChatHistory(prev => [
            ...prev,
            { role: 'user', parts: [{ text: textToSend }] },
            { role: 'model', parts: [{ text: fullText }] }
        ]);

        setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { 
                ...msg, 
                choices: [
                    { text: currentContent.quickNav.mainMenu, payload: 'main_menu' },
                    { text: currentContent.quickNav.discoveryQuiz, payload: 'discovery_quiz' },
                    { text: currentContent.quickNav.training, payload: 'career_training' },
                ]
            } : msg
        ));

    } catch (error) {
        console.error("API Error:", error);
        setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: "Sorry, I encountered an error. Please try again." } : msg
        ));
    } finally {
        setIsLoading(false);
    }
  }, [userInput, language, country, addMessage, currentMode, chatHistory, stopAudioPlayback, currentContent]);


  // Quiz Logic
  const startQuiz = useCallback(() => {
      setQuizState({ active: true, currentQuestion: 0, answers: {}, educationLevel: null });
      addMessage(currentContent.careerDiscoveryQuiz.startMessage, 'ai', [
          { text: currentContent.careerDiscoveryQuiz.educationLevels.thanwya, payload: 'edu_thanwya'},
          { text: currentContent.careerDiscoveryQuiz.educationLevels.ba, payload: 'edu_ba'},
          { text: currentContent.careerDiscoveryQuiz.educationLevels.ma, payload: 'edu_ma'},
          { text: currentContent.careerDiscoveryQuiz.educationLevels.phd, payload: 'edu_phd'},
      ]);
  }, [currentContent, addMessage]);

  const handleQuizAnswer = useCallback((payload: string) => {
      if (!quizState.active) return;
      
      const category = payload.split('_')[1];
      const newAnswers = { ...quizState.answers };
      newAnswers[category] = (newAnswers[category] || 0) + 1;

      const nextQuestionIndex = quizState.currentQuestion + 1;
      
      if (nextQuestionIndex < currentContent.careerDiscoveryQuiz.questions.length) {
          setQuizState(prevState => ({
              ...prevState,
              currentQuestion: nextQuestionIndex,
              answers: newAnswers,
          }));
          const nextQuestion = currentContent.careerDiscoveryQuiz.questions[nextQuestionIndex];
          addMessage(nextQuestion.question, 'ai', nextQuestion.answers);
      } else {
          setQuizState(prevState => ({ ...prevState, active: false }));
          endQuiz(newAnswers, quizState.educationLevel as string);
      }
  }, [quizState, currentContent, addMessage]);
  
  const endQuiz = useCallback((finalAnswers: Record<string, number>, educationLevel: string) => {
    const sortedResults = Object.entries(finalAnswers).sort(([,a],[,b]) => b-a);
    const topCategoryKey = sortedResults[0][0] as keyof typeof currentContent.careerDiscoveryQuiz.results;
    
    const results = currentContent.careerDiscoveryQuiz.results;
    const topResult = results[topCategoryKey] as { title: string; description: string; roles: Record<string, string> };

    let resultText = `${results.header}\n\n### 1. ${topResult.title}\n${topResult.description}\n\n**Potential Roles for you:** ${topResult.roles[educationLevel] || topResult.roles.ba}\n\n`;

    if (sortedResults.length > 1) {
        const secondCategoryKey = sortedResults[1][0] as keyof typeof currentContent.careerDiscoveryQuiz.results;
        const secondResult = results[secondCategoryKey] as { title: string; description: string; roles: Record<string, string> };
        resultText += `### 2. ${secondResult.title}\n${secondResult.description}\n\n`;
    }

    if (educationLevel === 'thanwya') {
      resultText += `> ${results.trainingPlan.replace('{clusterTitle}', topResult.title)}\n\n`;
    }
    
    resultText += results.closing;

    addMessage(resultText, 'ai', [
        { text: currentContent.mainMenu.explore, payload: 'explore_paths'},
        { text: currentContent.mainMenu.training, payload: 'career_training'},
        { text: currentContent.navigation.mainMenu, payload: 'main_menu'},
    ]);

  }, [currentContent, addMessage]);
  
  const startOver = useCallback(() => {
    stopAudioPlayback();
    setCountry(null);
    setLanguage(null);
    setMessages([]);
    setChatHistory([]);
    setUserInput('');
    setIsLoading(false);
    setCurrentMode('chat');
    setQuizState({
        active: false,
        currentQuestion: 0,
        answers: {},
        educationLevel: null,
    });
  }, [stopAudioPlayback]);

  const handleChoice = useCallback(async (payload: string) => {
    stopAudioPlayback();

    if (payload === 'main_menu') {
      setCurrentMode('chat');
      const userMessage: Message = {
        id: Date.now(),
        text: currentContent.navigation.mainMenu,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const aiMessage = getMainMenuMessage();
      setMessages(prev => [...prev, userMessage, aiMessage]);
      return;
    }
    
    let choiceText = '';
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.choices) {
        const choice = lastMessage.choices.find(c => c.payload === payload);
        if (choice && typeof choice.text === 'string') {
            choiceText = choice.text;
        } else if (payload === 'yes') {
            choiceText = 'Yes';
        } else if (payload === 'no') {
            choiceText = 'No';
        }
    }
    if (!choiceText) {
        if (payload === 'explore_paths') choiceText = currentContent.mainMenu.explore;
        else if (payload === 'discovery_quiz') choiceText = currentContent.mainMenu.discoveryQuiz;
        else if (payload === 'career_training') choiceText = currentContent.mainMenu.training;
    }

    if (choiceText) {
      const userMessage: Message = {
        id: Date.now(),
        text: choiceText,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, userMessage]);
    }
    
    if (quizState.active) {
        if (payload.startsWith('edu_')) {
            const level = payload.split('_')[1];
            setQuizState(prev => ({ ...prev, educationLevel: level }));
            const firstQuestion = currentContent.careerDiscoveryQuiz.questions[0];
            addMessage(currentContent.careerDiscoveryQuiz.readyMessage + "\n\n" + firstQuestion.question, 'ai', firstQuestion.answers);
        } else if (payload.startsWith('q')) {
            handleQuizAnswer(payload);
        }
        return;
    }

    const getLicensingChoices = (excludePayload?: string): Choice[] => {
      const choices: Choice[] = [];
      const menu = currentContent.clinicalLicensingSubMenu;
      const allPayloads: { [key: string]: string } = {
          'licensing_edu': menu.educational,
          'licensing_training': menu.training,
          'licensing_fees': menu.fees,
          'licensing_scope': menu.scope,
      };

      for (const [p, text] of Object.entries(allPayloads)) {
          if (p !== excludePayload) {
              choices.push({ text, payload: p });
          }
      }
      choices.push({ text: currentContent.navigation.backToClinical, payload: 'explore_clinical' });
      return choices;
    }

    // Main navigation logic
    if (payload === 'discovery_quiz') {
        startQuiz();
    } else if (payload === 'expert_question') {
        addMessage(currentContent.expertQuestionPrompt, 'ai');
        setCurrentMode('analysis');
    } else if (payload === 'team') {
        addMessage(currentContent.team.prompt, 'ai', [
            { text: currentContent.team.menu.jaye, payload: 'team_jaye' },
            { text: currentContent.team.menu.marco, payload: 'team_marco' },
            { text: currentContent.navigation.mainMenu, payload: 'main_menu' },
        ]);
    } else if (payload === 'team_jaye') {
        const jaye = currentContent.team.jaye;
        const message = `### ${jaye.title}\n*${jaye.subtitle}*\n\n**Bio:** ${jaye.bio}\n\n**Mission:** ${jaye.mission}\n\n> **Expert Advice:** "${jaye.quote}"`;
        addMessage(message, 'ai', [
            { text: currentContent.team.menu.marco, payload: 'team_marco' },
            { text: currentContent.navigation.backToClinical, payload: 'explore_clinical' },
            { text: currentContent.navigation.mainMenu, payload: 'main_menu' }
        ]);
    } else if (payload === 'team_marco') {
        const marco = currentContent.team.marco;
        const message = `### ${marco.title}\n*${marco.subtitle}*\n\n**Bio:** ${marco.bio}\n\n**Mission:** ${marco.mission}\n\n> **Creator's Vision:** "${marco.quote}"`;
        addMessage(message, 'ai', [
            { text: currentContent.team.menu.jaye, payload: 'team_jaye' },
            { text: currentContent.navigation.mainMenu, payload: 'main_menu' }
        ]);
    } else if (payload === 'career_training') {
        addMessage(currentContent.careerTraining.prompt, 'ai', [
            { text: currentContent.careerTraining.menu.undergrad, payload: 'training_undergrad' },
            { text: currentContent.careerTraining.menu.byPath, payload: 'training_by_path' }
        ]);
    } else if (payload === 'training_undergrad') {
        addMessage(currentContent.careerTraining.undergradContent, 'ai', [
            { text: currentContent.careerTraining.menu.byPath, payload: 'training_by_path' },
            { text: currentContent.navigation.mainMenu, payload: 'main_menu' }
        ]);
    } else if (payload === 'training_by_path') {
        addMessage(currentContent.careerTraining.byPathPrompt, 'ai', [
            { text: currentContent.careerTraining.byPathMenu.clinical, payload: 'training_path_clinical' },
            { text: currentContent.careerTraining.byPathMenu.organizational, payload: 'training_path_organizational' },
            { text: currentContent.careerTraining.byPathMenu.research, payload: 'training_path_research' },
            { text: currentContent.careerTraining.byPathMenu.tech, payload: 'training_path_tech' }
        ]);
    } else if (payload === 'training_path_clinical') {
        addMessage(currentContent.careerTraining.clinicalContent, 'ai', [{ text: currentContent.navigation.mainMenu, payload: 'main_menu' }]);
    } else if (payload === 'training_path_organizational') {
        addMessage(currentContent.careerTraining.organizationalContent, 'ai', [{ text: currentContent.navigation.mainMenu, payload: 'main_menu' }]);
    } else if (payload === 'training_path_research') {
        addMessage(currentContent.careerTraining.researchContent, 'ai', [{ text: currentContent.navigation.mainMenu, payload: 'main_menu' }]);
    } else if (payload === 'training_path_tech') {
        addMessage(currentContent.careerTraining.techContent, 'ai', [{ text: currentContent.navigation.mainMenu, payload: 'main_menu' }]);
    } else if (payload === 'whats_new') {
        addMessage(`### ${currentContent.whatsNewTitle}\n${currentContent.whatsNewContent}`, 'ai', [
          { text: currentContent.navigation.mainMenu, payload: 'main_menu' }
        ]);
    } else if (payload === 'about_us') {
      addMessage(currentContent.aboutUsContent, 'ai', [
        { text: currentContent.navigation.mainMenu, payload: 'main_menu' }
      ]);
    } else if (payload === 'explore_paths') {
      addMessage(currentContent.exploreSubMenuPrompt, 'ai', [
        { text: currentContent.exploreSubMenu.bachelors, payload: 'explore_bachelors' },
        { text: currentContent.exploreSubMenu.advanced, payload: 'explore_advanced' }
      ]);
    } else if (payload === 'explore_bachelors') {
      addMessage(currentContent.bachelorsHookPrompt, 'ai', [
        { text: currentContent.bachelorsSubMenu.pathOverview, payload: 'bachelors_overview' },
        { text: currentContent.bachelorsSubMenu.coreSkills, payload: 'bachelors_skills' },
        { text: currentContent.navigation.backToExplore, payload: 'explore_paths' }
      ]);
    } else if (payload === 'bachelors_overview') {
      addMessage(currentContent.bachelorsPathOverview, 'ai', [
        { text: currentContent.bachelorsSubMenu.coreSkills, payload: 'bachelors_skills' },
        { text: currentContent.navigation.backToBachelors, payload: 'explore_bachelors' }
      ]);
    } else if (payload === 'bachelors_skills') {
      addMessage(currentContent.bachelorsSkillsContent, 'ai', [
        { text: currentContent.bachelorsSubMenu.pathOverview, payload: 'bachelors_overview' },
        { text: currentContent.navigation.backToBachelors, payload: 'explore_bachelors' },
      ]);
    } else if (payload === 'explore_advanced') {
        addMessage(currentContent.advancedSubMenuPrompt, 'ai', [
            { text: currentContent.advancedSubMenu.clinical, payload: 'explore_clinical' },
            { text: currentContent.advancedSubMenu.academic, payload: 'explore_academic' },
            { text: currentContent.navigation.backToExplore, payload: 'explore_paths' }
        ]);
    } 
    // Clinical Path
    else if (payload === 'explore_clinical') {
        addMessage(currentContent.clinicalHookPrompt, 'ai', [
            { text: currentContent.clinicalSubMenu.pathOverview, payload: 'clinical_overview' },
            { text: currentContent.clinicalSubMenu.coreSkills, payload: 'clinical_skills' },
            { text: currentContent.clinicalSubMenu.licensing, payload: 'clinical_licensing' },
            { text: currentContent.clinicalSubMenu.hearStory, payload: 'team_jaye' },
            { text: currentContent.navigation.compareAcademic, payload: 'explore_academic' },
            { text: currentContent.navigation.backToExplore, payload: 'explore_paths' }
        ]);
    } else if (payload === 'clinical_overview') {
        addMessage(currentContent.clinicalPathOverview, 'ai', [
            { text: currentContent.clinicalSubMenu.coreSkills, payload: 'clinical_skills' },
            { text: currentContent.clinicalSubMenu.licensing, payload: 'clinical_licensing' },
            { text: currentContent.navigation.backToClinical, payload: 'explore_clinical' }
        ]);
    } else if (payload === 'clinical_licensing') {
        addMessage(country === 'egypt' ? currentContent.clinicalLicensing : currentContent.clinicalLicensingHook, 'ai', getLicensingChoices());
    } else if (payload === 'licensing_edu') {
        addMessage(currentContent.clinicalLicensingEducational, 'ai', getLicensingChoices(payload));
    } else if (payload === 'licensing_training') {
        addMessage(currentContent.clinicalLicensingTraining, 'ai', getLicensingChoices(payload));
    } else if (payload === 'licensing_fees') {
        addMessage(currentContent.clinicalLicensingFees, 'ai', getLicensingChoices(payload));
    } else if (payload === 'licensing_scope') {
        addMessage(currentContent.clinicalLicensingScope, 'ai', getLicensingChoices(payload));
    } else if (payload === 'clinical_skills') {
        addMessage(currentContent.coreSkillsPrompt, 'ai', [
            { text: currentContent.coreSkillsSubMenu.moreOnListening, payload: 'more_on_listening' },
            { text: currentContent.coreSkillsSubMenu.nextSkill, payload: 'next_skill' },
            { text: currentContent.navigation.backToClinical, payload: 'explore_clinical' }
        ]);
    } else if (payload === 'more_on_listening') {
        addMessage(currentContent.listeningContent, 'ai', [
            { text: currentContent.coreSkillsSubMenu.nextSkill, payload: 'next_skill' },
            { text: currentContent.navigation.backToClinical, payload: 'explore_clinical' }
        ]);
    } else if (payload === 'next_skill') {
        addMessage(currentContent.nextSkillContent, 'ai', [
            { text: currentContent.coreSkillsSubMenu.moreOnListening, payload: 'more_on_listening' },
            { text: currentContent.navigation.backToClinical, payload: 'explore_clinical' }
        ]);
    }
    // Academic Path
    else if (payload === 'explore_academic') {
      addMessage(currentContent.academicHookPrompt, 'ai', [
          { text: currentContent.academicSubMenu.pathOverview, payload: 'academic_overview' },
          { text: currentContent.academicSubMenu.coreSkills, payload: 'academic_skills' },
          { text: currentContent.academicSubMenu.getPublished, payload: 'academic_publishing' },
          { text: currentContent.navigation.compareClinical, payload: 'explore_clinical' },
          { text: currentContent.navigation.backToExplore, payload: 'explore_paths' }
      ]);
    } else if (payload === 'academic_overview') {
        addMessage(currentContent.academicPathOverview, 'ai', [
            { text: currentContent.academicSubMenu.coreSkills, payload: 'academic_skills' },
            { text: currentContent.academicSubMenu.getPublished, payload: 'academic_publishing' },
            { text: currentContent.navigation.backToAcademic, payload: 'explore_academic' }
        ]);
    } else if (payload === 'academic_skills') {
        addMessage(currentContent.academicSkills.prompt, 'ai', [
            { text: currentContent.academicSkills.menu.design, payload: 'academic_skill_design' },
            { text: currentContent.academicSkills.menu.stats, payload: 'academic_skill_stats' },
            { text: currentContent.academicSkills.menu.writing, payload: 'academic_skill_writing' },
            { text: currentContent.navigation.backToAcademic, payload: 'explore_academic' }
        ]);
    } else if (payload === 'academic_skill_design') {
        addMessage(currentContent.academicSkills.designContent, 'ai', [
            { text: currentContent.academicSkills.menu.stats, payload: 'academic_skill_stats' },
            { text: currentContent.academicSkills.menu.writing, payload: 'academic_skill_writing' },
            { text: currentContent.navigation.backToAcademic, payload: 'explore_academic' }
        ]);
    } else if (payload === 'academic_skill_stats') {
        addMessage(currentContent.academicSkills.statsContent, 'ai', [
            { text: currentContent.academicSkills.menu.design, payload: 'academic_skill_design' },
            { text: currentContent.academicSkills.menu.writing, payload: 'academic_skill_writing' },
            { text: currentContent.navigation.backToAcademic, payload: 'explore_academic' }
        ]);
    } else if (payload === 'academic_skill_writing') {
        addMessage(currentContent.academicSkills.writingContent, 'ai', [
            { text: currentContent.academicSkills.menu.design, payload: 'academic_skill_design' },
            { text: currentContent.academicSkills.menu.stats, payload: 'academic_skill_stats' },
            { text: currentContent.navigation.backToAcademic, payload: 'explore_academic' }
        ]);
    } else if (payload === 'academic_publishing') {
        addMessage(currentContent.academicPublishing.prompt, 'ai', [
            { text: currentContent.academicPublishing.menu.mentor, payload: 'academic_pub_mentor' },
            { text: currentContent.academicPublishing.menu.review, payload: 'academic_pub_review' },
            { text: currentContent.academicPublishing.menu.journal, payload: 'academic_pub_journal' },
            { text: currentContent.navigation.backToAcademic, payload: 'explore_academic' }
        ]);
    } else if (payload === 'academic_pub_mentor') {
        addMessage(currentContent.academicPublishing.mentorContent, 'ai', [
            { text: currentContent.academicPublishing.menu.review, payload: 'academic_pub_review' },
            { text: currentContent.navigation.backToAcademic, payload: 'explore_academic' }
        ]);
    } else if (payload === 'academic_pub_review') {
        addMessage(currentContent.academicPublishing.reviewContent, 'ai', [
            { text: currentContent.academicPublishing.menu.mentor, payload: 'academic_pub_mentor' },
            { text: currentContent.navigation.backToAcademic, payload: 'explore_academic' }
        ]);
    } else if (payload === 'academic_pub_journal') {
        addMessage(currentContent.academicPublishing.journalContent, 'ai', [
            { text: currentContent.academicPublishing.menu.mentor, payload: 'academic_pub_mentor' },
            { text: currentContent.navigation.backToAcademic, payload: 'explore_academic' }
        ]);
    }
    // Feedback flow
    else if (payload === 'yes' || payload === 'no') {
        addMessage(currentContent.feedbackThanks, 'ai', []);
        setTimeout(() => {
            const pollChoices: Choice[] = [
                { text: '1', payload: 'poll_1', type: 'secondary' },
                { text: '2', payload: 'poll_2', type: 'secondary' },
                { text: '3', payload: 'poll_3', type: 'secondary' },
                { text: '4', payload: 'poll_4', type: 'secondary' },
                { text: '5', payload: 'poll_5', type: 'secondary' },
            ];
            addMessage(currentContent.pollQuestion, 'ai', pollChoices);
        }, 500);
    } else if (payload.startsWith('poll_')) {
        addMessage(currentContent.pollThanks, 'ai', []);
        setTimeout(() => {
            const mainMenuMessage = getMainMenuMessage();
            setMessages(prev => [...prev, mainMenuMessage]);
        }, 1000);
    }
    // Session Management
    else if (payload === 'start_over') {
        startOver();
    } else if (payload === 'end_chat') {
        addMessage(currentContent.endChatPrompt, 'ai', [
            { text: currentContent.navigation.startOver, payload: 'start_over' }
        ]);
    }
  }, [messages, country, language, addMessage, handleQuizAnswer, quizState.active, getMainMenuMessage, currentContent, startOver, stopAudioPlayback]);

  // Initial welcome message logic
  useEffect(() => {
    if (currentContent && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now(),
        text: <ReactMarkdown>{currentContent.welcomeIntro}</ReactMarkdown>,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        choices: [
          { text: currentContent.mainMenu.explore, payload: 'explore_paths' },
          { text: currentContent.mainMenu.discoveryQuiz, payload: 'discovery_quiz' },
          { text: currentContent.mainMenu.training, payload: 'career_training' }
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [currentContent, messages.length]);
  
  const quizProgressText = currentContent && quizState.active && quizState.educationLevel
    ? currentContent.quizProgressText
        .replace('{current}', (quizState.currentQuestion + 1).toString())
        .replace('{total}', currentContent.careerDiscoveryQuiz.questions.length.toString())
    : null;


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
              <h2 className="text-xl font-bold text-white mb-3">Egypt & MENA Region</h2>
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
        <div className="flex items-center gap-2">
            <form
                onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
                }}
                className="flex-grow flex items-center bg-brand-primary/50 border border-brand-secondary/50 rounded-lg focus-within:ring-2 focus-within:ring-brand-accent transition-all duration-300"
            >
                <div className="flex items-center gap-1 p-1">
                    <ChoiceButton choice={{text: <HomeIcon/>, payload: 'main_menu', type: 'secondary'}} onClick={handleChoice} />
                    <ChoiceButton choice={{text: <ExploreIcon/>, payload: 'explore_paths', type: 'secondary'}} onClick={handleChoice} />
                    <ChoiceButton choice={{text: <QuizIcon/>, payload: 'discovery_quiz', type: 'secondary'}} onClick={handleChoice} />
                    <ChoiceButton choice={{text: <TrainingIcon/>, payload: 'career_training', type: 'secondary'}} onClick={handleChoice} />
                </div>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={currentContent.inputPlaceholder}
                  className="w-full p-3 bg-transparent focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="me-2 p-3 bg-brand-secondary rounded-lg text-white disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                  disabled={isLoading || !userInput.trim()}
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
            </form>
        </div>
      </footer>
    </div>
  );
};

export default App;

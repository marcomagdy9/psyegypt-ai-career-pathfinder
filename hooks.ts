import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateSpeech } from './services/geminiService';
import { fetchCrisisScenario } from './services/gameMasterService';
import { calculateRada, calculateResilience, detectScarcityMode } from './services/hakeemLogic';
import { SpecialtyId } from './types';

// --- AUDIO UTILITIES ---

function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data, ctx, sampleRate, numChannels) {
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

// --- SYNTHESIZED SFX (No Assets Required) ---
const playGameSound = (type: 'radar' | 'success' | 'fail') => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'radar') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } else if (type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
            osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); // C#5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        } else if (type === 'fail') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        }
    } catch (e) {
        // Silently fail if audio context not available
    }
};

// --- CUSTOM HOOK: useAudioPlayer ---

const TTS_SAMPLE_RATE = 24000;

const useAudioPlayer = () => {
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const audioContextRef = useRef(null);
    const audioSourceRef = useRef(null);
    const [audioPlayback, setAudioPlayback] = useState({ messageId: null, status: 'paused' });
    const [isAudioLoading, setIsAudioLoading] = useState(null);

    const stopAudioPlayback = useCallback(() => {
        if (audioSourceRef.current) {
            audioSourceRef.current.onended = null; 
            audioSourceRef.current.stop();
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }
        setAudioPlayback({ messageId: null, status: 'paused' });
    }, []);

    const handleToggleAudio = useCallback(async (text, messageId) => {
        if (!isSoundEnabled) return;

        if (audioPlayback.messageId === messageId && audioPlayback.status === 'playing') {
            stopAudioPlayback();
            setAudioPlayback({ messageId, status: 'paused' }); 
            return;
        }

        stopAudioPlayback();

        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext({ sampleRate: TTS_SAMPLE_RATE });
        }
         if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        setIsAudioLoading(messageId);

        try {
            const base64Audio = await generateSpeech(text);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, TTS_SAMPLE_RATE, 1);

            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start(0);

            source.onended = () => {
                if (audioSourceRef.current === source) {
                    setAudioPlayback({ messageId: null, status: 'paused' });
                    audioSourceRef.current = null;
                }
            };

            audioSourceRef.current = source;
            setAudioPlayback({ messageId, status: 'playing' });
        } catch (error) {
            console.error("Failed to play audio:", error);
            setAudioPlayback({ messageId: null, status: 'paused' });
        } finally {
            setIsAudioLoading(null);
        }
    }, [isSoundEnabled, audioPlayback, stopAudioPlayback]);

    return { isSoundEnabled, setIsSoundEnabled, audioPlayback, isAudioLoading, handleToggleAudio, stopAudioPlayback };
};


// --- CUSTOM HOOK: useQuiz (Standard Career Assessment) ---

const useQuiz = (currentContent, addMessage) => {
    const [quizState, setQuizState] = useState({
        active: false,
        currentQuestion: 0,
        answers: {},
        educationLevel: null
    });

    const startQuiz = useCallback(() => {
        if (!currentContent?.careerDiscoveryQuiz) return;
        setQuizState({ active: true, currentQuestion: 0, answers: {}, educationLevel: null });
        const { startMessage, educationLevels } = currentContent.careerDiscoveryQuiz;
        const choices = Object.entries(educationLevels).map(([key, value]) => ({ text: value, payload: `edu_${key}` }));
        addMessage(startMessage, 'ai', choices);
    }, [currentContent, addMessage]);

    const endQuiz = useCallback((finalAnswers, educationLevel) => {
        if (!currentContent?.careerDiscoveryQuiz) return;
        setQuizState(prev => ({ ...prev, active: false }));

        const sortedResults = Object.entries(finalAnswers).sort(([, a], [, b]) => (b as number) - (a as number));
        const topCategoryKey = sortedResults[0][0];
        const results = currentContent.careerDiscoveryQuiz.results;
        const topResult = results[topCategoryKey];

        const defaultRoleKey = currentContent.headerTitle.includes('PsyEgypt') ? 'ba' : 'bachelors';
        // Check for null educationLevel to prevent crash
        const educationLevelKey = educationLevel ? educationLevel.replace('edu_', '') : defaultRoleKey;
        const rolesText = topResult.roles[educationLevelKey] || topResult.roles[defaultRoleKey] || 'Explore entry-level roles!';
        
        let resultText = `${results.header}\n\n### 1. ${topResult.title}\n${topResult.description}\n\n**Potential Roles for you:** ${rolesText}\n\n`;
        if (sortedResults.length > 1) {
            const secondResult = results[sortedResults[1][0]];
            resultText += `### 2. ${secondResult.title}\n${secondResult.description}\n\n`;
        }
        
        const highSchoolKeys = ['thanwya', 'high_school', 'associates'];
        if (highSchoolKeys.includes(educationLevelKey)) {
            resultText += `> ${results.trainingPlan.replace('{clusterTitle}', topResult.title)}\n\n`;
        }
        
        resultText += results.closing;

        addMessage(resultText, 'ai', [
            { text: currentContent.mainMenu.explore_paths, payload: "explore_paths" },
            { text: currentContent.mainMenu.career_training, payload: "career_training" },
            { text: currentContent.quickNav.main_menu, payload: "main_menu" },
        ], results.nextSteps);
    }, [currentContent, addMessage]);

    const handleQuizAnswer = useCallback((payload) => {
        if (!quizState.active || !currentContent?.careerDiscoveryQuiz) return;
        const quizContent = currentContent.careerDiscoveryQuiz;

        if (payload.startsWith('edu_')) {
            const educationLevel = payload;
            setQuizState(prev => ({ ...prev, educationLevel }));
            addMessage(quizContent.readyMessage, 'ai');
            addMessage(
                quizContent.questions[0].question,
                'ai',
                quizContent.questions[0].answers
            );
            return;
        }

        const currentQuestionIndex = quizState.currentQuestion;
        const [question, category] = payload.split('_');
        const updatedAnswers = { ...quizState.answers };
        updatedAnswers[category] = (updatedAnswers[category] || 0) + 1;

        if (currentQuestionIndex + 1 < quizContent.questions.length) {
            setQuizState(prev => ({
                ...prev,
                currentQuestion: prev.currentQuestion + 1,
                answers: updatedAnswers,
            }));
            const nextQuestion = quizContent.questions[currentQuestionIndex + 1];
            addMessage(nextQuestion.question, 'ai', nextQuestion.answers);
        } else {
            endQuiz(updatedAnswers, quizState.educationLevel);
        }
    }, [quizState, currentContent, addMessage, endQuiz]);


    return { quizState, setQuizState, startQuiz, handleQuizAnswer };
};

// --- CUSTOM HOOK: useHakeem (The Deep Mirror - Decolonized 2.0) ---

const useHakeem = (currentContent, addMessage) => {
    const [hakeemState, setHakeemState] = useState({
        active: false,
        step: 0, 
        motive: null,    
        energy: null,    
        resilience: null,
        reality: null    
    });

    const finishHakeem = useCallback((finalState) => {
        setHakeemState({ ...finalState, active: false, step: 0 });
        
        const { motive, energy, resilience, reality } = finalState;

        // Safeguard: If state is incomplete (e.g. navigation interruption), exit gracefully without processing results
        if (!motive || !energy || !resilience || !reality) {
            return;
        }

        const resultsContent = currentContent.hakeemMirror.results;
        const modifiersContent = currentContent.hakeemMirror.modifiers;

        // --- HAKEEM ENGINE SCORING (Mapping Archetypes to Factors) ---
        // Motive: Status (Low Trust) vs Impact (High Trust)
        const trustScore = motive === 'hak_motive_impact' ? 5 : 2;
        
        // Energy: Healer (Competence) vs Fixer (Competence) vs Thinker (Competence)
        const competenceScore = 4; // Assuming all instincts are valid forms of competence
        
        // Resilience: Perfectionist (Low Change) vs Blamer (Low Control) vs Architect (High Change)
        let changeScore = 3;
        if (resilience === 'hak_resilience_perfectionist') changeScore = 1;
        if (resilience === 'hak_resilience_architect') changeScore = 5;

        // Reality: Idealist (Low Control/Efficacy) vs Pragmatist (High Control) vs Conformist (Low Efficacy)
        let controlScore = 3;
        if (reality === 'hak_reality_idealist') controlScore = 2; // Rigid
        if (reality === 'hak_reality_pragmatist') controlScore = 5; // Bricolage

        // RADA Calculation (Contentment)
        // Spiritual Coping mapped to Trust; Self Efficacy mapped to Control
        const radaResult = calculateRada(trustScore, controlScore, 2); // Default moderate distress
        
        // RESILIENCE Calculation
        const resilienceIndex = calculateResilience(competenceScore, trustScore, changeScore, controlScore);

        // 1. Base Profile Construction
        const baseKey = `${motive.replace('hak_motive_', '')}_${energy.replace('hak_energy_', '')}`;
        const baseResult = resultsContent[baseKey] || { title: "The Seeker", text: "Your path is unique." };
        
        let finalOutput = `### ${baseResult.title}\n\n${baseResult.text}\n\n`;
        
        // 2. Add Hakeem Metrics (Quantitative Insight)
        finalOutput += `#### 🧠 Hakeem Metrics (مؤشرات الحكيم)\n`;
        finalOutput += `*   **Resilience Index (الصمود):** ${resilienceIndex}/100\n`;
        finalOutput += `*   **Rada Score (الرضا):** ${radaResult.score}/100 - *${radaResult.status}*\n\n`;

        // 3. Wisdom Modifiers
        const resKey = resilience.replace('hak_resilience_', '');
        const realKey = reality.replace('hak_reality_', '');

        if (modifiersContent) {
            if (modifiersContent[resKey]) {
                finalOutput += `> **Wisdom on Failure:** ${modifiersContent[resKey]}\n\n`;
            }
            if (modifiersContent[realKey]) {
                finalOutput += `> **Wisdom on Reality:** ${modifiersContent[realKey]}\n\n`;
            }
        }

        addMessage(finalOutput, 'ai', [
            { text: currentContent.mainMenu.explore_paths, payload: "explore_paths" },
            { text: currentContent.quickNav.main_menu, payload: "main_menu" }
        ]);

    }, [currentContent, addMessage, setHakeemState]);

    const startHakeem = useCallback(() => {
        if (!currentContent?.hakeemMirror) return;
        setHakeemState({ 
            active: true, 
            step: 1, 
            motive: null, energy: null, resilience: null, reality: null
        });
        
        const { intro, questions } = currentContent.hakeemMirror;
        const q1 = questions[0];
        
        addMessage(intro, 'ai');
        setTimeout(() => {
            addMessage(q1.question, 'ai', q1.answers);
        }, 800);
    }, [currentContent, addMessage]);

    const handleHakeemAnswer = useCallback((payload) => {
        if (!hakeemState.active || !currentContent?.hakeemMirror) return;
        
        const { step } = hakeemState;
        
        const parts = payload ? payload.split('_') : [];
        const stateKey = parts[1]; // motive, energy, etc.
        
        const newState = {
            ...hakeemState,
            [stateKey]: payload
        };

        if (step < 4) {
            const nextStep = step + 1;
            const nextQ = currentContent?.hakeemMirror?.questions[nextStep - 1];

            if (!nextQ) {
                finishHakeem(newState);
            } else {
                setHakeemState({ ...newState, step: nextStep });
                addMessage(nextQ.question, 'ai', nextQ.answers);
            }
        } else {
            finishHakeem(newState);
        }

    }, [hakeemState, currentContent, addMessage, finishHakeem]);

    return { hakeemState, setHakeemState, startHakeem, handleHakeemAnswer };
}

// --- CUSTOM HOOK: useControlRoomAI (Infinite Strategy Mode with Scarcity Filter) ---

const ALL_SPECIALTIES: SpecialtyId[] = ['SPORTS', 'FORENSIC', 'CONSUMER', 'SCHOOL', 'MILITARY', 'COUNSELING', 'IO'];

const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const useControlRoomAI = (region, language) => {
    const [gameState, setGameState] = useState({
        active: false,
        loading: false,
        currentMission: null,
        score: 0,
        streak: 0,
        feedback: null,
        missionQueue: [] as SpecialtyId[],
        isScarcityMode: false
    });

    const initGame = useCallback(async () => {
        // Safe Loading Wrapper: Ensure we don't get stuck in loading state
        try {
            const deck = shuffleArray(ALL_SPECIALTIES);
            const targetId = deck.pop();

            setGameState(prev => ({ 
                ...prev, 
                active: true, 
                loading: true, 
                feedback: null, 
                score: 0, 
                streak: 0,
                missionQueue: deck,
                isScarcityMode: false
            }));
            
            playGameSound('radar');
            const mission = await fetchCrisisScenario(region, language, targetId, false);
            
            // Only update if we successfully got data
            setGameState(prev => ({ ...prev, loading: false, currentMission: mission }));
        } catch (error) {
            console.error("Critical Game Init Error:", error);
            // Emergency exit from loading state
            setGameState(prev => ({ 
                ...prev, 
                active: false, 
                loading: false,
                feedback: { status: 'failure', text: 'Connection Lost. Mission Aborted.' } 
            }));
        }
    }, [region, language]);

    const nextMission = useCallback(async () => {
        try {
            // Draw the next mission from the queue
            let currentQueue = [...gameState.missionQueue];
            
            // Refill and reshuffle if empty
            if (currentQueue.length === 0) {
                currentQueue = shuffleArray(ALL_SPECIALTIES);
            }
            
            const targetId = currentQueue.pop();

            setGameState(prev => ({ 
                ...prev, 
                loading: true, 
                feedback: null,
                missionQueue: currentQueue 
            }));
            
            playGameSound('radar');
            // Pass current scarcity mode to the fetch function
            const mission = await fetchCrisisScenario(region, language, targetId, gameState.isScarcityMode);
            setGameState(prev => ({ ...prev, loading: false, currentMission: mission }));
        } catch (error) {
            console.error("Mission Fetch Error:", error);
            // Handle error gracefully - keep previous mission but stop loading
            setGameState(prev => ({ 
                ...prev, 
                loading: false,
                feedback: { status: 'failure', text: 'Signal Interrupted. Retrying Secure Link...' } 
            }));
        }
    }, [region, language, gameState.missionQueue, gameState.isScarcityMode]);

    const deploySpecialist = useCallback((userChoiceId: SpecialtyId) => {
        if (!gameState.currentMission) return;
        
        const isCorrect = userChoiceId === gameState.currentMission.target_id;

        if (isCorrect) {
            // SUCCESS LOGIC: Reduce Scarcity Mode if active (Success relieves pressure - Bandwidth Recovery)
            playGameSound('success');
            setGameState(prev => ({
                ...prev,
                score: prev.score + 100 + (prev.streak * 10),
                streak: prev.streak + 1,
                isScarcityMode: false, // Success resets scarcity tunneling
                feedback: {
                    status: 'success',
                    text: `SUCCESS! ${gameState.currentMission.correct_reasoning}`,
                    learnMoreKey: gameState.currentMission.learn_more_key || 'explore_paths'
                }
            }));
        } else {
            // FAILURE LOGIC: Trigger Scarcity Mode on failure (Simulating stress/tunneling)
            playGameSound('fail');
            setGameState(prev => ({
                ...prev,
                score: Math.max(0, prev.score - 50), 
                streak: 0, 
                isScarcityMode: true, // Failure triggers Scarcity Mode for next generation
                feedback: {
                    status: 'failure',
                    text: language === 'ar' 
                        ? `نشر غير صحيح. حاول مرة أخرى. ركز على تكتيكات المهمة.`
                        : `INCORRECT DEPLOYMENT. Tactical mismatch. Analyze intelligence and RETRY.`
                }
            }));
        }
    }, [gameState.currentMission, language]);

    // Retry Mission: Clear feedback so user can interact with the deck again.
    const retryMission = useCallback(() => {
        setGameState(prev => ({ ...prev, feedback: null }));
    }, []);

    const exitGame = useCallback(() => {
        setGameState(prev => ({ ...prev, active: false, currentMission: null }));
    }, []);

    return { gameState, initGame, deploySpecialist, nextMission, retryMission, exitGame };
};


// --- CUSTOM HOOK: useChatManager ---

/**
 * The main hook to manage the entire chat application's state and logic.
 * @param {object} currentContent The content object for the selected language/country.
 * @param {string} country 'usa' or 'egypt'
 * @param {string} language 'en' or 'ar'
 */
export const useChatManager = (currentContent, country, language) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef(currentContent);

  useEffect(() => {
    contentRef.current = currentContent;
    if (currentContent && messages.length === 0) {
      addMessage(
        currentContent.welcomeIntro,
        'ai',
        Object.entries(currentContent.mainMenu).map(([key, value]) => ({ text: value, payload: key })),
        currentContent.placeholders.menu
      );
    }
  }, [currentContent]);

  const addMessage = useCallback((text, sender, choices = [], prompt = null) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessageId = `${Date.now()}-${sender}`;
    setMessages(prev => [...prev, { id: newMessageId, text, sender, choices, timestamp, prompt }]);
  }, []);

  const { isSoundEnabled, setIsSoundEnabled, audioPlayback, isAudioLoading, handleToggleAudio, stopAudioPlayback } = useAudioPlayer();
  const { quizState, setQuizState, startQuiz, handleQuizAnswer } = useQuiz(currentContent, addMessage);
  const { hakeemState, setHakeemState, startHakeem, handleHakeemAnswer } = useHakeem(currentContent, addMessage);
  
  // Pass region/language to game logic
  const { gameState: controlRoomState, initGame, deploySpecialist, nextMission, retryMission, exitGame } = useControlRoomAI(country, language);

  const startOver = useCallback(() => {
    setMessages([]);
    setQuizState({ active: false, currentQuestion: 0, answers: {}, educationLevel: null });
    setHakeemState({ 
        active: false, step: 0, 
        motive: null, energy: null, resilience: null, reality: null
    });
    exitGame();
    stopAudioPlayback();
  }, [stopAudioPlayback, setQuizState, setHakeemState, exitGame]);

  const conversationMap = (content, startQuizFn, startHakeemFn, startControlRoomFn) => {
    if (!content) return {};
    const nav = (payload) => [{ text: content.navigation[payload], payload }];
    
    // --- Navigation Helper Functions ---
    const showMainMenu = () => addMessage(content.placeholders.menu, 'ai', Object.entries(content.mainMenu).map(([key, value]) => ({ text: value, payload: key })));
    const showExplorePaths = () => addMessage(content.exploreSubMenuPrompt, 'ai', Object.entries(content.exploreSubMenu).map(([key, value]) => ({ text: value, payload: `explore_${key}` })));
    const showClinicalMenu = () => addMessage(content.clinicalHookPrompt, 'ai', Object.entries(content.clinicalSubMenu).map(([key, value]) => ({ text: value, payload: `clinical_${key}` })));
    const showAcademicMenu = () => addMessage(content.academicHookPrompt, 'ai', Object.entries(content.academicSubMenu).map(([key, value]) => ({ text: value, payload: `academic_${key}` })));
    const showCareerInsights = () => content.careerInsights && addMessage(content.careerInsights.prompt, 'ai', Object.entries(content.careerInsights.menu).map(([key, value]) => ({ text: value, payload: `insights_${key}` })));
    const showWorkforceData = () => content.workforceData && addMessage(content.workforceData.prompt, 'ai', Object.entries(content.workforceData.menu).map(([key, value]) => ({ text: value, payload: `workforce_${key}` })));

    return {
        // Main Menu & Footer Nav
        'main_menu': showMainMenu,
        'explore_paths': showExplorePaths,
        'discovery_quiz': startQuizFn,
        'hakeem_quiz': startHakeemFn,
        'control_room_start': startControlRoomFn, // NEW: Control Room Entry
        'career_training': () => addMessage(content.careerTraining.prompt, 'ai', Object.entries(content.careerTraining.menu).map(([key, value]) => ({ text: value, payload: `training_${key}` }))),
        'career_insights': showCareerInsights,
        'workforce_data': showWorkforceData,
        'our_report': () => content.ourReport && addMessage(content.ourReport, 'ai', nav('main_menu')),
        'qna_start': () => content.fixedQna && addMessage(content.fixedQna.prompt, 'ai', content.fixedQna.questions.map(q => ({ text: q.question, payload: q.payload }))),
        'team': () => addMessage(content.team.prompt, 'ai', Object.entries(content.team.menu).map(([key, value]) => ({ text: value, payload: `team_${key}` }))),
        'whats_new': () => addMessage(content.whatsNewContent, 'ai', [{ text: content.quickNav.main_menu, payload: 'main_menu' }], content.whatsNewTitle),
        'about_us': () => addMessage(content.aboutUsContent, 'ai', [{ text: content.quickNav.main_menu, payload: 'main_menu' }]),

        // Navigation "Back" handlers
        'back_to_explore': showExplorePaths,
        'back_to_clinical': showClinicalMenu,
        'back_to_academic': showAcademicMenu,
        'back_to_insights': showCareerInsights,
        'back_to_workforce': showWorkforceData,

        // QnA Answers
        ...content.fixedQna?.questions.reduce((acc, q) => {
            acc[q.payload] = () => addMessage(q.answer, 'ai', [{ text: content.quickNav.main_menu, payload: 'main_menu' }]);
            return acc;
        }, {}),

        // Team Bios
        'team_jaye': () => addMessage(`### ${content.team.jaye.title}\n*${content.team.jaye.subtitle}*\n\n**Bio:** ${content.team.jaye.bio}\n\n**Mission:** ${content.team.jaye.mission}\n\n> *"${content.team.jaye.quote}"*`, 'ai', nav('main_menu')),
        'team_marco': () => addMessage(`### ${content.team.marco.title}\n*${content.team.marco.subtitle}*\n\n**Bio:** ${content.team.marco.bio}\n\n**Mission:** ${content.team.marco.mission}\n\n> *"${content.team.marco.quote}"*`, 'ai', nav('main_menu')),

        // Explore Paths
        'explore_bachelors': () => addMessage(content.bachelorsHookPrompt, 'ai', Object.entries(content.bachelorsSubMenu).map(([key, value]) => ({ text: value, payload: `bachelors_${key}` }))),
        'explore_advanced': () => addMessage(content.advancedSubMenuPrompt, 'ai', Object.entries(content.advancedSubMenu).map(([key, value]) => ({ text: value, payload: `advanced_${key}` }))),

        // Bachelors Path
        'bachelors_pathOverview': () => addMessage(content.bachelorsPathOverview, 'ai', nav('back_to_explore')),
        'bachelors_coreSkills': () => addMessage(content.bachelorsSkillsContent, 'ai', nav('back_to_explore')),

        // Advanced Path
        'advanced_clinical': showClinicalMenu,
        'advanced_academic': showAcademicMenu,

        // Clinical Path
        'clinical_pathOverview': () => addMessage(content.clinicalPathOverview, 'ai', nav('back_to_clinical')),
        'clinical_coreSkills': () => addMessage(content.coreSkillsPrompt, 'ai', Object.entries(content.coreSkillsSubMenu).map(([key, value]) => ({ text: value, payload: `skills_${key}` }))),
        'clinical_licensing': () => addMessage(content.clinicalLicensing, 'ai', Object.entries(content.clinicalLicensingSubMenu).map(([key, value]) => ({ text: value, payload: `licensing_${key}` }))),
        'clinical_hearStory': () => addMessage(content.underConstruction, 'ai', nav('back_to_clinical')),
        'skills_moreOnListening': () => addMessage(content.listeningContent, 'ai', nav('back_to_clinical')),
        'skills_nextSkill': () => addMessage(content.nextSkillContent, 'ai', nav('back_to_clinical')),
        'licensing_educational': () => addMessage(content.clinicalLicensingEducational, 'ai', nav('back_to_clinical')),
        'licensing_training': () => addMessage(content.clinicalLicensingTraining, 'ai', nav('back_to_clinical')),
        'licensing_fees': () => addMessage(content.clinicalLicensingFees, 'ai', nav('back_to_clinical')),
        'licensing_scope': () => addMessage(content.clinicalLicensingScope, 'ai', nav('back_to_clinical')),
        'licensing_exam': () => addMessage(content.clinicalLicensingExam, 'ai', nav('back_to_clinical')),
        'licensing_experience': () => addMessage(content.clinicalLicensingExperience, 'ai', nav('back_to_clinical')),
        'licensing_state': () => addMessage(content.clinicalLicensingState, 'ai', nav('back_to_clinical')),
        
        // Academic Path
        'academic_pathOverview': () => addMessage(content.academicPathOverview, 'ai', nav('back_to_academic')),
        'academic_coreSkills': () => addMessage(content.academicSkills.prompt, 'ai', Object.entries(content.academicSkills.menu).map(([key, value]) => ({ text: value, payload: `acadSkills_${key}` }))),
        'academic_getPublished': () => addMessage(content.academicPublishing.prompt, 'ai', Object.entries(content.academicPublishing.menu).map(([key, value]) => ({ text: value, payload: `acadPub_${key}` }))),
        'acadSkills_design': () => addMessage(content.academicSkills.designContent, 'ai', nav('back_to_academic')),
        'acadSkills_stats': () => addMessage(content.academicSkills.statsContent, 'ai', nav('back_to_academic')),
        'acadSkills_writing': () => addMessage(content.academicSkills.writingContent, 'ai', nav('back_to_academic')),
        'acadPub_mentor': () => addMessage(content.academicPublishing.mentorContent, 'ai', nav('back_to_academic')),
        'acadPub_review': () => addMessage(content.academicPublishing.reviewContent, 'ai', nav('back_to_academic')),
        'acadPub_journal': () => addMessage(content.academicPublishing.journalContent, 'ai', nav('back_to_academic')),

        // Training Path
        'training_undergrad': () => addMessage(content.careerTraining.undergradContent, 'ai', nav('main_menu')),
        'training_byPath': () => addMessage(content.careerTraining.byPathPrompt, 'ai', Object.entries(content.careerTraining.byPathMenu).map(([key, value]) => ({ text: value, payload: `byPath_${key}` }))),
        'byPath_clinical': () => addMessage(content.careerTraining.clinicalContent, 'ai', nav('main_menu')),
        'byPath_organizational': () => addMessage(content.careerTraining.organizationalContent, 'ai', nav('main_menu')),
        'byPath_research': () => addMessage(content.careerTraining.researchContent, 'ai', nav('main_menu')),
        'byPath_tech': () => addMessage(content.careerTraining.techContent, 'ai', nav('main_menu')),
        
        // Insights Path (Egypt)
        'insights_licensing': () => addMessage(content.careerInsights.licensingContent, 'ai', nav('back_to_insights')),
        'insights_market': () => addMessage(content.careerInsights.marketContent, 'ai', nav('back_to_insights')),
        'insights_public_sector': () => addMessage(content.careerInsights.public_sectorContent, 'ai', nav('back_to_insights')),
        'insights_digital_pathway': () => addMessage(content.careerInsights.digital_pathwayContent, 'ai', nav('back_to_insights')),
        'insights_education': () => addMessage(content.careerInsights.educationContent, 'ai', nav('back_to_insights')),
        
        // Workforce Data Path (USA)
        'workforce_salary': () => addMessage(content.workforceData.salaryContent, 'ai', nav('back_to_workforce')),
        'workforce_settings': () => addMessage(content.workforceData.settingsContent, 'ai', nav('back_to_workforce')),
        'workforce_degree': () => addMessage(content.workforceData.degreePrompt, 'ai', Object.entries(content.workforceData.degreeMenu).map(([key, value]) => ({ text: value, payload: `degree_${key}` }))),
        'workforce_future': () => addMessage(content.workforceData.futureContent, 'ai', nav('back_to_workforce')),
        'degree_bachelors': () => addMessage(content.workforceData.bachelorsContent, 'ai', nav('back_to_workforce')),
        'degree_masters': () => addMessage(content.workforceData.mastersContent, 'ai', nav('back_to_workforce')),
        'degree_doctoral': () => addMessage(content.workforceData.doctoralContent, 'ai', nav('back_to_workforce')),
    };
  };

  const findChoiceText = (payload) => {
    const lastMessage = messages[messages.length - 1];
    const choice = lastMessage?.choices?.find(c => c.payload === payload);
    if (choice && typeof choice.text === 'string') {
        return choice.text;
    }
    // Fallback for footer icons or if text not found
    if (typeof payload === 'string') {
        return payload.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'My choice';
  };

  const handleChoice = useCallback((payload) => {
    // Priority: Control Room Exit
    if (payload === 'exit_game') {
        exitGame();
        return;
    }

    // New: Career Bridge from Game to Content
    if (payload.startsWith('bridge_')) {
        exitGame(); // Close game first
        const bridgeKey = payload.replace('bridge_', '');
        
        // Wait a tick for state to update then route
        setTimeout(() => {
            const map = conversationMap(contentRef.current, startQuiz, startHakeem, initGame);
            // Fallback to main explore if key doesn't exist
            const action = map[bridgeKey] || map['explore_paths'];
            if (action) {
                addMessage("Navigating to Career Database...", 'user'); // Simulated user action
                action();
            }
        }, 100);
        return;
    }

    // Priority: Control Room Active
    if (controlRoomState.active) {
        return;
    }

    addMessage(findChoiceText(payload), 'user');

    // Priority Check: Is Hakeem active?
    if (hakeemState.active) {
        // Strict Check: Only process if payload is a valid Hakeem answer
        if (payload && payload.startsWith('hak_')) {
            handleHakeemAnswer(payload);
            return;
        } else {
            // User interrupted flow (e.g. clicked Footer Nav), Exit Hakeem mode
            setHakeemState(prev => ({ ...prev, active: false }));
            // Proceed to standard map handling below
        }
    }

    // Priority Check: Is Standard Quiz active?
    if (quizState.active) {
         // Strict Check: Only process if payload is a valid Quiz answer
         // Quiz payloads start with 'edu_' or 'q' + number (e.g. q0_clinical)
         if (payload && (payload.startsWith('edu_') || /^q\d+_/.test(payload))) {
            handleQuizAnswer(payload);
            return;
         } else {
             // User interrupted flow, Exit Quiz mode
             setQuizState(prev => ({ ...prev, active: false }));
             // Proceed to standard map handling below
         }
    }

    const map = conversationMap(contentRef.current, startQuiz, startHakeem, initGame);
    const action = map[payload];

    if (action) {
      action();
    } else {
      addMessage("I'm sorry, I don't understand that choice.", 'ai');
    }
  }, [quizState.active, handleQuizAnswer, startQuiz, hakeemState.active, handleHakeemAnswer, startHakeem, controlRoomState.active, initGame, exitGame]);


  return {
    messages,
    isLoading,
    quizState,
    handleChoice,
    startOver,
    audioPlayback,
    isAudioLoading,
    isSoundEnabled,
    handleToggleAudio,
    setIsSoundEnabled,
    hakeemState,
    controlRoomState,
    deploySpecialist,
    nextMission,
    retryMission,
    exitGame
  };
};
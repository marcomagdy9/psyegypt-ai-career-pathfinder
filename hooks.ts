


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateSpeech } from './services/geminiService';

// --- AUDIO UTILITIES ---

/**
 * Decodes a base64 encoded string into a Uint8Array for the Web Audio API.
 * @param {string} base64 The base64 encoded audio string.
 * @returns {Uint8Array} The decoded audio data.
 */
function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts raw PCM audio data into a playable AudioBuffer.
 * @param {Uint8Array} data The raw audio data.
 * @param {AudioContext} ctx The AudioContext instance.
 * @param {number} sampleRate The sample rate of the audio (e.g., 24000).
 * @param {number} numChannels The number of audio channels (e.g., 1 for mono).
 * @returns {Promise<AudioBuffer>} A promise that resolves with the playable AudioBuffer.
 */
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


// --- CUSTOM HOOK: useAudioPlayer ---

const TTS_SAMPLE_RATE = 24000;

/**
 * Manages all audio playback functionality for Text-to-Speech.
 * @returns An object with audio player state and controls.
 */
const useAudioPlayer = () => {
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const audioContextRef = useRef(null);
    const audioSourceRef = useRef(null);
    const [audioPlayback, setAudioPlayback] = useState({ messageId: null, status: 'paused' });
    const [isAudioLoading, setIsAudioLoading] = useState(null);

    const stopAudioPlayback = useCallback(() => {
        if (audioSourceRef.current) {
            audioSourceRef.current.onended = null; // Prevent onended from firing on manual stop
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
            setAudioPlayback({ messageId, status: 'paused' }); // Keep icon as paused
            return;
        }

        stopAudioPlayback();

        if (!audioContextRef.current) {
            // FIX: Use type assertion to handle vendor-prefixed webkitAudioContext for older browsers.
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


// --- CUSTOM HOOK: useQuiz ---

/**
 * Manages the state and logic for the career discovery quiz.
 * @param {object} currentContent - The content object for the current language/country.
 * @param {function} addMessage - Callback to add a message to the chat window.
 * @returns An object with quiz state and handlers.
 */
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

        // FIX: Add type assertions to ensure values are treated as numbers for sorting.
        const sortedResults = Object.entries(finalAnswers).sort(([, a], [, b]) => (b as number) - (a as number));
        const topCategoryKey = sortedResults[0][0];
        const results = currentContent.careerDiscoveryQuiz.results;
        const topResult = results[topCategoryKey];

        const defaultRoleKey = currentContent.headerTitle.includes('PsyEgypt') ? 'ba' : 'bachelors';
        const educationLevelKey = educationLevel.replace('edu_', '');
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


// --- CUSTOM HOOK: useChatManager ---

/**
 * The main hook to manage the entire chat application's state and logic.
 * It orchestrates the conversation flow, quiz, and audio playback.
 * @param {object} currentContent The content object for the selected language/country.
 * @returns An object with all the state and handlers needed by the UI.
 */
export const useChatManager = (currentContent) => {
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

  const startOver = useCallback(() => {
    setMessages([]);
    setQuizState({ active: false, currentQuestion: 0, answers: {}, educationLevel: null });
    stopAudioPlayback();
  }, [stopAudioPlayback, setQuizState]);

  const conversationMap = (content, startQuizFn) => {
    if (!content) return {};
    const nav = (payload) => [{ text: content.navigation[payload], payload }];
    
    // --- Navigation Helper Functions for DRY principle ---
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

  const handleChoice = useCallback((payload) => {
    addMessage(findChoiceText(payload), 'user');

    if (quizState.active) {
        handleQuizAnswer(payload);
        return;
    }

    const map = conversationMap(contentRef.current, startQuiz);
    const action = map[payload];

    if (action) {
      action();
    } else {
      addMessage("I'm sorry, I don't understand that choice.", 'ai');
    }
  }, [quizState.active, handleQuizAnswer, startQuiz]);

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
  };
};
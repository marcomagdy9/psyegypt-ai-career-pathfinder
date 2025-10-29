
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message, Choice, GroundingSource } from './types';
import { ChatWindow } from './components/ChatWindow';
import { getPersonalizedGreeting, getChatResponse, getAnalysisResponse, generateSpeech } from './services/geminiService';
import { SendIcon, RefreshIcon, SettingsIcon, SpeakerIcon, AudioOffIcon, QuoteIcon, PlayIcon, PauseIcon, ExternalLinkIcon } from './components/icons';
// FIX: Imported ChoiceButton to resolve reference error.
import ChoiceButton from './components/ChoiceButton';

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


const content = {
  en: {
    headerTitle: "The PsyEgypt",
    headerSubtitle: "Career Pathfinder",
    headerCollaboration: "In collaboration with the APA",
    inputPlaceholder: "Type your message here...",
    distressMessage: "It sounds like you are going through a difficult time. Please know that I am an AI assistant for career guidance only and cannot provide mental health support. **For immediate help, please contact The General Secretariat of Mental Health and Addiction Treatment hotline at 08008880700.** Please reach out to a qualified professional.",
    
    epfWelcome: "Welcome to the PsyEgypt Career Pathfinder! I am an AI assistant supported by the American Psychological Association's (APA) 'Engaging Psychology's Future' (EPF) Presidential Initiative. My mission is to help you explore career paths from the bachelor's to the doctoral level.\n\nTo get started, what is your biggest challenge or question about your psychology career right now?",
    exploreDirectly: "I'd like to explore first",
    triageMessage: "Thank you for sharing. It's very common to feel that way. To help you move forward, let's start by focusing on one of these key areas. What's most helpful right now?",
    
    mainMenu: {
      explore: "🗺️ Explore Career Paths",
      discoveryPuzzle: "🔍 Career Discovery Puzzle",
      skills: "📊 Assess & Build Skills",
      chat: "💬 Ask a Question",
      analysis: "🧠 Strategic Career Analysis",
      mentors: "🤝 Meet the Mentors",
      whatsNew: "✨ What's New"
    },

    chatModePrompt: "You can now ask me anything about psychology careers in the MENA region. I'll use Google Search to find the most up-to-date information for you.",
    analysisModePrompt: "Please describe your complex career question or a multi-step scenario. I will use advanced reasoning to provide a comprehensive, strategic response. This might take a moment.",

    mentors: {
        prompt: "Connecting with professionals is a powerful way to understand your path. Here are a couple of mentors from our network. Learning about their journey might inspire yours.",
        profiles: [
            {
                name: "Dr. Fatima Al-Masri",
                title: "Clinical Psychologist, Cairo",
                bio: "My passion is helping individuals find their strength. Every day presents a new opportunity to make a direct, positive impact.",
                payload: "mentor_fatima",
                buttonText: "Learn from her path"
            },
            {
                name: "Mr. Omar Hassan",
                title: "User Experience Specialist, Alexandria",
                bio: "I discovered I could blend my love for psychology with technology. Understanding user behavior is key to building products people love.",
                payload: "mentor_omar",
                buttonText: "Learn from his path"
            }
        ],
        fatimaStory: "Dr. Al-Masri's advice: 'The journey to becoming a clinician is demanding but incredibly rewarding. The most crucial skill I learned was not in a textbook, but in learning to build a true 'Therapeutic Alliance' with my clients. If you're drawn to this path, start by volunteering. Get real-world experience. It will confirm your passion and strengthen your graduate school applications immensely.'",
        omarStory: "Mr. Hassan's advice: 'Don't limit your view of a psychology degree! I found a thriving career in tech. Companies need to understand their users, and that's pure psychology. My advice? Take a course in statistics (like SPSS) and learn about Human-Computer Interaction. This combination is powerful in the job market today.'"
    },

    careerQuiz: {
      startMessage: "Let's play a quick game to see which path might suit you best. I'll ask a few questions about your interests. Ready?",
      ready: "I'm Ready!",
      questions: [
        {
          question: "Imagine a news report highlights a growing mental health challenge in a local community. What is your immediate, most compelling thought?",
          answers: [
            { text: "How are individuals experiencing this, and what support could I offer them directly?", payload: "q0_clinical" },
            { text: "What are the root causes and patterns? What new research could explain this?", payload: "q0_academic" }
          ]
        },
        {
          question: "Which of these two multi-day projects sounds more energizing and fulfilling to you?",
          answers: [
            { text: "Guiding a client through sessions, building trust, and celebrating their progress.", payload: "q1_clinical" },
            { text: "Analyzing a complex dataset, finding a hidden pattern, and writing a paper on it.", payload: "q1_academic" }
          ]
        },
        {
          question: "You're presented with a confusing case study of a person with a rare behavioral pattern. What's your first step?",
          answers: [
            { text: "Focus on their personal narrative and emotional world to build an empathetic understanding.", payload: "q2_clinical" },
            { text: "Compare the case to established theories and published research to form a hypothesis.", payload: "q2_academic" }
          ]
        },
        {
          question: "Years from now, looking back on your career, which achievement would bring you the most pride?",
          answers: [
            { text: "Being a pivotal part of hundreds of individual journeys toward healing and growth.", payload: "q3_clinical" },
            { text: "Publishing research that fundamentally changed how a topic is understood.", payload: "q3_academic" }
          ]
        }
      ],
      result: {
        clinical: "Based on your answers, it seems you're drawn to making a direct impact on people's lives. The **Clinical Path** might be a great fit for you! This path offers a fantastic opportunity to apply psychological principles in a hands-on way to help others. Would you like to explore it?",
        academic: "Your answers suggest you have a passion for discovery and contributing new knowledge. The **Academic Path** could be your calling! This path is perfect for those who love asking big questions and shaping the future of the field. Shall we dive deeper into it?",
        balanced: "It looks like you have a balanced interest in both helping individuals and advancing the field. That's fantastic! This unique blend means you could thrive in either path, perhaps even in roles that combine both research and practice. Which one would you like to start with?",
      }
    },

    skillsQuiz: {
      startMessage: "Let's identify your current skill strengths and areas for growth. Ready to start the Skills Assessment?",
      ready: "Yes, let's start!",
      questions: [
        {
          question: "A friend tells you they're feeling overwhelmed. Your first response is to:",
          answers: [
            { text: "Listen quietly, then summarize what you heard to make sure you understand their feelings.", payload: "q0_clinical" },
            { text: "Immediately offer solutions and a step-by-step plan to fix the problem.", payload: "q0_professional" },
            { text: "Relate it back to a time you felt the same way, sharing your own story.", payload: "q0_none" }
          ]
        },
        {
          question: "You're reading a study, and the results contradict a popular theory. You feel most compelled to:",
          answers: [
            { text: "Dig into their methodology section to see how they reached that conclusion.", payload: "q1_research" },
            { text: "Quickly accept the new findings as fact.", payload: "q1_none" },
            { text: "Think about how you could present this surprising finding to others.", payload: "q1_professional" }
          ]
        },
        {
          question: "You have to present your project to a group. How do you feel?",
          answers: [
            { text: "Excited! It's a great opportunity to share my work and get feedback.", payload: "q2_professional" },
            { text: "Nervous. I'd rather just send them a written report.", payload: "q2_none" },
            { text: "Focused on making sure my data is 100% accurate and defensible.", payload: "q2_research" }
          ]
        }
      ],
      result: {
        header: "Here's your skills snapshot:",
        clinicalStrong: "You have a strong foundation in **empathy and listening**, key for the Clinical Path.",
        researchStrong: "You show a great aptitude for **critical analysis**, essential for the Academic Path.",
        professionalStrong: "You're comfortable with **communication and presentation**, vital skills for any path.",
        recommendationHeader: "Based on this, here's a suggested next step:",
        recommendClinical: "To build on your clinical skills, focus on **Active Listening**. A core technique is *reflective listening*. You can learn about this on the [Beck Institute's Blog](https://beckinstitute.org/blog/). **Action step:** Try this with a friend—for five minutes, just listen and paraphrase what they say to confirm you understand, without offering any advice.",
        recommendResearch: "To sharpen your research skills, dive into **SPSS**. The official [IBM SPSS Statistics YouTube channel](https://www.youtube.com/user/IBMSPSSStatistics) has excellent beginner tutorials. **Action step:** Follow along with their 'Introduction to SPSS' series using a sample dataset to practice calculating descriptive statistics.",
        recommendProfessional: "To enhance your professional skills, practice **Public Speaking**. Watch Dr. Angela Duckworth's talk on 'Grit' as an example of powerful storytelling. Notice her argument structure and how she engages the audience. You can find many more examples on the [APA's YouTube Channel](https://www.youtube.com/user/AmericanPsychAssoc). **Action step:** Record yourself summarizing a psychology concept for one minute.",
        recommendationFooter: "Also, see how the skills you're building map to what employers want in this [handy guide on Transferable Skills from the APA (PDF)](https://www.apa.org/education-career/guide/transferable-skills.pdf).",
        closing: "What would you like to do next?"
      }
    },

    whatsNewTitle: "✨ What's New This Week in PsyEgypt?",
    whatsNewContent: "This week, we're highlighting a special offer from our partners at the APA! As a referred member, you’re invited to take advantage of an exclusive opportunity to [join APA—for free](https://click.info.apa.org/?qs=280a7ec07bbe607469afc6752b3eaa283615a5f3e15695b4778926d2a7822aa6e64bc3c073813a4ccd1dc51a23b96deee8b44eb3911c049e)! *Offer valid for first-time APA members only.*",
    
    buildSkillsPrompt: "Perfect. Building skills is key. To give you the best recommendation, which area are you focused on right now?",
    skillsMenu: {
        research: "Research Skills (SPSS, paper writing)",
        clinical: "Clinical Skills (CBT, active listening)",
        professional: "Professional Skills (public speaking)"
    },
    researchSkillsContent: "Excellent choice. For research, the APA's 'Publication Manual' is the gold standard. For SPSS, check out the free tutorials on the official IBM SPSS Statistics YouTube channel. They are a great starting point.",
    clinicalSkillsContent: "Great focus. For practical clinical skills, the Beck Institute's blog is a fantastic free resource for CBT. The APA also has a specific division (Division 29, Society for the Advancement of Psychotherapy) with many articles.",
    professionalSkillsContent: "A vital skill. For public speaking, we recommend watching talks from the APA's annual convention on YouTube. Notice how seasoned professionals present complex topics clearly. This is a great way to learn.",

    helpfulPrompt: "What's next?",

    // Explore Path
    exploreSubMenuPrompt: "Great! The two main paths are Clinical and Academic. Which one interests you?",
    exploreSubMenu: {
      clinical: "Clinical Path",
      academic: "Academic Path"
    },
    
    // Clinical Path
    clinicalHookPrompt: "Excellent. The Clinical Path is a rewarding journey to help people directly. What aspect of this path interests you most?",
    clinicalSubMenu: {
      pathOverview: "Detailed Overview",
      coreSkills: "Core Skills",
      hearStory: "Mentor's Perspective"
    },
    clinicalPathOverview: `The Clinical Path is focused on applying psychological principles to help individuals and groups with mental, emotional, and behavioral challenges. Many clinicians find deep satisfaction in this direct, hands-on work.

**Typical Responsibilities:**
*   Conducting one-on-one or group therapy sessions.
*   Administering and interpreting psychological assessments for diagnosis.
*   Developing and implementing personalized treatment plans.
*   Collaborating with doctors, social workers, and other professionals.

**Required Education:**
The journey starts with a Bachelor's degree in Psychology. In Egypt and the MENA region, a Master's degree is the minimum requirement to practice, often followed by specialized diplomas. For full licensure as a 'Psychologist' and more autonomy, a PhD or PsyD is typically necessary. To learn more about specialties, explore [APA Division 12 (Society of Clinical Psychology)](https://www.div12.org/).

**Potential Work Environments:**
You could find yourself working in diverse settings such as hospitals, private clinics, community mental health centers, schools, rehabilitation facilities, or even corporate wellness programs.`,
    coreSkillsPrompt: "This is a key question. Practical skills are in demand, and the most critical one is **Active Listening**. What's next?",
    coreSkillsSubMenu: {
        moreOnListening: "More on Active Listening",
        nextSkill: "Next Skill"
    },
    listeningContent: "Active Listening isn't just hearing words; it's about understanding the emotion and intent behind them. It involves paraphrasing, asking clarifying questions, and showing empathy to build trust. The APA provides excellent resources for undergraduates. Here's a link to their [main resource page](https://www.apa.org/education-career/undergrad) to learn more.",
    nextSkillContent: "Another key skill is **Empathy**. This goes beyond listening to truly understanding and sharing the feelings of another. After that comes building a **'Therapeutic Alliance'** - the trust and rapport between you and your client, which is the foundation of effective therapy.",
    
    // Academic Path
    academicHookPrompt: "Excellent choice. The Academic Path is a journey of discovery, contributing new knowledge to the field. Where would you like to begin?",
    academicSubMenu: {
      pathOverview: "Detailed Overview",
      coreSkills: "Core Skills",
      getPublished: "Getting Published"
    },
    academicPathOverview: `The Academic Path is for those driven by curiosity and a desire to contribute new knowledge to the field of psychology through research and teaching. It's a path that shapes the future of the discipline. These paths are all connected by [psychology's integrative themes](https://www.apa.org/ed/precollege/undergrad/introductory-psychology-initiative/student-learning-outcomes-poster.pdf), which cut across all areas of the science.

**Typical Responsibilities:**
*   Designing and conducting original research studies.
*   Analyzing data and publishing findings in scientific journals, adhering to standards like the [APA Style Guide](https://apastyle.apa.org/).
*   Teaching psychology courses to undergraduate and graduate students.
*   Mentoring students in their own research projects.
*   Writing grant proposals to secure funding for research.

**Required Education:**
This path almost always requires a Doctorate (PhD). The journey involves a Bachelor's, a Master's degree with a strong research component (thesis), and finally, a PhD program where you conduct a major piece of original research for your dissertation.

**Potential Work Environments:**
The primary work environment is a university or college. Researchers can also work for government agencies, non-profit organizations, or private sector companies in roles related to user experience (UX) research, market research, or data science.`,
    
    academicSkills: {
        prompt: "Excellent. Core skills for academia revolve around rigorous inquiry. Let's break them down. Which area would you like to focus on first?",
        menu: {
            design: "Research Design & Methodology",
            stats: "Statistical Analysis",
            writing: "Scientific Writing"
        },
        designContent: "Research design is the blueprint of your study. A strong design ensures your results are valid and reliable. It's about choosing the right approach—experimental, correlational, longitudinal—to answer your specific question. **Key Action:** Familiarize yourself with different research designs by reading the methodology sections of papers in top APA journals. Notice how the design directly serves the research question. For a foundational guide, you can explore the [APA Style for Beginners](https://apastyle.apa.org/beginners) page.",
        statsContent: "Data is the language of research, and mastering statistical analysis using software like SPSS or R is an essential skill. It's not just about running tests; it's about understanding what the results mean and their limitations. **Key Action:** The APA offers advanced training and resources. A great place to start is the [EPF Resources Page](https://www.apa.org/about/governance/president/engaging-psychologys-future/resources), where you can find guides and opportunities.",
        writingContent: "Your discoveries mean little if you can't communicate them clearly. Scientific writing is precise, concise, and structured. Following the APA Publication Manual is essential for getting published. **Key Action:** Practice by summarizing a research article in your own words, following the abstract's structure. This hones your ability to distill complex information. The [APA Style Blog](https://apastyle.apa.org/blog) is an invaluable resource for common questions."
    },
    academicPublishing: {
        prompt: "Getting published is how you share your work with the world. It's a challenging but crucial process. Where should we start?",
        menu: {
            mentor: "Finding a Mentor & Topic",
            review: "Navigating Peer Review",
            journal: "Selecting the Right Journal"
        },
        mentorContent: "Your mentor is your most important guide. Look for professors whose research genuinely excites you. Read their papers, understand their work, and then reach out professionally. A good mentor will help you refine your research question into something novel and manageable. **Key Action:** Identify 3 professors at your institution or others whose work you admire. Draft a concise email introducing yourself and explaining why you're interested in their specific research.",
        reviewContent: "Peer review is a process where other experts in your field critique your work before it's published. You will almost certainly receive revision requests. This is a normal and positive part of the process! It makes your research stronger. **Key Action:** Learn to interpret reviewer comments constructively, not personally. Address each point methodically in a 'response to reviewers' letter. The APA provides resources for authors, which you can find on the [APA Publishing](https://www.apa.org/pubs/authors) site.",
        journalContent: "Choosing the right journal is strategic. You need to match your paper's topic and impact with the journal's scope and audience. A journal's 'impact factor' is one metric, but relevance is more important. **Key Action:** Use the [APA Journals](https://www.apa.org/pubs/journals) portal to browse journals by topic. Read their 'aims and scope' sections carefully to see if your research is a good fit before you even start writing."
    },


    storyHook: "This is a key part of the EPF mission! The best way to hear real stories is to join our free 'EPF-Egypt Inaugural Summit,' where you can ask questions directly to recent graduates and seasoned professionals.",
    toolkitHook: "To help you organize everything, you can download the APA's comprehensive [Resources for Undergraduate Students guide (PDF)](https://www.apa.org/about/governance/president/engaging-psychologys-future/apa-resources-undergraduate-students.pdf). It's a great reference for your journey.",

    underConstruction: "This is an important area. This interactive module is currently under development, but I can offer you our main resources now.",

    feedbackQuestion: 'Was this conversation helpful?',
    yes: '👍 Yes',
    no: '👎 No',
    pollQuestion: "After our chat, how much clearer do you feel about your career path in psychology?\n\n(1 = Not Clear at all, 5 = Very Clear)",
    pollThanks: "Thank you for your feedback! Your input is valuable for the APA's mission.",
    feedbackThanks: "Thank you for your feedback! To help us improve and support the APA's mission, could you answer one quick question?",
    challengeTitle: "Weekly Pathfinder Challenge",
    challengeText: "Spend 15 minutes researching one Egyptian professional on LinkedIn who has the career you want. Send them a polite, professional connection request. This is the first step to building your network!",

    navigationPrompt: "What's next?",
    navigation: {
        mainMenu: "Main Menu",
        startOver: "Restart",
        endChat: "End Chat",
        backToClinical: "Back to Clinical Path",
        backToAcademic: "Back to Academic Path",
        backToExplore: "Back to Career Paths",
        compareAcademic: "Compare with Academic",
        compareClinical: "Compare with Clinical",
    },
    endChatPrompt: "Thank you for using the Pathfinder! We wish you the best in your career journey. Before you go, would you like to provide more detailed feedback?",
    personalizedGoodbye: "Thank you for using the Pathfinder today! {summary} I hope this was a helpful step in your journey. Remember, the PsyEgypt community is always here to support you.",
    goodbyeDefaultSummary: "We're glad to have had you",
    goodbyeSummaryPrefix: "We explored the ",

    endChatOptions: {
        shareExperience: "Share my experience",
        messageDesigner: "Message a chat designer",
        additionalComments: "Additional comments",
        finish: "No, I'm done",
    },
    experiencePrompt: "Thank you! Please share any thoughts on your experience below.",
    designerPrompt: "You can reach the designers with feedback or questions at:",
    commentsPrompt: "Please provide any other comments you have.",
    finalGoodbye: "You're all set. Best of luck on your path!",
    errorGreeting: "I'm sorry, I encountered an issue while processing that. Would you like to try again?",
    tryAgain: "Try Again",
    footerDisclaimer: "AI-powered guidance. Not a substitute for professional advice.",
  },
  ar: {
    headerTitle: "مرشد PsyEgypt",
    headerSubtitle: "المهني",
    headerCollaboration: "بالتعاون مع الجمعية الأمريكية لعلم النفس",
    inputPlaceholder: "اكتب رسالتك هنا...",
    distressMessage: "يبدو أنك تمر بوقت عصيب. أنا مساعد افتراضي للإرشاد المهني فقط ولا يمكنني تقديم الدعم النفسي. **للمساعدة الفورية، يرجى الاتصال بالخط الساخن للأمانة العامة للصحة النفسية وعلاج الإدمان على 08008880700.** من فضلك تواصل مع متخصص مؤهل.",
    
    epfWelcome: "أهلاً بك في \"مرشد PsyEgypt المهني\"! أنا مساعد افتراضي مدعوم من مبادرة \"إشراك مستقبل علم النفس\" (EPF) الرئاسية التابعة للجمعية الأمريكية لعلم النفس. مهمتي هي مساعدتك في استكشاف المسارات المهنية من مستوى البكالوريوس (الليسانس) إلى الدكتوراه.\n\nللبدء، ما هو أكبر تحدٍ أو سؤال لديك حول مسيرتك المهنية في علم النفس الآن؟",
    exploreDirectly: "أود الاستكشاف أولاً",
    triageMessage: "شكراً لمشاركتنا. من الشائع جداً الشعور بهذه الطريقة. لمساعدتك على المضي قدماً، دعنا نبدأ بالتركيز على أحد هذه المجالات الرئيسية. ما هو الأكثر فائدة لك الآن؟",
    
    mainMenu: {
      explore: "🗺️ استكشاف المسارات المهنية",
      discoveryPuzzle: "🔍 أحجية اكتشاف المسار المهني",
      skills: "📊 تقييم وبناء المهارات",
      chat: "💬 طرح سؤال",
      analysis: "🧠 تحليل استراتيجي للمسار المهني",
      mentors: "🤝 تعرف على المرشدين",
      whatsNew: "✨ ما الجديد"
    },

    chatModePrompt: "يمكنك الآن أن تسألني أي شيء عن المهن في علم النفس في منطقة الشرق الأوسط وشمال إفريقيا. سأستخدم بحث Google للعثور على أحدث المعلومات لك.",
    analysisModePrompt: "يرجى وصف سؤالك المهني المعقد أو سيناريو متعدد الخطوات. سأستخدم تفكيراً متقدماً لتقديم إجابة استراتيجية شاملة. قد يستغرق هذا بعض الوقت.",

    mentors: {
        prompt: "التواصل مع المهنيين هو وسيلة قوية لفهم مسارك. إليك بعض المرشدين من شبكتنا. قد يلهمك التعرف على رحلتهم.",
        profiles: [
            {
                name: "د. فاطمة المصري",
                title: "أخصائية نفسية إكلينيكية، القاهرة",
                bio: "شغفي هو مساعدة الأفراد في العثور على قوتهم. كل يوم يمثل فرصة جديدة لإحداث تأثير إيجابي مباشر.",
                payload: "mentor_fatima",
                buttonText: "تعلم من مسارها"
            },
            {
                name: "أ. عمر حسن",
                title: "أخصائي تجربة مستخدم، الإسكندرية",
                bio: "اكتشفت أنه يمكنني دمج حبي لعلم النفس مع التكنولوجيا. فهم سلوك المستخدم هو مفتاح بناء منتجات يحبها الناس.",
                payload: "mentor_omar",
                buttonText: "تعلم من مساره"
            }
        ],
        fatimaStory: "نصيحة د. المصري: 'الرحلة لتصبح طبيباً إكلينيكياً متطلبة ولكنها مجزية بشكل لا يصدق. أهم مهارة تعلمتها لم تكن في كتاب مدرسي، بل في تعلم بناء \"تحالف علاجي\" حقيقي مع عملائي. إذا كنت منجذباً إلى هذا المسار، فابدأ بالتطوع. احصل على خبرة واقعية. سيؤكد ذلك شغفك ويعزز طلباتك للالتحاق بالدراسات العليا بشكل كبير.'",
        omarStory: "نصيحة أ. حسن: 'لا تحد من نظرتك لشهادة علم النفس! لقد وجدت مسيرة مهنية مزدهرة في مجال التكنولوجيا. تحتاج الشركات إلى فهم مستخدميها، وهذا هو علم النفس الخالص. نصيحتي؟ خذ دورة في الإحصاء (مثل SPSS) وتعلم عن تفاعل الإنسان والحاسوب. هذا المزيج قوي في سوق العمل اليوم.'"
    },

    careerQuiz: {
      startMessage: "لنلعب لعبة سريعة لنرى أي مسار قد يناسبك. سأطرح بعض الأسئلة حول اهتماماتك. هل أنت مستعد؟",
      ready: "أنا مستعد!",
      questions: [
        {
            question: "تخيل أن تقريراً إخبارياً يسلط الضوء على تحدٍ متزايد في مجال الصحة النفسية بمجتمعك المحلي. ما هي أول فكرة قوية تخطر ببالك؟",
            answers: [
                { text: "كيف يعيش الأفراد هذه التجربة، وما الدعم الذي يمكنني تقديمه لهم مباشرة؟", payload: "q0_clinical" },
                { text: "ما هي الأسباب الجذرية والأنماط؟ وأي بحث جديد يمكن أن يفسر هذه الظاهرة؟", payload: "q0_academic" }
            ]
        },
        {
            question: "أي من هذين المشروعين، اللذين يستمران لعدة أيام، يبدو أكثر تحفيزاً وإشباعاً لك؟",
            answers: [
                { text: "إرشاد عميل خلال جلسات، وبناء الثقة، والاحتفال بتقدمه.", payload: "q1_clinical" },
                { text: "تحليل مجموعة بيانات معقدة، وإيجاد نمط خفي، وكتابة ورقة بحثية عنه.", payload: "q1_academic" }
            ]
        },
        {
            question: "تُعرض عليك دراسة حالة محيرة لشخص لديه نمط سلوكي نادر. ما هي خطوتك الأولى لفهمها؟",
            answers: [
                { text: "التركيز على سرده الشخصي وعالمه العاطفي لبناء فهم متعاطف.", payload: "q2_clinical" },
                { text: "مقارنة الحالة بالنظريات الراسخة والأبحاث المنشورة لتكوين فرضية.", payload: "q2_academic" }
            ]
        },
        {
            question: "بعد سنوات من الآن، عندما تنظر إلى مسيرتك المهنية، أي إنجاز سيجعلك تشعر بالفخر الأكبر؟",
            answers: [
                { text: "أن أكون جزءاً محورياً في مئات الرحلات الفردية نحو الشفاء والنمو.", payload: "q3_clinical" },
                { text: "نشر بحث غيّر بشكل جذري كيفية فهم موضوع معين.", payload: "q3_academic" }
            ]
        }
      ],
      result: {
        clinical: "بناءً على إجاباتك، يبدو أنك تنجذب إلى إحداث تأثير مباشر في حياة الناس. قد يكون **المسار الإكلينيكي** مناسباً لك! يوفر هذا المسار فرصة رائعة لتطبيق المبادئ النفسية بطريقة عملية لمساعدة الآخرين. هل ترغب في استكشافه؟",
        academic: "تشير إجاباتك إلى أن لديك شغفاً بالاكتشاف والمساهمة بمعرفة جديدة. قد يكون **المسار الأكاديمي** هو دعوتك! هذا المسار مثالي لأولئك الذين يحبون طرح الأسئلة الكبيرة وتشكيل مستقبل هذا المجال. هل نتعمق فيه أكثر؟",
        balanced: "يبدو أن لديك اهتماماً متوازناً بكل من مساعدة الأفراد وتطوير المجال. هذا رائع! هذا المزيج الفريد يعني أنه يمكنك النجاح في أي من المسارين، وربما في أدوار تجمع بين البحث والممارسة. بأيهما تود أن تبدأ؟",
      }
    },

    skillsQuiz: {
      startMessage: "دعنا نحدد نقاط قوتك الحالية في المهارات ومجالات النمو. هل أنت مستعد لبدء تقييم المهارات؟",
      ready: "نعم، لنبدأ!",
      questions: [
        {
          question: "يخبرك صديق أنه يشعر بالإرهاق. ردك الأول هو:",
          answers: [
            { text: "الاستماع بهدوء، ثم تلخيص ما سمعته للتأكد من فهمك لمشاعره.", payload: "q0_clinical" },
            { text: "تقديم حلول فورية وخطة خطوة بخطوة لحل المشكلة.", payload: "q0_professional" },
            { text: "ربط الأمر بوقت شعرت فيه بنفس الشيء، ومشاركة قصتك الخاصة.", payload: "q0_none" }
          ]
        },
        {
          question: "أثناء قراءة دراسة، تجد أن النتائج تتعارض مع نظرية شائعة. تشعر بالدافع الأكبر لـ:",
          answers: [
            { text: "التعمق في قسم المنهجية لمعرفة كيف توصلوا إلى هذا الاستنتاج.", payload: "q1_research" },
            { text: "قبول النتائج الجديدة كحقيقة بسرعة.", payload: "q1_none" },
            { text: "التفكير في كيفية تقديم هذه النتيجة المفاجئة للآخرين.", payload: "q1_professional" }
          ]
        },
        {
          question: "عليك تقديم مشروعك لمجموعة. كيف تشعر؟",
          answers: [
            { text: "متحمس! إنها فرصة رائعة لمشاركة عملي والحصول على ملاحظات.", payload: "q2_professional" },
            { text: "متوتر. أفضل أن أرسل لهم تقريراً مكتوباً.", payload: "q2_none" },
            { text: "أركز على التأكد من أن بياناتي دقيقة 100٪ وقابلة للدفاع عنها.", payload: "q2_research" }
          ]
        }
      ],
      result: {
        header: "إليك لمحة عن مهاراتك:",
        clinicalStrong: "لديك أساس قوي في **التعاطف والاستماع**، وهما مفتاح المسار الإكلينيكي.",
        researchStrong: "تظهر قدرة كبيرة على **التحليل النقدي**، وهو أمر ضروري للمسار الأكاديمي.",
        professionalStrong: "تشعر بالراحة في **التواصل والعرض**، وهي مهارات حيوية لأي مسار.",
        recommendationHeader: "بناءً على ذلك، إليك خطوة تالية مقترحة:",
        recommendClinical: "للبناء على مهاراتك الإكلينيكية، ركز على **الاستماع النشط**. أسلوب أساسي هو *الاستماع العاكس*. يمكنك معرفة المزيد عنه في [مدونة معهد بيك](https://beckinstitute.org/blog/). **خطوة عملية:** جرب هذا مع صديق - لمدة خمس دقائق، استمع فقط وأعد صياغة ما يقوله للتأكد من فهمك، دون تقديم أي نصيحة.",
        recommendResearch: "لصقل مهاراتك البحثية، تعمق في **SPSS**. قناة [IBM SPSS Statistics الرسمية على يوتيوب](https://www.youtube.com/user/IBMSPSSStatistics) بها دروس تعليمية ممتازة للمبتدئين. **خطوة عملية:** تابع سلسلة 'مقدمة إلى SPSS' باستخدام مجموعة بيانات نموذجية للتدرب على حساب الإحصاءات الوصفية.",
        recommendProfessional: "لتعزيز مهاراتك المهنية، تدرب على **الخطابة العامة**. شاهد محاضرة د. أنجيلا داكوورث عن 'العزيمة' كمثال على السرد القصصي القوي. لاحظ بنية حجتها وكيفية إشراكها للجمهور. يمكنك العثور على العديد من الأمثلة على [قناة APA على يوتيوب](https://www.youtube.com/user/AmericanPsychAssoc). **خطوة عملية:** سجل لنفسك ملخصاً لمفهوم نفسي لمدة دقيقة واحدة.",
        recommendationFooter: "أيضاً، انظر كيف ترتبط المهارات التي تبنيها بما يريده أصحاب العمل في هذا [الدليل العملي حول المهارات القابلة للتحويل من APA (PDF)](https://www.apa.org/education-career/guide/transferable-skills.pdf).",
        closing: "ماذا تود أن تفعل بعد ذلك؟"
      }
    },

    whatsNewTitle: "✨ ما الجديد هذا الأسبوع في PsyEgypt؟",
    whatsNewContent: "نسلط الضوء هذا الأسبوع على عرض خاص من شركائنا في APA! كعضو محال، أنت مدعو للاستفادة من فرصة حصرية [للانضمام إلى APA مجاناً](https://click.info.apa.org/?qs=280a7ec07bbe607469afc6752b3eaa283615a5f3e15695b4778926d2a7822aa6e64bc3c073813a4ccd1dc51a23b96deee8b44eb3911c049e)! *العرض صالح لأعضاء APA لأول مرة فقط.*",

    buildSkillsPrompt: "ممتاز. بناء المهارات هو المفتاح. لتقديم أفضل توصية لك، على أي مجال تركز الآن؟",
    skillsMenu: {
        research: "مهارات البحث (SPSS، كتابة الأبحاث)",
        clinical: "المهارات الإكلينيكية (العلاج المعرفي السلوكي، الاستماع النشط)",
        professional: "المهارات المهنية (الخطابة العامة)"
    },
    researchSkillsContent: "اختيار ممتاز. بالنسبة للبحث، 'دليل النشر' الخاص بـ APA هو المعيار الذهبي. بالنسبة لـ SPSS، تحقق من الدروس التعليمية المجانية على قناة IBM SPSS Statistics الرسمية على يوتيوب. إنها نقطة انطلاق رائعة.",
    clinicalSkillsContent: "تركيز رائع. للمهارات الإكلينيكية العملية، مدونة معهد بيك هي مصدر مجاني رائع للعلاج المعرفي السلوكي. لدى APA أيضاً قسم محدد (القسم 29، جمعية تطوير العلاج النفسي) به العديد من المقالات.",
    professionalSkillsContent: "مهارة حيوية. بالنسبة للخطابة العامة، نوصي بمشاهدة محاضرات من المؤتمر السنوي لـ APA على يوتيوب. لاحظ كيف يقدم المحترفون المتمرسون الموضوعات المعقدة بوضوح. هذه طريقة رائعة للتعلم.",

    helpfulPrompt: "ماذا بعد؟",

    // Explore Path
    exploreSubMenuPrompt: "رائع! المساران الرئيسيان هما الإكلينيكي والأكاديمي. أيهما يثير اهتمامك؟",
    exploreSubMenu: {
      clinical: "المسار الإكلينيكي",
      academic: "المسار الأكاديمي"
    },
    
    // Clinical Path
    clinicalHookPrompt: "ممتاز. المسار الإكلينيكي هو رحلة مجزية لمساعدة الناس مباشرة. أي جانب من هذا المسار يثير اهتمامك أكثر؟",
    clinicalSubMenu: {
      pathOverview: "نظرة عامة مفصلة",
      coreSkills: "المهارات الأساسية",
      hearStory: "منظور مرشد"
    },
    clinicalPathOverview: `يركز المسار الإكلينيكي على تطبيق المبادئ النفسية لمساعدة الأفراد والمجموعات التي تواجه تحديات نفسية وعاطفية وسلوكية. يجد العديد من الأخصائيين رضا عميقاً في هذا العمل المباشر والعملي.

**المسؤوليات النموذجية:**
*   إجراء جلسات علاج فردية أو جماعية.
*   إدارة وتفسير التقييمات النفسية للتشخيص.
*   تطوير وتنفيذ خطط علاجية مخصصة.
*   التعاون مع الأطباء والأخصائيين الاجتماعيين وغيرهم من المهنيين.

**التعليم المطلوب:**
تبدأ الرحلة بدرجة البكالوريوس في علم النفس. في مصر ومنطقة الشرق الأوسط وشمال إفريقيا، درجة המاجستير هي الحد الأدنى للممارسة، وغالباً ما تليها دبلومات متخصصة. للحصول على ترخيص كامل كـ 'أخصائي نفسي' ومزيد من الاستقلالية، عادة ما تكون درجة الدكتوراه (PhD أو PsyD) ضرورية. لمعرفة المزيد عن التخصصات، استكشف [القسم 12 من APA (جمعية علم النفس الإكلينيكي)](https://www.div12.org/).

**بيئات العمل المحتملة:**
يمكنك أن تجد نفسك تعمل في بيئات متنوعة مثل المستشفيات، والعيادات الخاصة، ومراكز الصحة النفسية المجتمعية، والمدارس، ومرافق إعادة التأهيل، أو حتى برامج العافية في الشركات.`,
    coreSkillsPrompt: "هذا سؤال أساسي. المهارات العملية مطلوبة، وأهمها هو **الاستماع النشط**. ماذا بعد؟",
    coreSkillsSubMenu: {
        moreOnListening: "المزيد عن الاستماع النشط",
        nextSkill: "المهارة التالية"
    },
    listeningContent: "الاستماع النشط ليس مجرد سماع الكلمات؛ إنه يتعلق بفهم العاطفة والقصد من ورائها. يتضمن إعادة الصياغة، وطرح أسئلة توضيحية، وإظهار التعاطف لبناء الثقة. توفر APA موارد ممتازة لطلاب البكالوريوس. إليك رابط [لصفحة الموارد الرئيسية](https://www.apa.org/education-career/undergrad) الخاصة بهم لمعرفة المزيد.",
    nextSkillContent: "مهارة أساسية أخرى هي **التعاطف**. هذا يتجاوز الاستماع إلى الفهم الحقيقي ومشاركة مشاعر الآخر. بعد ذلك يأتي بناء **'تحالف علاجي'** - الثقة والعلاقة بينك وبين عميلك، وهو أساس العلاج الفعال.",
    
    // Academic Path
    academicHookPrompt: "اختيار ممتاز. المسار الأكاديمي هو رحلة اكتشاف، تساهم بمعرفة جديدة في هذا المجال. من أين تود أن تبدأ؟",
    academicSubMenu: {
      pathOverview: "نظرة عامة مفصلة",
      coreSkills: "المهارات الأساسية",
      getPublished: "النشر العلمي"
    },
    academicPathOverview: `المسار الأكاديمي مخصص لأولئك الذين يدفعهم الفضول والرغبة في المساهمة بمعرفة جديدة في مجال علم النفس من خلال البحث والتدريس. إنه مسار يشكل مستقبل هذا التخصص. ترتبط كل هذه المسارات بـ [الموضوعات التكاملية لعلم النفس](https://www.apa.org/ed/precollege/undergrad/introductory-psychology-initiative/student-learning-outcomes-poster.pdf)، التي تتقاطع مع جميع مجالات العلم.

**المسؤوليات النموذجية:**
*   تصميم وإجراء دراسات بحثية أصلية.
*   تحليل البيانات ونشر النتائج في المجلات العلمية، مع الالتزام بمعايير مثل [دليل أسلوب APA](https://apastyle.apa.org/).
*   تدريس مقررات علم النفس لطلاب البكالوريوس والدراسات العليا.
*   توجيه الطلاب في مشاريعهم البحثية الخاصة.
*   كتابة مقترحات المنح لتأمين التمويل للبحوث.

**التعليم المطلوب:**
يتطلب هذا المسار دائماً تقريباً درجة الدكتوراه (PhD). تتضمن الرحلة بكالوريوس، وماجستير مع مكون بحثي قوي (رسالة)، وأخيراً، برنامج دكتوراه حيث تجري بحثاً أصلياً كبيراً لأطروحتك.

**بيئات العمل المحتملة:**
بيئة العمل الأساسية هي الجامعة أو الكلية. يمكن للباحثين أيضاً العمل في الوكالات الحكومية، أو المنظمات غير الربحية، أو شركات القطاع الخاص في أدوار تتعلق ببحث تجربة المستخدم (UX)، أو أبحاث السوق، أو علوم البيانات.`,
    
    academicSkills: {
        prompt: "ممتاز. تتمحور المهارات الأساسية للأوساط الأكاديمية حول البحث الدقيق. لنقسمها. أي مجال تود التركيز عليه أولاً؟",
        menu: {
            design: "تصميم البحث والمنهجية",
            stats: "التحليل الإحصائي",
            writing: "الكتابة العلمية"
        },
        designContent: "يعتبر تصميم البحث بمثابة المخطط الأساسي لدراستك، فالتصميم القوي يضمن صحة وموثوقية نتائجك. يتطلب الأمر اختيار المنهجية الأنسب لسؤالك البحثي، سواء كانت تجريبية، أو ارتباطية، أو طولية. **خطوة أساسية:** لتتعرف على تصميمات البحث المختلفة، قم بقراءة قسم \"المنهجية\" في الأبحاث المنشورة في مجلات APA المرموقة، ولاحظ كيف يخدم التصميم سؤال البحث مباشرة. للحصول على دليل مبسط، يمكنك استكشاف [أساسيات أسلوب APA للمبتدئين](https://apastyle.apa.org/beginners).",
        statsContent: "البيانات هي لغة البحث، وإتقان التحليل الإحصائي باستخدام برامج مثل SPSS أو R هو مهارة أساسية. لا يقتصر الأمر على إجراء الاختبارات فحسب، بل يشمل فهم دلالة النتائج وقيودها. **خطوة أساسعية:** تقدم APA تدريباً وموارد متقدمة. كنقطة انطلاق رائعة، قم بزيارة [صفحة موارد EPF](https://www.apa.org/about/governance/president/engaging-psychologys-future/resources)، حيث يمكنك العثور على أدلة وفرص.",
        writingContent: "اكتشافاتك لا تعني الكثير إذا لم تتمكن من توصيلها بوضوح. الكتابة العلمية دقيقة وموجزة ومنظمة. يعد اتباع دليل النشر الخاص بـ APA أمراً ضرورياً للنشر. **خطوة أساسعية:** تدرب عن طريق تلخيص مقال بحثي بكلماتك الخاصة، متبعاً هيكل الملخص. هذا يصقل قدرتك على استخلاص المعلومات المعقدة. [مدونة APA Style](https://apastyle.apa.org/blog) هي مصدر لا يقدر بثمن للأسئلة الشائعة."
    },
    academicPublishing: {
        prompt: "النشر هو الطريقة التي تشارك بها عملك مع العالم. إنها عملية صعبة ولكنها حاسمة. من أين نبدأ؟",
        menu: {
            mentor: "العثور على مرشد وموضوع",
            review: "التعامل مع مراجعة الأقران",
            journal: "اختيار المجلة المناسبة"
        },
        mentorContent: "مرشدك هو أهم دليل لك. ابحث عن الأساتذة الذين يثير بحثهم حماسك حقاً. اقرأ أوراقهم، وافهم عملهم، ثم تواصل معهم بشكل احترافي. سيساعدك المرشد الجيد على صقل سؤال بحثك ليصبح شيئاً جديداً وقابلاً للإدارة. **خطوة أساسية:** حدد 3 أساتذة في مؤسستك أو في مؤسسات أخرى يعجبك عملهم. قم بصياغة بريد إلكتروني موجز تقدم فيه نفسك وتشرح سبب اهتمامك ببحثهم المحدد.",
        reviewContent: "مراجعة الأقران هي عملية يقوم فيها خبراء آخرون في مجالك بنقد عملك قبل نشره. من شبه المؤكد أنك ستتلقى طلبات مراجعة. هذا جزء طبيعي وإيجابي من العملية! فهو يجعل بحثك أقوى. **خطوة أساسية:** تعلم كيفية تفسير تعليقات المراجعين بشكل بناء، وليس بشكل شخصي. قم بمعالجة كل نقطة بشكل منهجي في خطاب 'الرد على المراجعين'. توفر APA موارد للمؤلفين، والتي يمكنك العثور عليها على موقع [APA Publishing](https://www.apa.org/pubs/authors).",
        journalContent: "يعد اختيار المجلة المناسبة أمراً استراتيجياً. تحتاج إلى مطابقة موضوع ورقتك وتأثيرها مع نطاق المجلة وجمهورها. 'عامل التأثير' للمجلة هو أحد المقاييس، لكن الملاءمة أكثر أهمية. **خطوة أساسعية:** استخدم بوابة [مجلات APA](https://www.apa.org/pubs/journals) لتصفح المجلات حسب الموضوع. اقرأ أقسام 'الأهداف والنطاق' بعناية لمعرفة ما إذا كان بحثك مناسباً حتى قبل أن تبدأ في الكتابة."
    },

    storyHook: "هذا جزء أساسي من مهمة EPF! أفضل طريقة لسماع قصص حقيقية هي الانضمام إلى 'قمة EPF-مصر الافتتاحية' المجانية، حيث يمكنك طرح الأسئلة مباشرة على الخريجين الجدد والمهنيين المخضرمين.",
    toolkitHook: "لمساعدتك على تنظيم كل شيء، يمكنك تنزيل [دليل موارد APA الشامل لطلاب البكالوريوس (PDF)](https://www.apa.org/about/governance/president/engaging-psychologys-future/apa-resources-undergraduate-students.pdf). إنه مرجع رائع لرحلتك.",

    underConstruction: "هذا مجال مهم. هذه الوحدة التفاعلية قيد التطوير حالياً، لكن يمكنني أن أقدم لك مواردنا الرئيسية الآن.",

    feedbackQuestion: 'هل كانت هذه المحادثة مفيدة؟',
    yes: '👍 نعم',
    no: '👎 لا',
    pollQuestion: "بعد محادثتنا، ما مدى وضوح مسارك المهني في علم النفس بالنسبة لك؟\n\n(1 = غير واضح إطلاقاً، 5 = واضح جداً)",
    pollThanks: "شكراً لملاحظاتك! مدخلاتك قيمة لمهمة APA.",
    feedbackThanks: "شكراً لملاحظاتك! لمساعدتنا على التحسين ودعم مهمة APA، هل يمكنك الإجابة على سؤال سريع واحد؟",
    challengeTitle: "تحدي المرشد الأسبوعي",
    challengeText: "اقضِ 15 دقيقة في البحث عن مهني مصري واحد على LinkedIn لديه المهنة التي تريدها. أرسل له طلب تواصل مهذب واحترافي. هذه هي الخطوة الأولى لبناء شبكتك!",

    navigationPrompt: "ماذا بعد؟",
    navigation: {
        mainMenu: "القائمة الرئيسية",
        startOver: "البدء من جديد",
        endChat: "إنهاء المحادثة",
        backToClinical: "العودة إلى المسار الإكلينيكي",
        backToAcademic: "العودة إلى المسار الأكاديمي",
        backToExplore: "العودة إلى المسارات المهنية",
        compareAcademic: "مقارنة بالمسار الأكاديمي",
        compareClinical: "مقارنة بالمسار الإكلينيكي",
    },
    endChatPrompt: "شكراً لاستخدامك المرشد! نتمنى لك كل التوفيق في رحلتك المهنية. قبل أن تذهب، هل ترغب في تقديم ملاحظات أكثر تفصيلاً؟",
    personalizedGoodbye: "شكراً لاستخدامك المرشد اليوم! {summary} آمل أن تكون هذه خطوة مفيدة في رحلتك. تذكر، مجتمع PsyEgypt هنا دائماً لدعمك.",
    goodbyeDefaultSummary: "يسعدنا وجودك معنا",
    goodbyeSummaryPrefix: "لقد استكشفنا ",

    endChatOptions: {
        shareExperience: "مشاركة تجربتي",
        messageDesigner: "مراسلة مصمم المحادثة",
        additionalComments: "تعليقات إضافية",
        finish: "لا، لقد انتهيت",
    },
    experiencePrompt: "شكراً لك! يرجى مشاركة أي أفكار حول تجربتك أدناه.",
    designerPrompt: "يمكنك التواصل مع المصممين بملاحظات أو أسئلة على:",
    commentsPrompt: "يرجى تقديم أي تعليقات أخرى لديك.",
    finalGoodbye: "أنت جاهز الآن. كل التوفيق في مسارك!",
    errorGreeting: "أنا آسف، لقد واجهت مشكلة أثناء معالجة ذلك. هل ترغب في المحاولة مرة أخرى؟",
    tryAgain: "حاول مرة أخرى",
    footerDisclaimer: "إرشاد مدعوم بالذكاء الاصطناعي. ليس بديلاً عن المشورة المهنية المتخصصة.",
  }
};

type ChatState = 'start' | 'awaiting_challenge' | 'main_menu' | 'career_quiz' | 'skills_quiz' | 'explore_paths' | 'chat_mode' | 'analysis_mode' | 'feedback' | 'end_chat';

const App: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [userInput, setUserInput] = useState<string>('');
    const [language, setLanguage] = useState<'en' | 'ar' | null>(null);
    const [chatState, setChatState] = useState<ChatState>('start');
    const [quizScores, setQuizScores] = useState<{ clinical: number; academic: number; professional: number; research: number }>({ clinical: 0, academic: 0, professional: 0, research: 0 });
    const [quizStep, setQuizStep] = useState(0);
    const [chatHistory, setChatHistory] = useState<{ role: string; parts: { text: string }[] }[]>([]);
    const [visitedPaths, setVisitedPaths] = useState<string[]>([]);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [audioPlayback, setAudioPlayback] = useState<{ messageId: number | null; status: 'playing' | 'paused' }>({ messageId: null, status: 'paused' });
    const [isAudioLoading, setIsAudioLoading] = useState<number | null>(null);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const langContent = language ? content[language] : content.en;

    useEffect(() => {
        // Initialize AudioContext after user interaction (e.g., language selection)
        if (language && !audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        return () => {
             // Cleanup on component unmount
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [language]);


    const addMessage = useCallback((text: string | React.ReactNode, sender: 'ai' | 'user', choices: Choice[] = [], sources: GroundingSource[] = []) => {
        setMessages(prev => [
            ...prev,
            {
                id: prev.length,
                text,
                sender,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                choices,
                sources
            }
        ]);
    }, []);
    
    const handleLanguageSelect = useCallback((lang: 'en' | 'ar') => {
        setLanguage(lang);
        const selectedContent = content[lang];
        addMessage(selectedContent.epfWelcome, 'ai', [{ text: selectedContent.exploreDirectly, payload: 'main_menu' }]);
        setChatState('awaiting_challenge');
    }, [addMessage]);

    const showMainMenu = useCallback(() => {
        const c = langContent.mainMenu;
        const menuChoices = [
            { text: c.explore, payload: 'explore_paths' },
            { text: c.discoveryPuzzle, payload: 'start_career_quiz' },
            { text: c.skills, payload: 'start_skills_quiz' },
            { text: c.chat, payload: 'start_chat_mode' },
            { text: c.analysis, payload: 'start_analysis_mode' },
            { text: c.mentors, payload: 'show_mentors' },
            { text: c.whatsNew, payload: 'whats_new' }
        ];
        addMessage(langContent.triageMessage, 'ai', menuChoices);
        setChatState('main_menu');
    }, [addMessage, langContent]);

    const handleRestart = useCallback(() => {
        setMessages([]);
        setLanguage(null);
        setChatState('start');
        setQuizScores({ clinical: 0, academic: 0, professional: 0, research: 0 });
        setQuizStep(0);
        setChatHistory([]);
        setVisitedPaths([]);
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current = null;
        }
        setAudioPlayback({ messageId: null, status: 'paused' });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !language) return;

        addMessage(userInput, 'user');
        setUserInput('');
        setIsLoading(true);

        try {
            if (DISTRESS_KEYWORDS.some(keyword => userInput.toLowerCase().includes(keyword))) {
                 addMessage(langContent.distressMessage, 'ai');
                 setIsLoading(false);
                 return;
            }
            
            if (chatState === 'awaiting_challenge') {
                const greeting = await getPersonalizedGreeting(userInput, language);
                addMessage(greeting, 'ai');
                showMainMenu();
            } else if (chatState === 'chat_mode') {
                const history = [...chatHistory, { role: 'user', parts: [{ text: userInput }] }];
                const { text, sources } = await getChatResponse(chatHistory, userInput, language);
                addMessage(text, 'ai', [], sources);
                setChatHistory([...history, { role: 'model', parts: [{ text }] }]);
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.navigation.mainMenu, payload: 'main_menu', type: 'secondary'},
                    { text: langContent.navigation.startOver, payload: 'restart', type: 'secondary'}
                ];
                addMessage(langContent.navigationPrompt, 'ai', choices);

            } else if (chatState === 'analysis_mode') {
                const analysis = await getAnalysisResponse(userInput, language);
                addMessage(analysis, 'ai');
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.navigation.mainMenu, payload: 'main_menu', type: 'secondary'},
                    { text: langContent.navigation.startOver, payload: 'restart', type: 'secondary'}
                ];
                addMessage(langContent.navigationPrompt, 'ai', choices);
            }
            
        } catch (error) {
            console.error("API Error:", error);
            addMessage(langContent.errorGreeting, 'ai', [{ text: langContent.tryAgain, payload: 'retry_last' }]); // A retry mechanism could be implemented
        } finally {
            setIsLoading(false);
        }
    };
    
    // This is the main controller for conversation flow via buttons
    const handleChoiceClick = (payload: string) => {
        if (isLoading) return;
        
        const choiceText = findChoiceText(payload);
        if (choiceText) {
             addMessage(choiceText, 'user');
        }

        // Quiz Logic
        if (payload.startsWith('q')) {
            handleQuizAnswer(payload);
            return;
        }

        // Navigation and Module Logic
        switch (payload) {
            case 'main_menu':
                showMainMenu();
                break;
            case 'restart':
                handleRestart();
                break;
            // Career Quiz Flow
            case 'start_career_quiz':
                startCareerQuiz();
                break;
            case 'ready_career_quiz':
                askCareerQuizQuestion(0);
                break;
             // Skills Quiz Flow
            case 'start_skills_quiz':
                startSkillsQuiz();
                break;
            case 'ready_skills_quiz':
                askSkillsQuizQuestion(0);
                break;
            // Chat/Analysis modes
            case 'start_chat_mode':
                setChatState('chat_mode');
                addMessage(langContent.chatModePrompt, 'ai');
                break;
             case 'start_analysis_mode':
                setChatState('analysis_mode');
                addMessage(langContent.analysisModePrompt, 'ai');
                break;
            // Explore Paths Flow
            case 'explore_paths':
                addMessage(langContent.exploreSubMenuPrompt, 'ai', [
                    { text: langContent.exploreSubMenu.clinical, payload: 'explore_clinical' },
                    { text: langContent.exploreSubMenu.academic, payload: 'explore_academic' }
                ]);
                break;
            case 'explore_clinical':
                setVisitedPaths(prev => [...prev, 'clinical']);
                addMessage(langContent.clinicalHookPrompt, 'ai', [
                    { text: langContent.clinicalSubMenu.pathOverview, payload: 'clinical_overview' },
                    { text: langContent.clinicalSubMenu.coreSkills, payload: 'clinical_skills' },
                    { text: langContent.clinicalSubMenu.hearStory, payload: 'mentor_fatima' }
                ]);
                break;
            case 'clinical_overview': {
                 // FIX: Explicitly type choices array to match Choice[] type
                 const choices: Choice[] = [
                    { text: langContent.clinicalSubMenu.coreSkills, payload: 'clinical_skills' },
                    { text: langContent.navigation.compareAcademic, payload: 'explore_academic', type: 'secondary' },
                    { text: langContent.navigation.backToClinical, payload: 'explore_clinical', type: 'secondary' },
                    { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
                 ];
                 addMessage(langContent.clinicalPathOverview, 'ai', choices);
                break;
            }
            // START: Fixed Clinical Skills Flow
            case 'clinical_skills': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.coreSkillsSubMenu.moreOnListening, payload: 'clinical_listening' },
                    { text: langContent.coreSkillsSubMenu.nextSkill, payload: 'clinical_next_skill' },
                    { text: langContent.navigation.backToClinical, payload: 'explore_clinical', type: 'secondary' },
                ];
                addMessage(langContent.coreSkillsPrompt, 'ai', choices);
                break;
            }
            case 'clinical_listening': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.coreSkillsSubMenu.nextSkill, payload: 'clinical_next_skill' },
                    { text: langContent.navigation.backToClinical, payload: 'explore_clinical', type: 'secondary' },
                ];
                addMessage(langContent.listeningContent, 'ai', choices);
                break;
            }
            case 'clinical_next_skill': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.navigation.backToClinical, payload: 'explore_clinical', type: 'secondary' },
                    { text: langContent.navigation.mainMenu, payload: 'main_menu', type: 'secondary' },
                ];
                addMessage(langContent.nextSkillContent, 'ai', choices);
                break;
            }
            // END: Fixed Clinical Skills Flow
            case 'explore_academic':
                setVisitedPaths(prev => [...prev, 'academic']);
                addMessage(langContent.academicHookPrompt, 'ai', [
                    { text: langContent.academicSubMenu.pathOverview, payload: 'academic_overview' },
                    { text: langContent.academicSubMenu.coreSkills, payload: 'academic_skills' },
                    { text: langContent.academicSubMenu.getPublished, payload: 'academic_publish' }
                ]);
                break;
            case 'academic_overview': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.navigation.compareClinical, payload: 'explore_clinical', type: 'secondary' },
                    { text: langContent.navigation.backToAcademic, payload: 'explore_academic', type: 'secondary' },
                    { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
                ];
                addMessage(langContent.academicPathOverview, 'ai', choices);
                break;
            }
            // Academic Path - Interactive Sections
            case 'academic_skills': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.academicSkills.menu.design, payload: 'academic_skill_design' },
                    { text: langContent.academicSkills.menu.stats, payload: 'academic_skill_stats' },
                    { text: langContent.academicSkills.menu.writing, payload: 'academic_skill_writing' },
                    { text: langContent.navigation.backToAcademic, payload: 'explore_academic', type: 'secondary' }
                ];
                addMessage(langContent.academicSkills.prompt, 'ai', choices);
                break;
            }
            case 'academic_skill_design': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.academicSkills.menu.stats, payload: 'academic_skill_stats' },
                    { text: langContent.navigation.backToAcademic, payload: 'explore_academic', type: 'secondary' },
                    { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
                ];
                addMessage(langContent.academicSkills.designContent, 'ai', choices);
                break;
            }
            case 'academic_skill_stats': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.academicSkills.menu.writing, payload: 'academic_skill_writing' },
                    { text: langContent.navigation.backToAcademic, payload: 'explore_academic', type: 'secondary' },
                    { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
                ];
                addMessage(langContent.academicSkills.statsContent, 'ai', choices);
                break;
            }
            case 'academic_skill_writing': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.navigation.backToAcademic, payload: 'explore_academic', type: 'secondary' },
                    { text: langContent.navigation.mainMenu, payload: 'main_menu', type: 'secondary' },
                    { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
                ];
                addMessage(langContent.academicSkills.writingContent, 'ai', choices);
                break;
            }
            case 'academic_publish': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.academicPublishing.menu.mentor, payload: 'academic_publish_mentor' },
                    { text: langContent.academicPublishing.menu.review, payload: 'academic_publish_review' },
                    { text: langContent.academicPublishing.menu.journal, payload: 'academic_publish_journal' },
                    { text: langContent.navigation.backToAcademic, payload: 'explore_academic', type: 'secondary' }
                ];
                addMessage(langContent.academicPublishing.prompt, 'ai', choices);
                break;
            }
            case 'academic_publish_mentor': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.academicPublishing.menu.review, payload: 'academic_publish_review' },
                    { text: langContent.navigation.backToAcademic, payload: 'explore_academic', type: 'secondary' },
                    { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
                ];
                addMessage(langContent.academicPublishing.mentorContent, 'ai', choices);
                break;
            }
            case 'academic_publish_review': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.academicPublishing.menu.journal, payload: 'academic_publish_journal' },
                    { text: langContent.navigation.backToAcademic, payload: 'explore_academic', type: 'secondary' },
                    { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
                ];
                addMessage(langContent.academicPublishing.reviewContent, 'ai', choices);
                break;
            }
            case 'academic_publish_journal': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                    { text: langContent.navigation.backToAcademic, payload: 'explore_academic', type: 'secondary' },
                    { text: langContent.navigation.mainMenu, payload: 'main_menu', type: 'secondary' },
                    { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
                ];
                addMessage(langContent.academicPublishing.journalContent, 'ai', choices);
                break;
            }
            // Mentors
            case 'show_mentors':
                addMessage(langContent.mentors.prompt, 'ai');
                const mentorProfiles = langContent.mentors.profiles.map(p => {
                    const profileText = (
                        <div>
                            <h4 className="font-bold">{p.name}</h4>
                            <p className="text-xs">{p.title}</p>
                        </div>
                    );
                    return { text: profileText, payload: p.payload };
                });
                addMessage(<div className="flex flex-col gap-2">{mentorProfiles.map((p, i) => <ChoiceButton key={i} choice={{text: p.text, payload: p.payload}} onClick={handleChoiceClick} />)}</div>, 'ai');
                break;
            case 'mentor_fatima': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                     { text: langContent.navigation.mainMenu, payload: 'main_menu', type: 'secondary' },
                     { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
                ];
                addMessage(langContent.mentors.fatimaStory, 'ai', choices);
                break;
            }
            case 'mentor_omar': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                     { text: langContent.navigation.mainMenu, payload: 'main_menu', type: 'secondary' },
                     { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
                ];
                addMessage(langContent.mentors.omarStory, 'ai', choices);
                break;
            }
            // What's new
            case 'whats_new': {
                // FIX: Explicitly type choices array to match Choice[] type
                const choices: Choice[] = [
                     { text: langContent.navigation.mainMenu, payload: 'main_menu', type: 'secondary' },
                     { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
                ];
                addMessage(<div><h3 className="font-bold text-lg mb-2">{langContent.whatsNewTitle}</h3><ReactMarkdown>{langContent.whatsNewContent}</ReactMarkdown></div>, 'ai', choices);
                break;
            }
            default:
                // Fallback for simple content display
                const contentKey = payload as keyof typeof langContent;
                if (langContent[contentKey]) {
                    addMessage(langContent[contentKey] as string, 'ai');
                }
                break;
        }
    };
    
    // Helper to find the text of a choice from its payload for displaying user's selection
    const findChoiceText = (payload: string): string | null => {
        for (let i = messages.length - 1; i >= 0; i--) {
            const choice = messages[i].choices?.find(c => c.payload === payload);
            if (choice) {
                // For ReactNode choices, we can't get a simple string, so we'll just return the payload or a generic response.
                if (typeof choice.text !== 'string') return null;
                return choice.text;
            }
        }
        return null;
    };


    const startCareerQuiz = () => {
        setChatState('career_quiz');
        setQuizScores({ clinical: 0, academic: 0, professional: 0, research: 0 });
        setQuizStep(0);
        addMessage(langContent.careerQuiz.startMessage, 'ai', [
            { text: langContent.careerQuiz.ready, payload: 'ready_career_quiz' }
        ]);
    };

    const askCareerQuizQuestion = (step: number) => {
        const quiz = langContent.careerQuiz;
        if (step < quiz.questions.length) {
            const q = quiz.questions[step];
            addMessage(q.question, 'ai', q.answers);
            setQuizStep(step);
        } else {
            // End of quiz, show results
            showCareerQuizResult();
        }
    };
    
    const showCareerQuizResult = () => {
        const { clinical, academic } = quizScores;
        let resultText = '';
        // FIX: Explicitly type choices array to match Choice[] type
        const choices: Choice[] = [
            { text: langContent.exploreSubMenu.clinical, payload: 'explore_clinical' },
            { text: langContent.exploreSubMenu.academic, payload: 'explore_academic' },
            { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
        ];

        if (clinical > academic) {
            resultText = langContent.careerQuiz.result.clinical;
        } else if (academic > clinical) {
            resultText = langContent.careerQuiz.result.academic;
        } else {
            resultText = langContent.careerQuiz.result.balanced;
        }
        
        addMessage(resultText, 'ai', choices);
        setChatState('main_menu'); // Return to main menu state after quiz
    };
    
     const startSkillsQuiz = () => {
        setChatState('skills_quiz');
        setQuizScores({ clinical: 0, academic: 0, professional: 0, research: 0 });
        setQuizStep(0);
        addMessage(langContent.skillsQuiz.startMessage, 'ai', [
            { text: langContent.skillsQuiz.ready, payload: 'ready_skills_quiz' }
        ]);
    };

    const askSkillsQuizQuestion = (step: number) => {
        const quiz = langContent.skillsQuiz;
        if (step < quiz.questions.length) {
            const q = quiz.questions[step];
            addMessage(q.question, 'ai', q.answers);
            setQuizStep(step);
        } else {
            showSkillsQuizResult();
        }
    };
    
    const showSkillsQuizResult = () => {
        const { clinical, research, professional } = quizScores;
        const strengths = [];
        if (clinical > 0) strengths.push(langContent.skillsQuiz.result.clinicalStrong);
        if (research > 0) strengths.push(langContent.skillsQuiz.result.researchStrong);
        if (professional > 0) strengths.push(langContent.skillsQuiz.result.professionalStrong);

        // Determine recommendation based on highest score or a default
        let recommendation = '';
        const maxScore = Math.max(clinical, research, professional);
        if (maxScore > 0) {
            if (clinical === maxScore) recommendation = langContent.skillsQuiz.result.recommendClinical;
            else if (research === maxScore) recommendation = langContent.skillsQuiz.result.recommendResearch;
            else if (professional === maxScore) recommendation = langContent.skillsQuiz.result.recommendProfessional;
        } else {
             recommendation = langContent.skillsQuiz.result.recommendClinical; // Default
        }


        const resultHeader = <div className="font-bold">{langContent.skillsQuiz.result.header}</div>;
        const resultStrengths = <ul className="list-disc list-inside my-2">{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>;
        const resultRecommendation = <div><h4 className="font-bold mt-3">{langContent.skillsQuiz.result.recommendationHeader}</h4><ReactMarkdown>{recommendation}</ReactMarkdown><p className="mt-2"><ReactMarkdown>{langContent.skillsQuiz.result.recommendationFooter}</ReactMarkdown></p></div>;

        addMessage(<div>{resultHeader}{resultStrengths}{resultRecommendation}</div>, 'ai');
        // FIX: Explicitly type choices array to match Choice[] type
        const choices: Choice[] = [
            { text: langContent.navigation.mainMenu, payload: 'main_menu', type: 'secondary' },
            { text: langContent.mainMenu.chat, payload: 'start_chat_mode', type: 'secondary'}
        ];
        addMessage(langContent.skillsQuiz.result.closing, 'ai', choices);
        setChatState('main_menu');
    };

    const handleQuizAnswer = (payload: string) => {
        const [question, answerType] = payload.split('_');
        
        setQuizScores(prev => {
            const newScores = {...prev};
            if (answerType === 'clinical') newScores.clinical += 1;
            else if (answerType === 'academic') newScores.academic += 1;
            else if (answerType === 'professional') newScores.professional += 1;
            else if (answerType === 'research') newScores.research += 1;
            return newScores;
        });

        const nextStep = quizStep + 1;
        if (chatState === 'career_quiz') {
            askCareerQuizQuestion(nextStep);
        } else if (chatState === 'skills_quiz') {
            askSkillsQuizQuestion(nextStep);
        }
    };
    
     const toggleAudioPlayback = async (text: string, messageId: number) => {
        if (!audioContextRef.current || !isSoundEnabled) return;

        // If clicking the same message that is playing, pause it
        if (audioPlayback.messageId === messageId && audioPlayback.status === 'playing') {
            audioContextRef.current.suspend();
            setAudioPlayback({ messageId, status: 'paused' });
            return;
        }

        // If clicking the same message that is paused, resume it
        if (audioPlayback.messageId === messageId && audioPlayback.status === 'paused') {
            audioContextRef.current.resume();
            setAudioPlayback({ messageId, status: 'playing' });
            return;
        }

        // Stop any currently playing audio
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }
        
        // If context was suspended, resume it for new playback
        if(audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        setIsAudioLoading(messageId);
        setAudioPlayback({ messageId: null, status: 'paused' });

        try {
            const base64Audio = await generateSpeech(text);
            const audioBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
            
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
            
            source.onended = () => {
                setAudioPlayback({ messageId: null, status: 'paused' });
                audioSourceRef.current = null;
            };

            audioSourceRef.current = source;
            setAudioPlayback({ messageId, status: 'playing' });

        } catch (error) {
            console.error("Error playing audio:", error);
            // Optionally, add a user-facing error message
        } finally {
            setIsAudioLoading(null);
        }
    };

    if (!language) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-brand-primary p-4">
                 <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white">{content.en.headerTitle} <span className="text-brand-secondary">{content.en.headerSubtitle}</span></h1>
                    <h2 className="text-2xl font-bold text-gray-300 mt-2" dir="rtl">{content.ar.headerTitle} <span className="text-brand-secondary">{content.ar.headerSubtitle}</span></h2>
                    <p className="text-sm text-gray-400 mt-2">{content.en.headerCollaboration}</p>
                 </div>
                <div className="flex gap-4">
                    <button onClick={() => handleLanguageSelect('en')} className="bg-brand-secondary hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105">English</button>
                    <button onClick={() => handleLanguageSelect('ar')} className="bg-brand-secondary hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105">العربية</button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
           <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-brand-primary/80 backdrop-blur-sm sticky top-0 z-10">
                <div>
                     <h1 className="text-xl font-bold text-white">{langContent.headerTitle} <span className="text-brand-secondary">{langContent.headerSubtitle}</span></h1>
                     <p className="text-xs text-gray-400">{langContent.headerCollaboration}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label={isSoundEnabled ? "Disable Sound" : "Enable Sound"}>
                        {isSoundEnabled ? <SpeakerIcon /> : <AudioOffIcon />}
                    </button>
                    <button onClick={handleRestart} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Restart Conversation">
                        <RefreshIcon />
                    </button>
                </div>
           </header>
            <ChatWindow 
                messages={messages} 
                isLoading={isLoading} 
                onChoiceClick={handleChoiceClick} 
                language={language}
                onToggleAudio={toggleAudioPlayback}
                audioPlayback={audioPlayback}
                isAudioLoading={isAudioLoading}
                isSoundEnabled={isSoundEnabled}
            />
            <footer className="p-4 border-t border-gray-700">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    {/* FIX: Corrected typo `e.g.value` to `e.target.value` in the onChange handler. */}
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={langContent.inputPlaceholder}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary text-white"
                        disabled={isLoading || !['awaiting_challenge', 'chat_mode', 'analysis_mode'].includes(chatState)}
                    />
                    <button type="submit" className="bg-brand-secondary text-white p-2 rounded-full hover:bg-blue-500 disabled:bg-gray-500 transition-colors" disabled={isLoading || !userInput.trim()}>
                        <SendIcon />
                    </button>
                </form>
                 <p className="text-center text-xs text-gray-500 mt-2">{langContent.footerDisclaimer}</p>
            </footer>
        </div>
    );
};

export default App;

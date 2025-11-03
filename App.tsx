
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message, Choice, GroundingSource } from './types';
import { ChatWindow } from './components/ChatWindow';
import { getChatResponseStream, getAnalysisResponseStream, generateSpeech } from './services/geminiService';
// FIX: Import `BotIcon` to resolve reference error.
import { SendIcon, RefreshIcon, SpeakerIcon, AudioOffIcon, LogoIcon, HomeIcon, ExploreIcon, QuizIcon, TrainingIcon, BotIcon } from './components/icons';
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


const content = {
  usa: {
    en: {
      headerTitle: "Career Pathfinder",
      headerSubtitle: "American Psychological Association",
      headerCollaboration: "In collaboration with the APA",
      inputPlaceholder: "Type your message or use the menu...",
      distressMessage: "It sounds like you are going through a difficult time. Please know that I am an AI assistant for career guidance only and cannot provide mental health support. **For immediate help, please call or text the 988 Suicide & Crisis Lifeline.** Please reach out to a qualified professional.",
      welcomeIntro: `Welcome to the Career Pathfinder!

I am an AI assistant supported by the [APA's 'Engaging Psychology's Future' (EPF) Initiative](https://www.apa.org/about/governance/president/engaging-psychologys-future), designed to help you explore career paths from the bachelor's to the doctoral level in the United States.

> *A common myth is that you must have a graduate degree to find a job in psychology. The reality is that your Bachelor's degree opens doors to many exciting fields! In fact, data from the [APA's Center for Workforce Studies](https://www.apa.org/workforce/data-tools/bachelors-workforce) shows that the vast majority of psychology graduates enter the workforce with their Bachelor's degree.*
>
> — Insight from Dr. Jaye Van Kirk, Professor Emeritus of Psychology

How can I help you today?`,
      
      mainMenu: {
        explore: "🗺️ Explore Career Paths",
        discoveryQuiz: "🧩 Career Discovery Quiz",
        training: "🚀 Career & Skill Training",
        expertQuestion: "💬 Ask an Expert Question",
        team: "🤝 Meet the Team",
        whatsNew: "✨ Join APA for Free",
        aboutUs: "👥 About Us"
      },
      aboutUsContent: `This Career Pathfinder was developed in collaboration with the American Psychological Association (APA) as a direct execution of the **[APA's 'Engaging Psychology's Future' (EPF) Presidential Initiative](https://www.apa.org/about/governance/president/engaging-psychologys-future/resources).**

Inspired by the vision of **Dr. Jaye Van Kirk**, we are dedicated to challenging the myth that a graduate degree is the only path to a successful career in psychology. This tool is designed to illuminate the diverse and exciting career opportunities available to you right now, with your Bachelor's degree.

Our mission is to empower you with clarity and confidence, bridging the gap between your academic knowledge and its powerful application in the real world. We're here to help you navigate your future and become part of the next generation of psychology leaders.`,
      
      // Clinical Path
      clinicalLicensing: "Licensing in the USA", // Main menu item
      clinicalLicensingHook: `In the United States, the path to becoming a licensed clinical psychologist is rigorous and regulated at the state level. While specific requirements vary by state, the journey generally follows a standardized framework set by professional organizations like the APA. Which part of the process would you like to explore?`,
      clinicalLicensingSubMenu: {
        educational: "Educational Requirements (The Doctorate)",
        training: "Supervised Experience (Internship & Postdoc)",
        fees: "Examinations (EPPP & State Exams)",
        scope: "The Role of State Boards",
      },
      clinicalLicensingEducational: `### Educational Requirements (The Doctorate)
*   **Degree:** You must earn a doctoral degree (a Ph.D. or a Psy.D.) from a program accredited by the American Psychological Association (APA). This ensures the program meets high standards for scientific and professional training.
*   **Coursework:** Doctoral programs include comprehensive coursework in psychological theory, research methods, statistics, ethics, and hands-on clinical practicum experiences.`,
      clinicalLicensingTraining: `### Supervised Experience Requirements
*   **Pre-doctoral Internship:** Before graduating, students must complete a one-year, full-time supervised internship. This is a highly structured, intensive clinical experience.
*   **Postdoctoral Fellowship:** Most states require at least one year (often 1,500-2,000 hours) of supervised professional experience *after* earning the doctorate. This "postdoc" is critical for developing advanced clinical competence.`,
      clinicalLicensingFees: `### Examinations (EPPP & State Exams)
*   **National Exam:** The primary exam is the [Examination for Professional Practice in Psychology (EPPP)](https://www.asppb.net/eppp/), a national, standardized test covering core knowledge in psychology.
*   **State Exam:** Most states also require applicants to pass a jurisprudence exam, which tests knowledge of that state's specific laws, rules, and ethical codes related to the practice of psychology.`,
      clinicalLicensingScope: `### The Role of State Boards & Continuing Education
*   **State-Level Authority:** Licensure is granted by individual state or provincial psychology licensing boards, not the APA. It is **crucial** to check the specific requirements of the state where you intend to practice. The [Association of State and Provincial Psychology Boards (ASPPB)](https://www.asppb.net/) provides a directory of these boards.
*   **Renewal:** Your license must be renewed periodically (e.g., every two years), which requires completing a set number of continuing education (CE) credits to stay current in the field.`,
    }
  },
  egypt: {
    en: {
      headerTitle: "The PsyEgypt",
      headerSubtitle: "Career Pathfinder",
      headerCollaboration: "In collaboration with the APA",
      inputPlaceholder: "Type your message or use the menu...",
      distressMessage: "It sounds like you are going through a difficult time. Please know that I am an AI assistant for career guidance only and cannot provide mental health support. **For immediate help, please contact The General Secretariat of Mental Health and Addiction Treatment hotline at 08008880700.** Please reach out to a qualified professional.",
      
      welcomeIntro: `Welcome to the PsyEgypt Career Pathfinder!

I am an AI assistant supported by the [APA's 'Engaging Psychology's Future' (EPF) Initiative](https://www.apa.org/about/governance/president/engaging-psychologys-future), designed to help you explore career paths from the bachelor's to the doctoral level in Egypt and the MENA region.

> *A common myth is that you must have a graduate degree to find a job in psychology. The reality is that your Bachelor's degree opens doors to many exciting fields! In fact, data from the [APA's Center for Workforce Studies](https://www.apa.org/workforce/data-tools/bachelors-workforce) shows that the vast majority of psychology graduates enter the workforce with their Bachelor's degree.*
>
> — Insight from Dr. Jaye Van Kirk, Professor Emeritus of Psychology

How can I help you today?`,
      
      mainMenu: {
        explore: "🗺️ Explore Career Paths",
        discoveryQuiz: "🧩 Career Discovery Quiz",
        training: "🚀 Career & Skill Training",
        expertQuestion: "💬 Ask an Expert Question",
        team: "🤝 Meet the Team",
        whatsNew: "✨ Join APA for Free",
        aboutUs: "👥 About Us"
      },
      aboutUsContent: `This Career Pathfinder was developed by **PsyEgypt (مجتمع علم النفس في مصر)**, the pioneering platform for psychology in Egypt. PsyEgypt is the first initiative of its kind to connect the international scientific community with the local community, offering AI-powered services to empower students and graduates. Our work is a direct execution of the **[APA's 'Engaging Psychology's Future' (EPF) Presidential Initiative](https://www.apa.org/about/governance/president/engaging-psychologys-future/resources).**

Inspired by the vision of **Dr. Jaye Van Kirk**, we are dedicated to challenging the myth that a graduate degree is the only path to a successful career in psychology. This tool is designed to illuminate the diverse and exciting career opportunities available to you right now, with your Bachelor's degree.

Our mission is to empower you with clarity and confidence, bridging the gap between your academic knowledge and its powerful application in the real world. We're here to help you navigate your future and become part of the next generation of psychology leaders.`,

      quickNav: {
        mainMenu: "Main Menu",
        discoveryQuiz: "Discovery Quiz",
        training: "Training",
      },

      expertQuestionPrompt: "You can now ask me an expert-level question about psychology careers. For topics requiring the most current information, I will access up-to-date sources from the web. For complex career strategy questions, I will use advanced reasoning to provide a deep analysis.",

      team: {
          prompt: "Meet the team behind the PsyEgypt Career Pathfinder. Our mission combines deep academic expertise with innovative technology to support your journey. Who would you like to learn about?",
          menu: {
              jaye: "Dr. Jaye Van Kirk (Mentor)",
              marco: "Marco Magdy (Creator)"
          },
          jaye: {
              title: "Dr. Jaye Van Kirk, Mentor",
              subtitle: "Professor Emeritus of Psychology, San Diego Mesa College | Past National President, Psi Beta",
              bio: "With over 15 years of experience teaching a dedicated 'Careers in Psychology' course, Dr. Van Kirk is a leading expert in helping students navigate their professional journey. Her approach is grounded in research-based evidence from sources like the APA's Center for Workforce Studies, aiming to provide students with a realistic and empowering view of their career options.",
              mission: "To debunk the pervasive myth that a graduate degree is the only path to a successful career in psychology. Dr. Van Kirk is passionate about empowering students to recognize the immense value and marketability of their Bachelor's degree, equipping them with the knowledge to confidently enter the workforce.",
              quote: "The data is clear: you are highly employable *now*. Be proactive. Seek out undergraduate research opportunities, volunteer, and conduct informational interviews. These experiences, combined with the skills from your degree, will make you a standout candidate."
          },
          marco: {
              title: "Marco Magdy Abdelmaseh, Creator & Developer",
              subtitle: "Founder of PsyEgypt | APA Campus Ambassador | AI Specialist",
              bio: "Marco's journey into psychology wasn't linear. After starting in a different field, he made a courageous career shift, driven by a newfound passion for understanding the human mind. However, he quickly discovered that the path for aspiring psychologists in the MENA region was filled with obstacles: a lack of clear guidance, limited mentorship, and a gap between academic theory and real-world careers. This personal struggle wasn't a dead end; it became his mission. He founded PsyEgypt to build the very resource he wished he'd had.",
              mission: "As an APA Campus Ambassador, Marco is dedicated to bridging the gap between international resources and local students. His mission is to use technology to democratize career knowledge, making the route into psychology clearer, more accessible, and less intimidating for the next generation of leaders in Egypt and the MENA region.",
              quote: "I built this tool to be the supportive guide I never had. My vision is to use technology to bridge the gap between academic knowledge and real-world opportunity, empowering you to forge your own unique career with confidence."
          }
      },

      careerDiscoveryQuiz: {
          startMessage: "This quiz will help you discover career paths that match your interests. Let's start by understanding where you are in your educational journey. What is your current or highest level of education?",
          educationLevels: {
              thanwya: "High School (Thanaweya Amma) / Undergraduate Student",
              ba: "Bachelor's Degree (BA/BSc) in Psychology",
              ma: "Master's Degree (MA/MSc) in Psychology",
              phd: "Doctoral Degree (PhD/PsyD) in Psychology"
          },
          readyMessage: "Great! Now, for each of the following questions, choose the option that most resonates with you.",
          questions: [
              {
                  question: "What kind of impact most motivates you?",
                  answers: [
                      { text: "Directly helping individuals navigate their personal challenges.", payload: "q0_clinical" },
                      { text: "Improving systems and efficiency within an organization.", payload: "q0_organizational" },
                      { text: "Discovering new knowledge and understanding complex patterns.", payload: "q0_research" },
                      { text: "Applying psychological principles to improve technology and products.", payload: "q0_tech" }
                  ]
              },
              {
                  question: "Which work environment sounds most appealing?",
                  answers: [
                      { text: "A collaborative corporate office with team-based projects.", payload: "q1_organizational" },
                      { text: "A university or research lab, surrounded by data and literature.", payload: "q1_research" },
                      { text: "A private, quiet setting for one-on-one interactions.", payload: "q1_clinical" },
                      { text: "A dynamic tech company, working with designers and engineers.", payload: "q1_tech" }
                  ]
              },
              {
                  question: "Which of these tasks would you enjoy the most?",
                  answers: [
                      { text: "Conducting interviews to understand user needs for a new app.", payload: "q2_tech" },
                      { text: "Administering and interpreting a psychological assessment.", payload: "q2_clinical" },
                      { text: "Designing a training program for new employees.", payload: "q2_organizational" },
                      { text: "Analyzing a large dataset with SPSS to find significant results.", payload: "q2_research" }
                  ]
              },
              {
                  question: "Who would you prefer to work with primarily?",
                  answers: [
                      { text: "Children and adolescents.", payload: "q3_clinical" },
                      { text: "Working adults and teams.", payload: "q3_organizational" },
                      { text: "Data, theories, and concepts.", payload: "q3_research" },
                      { text: "End-users of a product or service.", payload: "q3_tech" }
                  ]
              }
          ],
          results: {
              header: "Based on your answers, here are the top career clusters that seem to align with your interests. This is a starting point for exploration, designed to spark ideas regardless of your current career stage.",
              trainingPlan: "For an undergraduate, the best first step is to gain practical experience. To get started, we recommend following our **{clusterTitle} Training Plan** to build foundational skills.",
              clinical: {
                  title: "Clinical & Counseling Path",
                  description: "You're drawn to helping people directly. This path, often represented by [APA's Division 12 (Society of Clinical Psychology)](https://www.div12.org/), focuses on diagnosing and treating mental, emotional, and behavioral disorders.",
                  roles: {
                      ba: "Case Manager, Social Services Assistant, Psychiatric Technician.",
                      ma: "Licensed Counselor, School Psychologist, Marriage and Family Therapist.",
                      phd: "Licensed Clinical Psychologist, Neuropsychologist, Private Practitioner."
                  }
              },
              organizational: {
                  title: "Organizational & HR Path",
                  description: "You enjoy improving systems and working with teams. This field, represented by [APA's Division 14 (Society for Industrial and Organizational Psychology)](https://www.siop.org/), applies psychology to the workplace to improve productivity and employee well-being.",
                  roles: {
                      ba: "HR Coordinator, Recruiter, Training and Development Assistant.",
                      ma: "HR Manager, Organizational Development Consultant, Talent Acquisition Specialist.",
                      phd: "Chief People Officer, Industrial-Organizational Psychologist, Executive Coach."
                  }
              },
              research: {
                  title: "Research & Academic Path",
                  description: "You are driven by curiosity and the pursuit of knowledge. This path involves conducting studies, analyzing data, and contributing to the scientific understanding of the mind and behavior, a core mission of the [APA Science Directorate](https://www.apa.org/science).",
                  roles: {
                      ba: "Research Assistant, Data Analyst, Lab Manager.",
                      ma: "University Lecturer, Research Scientist (in government or private sector).",
                      phd: "University Professor, Principal Investigator, Senior Research Scientist."
                  }
              },
              tech: {
                  title: "Technology & User Experience (UX) Path",
                  description: "You're interested in the intersection of psychology and technology. This path focuses on making products and services more intuitive, effective, and enjoyable for users, a field explored in depth by [Human Factors psychologists](https://www.apa.org/education-career/guide/user-experience-design).",
                  roles: {
                      ba: "UX Research Assistant, Content Strategist, Marketing Analyst.",
                      ma: "UX Researcher, Product Manager, Human Factors Specialist.",
                      phd: "Senior UX Researcher, Director of Product, Research Scientist (in tech)."
                  }
              },
              closing: "This is a starting point for your exploration. To learn more, you can dive into the 'Explore Career Paths' section or get actionable advice in our 'Career & Skill Training' module.",
              nextSteps: "What's next?"
          }
      },

      careerTraining: {
          prompt: "Building practical skills is crucial for your career. This section provides actionable guidance. Where would you like to start?",
          menu: {
              undergrad: "🎓 Undergraduate Training Opportunities",
              byPath: "🎯 Skill Training by Career Path"
          },
          undergradContent: `As an undergraduate, gaining hands-on experience is one of the most valuable things you can do. It builds your CV, helps you discover your passions, and creates a professional network. Here are some key strategies:

### 1. Become a Research Assistant
*   **Why it Matters:** This is essential for graduate school applications and teaches you practical skills like data entry (SPSS), literature reviews, and research ethics. See the APA's guide on [how to get research experience](https://www.apa.org/education-career/guide/get-experience).
*   **Action Steps:**
    *   Identify 2-3 professors at your university whose research interests you.
    *   Read one of their recent papers.
    *   Send them a professional email introducing yourself, mentioning their paper, and offering to volunteer your time.
*   **Key Benefits:** Develop a strong relationship with a potential mentor for recommendation letters.

### 2. Volunteer in a Relevant Setting
*   **Why it Matters:** This provides invaluable, real-world exposure to different populations and work environments. It demonstrates your commitment and empathy.
*   **Action Steps:**
    *   Seek opportunities at local NGOs, community mental health clinics, schools for children with special needs, or hospitals.
*   **Key Benefits:** Confirms your interest in a specific field (e.g., clinical) before committing to graduate studies.

### 3. Conduct Informational Interviews
*   **Why it Matters:** This is a low-pressure way to [network effectively](https://www.apa.org/gradpsych/2012/01/networking), get insider advice, and understand the day-to-day reality of a job.
*   **Action Steps:**
    *   Use LinkedIn to find professionals in Egypt working in a career you're curious about.
    *   Send them a polite, concise connection request asking for a 15-minute "informational interview" to learn about their journey.
*   **Key Benefits:** Builds your professional network and uncovers hidden job opportunities.

### 4. Join Student Organizations
*   **Why it Matters:** This develops leadership, project management, and public speaking skills. Consider joining the [American Psychological Association of Graduate Students (APAGS)](https://www.apa.org/apags) if you plan on graduate studies.
*   **Action Steps:**
    *   Join (or start!) a psychology club at your university.
    *   Organize events, invite guest speakers, and create a study community.
*   **Key Benefits:** Demonstrates initiative and teamwork skills to future employers.`,
          byPathPrompt: "Excellent. Let's focus on the skills for a specific career path. Which area are you targeting?",
          byPathMenu: {
              clinical: "Clinical & Counseling",
              organizational: "Organizational & HR",
              research: "Research & Academia",
              tech: "Technology & UX"
          },
          clinicalContent: `### Core Skills
*   **Must-Haves:** Active Listening, Empathy, Therapeutic Alliance Building.
*   **Important:** Clinical Note-Taking (e.g., SOAP notes), Crisis Intervention.

### Recommended Training
*   **Theoretical:** Take online introductory courses on therapeutic modalities like Cognitive Behavioral Therapy (CBT) from platforms like Coursera. For more on evidence-based practices, explore the resources from [APA's Division 12](https://www.div12.org/psychological-treatments/).
*   **Practical:** Volunteer at a helpline or a peer support center. This provides supervised practice in active listening and crisis management.
*   **Action Step:** For one week, practice *reflective listening* with friends. After they speak, say "So what I'm hearing is..." and summarize their point without adding your own opinion. Notice how it changes the conversation.`,
          organizationalContent: `### Core Skills
*   **Must-Haves:** Public Speaking, Conflict Resolution, Project Management.
*   **Important:** Data Analysis (for employee surveys, etc.), Understanding of Egyptian Labor Law.

### Recommended Training
*   **Theoretical:** Read books like "Crucial Conversations." Consider an online certification in HR fundamentals (like the aPHR or SHRM-CP). For more professional resources, visit the [Society for Industrial and Organizational Psychology (SIOP)](https://www.siop.org/).
*   **Practical:** Take on a leadership role in a student club to practice project management. Join a Toastmasters club to improve public speaking.
*   **Action Step:** Create a simple project plan for a personal goal (e.g., "Complete my final paper"). Define objectives, tasks, and deadlines. This builds a project management mindset.`,
          researchContent: `### Core Skills
*   **Must-Haves:** Statistical Analysis (SPSS or R), Scientific Writing (APA Style).
*   **Important:** Research Methodology, Critical Thinking, Literature Review.

### Recommended Training
*   **Theoretical:** Master the [APA Style Guide](https://apastyle.apa.org/). Watch tutorials on the official [IBM SPSS Statistics YouTube channel](https://www.youtube.com/user/IBMSPSSStatistics).
*   **Practical:** The best way to learn is by doing. You can find inspiration by browsing [APA's extensive journal database](https://www.apa.org/pubs/journals).
*   **Action Step:** Find a research article in your area of interest. Write a one-page summary that explains the research question, methods, key findings, and limitations in your own words.`,
          techContent: `### Core Skills
*   **Must-Haves:** User Research Methods (interviews, surveys, usability testing), Data Synthesis.
*   **Important:** Wireframing basics (e.g., Figma), Clear Communication (presenting findings to non-psychologists).

### Recommended Training
*   **Theoretical:** Read classic UX books like "Don't Make Me Think" by Steve Krug. Consider a structured program like Google's [UX Design Professional Certificate on Coursera](https://www.coursera.org/professional-certificates/google-ux-design). You can also explore the work of [APA's Division of Applied Experimental & Engineering Psychology](https://www.apa.org/about/division/div21).
*   **Practical:** Offer to do a free "heuristic evaluation" of a local small business's website. Provide them with a short report of potential usability issues.
*   **Action Step:** Pick a mobile app you use daily. For 15 minutes, actively try to notice things that are confusing or frustrating. Write down three specific suggestions for improvement. This trains your UX observation skills.`
      },

      whatsNewTitle: "✨ Join APA for Free!",
      whatsNewContent: "This week, we're highlighting a special offer from our partners at the APA! As a referred member, you’re invited to take advantage of an exclusive opportunity to [join APA—for free](https://click.info.apa.org/?qs=280a7ec07bbe607469afc6752b3eaa283615a5f3e15695b4778926d2a7822aa6e64bc3c073813a4ccd1dc51a23b96deee8b44eb3911c049e)! *Offer valid for first-time APA members only.*",
      
      helpfulPrompt: "What's next?",

      // Explore Path
      exploreSubMenuPrompt: "Great! Let's look at the different directions your psychology degree can take you. The most common path, taken by the majority of graduates, is exploring careers available with a Bachelor's degree. There are also more specialized roles that require advanced graduate studies. Which path would you like to explore first?",
      exploreSubMenu: {
        bachelors: "Careers with a Bachelor's Degree (Most Common Path)",
        advanced: "Advanced Paths (Requires Graduate Studies)"
      },
      advancedSubMenuPrompt: "Excellent. These specialized paths require a graduate degree (Master's or Doctorate) and open doors to roles in research and licensed practice. Which area interests you?",
      advancedSubMenu: {
          clinical: "Clinical Path",
          academic: "Academic Path"
      },

      
      // Clinical Path
      clinicalHookPrompt: "Excellent. The Clinical Path is a rewarding journey to help people directly. What aspect of this path interests you most?",
      clinicalSubMenu: {
        pathOverview: "Detailed Overview",
        coreSkills: "Core Skills",
        hearStory: "Mentor's Perspective",
        licensing: "Licensing in Egypt",
      },
      clinicalPathOverview: `The Clinical Path, as defined by the [American Psychological Association](https://www.apa.org/ed/graduate/specialize/clinical), is focused on applying psychological principles to help individuals and groups with mental, emotional, and behavioral challenges. Many clinicians find deep satisfaction in this direct, hands-on work.

**Typical Responsibilities:**
*   Conducting one-on-one or group therapy sessions.
*   Administering and interpreting psychological assessments for diagnosis.
*   Developing and implementing personalized treatment plans.
*   Collaborating with doctors, social workers, and other professionals.

**Required Education:**
The journey starts with a Bachelor's degree in Psychology. In Egypt and the MENA region, a Master's degree is the minimum requirement to practice, often followed by specialized diplomas. For full licensure as a 'Psychologist' and more autonomy, a PhD or PsyD is typically necessary. To learn more about specialties, explore [APA Division 12 (Society of Clinical Psychology)](https://www.div12.org/).

**Potential Work Environments:**
You could find yourself working in diverse settings such as hospitals, private clinics, community mental health centers, schools, rehabilitation facilities, or even corporate wellness programs.`,
      clinicalLicensing: `In a landmark development for psychology in Egypt (Law No. 203 of 2020), there's now a clear pathway for non-physicians to obtain a license to practice psychotherapy. This is a significant step forward, aligning with international standards.

The requirements are broken down into several key areas. Which part would you like to explore?`,
      clinicalLicensingSubMenu: {
          educational: "Educational & Personal Requirements",
          training: "Training & Supervision",
          fees: "Licensing & Renewal",
          scope: "Scope of Practice & Limitations",
      },
      clinicalLicensingEducational: `### Educational & Personal Requirements
*   **Degree:** A Master's or Doctorate in Clinical Psychology from the Faculty of Arts of an accredited Egyptian university (or an equivalent).
*   **Good Standing:** Must have a good reputation and no criminal record related to honor or integrity.
*   **Membership:** Must be an active member of a recognized psychological association in Egypt or abroad.
*   **Examination:** Must pass a dedicated interview and examination set by the official committee.`,
      clinicalLicensingTraining: `### Training & Supervision Requirements
*   **Supervised Practice:** A minimum of two years of supervised practical training in a recognized governmental or licensed private hospital (with at least 25 beds).
*   **Supervision:** The practice must be under the direct supervision of a licensed psychiatrist.
*   **Academic Courses:** Must complete at least seven specialized training courses from an approved body, covering topics such as Professional Ethics and various CBT applications (for Depression, OCD, Anxiety, PTSD, etc.).`,
      clinicalLicensingFees: `### Licensing & Renewal
*   **Initial Fee:** A fee of 2000 EGP is required to obtain the license.
*   **Validity:** The license is valid for seven years.
*   **Renewal:** Renewal requires passing an exam and a fee of 1000 EGP.`,
      clinicalLicensingScope: `### Scope of Practice & Limitations
*   **Collaboration:** Psychotherapists **must** collaborate with a treating psychiatrist. Therapy cannot continue without the psychiatrist's approval.
*   **Prohibitions:** It is strictly forbidden for a psychotherapist to diagnose medical conditions, treat organic diseases, or write any medical prescriptions. Patients must be referred to a psychiatrist if new symptoms arise.

This is a significant step forward, aligning with international standards advocated by organizations like the [APA](https://www.apa.org/about/policy/statement-regulation-practice-psychology). It ensures practitioners are highly qualified and provides public safety. For the most current details, always refer to the official [Egyptian Ministry of Health website](https://www.mohp.gov.eg/).`,
      coreSkillsPrompt: "This is a key question. Practical skills are in demand, and the most critical one is **Active Listening**. What's next?",
      coreSkillsSubMenu: {
          moreOnListening: "More on Active Listening",
          nextSkill: "Next Skill"
      },
      listeningContent: "Active Listening isn't just hearing words; it's about understanding the emotion and intent behind them. It involves paraphrasing, asking clarifying questions, and showing empathy to build trust. The APA provides excellent resources for undergraduates. Here's a link to their [main resource page](https://www.apa.org/education-career/undergrad) to learn more.",
      nextSkillContent: "Another key skill is **Empathy**. This goes beyond listening to truly understanding and sharing the feelings of another. After that comes building a **'[Therapeutic Alliance](https://www.apa.org/monitor/2019/11/ce-corner-alliance)'** - the trust and rapport between you and your client, which is the foundation of effective therapy.",
      
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
          designContent: "Research design is the blueprint of your study. A strong design ensures your results are valid and reliable. It's about choosing the right approach—experimental, correlational, longitudinal—to answer your specific question. **Key Action:** Familiarize yourself with different research designs by reading the methodology sections of papers in top APA journals. Notice how the design directly serves the research question. For a foundational guide, you can explore the [APA's instructional aids](https://apastyle.apa.org/instructional-aids) page.",
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

      // Bachelor's Path Content
      bachelorsHookPrompt: "That's a fantastic and practical area to explore! A Bachelor's degree in psychology opens doors to many fields where understanding human behavior is a major advantage. Where would you like to start?",
      bachelorsSubMenu: {
        pathOverview: "Detailed Overview",
        coreSkills: "Key Transferable Skills"
      },
      bachelorsPathOverview: `This is the most common path, taken by the vast majority of psychology graduates—around 90% according to [APA workforce studies](https://www.apa.org/workforce/data-tools/bachelors-workforce). It's a common misconception that a graduate degree is required for a successful career, but the skills you learn in your Bachelor's program are highly sought after across many industries.

**Key Insight:** You are not just learning about psychology; you are learning how to understand people, analyze data, communicate complex ideas, and solve problems—skills every employer wants.

**Potential Career Fields:**
*   **Human Resources:** Roles in recruiting, training, and employee relations.
*   **Market Research:** Analyzing consumer behavior to inform business strategy.
*   **User Experience (UX):** As you saw with our mentor Omar, this field blends psychology and tech to make products more user-friendly.
*   **Social & Community Services:** Working as a case manager or in non-profits to support communities.
*   **Sales & Marketing:** Using principles of persuasion and communication to connect with customers.

For a deeper look, the APA has an excellent guide on what you can do with your degree: [Careers for Psychology Majors](https://www.apa.org/education-career/guide/careers).`,
      bachelorsSkillsContent: `The skills you gain from a psychology degree are your 'superpower' in the job market. The most critical is **Critical Thinking**—the ability to analyze information objectively and make reasoned judgments.

Another is **Communication**. This isn't just about speaking or writing well, but also about active listening and understanding non-verbal cues.

Finally, there's **Data Literacy**. Your training in research methods and statistics, even at a basic level, is a huge asset.

These are all detailed in the APA's guide on [Transferable Skills (PDF)](https://www.apa.org/education-career/guide/transferable-skills.pdf). Focusing on how to present these skills on your CV is a crucial next step.`,


      underConstruction: "This is an important area. This interactive module is currently under development, but I can offer you our main resources now.",

      feedbackQuestion: 'Was this conversation helpful?',
      yes: '👍 Yes',
      no: '👎 No',
      pollQuestion: "After our chat, how much clearer do you feel about your career path in psychology?\n\n(1 = Not Clear at all, 5 = Very Clear)",
      pollThanks: "Thank you for your feedback! Your input is valuable for the APA's mission.",
      quizProgressText: "Question {current} of {total}",
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
          backToBachelors: "Back to BA/BSc Path",
          compareAcademic: "Compare with Academic",
          compareClinical: "Compare with Clinical",
      },
      endChatPrompt: "Thank you for using the Pathfinder! We wish you the best in your career journey. Before you go, would you like to provide more detailed feedback?",
    },
    ar: {
      headerTitle: "ساي إيجيبت",
      headerSubtitle: "مسار الإرشاد المهني",
      headerCollaboration: "بالتعاون مع APA",
      inputPlaceholder: "اكتب رسالتك أو استخدم القائمة...",
      distressMessage: "يبدو أنك تمر بوقت عصيب. يرجى العلم بأنني مساعد ذكاء اصطناعي للإرشاد المهني فقط ولا يمكنني تقديم دعم في الصحة النفسية. **للمساعدة الفورية، يرجى الاتصال بالخط الساخن للأمانة العامة للصحة النفسية وعلاج الإدمان على 08008880700.** يرجى التواصل مع متخصص مؤهل.",
      
      welcomeIntro: `أهلاً بك في مسار الإرشاد المهني من ساي إيجيبت!

أنا مساعد ذكاء اصطناعي مدعوم من [مبادرة 'إشراك مستقبل علم النفس' (EPF) التابعة لجمعية علم النفس الأمريكية (APA)](https://www.apa.org/about/governance/president/engaging-psychologys-future)، مصمم لمساعدتك على استكشاف المسارات المهنية من مرحلة البكالوريوس إلى الدكتوراه في مصر ومنطقة الشرق الأوسط وشمال أفريقيا.

> *هناك خرافة شائعة تقول إنه يجب أن تكون حاصلاً على درجة دراسات عليا للعثور على وظيفة في علم النفس. الحقيقة هي أن درجة البكالوريوس تفتح الأبواب أمام العديد من المجالات المثيرة! في الواقع، تظهر البيانات من [مركز دراسات القوى العاملة التابع لـ APA](https://www.apa.org/workforce/data-tools/bachelors-workforce) أن الغالبية العظمى من خريجي علم النفس يدخلون سوق العمل بدرجة البكالoriوس.*
>
> — رؤية من د. جاي فان كيرك، أستاذ فخري في علم النفس

كيف يمكنني مساعدتك اليوم؟`,
      
      mainMenu: {
        explore: "🗺️ استكشف المسارات المهنية",
        discoveryQuiz: "🧩 اختبار اكتشاف المسار المهني",
        training: "🚀 التدريب المهني وتنمية المهارات",
        expertQuestion: "💬 اطرح سؤال خبير",
        team: "🤝 تعرف على الفريق",
        whatsNew: "✨ انضم إلى APA مجانًا",
        aboutUs: "👥 من نحن"
      },

      aboutUsContent: `تم تطوير "مسار الإرشاد المهني" هذا بواسطة **ساي إيجيبت (مجتمع علم النفس في مصر)**، وهي المنصة الرائدة الأولى من نوعها في علم النفس في مصر. ساي إيجيبت هي أول مبادرة تجمع بين المجتمع العلمي الدولي والمجتمع المحلي، وتقدم خدمات مدعومة بالذكاء الاصطناعي لتمكين الطلبة والخريجين. عملنا هو تنفيذ مباشر لـ**[مبادرة 'إشراك مستقبل علم النفس' (EPF) الرئاسية التابعة لجمعية علم النفس الأمريكية (APA)](https://www.apa.org/about/governance/president/engaging-psychologys-future/resources).**

مستلهمين من رؤية **الدكتورة جاي فان كيرك**، نحن ملتزمون بتحدي الخرافة القائلة بأن درجة الدراسات العليا هي السبيل الوحيد لمهنة ناجحة في علم النفس. صُممت هذه الأداة لتسليط الضوء على الفرص المهنية المتنوعة والمثيرة المتاحة لك الآن، بدرجة البكالوريوس.

مهمتنا هي تمكينك بالوضوح والثقة، وسد الفجوة بين معرفتك الأكاديمية وتطبيقها القوي في العالم الحقيقي. نحن هنا لمساعدتك على استكشاف مستقبلك ولتصبح جزءًا من الجيل القادم من قادة علم النفس.`,

      quickNav: {
        mainMenu: "القائمة الرئيسية",
        discoveryQuiz: "اختبار الاكتشاف",
        training: "التدريب",
      },

      expertQuestionPrompt: "يمكنك الآن أن تطرح سؤالاً بمستوى الخبراء حول المسارات المهنية في علم النفس. للمواضيع التي تتطلب أحدث المعلومات، سأصل إلى مصادر محدّثة من الويب. لأسئلة استراتيجيات المسار المهني المعقدة، سأستخدم التفكير المتقدم لتقديم تحليل معمّق.",

      team: {
          prompt: "تعرف على الفريق الذي يقف خلف مسار الإرشاد المهني من ساي إيجيبت. مهمتنا تجمع بين الخبرة الأكاديمية العميقة والتكنولوجيا المبتكرة لدعم رحلتك. عن من تود أن تعرف المزيد؟",
          menu: {
              jaye: "د. جاي فان كيرك (الموجهة)",
              marco: "ماركو مجدي (المنشئ)"
          },
          jaye: {
              title: "د. جاي فان كيرك، الموجهة",
              subtitle: "أستاذ فخري في علم النفس، كلية سان دييغو ميسا | الرئيس الوطني السابق لـ Psi Beta",
              bio: "بخبرة تزيد عن 15 عامًا في تدريس مقرر 'وظائف في علم النفس'، تعد الدكتورة فان كيرك خبيرة رائدة في مساعدة الطلاب على استكشاف رحلتهم المهنية. يعتمد نهجها على الأدلة البحثية من مصادر مثل مركز دراسات القوى العاملة التابع لـ APA، بهدف تزويد الطلاب برؤية واقعية وممكّنة لخياراتهم المهنية.",
              mission: "دحض الخرافة السائدة بأن درجة الدراسات العليا هي السبيل الوحيد لمهنة ناجحة في علم النفس. الدكتورة فان كيرك شغوفة بتمكين الطلاب من إدراك القيمة الهائلة وقابلية التسويق لدرجة البكالوريوس، وتزويدهم بالمعرفة لدخول سوق العمل بثقة.",
              quote: "البيانات واضحة: أنت قابل للتوظيف بشكل كبير *الآن*. كن استباقيًا. ابحث عن فرص بحثية للطلاب الجامجيين، تطوع، وقم بإجراء مقابلات استعلامية. هذه التجارب، جنبًا إلى جنب مع المهارات من شهادتك، ستجعلك مرشحًا متميزًا."
          },
          marco: {
              title: "ماركو مجدي عبد المسيح، المنشئ والمطور",
              subtitle: "مؤسس ساي إيجيبت | سفير جمعية علم النفس الأمريكية بالحرم الجامعي | متخصص في الذكاء الاصطناعي",
              bio: "رحلة ماركو إلى علم النفس لم تكن خطية. بعد أن بدأ في مجال مختلف، قام بتحول مهني شجاع، مدفوعًا بشغف جديد لفهم العقل البشري. ومع ذلك، اكتشف بسرعة أن الطريق لعلماء النفس الطموحين في منطقة الشرق الأوسط وشمال أفريقيا كان مليئًا بالعقبات: نقص الإرشاد الواضح، ومحدودية التوجيه، وفجوة بين النظرية الأكاديمية والوظائف في العالم الحقيقي. هذا الصراع الشخصي لم يكن طريقًا مسدودًا؛ بل أصبح مهمته. أسس ساي إيجيبت لبناء المورد الذي كان يتمناه لنفسه.",
              mission: "بصفته سفيرًا لجمعية علم النفس الأمريكية بالحرم الجامعي، يكرس ماركو جهوده لسد الفجوة بين الموارد الدولية والطلاب المحليين. مهمته هي استخدام التكنولوجيا لجعل المعرفة المهنية في متناول الجميع، مما يجعل الطريق إلى علم النفس أكثر وضوحًا وسهولة وأقل رهبة للجيل القادم من القادة في مصر ومنطقة الشرق الأوسط وشمال أفريقيا.",
              quote: "لقد بنيت هذه الأداة لتكون الدليل الداعم الذي لم أحصل عليه قط. رؤيتي هي استخدام التكنولوجيا لسد الفجوة بين المعرفة الأكاديمية والفرص في العالم الحقيقي، وتمكينك من شق طريقك المهني الفريد بثقة."
          }
      },

      careerDiscoveryQuiz: {
          startMessage: "سيساعدك هذا الاختبار على اكتشاف المسارات المهنية التي تتوافق مع اهتماماتك. لنبدأ بفهم أين أنت في رحلتك التعليمية. ما هو مستواك التعليمي الحالي أو الأعلى؟",
          educationLevels: {
              thanwya: "طالب في الثانوية العامة / المرحلة الجامعية",
              ba: "درجة البكالوريوس في علم النفس",
              ma: "درجة الماجستير في علم النفس",
              phd: "درجة الدكتوراه في علم النفس"
          },
          readyMessage: "رائع! الآن، لكل من الأسئلة التالية، اختر الخيار الذي يتردد صداه معك أكثر.",
          questions: [
              {
                  question: "ما نوع التأثير الذي يحفزك أكثر؟",
                  answers: [
                      { text: "مساعدة الأفراد بشكل مباشر على تخطي تحدياتهم الشخصية.", payload: "q0_clinical" },
                      { text: "تحسين الأنظمة والكفاءة داخل المؤسسة.", payload: "q0_organizational" },
                      { text: "اكتشاف معرفة جديدة وفهم الأنماط المعقدة.", payload: "q0_research" },
                      { text: "تطبيق مبادئ علم النفس لتحسين التكنولوجيا والمنتجات.", payload: "q0_tech" }
                  ]
              },
              {
                  question: "أي بيئة عمل تبدو أكثر جاذبية؟",
                  answers: [
                      { text: "مكتب شركة تعاوني مع مشاريع قائمة على الفرق.", payload: "q1_organizational" },
                      { text: "جامعة أو مختبر أبحاث، محاط بالبيانات والأدبيات.", payload: "q1_research" },
                      { text: "مكان خاص وهادئ للتفاعلات الفردية.", payload: "q1_clinical" },
                      { text: "شركة تكنولوجيا ديناميكية، تعمل مع المصممين والمهندسين.", payload: "q1_tech" }
                  ]
              },
              {
                  question: "أي من هذه المهام ستستمتع بها أكثر؟",
                  answers: [
                      { text: "إجراء مقابلات لفهم احتياجات المستخدم لتطبيق جديد.", payload: "q2_tech" },
                      { text: "إجراء وتفسير تقييم نفسي.", payload: "q2_clinical" },
                      { text: "تصميم برنامج تدريبي للموظفين الجدد.", payload: "q2_organizational" },
                      { text: "تحليل مجموعة بيانات كبيرة باستخدام SPSS للعثور على نتائج مهمة.", payload: "q2_research" }
                  ]
              },
              {
                  question: "مع من تفضل العمل بشكل أساسي؟",
                  answers: [
                      { text: "الأطفال والمراهقون.", payload: "q3_clinical" },
                      { text: "البالغون العاملون والفرق.", payload: "q3_organizational" },
                      { text: "البيانات والنظريات والمفاهيم.", payload: "q3_research" },
                      { text: "المستخدمون النهائيون لمنتج أو خدمة.", payload: "q3_tech" }
                  ]
              }
          ],
          results: {
              header: "بناءً على إجاباتك، إليك أهم المجموعات المهنية التي تبدو متوافقة مع اهتماماتك. هذه نقطة بداية للاستكشاف، مصممة لإثارة الأفكار بغض النظر عن مرحلتك المهنية الحالية.",
              trainingPlan: "بالنسبة لطالب جامعي، فإن أفضل خطوة أولى هي اكتساب خبرة عملية. للبدء، نوصي باتباع **خطة التدريب الخاصة بـ {clusterTitle}** لبناء المهارات الأساسية.",
              clinical: {
                  title: "المسار الإكلينيكي والإرشادي",
                  description: "أنت منجذب لمساعدة الناس مباشرة. يركز هذا المسار، الذي يمثله غالبًا [القسم 12 من APA (جمعية علم النفس الإكلينيكي)](https://www.div12.org/)، على تشخيص وعلاج الاضطرابات العقلية والعاطفية والسلوكية.",
                  roles: {
                      ba: "مدير حالة، مساعد خدمات اجتماعية، فني نفسي.",
                      ma: "مرشد مرخص، أخصائي نفسي مدرسي، معالج زواج وأسرة.",
                      phd: "أخصائي نفسي إكلينيكي مرخص، أخصائي علم النفس العصبي، ممارس خاص."
                  }
              },
              organizational: {
                  title: "المسار التنظيمي والموارد البشرية",
                  description: "تستمتع بتحسين الأنظمة والعمل مع الفرق. يطبق هذا المجال، الذي يمثله [القسم 14 من APA (جمعية علم النفس الصناعي والتنظيمي)](https://www.siop.org/)، علم النفس على مكان العمل لتحسين الإنتاجية ورفاهية الموظفين.",
                  roles: {
                      ba: "منسق موارد بشرية، مسؤول توظيف، مساعد تدريب وتطوير.",
                      ma: "مدير موارد بشرية، مستشار تطوير تنظيمي، أخصائي اكتساب مواهب.",
                      phd: "رئيس قسم الموظفين، أخصائي علم النفس الصناعي والتنظيمي، مدرب تنفيذي."
                  }
              },
              research: {
                  title: "المسار البحثي والأكاديمي",
                  description: "أنت مدفوع بالفضول والسعي وراء المعرفة. يشمل هذا المسار إجراء الدراسات وتحليل البيانات والمساهمة في الفهم العلمي للعقل والسلوك، وهي مهمة أساسية لـ [مديرية العلوم في APA](https://www.apa.org/science).",
                  roles: {
                      ba: "مساعد باحث، محلل بيانات، مدير مختبر.",
                      ma: "محاضر جامعي، عالم أبحاث (في الحكومة أو القطاع الخاص).",
                      phd: "أستاذ جامعي، باحث رئيسي، عالم أبحاث أول."
                  }
              },
              tech: {
                  title: "مسار التكنولوجيا وتجربة المستخدم (UX)",
                  description: "أنت مهتم بالتقاطع بين علم النفس والتكنولوجيا. يركز هذا المسار على جعل المنتجات والخدمات أكثر سهولة وفعالية ومتعة للمستخدمين، وهو مجال يستكشفه بعمق [علماء نفس العوامل البشرية](https://www.apa.org/education-career/guide/user-experience-design).",
                  roles: {
                      ba: "مساعد باحث تجربة المستخدم، استراتيجي محتوى، محلل تسويق.",
                      ma: "باحث تجربة المستخدم، مدير منتج، أخصائي عوامل بشرية.",
                      phd: "باحث تجربة مستخدم أول، مدير منتج، عالم أبحاث (في التكنولوجيا)."
                  }
              },
              closing: "هذه نقطة بداية لاستكشافك. لمعرفة المزيد، يمكنك الغوص في قسم 'استكشاف المسارات المهنية' أو الحصول على نصائح قابلة للتنفيذ في وحدة 'التدريب المهني وتنمية المهارات' لدينا.",
              nextSteps: "ماذا بعد؟"
          }
      },

      careerTraining: {
          prompt: "بناء المهارات العملية أمر حاسم في حياتك المهنية. يقدم هذا القسم إرشادات قابلة للتنفيذ. من أين تود أن تبدأ؟",
          menu: {
              undergrad: "🎓 فرص التدريب للطلاب الجامعيين",
              byPath: "🎯 التدريب على المهارات حسب المسار الوظيفي"
          },
          undergradContent: `كطالب جامعي، يعد اكتساب الخبرة العملية من أكثر الأشياء قيمة التي يمكنك القيام بها. فهي تبني سيرتك الذاتية، وتساعدك على اكتشاف شغفك، وتنشئ شبكة مهنية. إليك بعض الاستراتيجيات الرئيسية:

### 1. كن مساعد باحث
*   **لماذا يهم:** هذا ضروري لطلبات الدراسات العليا ويعلمك مهارات عملية مثل إدخال البيانات (SPSS)، ومراجعات الأدبيات، وأخلاقيات البحث. راجع دليل APA حول [كيفية الحصول على خبرة بحثية](https://www.apa.org/education-career/guide/get-experience).
*   **خطوات العمل:**
    *   حدد 2-3 أساتذة في جامعتك تهمك أبحاثهم.
    *   اقرأ إحدى أوراقهم البحثية الحديثة.
    *   أرسل لهم بريدًا إلكترونيًا احترافيًا تعرف فيه بنفسك، وتذكر ورقتهم، وتعرض التطوع بوقتك.
*   **الفوائد الرئيسية:** تطوير علاقة قوية مع مرشد محتمل لخطابات التوصية.

### 2. تطوع في بيئة ذات صلة
*   **لماذا يهم:** يوفر هذا تعرضًا لا يقدر بثمن للعالم الحقيقي مع مجموعات سكانية وبيئات عمل مختلفة. إنه يوضح التزامك وتعاطفك.
*   **خطوات العمل:**
    *   ابحث عن فرص في المنظمات غير الحكومية المحلية، وعيادات الصحة النفسية المجتمعية، ومدارس الأطفال ذوي الاحتياجات الخاصة، أو المستشفيات.
*   **الفوائد الرئيسية:** يؤكد اهتمامك بمجال معين (مثل الإكلينيكي) قبل الالتزام بالدراسات العليا.

### 3. قم بإجراء مقابلات استعلامية
*   **لماذا يهم:** هذه طريقة منخفضة الضغط لـ [التواصل الفعال](https://www.apa.org/gradpsych/2012/01/networking)، والحصول على نصائح من الداخل، وفهم الواقع اليومي للوظيفة.
*   **خطوات العمل:**
    *   استخدم LinkedIn للعثور على محترفين في مصر يعملون في مهنة تثير فضولك.
    *   أرسل لهم طلب اتصال مهذبًا وموجزًا تطلب فيه "مقابلة استعلامية" مدتها 15 دقيقة للتعرف على رحلتهم.
*   **الفوائد الرئيسية:** تبني شبكتك المهنية وتكشف عن فرص عمل خفية.

### 4. انضم إلى المنظمات الطلابية
*   **لماذا يهم:** يطور هذا مهارات القيادة وإدارة المشاريع والخطابة العامة. فكر في الانضمام إلى [الجمعية الأمريكية لطلاب الدراسات العليا في علم النفس (APAGS)](https://www.apa.org/apags) إذا كنت تخطط للدراسات العليا.
*   **خطوات العمل:**
    *   انضم (أو ابدأ!) نادي علم النفس في جامعتك.
    *   نظم فعاليات، وادعُ متحدثين ضيوف، وأنشئ مجتمعًا للدراسة.
*   **الفوائد الرئيسية:** يوضح المبادرة ومهارات العمل الجماعي لأصحاب العمل في المستقبل.`,
          byPathPrompt: "ممتاز. لنركز على المهارات لمسار وظيفي معين. أي مجال تستهدفه؟",
          byPathMenu: {
              clinical: "الإكلينيكي والإرشادي",
              organizational: "التنظيمي والموارد البشرية",
              research: "البحث والأوساط الأكاديمية",
              tech: "التكنولوجيا وتجربة المستخدم"
          },
          clinicalContent: `### المهارات الأساسية
*   **يجب توفرها:** الاستماع النشط، التعاطف، بناء التحالف العلاجي.
*   **مهم:** تدوين الملاحظات السريرية (مثل ملاحظات SOAP)، التدخل في الأزمات.

### التدريب الموصى به
*   **نظري:** خذ دورات تمهيدية عبر الإنترنت حول طرق العلاج مثل العلاج السلوكي المعرفي (CBT) من منصات مثل Coursera. لمزيد من المعلومات حول الممارسات القائمة على الأدلة، استكشف الموارد من [القسم 12 من APA](https://www.div12.org/psychological-treatments/).
*   **عملي:** تطوع في خط مساعدة أو مركز دعم الأقران. يوفر هذا ممارسة تحت الإشراف في الاستماع النشط وإدارة الأزمات.
*   **خطوة عمل:** لمدة أسبوع، تدرب على *الاستماع الانعكاسي* مع الأصدقاء. بعد أن يتحدثوا، قل "إذن ما أسمعه هو..." ولخص وجهة نظرهم دون إضافة رأيك الخاص. لاحظ كيف يغير ذلك المحادثة.`,
          organizationalContent: `### المهارات الأساسية
*   **يجب توفرها:** الخطابة العامة، حل النزاعات، إدارة المشاريع.
*   **مهم:** تحليل البيانات (لاستطلاعات الموظفين، إلخ)، فهم قانون العمل المصري.

### التدريب الموصى به
*   **نظري:** اقرأ كتبًا مثل "المحادثات الحاسمة". فكر في الحصول على شهادة عبر الإنترنت في أساسيات الموارد البشرية (مثل aPHR أو SHRM-CP). لمزيد من الموارد المهنية، قم بزيارة [جمعية علم النفس الصناعي والتنظيمي (SIOP)](https://www.siop.org/).
*   **عملي:** تولى دورًا قياديًا في نادٍ طلابي لممارسة إدارة المشاريع. انضم إلى نادٍ لـ Toastmasters لتحسين الخطابة العامة.
*   **خطوة عمل:** أنشئ خطة مشروع بسيطة لهدف شخصي (على سبيل المثال، "إكمال ورقتي النهائية"). حدد الأهداف والمهام والمواعيد النهائية. هذا يبني عقلية إدارة المشاريع.`,
          researchContent: `### المهارات الأساسية
*   **يجب توفرها:** التحليل الإحصائي (SPSS أو R)، الكتابة العلمية (نمط APA).
*   **مهم:** منهجية البحث، التفكير النقدي، مراجعة الأدبيات.

### التدريب الموصى به
*   **نظري:** أتقن [دليل نمط APA](https://apastyle.apa.org/). شاهد دروسًا تعليمية على قناة [IBM SPSS Statistics YouTube الرسمية](https://www.youtube.com/user/IBMSPSSStatistics).
*   **عملي:** أفضل طريقة للتعلم هي بالممارسة. يمكنك العثور na الإلهام من خلال تصفح [قاعدة بيانات المجلات الواسعة لـ APA](https://www.apa.org/pubs/journals).
*   **خطوة عمل:** ابحث عن مقال بحثي في مجال اهتمامك. اكتب ملخصًا من صفحة واحدة يشرح سؤال البحث والأساليب والنتائج الرئيسية والقيود بكلماتك الخاصة.`,
          techContent: `### المهارات الأساسية
*   **يجب توفرها:** طرق بحث المستخدم (المقابلات، الاستطلاعات، اختبار قابلية الاستخدام)، تجميع البيانات.
*   **مهم:** أساسيات النماذج الأولية (مثل Figma)، التواصل الواضح (تقديم النتائج لغير المتخصصين في علم النفس).

### التدريب الموصى به
*   **نظري:** اقرأ كتب تجربة المستخدم الكلاسيكية مثل "لا تجعلني أفكر" لستيف كروغ. فكر في برنامج منظم مثل [شهادة جوجل الاحترافية في تصميم تجربة المستخدم على Coursera](https://www.coursera.org/professional-certificates/google-ux-design). يمكنك أيضًا استكشاف عمل [قسم علم النفس التجريبي التطبيقي والهندسي التابع لـ APA](https://www.apa.org/about/division/div21).
*   **عملي:** اعرض إجراء "تقييم استرشادي" مجاني لموقع ويب لشركة محلية صغيرة. قدم لهم تقريرًا قصيرًا عن مشكلات قابلية الاستخدام المحتملة.
*   **خطوة عمل:** اختر تطبيقًا محمولاً تستخدمه يوميًا. لمدة 15 دقيقة، حاول بفاعلية ملاحظة الأشياء المربكة أو المحبطة. اكتب ثلاثة اقتراحات محددة للتحسين. هذا يدرب مهارات الملاحظة لديك في مجال تجربة المستخدم.`
      },

      whatsNewTitle: "✨ انضم إلى جمعية علم النفس الأمريكية (APA) مجانًا!",
      whatsNewContent: "نسلط الضوء هذا الأسبوع على عرض خاص من شركائنا في APA! كعضو محال، أنت مدعو للاستفادة من فرصة حصرية لـ [الانضمام إلى APA - مجانًا](https://click.info.apa.org/?qs=280a7ec07bbe607469afc6752b3eaa283615a5f3e15695b4778926d2a7822aa6e64bc3c073813a4ccd1dc51a23b96deee8b44eb3911c049e)! *العرض صالح لأعضاء APA لأول مرة فقط.*",
      
      helpfulPrompt: "ماذا بعد؟",

      // Explore Path
      exploreSubMenuPrompt: "رائع! لنلقِ نظرة على الاتجاهات المختلفة التي يمكن أن تأخذك إليها شهادتك في علم النفس. المسار الأكثر شيوعًا، الذي يسلكه غالبية الخريجين، هو استكشاف الوظائف المتاحة بدرجة البكالوريوس. هناك أيضًا أدوار أكثر تخصصًا تتطلب دراسات عليا متقدمة. أي مسار تود استكشافه أولاً؟",
      exploreSubMenu: {
        bachelors: "وظائف بدرجة البكالوريوس (المسار الأكثر شيوعًا)",
        advanced: "مسارات متقدمة (تتطلب دراسات عليا)"
      },
      advancedSubMenuPrompt: "ممتاز. تتطلب هذه المسارات المتخصصة درجة دراسات عليا (ماجستير أو دكتوراه) وتفتح الأبواب لأدوار في البحث والممارسة المرخصة. أي مجال يثير اهتمامك؟",
      advancedSubMenu: {
          clinical: "المسار الإكلينيكي",
          academic: "المسار الأكاديمي"
      },
      
      // Clinical Path
      clinicalHookPrompt: "ممتاز. المسار الإكلينيكي هو رحلة مجزية لمساعدة الناس مباشرة. أي جانب من هذا المسار يثير اهتمامك أكثر؟",
      clinicalSubMenu: {
        pathOverview: "نظرة عامة مفصلة",
        coreSkills: "المهارات الأساسية",
        hearStory: "منظور الموجهة",
        licensing: "الترخيص في مصر",
      },
      clinicalPathOverview: `المسار الإكلينيكي، كما حددته [الجمعية الأمريكية لعلم النفس](https://www.apa.org/ed/graduate/specialize/clinical)، يركز على تطبيق مبادئ علم النفس لمساعدة الأفراد والمجموعات التي تواجه تحديات عقلية وعاطفية وسلوكية. يجد العديد من الأخصائيين الإكلينيكيين رضا عميقًا في هذا العمل المباشر والعملي.

**المسؤوليات النموذجية:**
*   إجراء جلسات علاج فردية أو جماعية.
*   إجراء وتفسير التقييمات النفسية للتشخيص.
*   تطوير وتنفيذ خطط علاجية شخصية.
*   التعاون مع الأطباء والأخصائيين الاجتماعيين وغيرهم من المهنيين.

**التعليم المطلوب:**
تبدأ الرحلة بدرجة البكالوريوس في علم النفس. في مصر ومنطقة الشرق الأوسط وشمال أفريقيا، درجة الماجستير هي الحد الأدنى لممارسة المهنة، وغالبًا ما تتبعها دبلومات متخصصة. للحصول على ترخيص كامل كـ "أخصائي نفسي" ومزيد من الاستقلالية، عادة ما تكون درجة الدكتوراه (PhD أو PsyD) ضرورية. لمعرفة المزيد عن التخصصات، استكشف [القسم 12 من APA (جمعية علم النفس الإكلينيكي)](https://www.div12.org/).

**بيئات العمل المحتملة:**
يمكنك أن تجد نفسك تعمل في بيئات متنوعة مثل المستشفيات، والعيادات الخاصة، ومراكز الصحة النفسية المجتمعية، والمدارس، ومرافق إعادة التأهيل، أو حتى برامج العافية في الشركات.`,
      clinicalLicensing: `في تطور تاريخي لعلم النفس في مصر (القانون رقم 203 لسنة 2020)، أصبح هناك الآن مسار واضح لغير الأطباء للحصول على ترخيص لممارسة العلاج النفسي. هذه خطوة مهمة إلى الأمام، تتماشى مع المعايير الدولية.

تنقسم المتطلبات إلى عدة مجالات رئيسية. أي جزء تود استكشافه؟`,
      clinicalLicensingSubMenu: {
          educational: "المتطلبات التعليمية والشخصية",
          training: "التدريب والإشراف",
          fees: "الترخيص والتجديد",
          scope: "نطاق الممارسة والقيود",
      },
      clinicalLicensingEducational: `### المتطلبات التعليمية والشخصية
*   **الدرجة العلمية:** الحصول على درجة الماجستير أو الدكتوراه في علم النفس الإكلينيكي من كلية الآداب بإحدى الجامعات المصرية المعتمدة (أو ما يعادلها).
*   **حسن السمعة:** يجب أن يكون المتقدم حسن السمعة ومحمود السيرة، وألا يكون قد صدر ضده حكم في جناية أو جنحة مخلة بالشرف.
*   **العضوية:** أن يكون عاملاً أو منتسباً لإحدى روابط أو جمعيات العلاج النفسي المعترف بها.
*   **الامتحان:** اجتياز المقابلة والاختبار الذي تحدده اللجنة الرسمية.`,
      clinicalLicensingTraining: `### متطلبات التدريب والإشراف
*   **التدريب العملي:** قضاء مدة تدريب عملي لا تقل عن عامين في مستشفى حكومي متخصص أو مستشفى جامعي، أو مستشفى خاص مرخص لا يقل عدد الأسرة به عن 25 سريراً.
*   **الإشراف:** يجب أن تكون الممارسة تحت إشراف مباشر من أحد الأطباء النفسيين.
*   **الدورات الأكاديمية:** اجتياز 7 دورات تدريبية معتمدة على الأقل في موضوعات مثل أخلاقيات المهنة وتطبيقات العلاج المعرفي السلوكي المتنوعة (للاكتئاب، الوسواس القهري، القلق، اضطراب ما بعد الصدمة، إلخ).`,
      clinicalLicensingFees: `### الترخيص والتجديد
*   **رسوم الترخيص:** سداد رسم قدره 2000 جنيه مصري للحصول على الترخيص.
*   **صلاحية الترخيص:** الترخيص سارٍ لمدة سبع سنوات.
*   **التجديد:** يتطلب التجديد اجتياز اختبار وسداد رسم قدره 1000 جنيه مصري.`,
      clinicalLicensingScope: `### نطاق الممارسة والقيود
*   **التعاون:** **يجب** على المعالج النفسي أن يتعاون مع الطبيب النفسي المعالج، ولا يجوز له الاستمرار في العلاج إلا بعد موافقة الطبيب.
*   **المحظورات:** يُحظر على المعالج النفسي تشخيص الأمراض العضوية أو علاجها أو كتابة أي وصفات طبية. يجب عرض المريض على الطبيب النفسي إذا طرأت عليه أعراض جديدة.

للحصول على أحدث التفاصيل، يرجى دائمًا الرجوع إلى [الموقع الرسمي لوزارة الصحة المصرية](https://www.mohp.gov.eg/).`,
      coreSkillsPrompt: "هذا سؤال أساسي. المهارات العملية مطلوبة، وأهمها هو **الاستماع النشط**. ماذا بعد؟",
      coreSkillsSubMenu: {
          moreOnListening: "المزيد عن الاستماع النشط",
          nextSkill: "المهارة التالية"
      },
      listeningContent: "الاستماع النشط ليس مجرد سماع الكلمات؛ إنه يتعلق بفهم العاطفة والقصد من ورائها. إنه ينطوي على إعادة الصياغة، وطرح أسئلة توضيحية، وإظهار التعاطف لبناء الثقة. توفر APA موارد ممتازة للطلاب الجامعيين. إليك رابط إلى [صفحة الموارد الرئيسية](https://www.apa.org/education-career/undergrad) لمعرفة المزيد.",
      nextSkillContent: "مهارة رئيسية أخرى هي **التعاطف**. هذا يتجاوز الاستماع إلى فهم ومشاركة مشاعر الآخر حقًا. بعد ذلك يأتي بناء **'[تحالف علاجي](https://www.apa.org/monitor/2019/11/ce-corner-alliance)'** - الثقة والانسجام بينك وبين عميلك، وهو أساس العلاج الفعال.",
      
      // Academic Path
      academicHookPrompt: "اختيار ممتاز. المسار الأكاديمي هو رحلة اكتشاف، تساهم في إضافة معرفة جديدة إلى المجال. من أين تود أن تبدأ؟",
      academicSubMenu: {
        pathOverview: "نظرة عامة مفصلة",
        coreSkills: "المهارات الأساسية",
        getPublished: "النشر العلمي"
      },
      academicPathOverview: `المسار الأكاديمي مخصص لأولئك الذين يدفعهم الفضول والرغبة في المساهمة بمعرفة جديدة في مجال علم النفس من خلال البحث والتدريس. إنه مسار يشكل مستقبل هذا التخصص. ترتبط كل هذه المسارات بـ [مواضيع علم النفس التكاملية](https://www.apa.org/ed/precollege/undergrad/introductory-psychology-initiative/student-learning-outcomes-poster.pdf)، والتي تتقاطع مع جميع مجالات العلم.

**المسؤوليات النموذجية:**
*   تصميم وإجراء دراسات بحثية أصلية.
*   تحليل البيانات ونشر النتائج في المجلات العلمية، مع الالتزام بمعايير مثل [دليل نمط APA](https://apastyle.apa.org/).
*   تدريس دورات علم النفس للطلاب الجامعيين وطلاب الدراسات العليا.
*   توجيه الطلاب في مشاريعهم البحثية الخاصة.
*   كتابة مقترحات منح لتأمين التمويل للبحث.

**التعليم المطلوب:**
يتطلب هذا المسار دائمًا تقريبًا درجة الدكتوراه (PhD). تتضمن الرحلة درجة البكالوريوس، ودرجة الماجستير مع مكون بحثي قوي (رسالة)، وأخيرًا، برنامج دكتوراه حيث تجري بحثًا أصليًا كبيرًا لرسالتك.

**بيئات العمل المحتملة:**
بيئة العمل الأساسية هي جامعة أو كلية. يمكن للباحثين أيضًا العمل في الوكالات الحكومية أو المنظمات غير الربحية أو شركات القطاع الخاص في أدوار تتعلق ببحث تجربة المستخدم (UX) أو أبحاث السوق أو علم البيانات.`,
      
      academicSkills: {
          prompt: "ممتاز. تتمحور المهارات الأساسية للأوساط الأكاديمية حول البحث الدقيق. دعنا نحللها. أي مجال تود التركيز عليه أولاً؟",
          menu: {
              design: "تصميم ومنهجية البحث",
              stats: "التحليل الإحصائي",
              writing: "الكتابة العلمية"
          },
          designContent: "تصميم البحث هو مخطط دراستك. يضمن التصميم القوي أن تكون نتائجك صحيحة وموثوقة. يتعلق الأمر باختيار النهج الصحيح - تجريبي، ارتباطي، طولي - للإجابة على سؤالك المحدد. **إجراء رئيسي:** تعرف على تصميمات البحث المختلفة من خلال قراءة أقسام المنهجية في الأوراق البحثية في مجلات APA الرائدة. لاحظ كيف يخدم التصميم سؤال البحث مباشرة. للحصول على دليل أساسي، يمكنك استكشاف صفحة [المساعدات التعليمية من APA](https://apastyle.apa.org/instructional-aids).",
          statsContent: "البيانات هي لغة البحث، وإتقان التحليل الإحصائي باستخدام برامج مثل SPSS أو R هو مهارة أساسية. لا يتعلق الأمر فقط بإجراء الاختبارات؛ بل بفهم ما تعنيه النتائج وحدودها. **إجراء رئيسي:** تقدم APA تدريبًا وموارد متقدمة. مكان رائع للبدء هو [صفحة موارد EPF](https://www.apa.org/about/governance/president/engaging-psychologys-future/resources)، حيث يمكنك العثور على أدلة وفرص.",
          writingContent: "اكتشافاتك لا تعني الكثير إذا لم تتمكن من توصيلها بوضوح. الكتابة العلمية دقيقة وموجزة ومنظمة. يعد اتباع دليل النشر لـ APA أمرًا ضروريًا للنشر. **إجراء رئيسي:** تدرب عن طريق تلخيص مقال بحثي بكلماتك الخاصة، متبعًا هيكل الملخص. هذا يصقل قدرتك على تقطير المعلومات المعقدة. [مدونة نمط APA](https://apastyle.apa.org/blog) هي مصدر لا يقدر بثمن للأسئلة الشائعة."
      },
      academicPublishing: {
          prompt: "النشر هو الطريقة التي تشارك بها عملك مع العالم. إنها عملية صعبة ولكنها حاسمة. من أين نبدأ؟",
          menu: {
              mentor: "العثور على مرشد وموضوع",
              review: "التنقل في مراجعة الأقران",
              journal: "اختيار المجلة المناسبة"
          },
          mentorContent: "مرشدك هو أهم دليل لك. ابحث عن الأساتذة الذين يثير بحثهم حماسك حقًا. اقرأ أوراقهم، وافهم عملهم، ثم تواصل معهم بشكل احترافي. سيساعدك المرشد الجيد على صقل سؤال بحثك إلى شيء جديد ويمكن إدارته. **إجراء رئيسي:** حدد 3 أساتذة في مؤسستك أو غيرها ممن تعجب بعملهم. قم بصياغة بريد إلكتروني موجز تقدم فيه نفسك وتشرح سبب اهتمامك ببحثهم المحدد.",
          reviewContent: "مراجعة الأقران هي عملية يقوم فيها خبراء آخرون في مجالك بنقد عملك قبل نشره. من شبه المؤكد أنك ستتلقى طلبات مراجعة. هذا جزء طبيعي وإيجابي من العملية! يجعل بحثك أقوى. **إجراء رئيسي:** تعلم تفسير تعليقات المراجعين بشكل بناء، وليس شخصيًا. عالج كل نقطة بشكل منهجي في رسالة 'رد على المراجعين'. توفر APA موارد للمؤلفين، والتي يمكنك العثور عليها على موقع [النشر في APA](https://www.apa.org/pubs/authors).",
          journalContent: "اختيار المجلة المناسبة أمر استراتيجي. تحتاج إلى مطابقة موضوع ورقتك وتأثيرها مع نطاق المجلة وجمهورها. 'عامل التأثير' للمجلة هو أحد المقاييس، لكن الملاءمة أكثر أهمية. **إجراء رئيسي:** استخدم بوابة [مجلات APA](https://www.apa.org/pubs/journals) لتصفح المجلات حسب الموضوع. اقرأ أقسام 'الأهداف والنطاق' بعناية لترى ما إذا كان بحثك مناسبًا قبل أن تبدأ في الكتابة."
      },

      bachelorsHookPrompt: "هذا مجال رائع وعملي للاستكشاف! تفتح درجة البكالوريوس في علم النفس الأبواب أمام العديد من المجالات حيث يعد فهم السلوك البشري ميزة كبيرة. من أين تود أن تبدأ؟",
      bachelorsSubMenu: {
        pathOverview: "نظرة عامة مفصلة",
        coreSkills: "المهارات الأساسية القابلة للتحويل"
      },
      bachelorsPathOverview: `هذا هو المسار الأكثر شيوعًا، الذي يسلكه الغالبية العظمى من خريجي علم النفس - حوالي 90٪ وفقًا لـ [دراسات القوى العاملة في APA](https://www.apa.org/workforce/data-tools/bachelors-workforce). من المفاهيم الخاطئة الشائعة أن درجة الدراسات العليا مطلوبة لمهنة ناجحة، لكن المهارات التي تتعلمها في برنامج البكالوريوس مطلوبة بشدة في العديد من الصناعات.

**رؤية رئيسية:** أنت لا تتعلم فقط عن علم النفس؛ أنت تتعلم كيف تفهم الناس، وتحلل البيانات، وتوصل الأفكار المعقدة، وتحل المشكلات - وهي مهارات يريدها كل صاحب عمل.

**مجالات العمل المحتملة:**
*   **الموارد البشرية:** أدوار في التوظيف والتدريب وعلاقات الموظفين.
*   **أبحاث السوق:** تحليل سلوك المستهلك لإبلاغ استراتيجية العمل.
*   **تجربة المستخدم (UX):** كما رأيت مع مرشدنا عمر، يمزج هذا المجال بين علم النفس والتكنولوجيا لجعل المنتجات أكثر سهولة في الاستخدام.
*   **الخدمات الاجتماعية والمجتمعية:** العمل كمدير حالة أو في المنظمات غير الربحية لدعم المجتمعات.
*   **المبيعات والتسويق:** استخدام مبادئ الإقناع والتواصل للتواصل مع العملاء.

لإلقاء نظرة أعمق، لدى APA دليل ممتاز حول ما يمكنك فعله بشهادتك: [وظائف لتخصصات علم النفس](https://www.apa.org/education-career/guide/careers).`,
      bachelorsSkillsContent: `المهارات التي تكتسبها من شهادة علم النفس هي 'قوتك الخارقة' في سوق العمل. الأهم هو **التفكير النقدي** - القدرة على تحليل المعلومات بموضوعية وإصدار أحكام منطقية.

مهارة أخرى هي **التواصل**. لا يقتصر هذا على التحدث أو الكتابة بشكل جيد فحسب، بل يشمل أيضًا الاستماع النشط وفهم الإشارات غير اللفظية.

أخيرًا، هناك **الإلمام بالبيانات**. تدريبك على طرق البحث والإحصاء، حتى على مستوى أساسي، هو رصيد كبير.

كل هذه التفاصيل مذكورة في دليل APA حول [المهارات القابلة للتحويل (PDF)](https://www.apa.org/education-career/guide/transferable-skills.pdf). التركيز على كيفية تقديم هذه المهارات في سيرتك الذاتية هو خطوة تالية حاسمة.`,

      underConstruction: "هذا مجال مهم. هذه الوحدة التفاعلية قيد التطوير حاليًا، لكن يمكنني أن أقدم لك مواردنا الرئيسية الآن.",
      
      feedbackQuestion: 'هل كانت هذه المحادثة مفيدة؟',
      yes: '👍 نعم',
      no: '👎 لا',
      pollQuestion: "بعد محادثتنا، ما مدى وضوح مسارك المهني في علم النفس؟\n\n(1 = غير واضح على الإطلاق، 5 = واضح جدًا)",
      pollThanks: "شكرًا لملاحظاتك! رأيك قيّم لمهمة APA.",
      quizProgressText: "السؤال {current} من {total}",
      feedbackThanks: "شكرًا لملاحظاتك! لمساعدتنا على التحسين ودعم مهمة APA، هل يمكنك الإجابة على سؤال سريع واحد؟",
      challengeTitle: "تحدي مكتشف المسار الأسبوعي",
      challengeText: "اقضِ 15 دقيقة في البحث على LinkedIn عن متخصص مصري واحد في المهنة التي تريدها. أرسل له طلب اتصال مهذب واحترافي. هذه هي الخطوة الأولى لبناء شبكتك!",
      
      navigationPrompt: "ماذا بعد؟",
      navigation: {
          mainMenu: "القائمة الرئيسية",
          startOver: "إعادة التشغيل",
          endChat: "إنهاء المحادثة",
          backToClinical: "العودة إلى المسار الإكلينيكي",
          backToAcademic: "العودة إلى المسار الأكاديمي",
          backToExplore: "العودة إلى المسارات المهنية",
          backToBachelors: "العودة إلى مسار البكالوريوس",
          compareAcademic: "مقارنة مع المسار الأكاديمي",
          compareClinical: "مقارنة مع المسار الإكلينيكي",
      },
      endChatPrompt: "شكرًا لاستخدامك مكتشف المسار! نتمنى لك كل التوفيق في رحلتك المهنية. قبل أن تذهب، هل تود تقديم ملاحظات أكثر تفصيلاً؟",
    }
  }
};

// Merging shared content to avoid duplication
const sharedEnContent = { ...content.egypt.en };
Object.assign(content.usa.en, {
    ...sharedEnContent,
    ...content.usa.en
});
Object.assign(content.egypt.en, {
    ...sharedEnContent,
    ...content.egypt.en
});


type AppMode = 'chat' | 'analysis';

const App: React.FC = () => {
  const [country, setCountry] = useState<'egypt' | 'usa' | null>(null);
  const [language, setLanguage] = useState<'en' | 'ar' | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AppMode>('chat');
  const [chatHistory, setChatHistory] = useState<{ role: string; parts: { text: string }[] }[]>([]);
  
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

  const currentContent = country && language ? content[country][language] : content.egypt.en;

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
      const menu = country === 'egypt' ? content.egypt.en.clinicalLicensingSubMenu : content.usa.en.clinicalLicensingSubMenu;
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
    if (country && language && messages.length === 0) {
      const langContent = content[country][language];
      const welcomeMessage: Message = {
        id: Date.now(),
        text: <ReactMarkdown>{langContent.welcomeIntro}</ReactMarkdown>,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        choices: [
          { text: langContent.mainMenu.explore, payload: 'explore_paths' },
          { text: langContent.mainMenu.discoveryQuiz, payload: 'discovery_quiz' },
          { text: langContent.mainMenu.training, payload: 'career_training' }
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [country, language, messages.length]);
  
  const quizProgressText = quizState.active && quizState.educationLevel
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

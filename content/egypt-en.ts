


const content = {
    headerTitle: "PsyEgypt Career Pathfinder",
    headerSubtitle: "Psychology Career Guidance",
    headerCollaboration: "An Independent Initiative",
    distressMessage: "It sounds like you are going through a difficult time. Please know that I am an AI assistant for career guidance only and cannot provide mental health support. **For immediate help, please contact The General Secretariat of Mental Health and Addiction Treatment hotline at 08008880700.** Please reach out to a qualified professional.",
    
    welcomeIntro: `Welcome to the PsyEgypt Career Pathfinder!

I am an AI assistant designed to help you explore career paths from the bachelor's to the doctoral level in Egypt. My responses are informed by public resources from the [APA's 'Engaging Psychology's Future' (EPF) Initiative](https://www.apa.org/about/governance/president/engaging-psychologys-future).

> *A common myth is that you must have a graduate degree to find a job in psychology. The reality is that your Bachelor's degree opens doors to many exciting fields! In fact, data from the [APA's Center for Workforce Studies](https://www.apa.org/workforce/data-tools/bachelors-workforce) shows that the vast majority of psychology graduates enter the workforce with their Bachelor's degree.*
>
> — Insight from Professor Jaye Van Kirk, Professor Emeritus of Psychology

How can I help you today?`,
    
    mainMenu: {
      explore_paths: "🗺️ Explore Career Paths",
      discovery_quiz: "🧩 Standard Career Quiz",
      hakeem_quiz: "🔮 The Hakeem's Mirror",
      career_training: "🚀 Career & Skill Training",
      career_insights: "📊 Career Insights & Data",
      qna_start: "💬 Q&A",
      our_report: "📜 Our Research Report",
      team: "🤝 Meet the Team",
      whats_new: "✨ Membership Resources",
      about_us: "👥 About Us"
    },

    hakeemMirror: {
        intro: "Welcome to **The Hakeem's Mirror**. Unlike the standard quiz, this does not measure your skills, but your *soul*. It asks not what you want to do, but *who you are* when the world is dark. Are you ready to see your reflection?",
        questions: [
            {
                question: "Imagine two futures. In one, you are a famous Doctor with a prestigious title, but you feel empty inside. In the other, you are an unknown worker saving 5,000 lives, but no one knows your name. Which path feels safer to your heart?",
                answers: [
                    { text: "The Prestigious Title (Safety in Status)", payload: "hak_motive_status" },
                    { text: "The Silent Impact (Safety in Purpose)", payload: "hak_motive_impact" }
                ]
            },
            {
                question: "A neighbor knocks on your door at 2:00 AM, in deep distress. What is your immediate instinct?",
                answers: [
                    { text: "I sit, listen, and hold space for their pain.", payload: "hak_energy_healer" },
                    { text: "I make a plan to fix the problem immediately.", payload: "hak_energy_fixer" },
                    { text: "I step back to analyze why this is happening.", payload: "hak_energy_thinker" }
                ]
            },
            {
                question: "You spent 6 months building a passionate project to help others, and it failed completely. No one showed up. How does your internal voice speak?",
                answers: [
                    { text: "I feel ashamed. I wasn't good enough.", payload: "hak_resilience_perfectionist" },
                    { text: "The system is unfair. People didn't understand it.", payload: "hak_resilience_blamer" },
                    { text: "It's painful, but useful data. I will rebuild better.", payload: "hak_resilience_architect" }
                ]
            },
            {
                question: "You are broke. You are offered a high-salary job selling a product you don't believe in. What do you do?",
                answers: [
                    { text: "Refuse immediately. My integrity is everything.", payload: "hak_reality_idealist" },
                    { text: "Take it temporarily to fund my true dream.", payload: "hak_reality_pragmatist" },
                    { text: "Take it. Work is work, and I need safety.", payload: "hak_reality_conformist" }
                ]
            }
        ],
        results: {
            status_healer: {
                title: "The Benevolent Authority",
                text: "You seek the title of 'Doctor' not just for ego, but because you believe authority helps you heal others. **Your Trap:** You may burn out trying to maintain the image of perfection. **Your Path:** Clinical Psychology or Psychiatry, but remember: the degree does not heal, *you* do."
            },
            status_fixer: {
                title: "The Executive Leader",
                text: "You want to lead systems and be recognized for your efficiency. You are not a therapist; you are a CEO of well-being. **Your Path:** Industrial-Organizational Psychology or Hospital Administration. You are built to manage power."
            },
            status_thinker: {
                title: "The Distinguished Professor",
                text: "You seek respect through intellect. You want to be the smartest person in the room. **Your Path:** Academia and High-Level Research. Write the books that others study."
            },
            impact_healer: {
                title: "The Silent Guardian",
                text: "You do not care if they know your name, only that they are safe. You have the true heart of a counselor. **Your Path:** NGO work, Trauma Counseling, or Social Work. Beware of 'Compassion Fatigue'—you give too much."
            },
            impact_fixer: {
                title: "The System Architect",
                text: "You see the suffering caused by bad systems (poverty, bad laws) and you want to fix the *root*. **Your Path:** Policy Making, Organizational Development, or Advocacy. Don't treat the patient; treat the society."
            },
            impact_thinker: {
                title: "The Knowledge Pioneer",
                text: "You save lives by finding the truth. You are the scientist working on the cure while others treat the symptoms. **Your Path:** Neuroscience, Data Science, or UX Research. Your impact is invisible but infinite."
            }
        },
        modifiers: {
            perfectionist: "Warning: You have the vision, but the fear of a Perfectionist. You tie your worth to your success. In psychology, failure is just data. You must learn to fail faster.",
            blamer: "Observation: You have a 'Blamer' reflex. Focusing on the unfairness of the system will paralyze you. The world is unfair; your job is to navigate it, not just judge it.",
            architect: "Strength: You have the 'Architect' mindset. You view pain as information. This resilience is the #1 predictor of long-term success in this field.",
            idealist: "Advice: You are a pure 'Idealist'. This is noble, but dangerous. Without financial safety, you cannot help others effectively. Don't become a martyr for your cause.",
            pragmatist: "Advice: You have chosen the 'Tentmaker' path (like Paul the Apostle). Using a job to fund your dream is wise, but dangerous. Ensure your money fuels your mission, not your ego.",
            conformist: "Warning: You are seeking safety above all else. Psychology is a field for risk-takers. If you prioritize comfort over conviction, you may find yourself rich but empty."
        }
    },

    fixedQna: {
      prompt: "Here are some frequently asked questions about careers in psychology in Egypt, based on the latest 2025-2026 data. Select one to see the answer.",
      questions: [
        {
          question: "What's the difference between studying at a public vs. private university?",
          payload: "qna_1",
          answer: `This is a fundamental choice that shapes your entire career trajectory.
*   **Public Universities (e.g., Ain Shams, Cairo):** Are research-focused ('scientist' model), primarily teach in Arabic, and lead to careers in the public sector and traditional academia.
*   **Private Universities (e.g., AUC, BUE):** Are practitioner-focused ('professional practitioner' model), teach in English, have international accreditation, and funnel graduates into private practice, international NGOs, and multinational corporations. The high cost of tuition also acts as a socioeconomic filter.

**Source:** *Mapping a Profession: A Strategic Blueprint for Data-Insight Guides*`
        },
        {
          question: "Where are the best job opportunities for psychology graduates?",
          payload: "qna_2",
          answer: `The data shows a clear economic split. While the societal need is in clinical care, the best-paying and highest-demand domestic jobs are in the **"Corporate Siphon"** and the **"Third Pathway"**:
*   **Corporate Sector:** A senior Industrial-Organizational Psychologist can earn over 50% more than a senior Clinical Psychologist. Roles in HR, Organizational Development, and Talent Management are in high demand.
*   **Tech & Business Sector:** UX Research and Market Research are the most lucrative fields, with senior roles earning significantly more than clinical counterparts.
*   **Digital Health Platforms:** The rise of tele-psychology platforms (e.g., O7 Therapy) represents a major new, flexible career path.

**Source:** *The Egyptian Psychology Career Landscape (2025-2026): A Critical Analysis*`
        },
        {
          question: "Can I practice psychotherapy with a psychology degree?",
          payload: "qna_3",
          answer: `This is legally complex and high-risk. The right to practice is **not automatic**.
*   The title "Psychotherapist" is legally restricted to medical doctors (psychiatrists) unless a non-doctor obtains a specific, separate license from the Ministry of Health.
*   Practicing with only a Bachelor's degree is considered a serious "ethical violation."
*   The new **2025 Medical Liability Law** introduces severe penalties, including imprisonment, for medical errors. Psychologists may be held liable under this law without the institutional protection of the Medical Syndicate, making private practice significantly more perilous.

**Source:** *The Egyptian Psychology Career Landscape (2025-2026): A Critical Analysis*`
        },
        {
          question: "What is the biggest challenge facing psychologists in Egypt?",
          payload: "qna_4",
          answer: `The central challenge is a paradox: a massive societal need for mental health (a 99.6% treatment gap) is met with systemic dysfunction. This includes:
*   **Legal Ambiguity:** A developing and confusing regulatory framework.
*   **Economic Precarity:** Low clinical salaries that don't keep pace with the high cost of living in Cairo.
*   **Public Sector Collapse:** A "doctors' exodus" and fee hikes have made the public sector an unviable career path.
*   **Brain Drain:** A 10x-15x salary difference pulls experienced talent to the Gulf countries, worsening the local workforce shortage.

**Source:** *The Egyptian Psychology Career Landscape (2025-2026): A Critical Analysis*`
        }
      ]
    },

    careerInsights: {
      prompt: "Welcome to the Career Data & Insights Hub. This entire section is based on a critical analysis of the Egyptian psychology profession for 2025-2026, revealing a field in rapid transition. What would you like to explore?",
      menu: {
        licensing: "The Legal & Regulatory Gauntlet",
        market: "The Labor Market & Economics",
        public_sector: "Public Sector vs. Brain Drain",
        digital_pathway: "The Digital 'Third Pathway'",
        education: "The Educational Landscape"
      },
      licensingContent: `### The Legal & Regulatory Gauntlet: A System in Flux

The primary challenge is not clinical, but legal. The environment is moving from unregulated to a new, high-risk framework.

**The Tripartite Professional Divide:**
*   **Psychiatrist:** A fully regulated medical doctor, licensed by the Ministry of Health (MOHP) and Medical Syndicate. Can legally diagnose, prescribe, and perform psychotherapy.
*   **Psychologist:** A profession with "developing regulation." The MOHP formed a new committee in 2024 to create a licensing system, creating uncertainty for practitioners.
*   **Psychotherapist:** A legally restricted title. The law reserves this for psychiatrists, unless a non-doctor obtains a special MOHP license.

**2025 Legislative Upheaval:**
A new **Medical Liability and Patient Safety Law (2025)** is the most critical development. It introduces harsh criminal penalties, including **imprisonment for up to 10 years**, for medical errors resulting from "gross negligence." Psychologists are in a high-risk position: they may be held liable under this punitive law without the legal protection and defined standards of the Medical Syndicate. This makes private practice significantly more perilous.

**Source:** *The Egyptian Psychology Career Landscape (2025-2026): A Critical Analysis*`,
      marketContent: `### The Labor Market: The "Corporate Siphon" and Economic Reality

For a profession with high societal need, the economic incentives for clinicians are disproportionately low.

**The Corporate Siphon:**
Data reveals a stark financial hierarchy. A senior **Industrial-Organizational (I-O) Psychologist** in Cairo earns an average of **EGP 613,369**, which is **52% more** than a senior **Clinical Psychologist** (avg. EGP 402,954). The market is actively pulling talent *out* of healthcare and into better-paying corporate roles in HR, OD, and talent management.

**Salary vs. Cost of Living:**
A mid-career psychologist in Cairo can expect to spend over **37% of their gross monthly income** on just rent and basic utilities. This economic precarity is a major "push" factor driving professionals to seek other opportunities.

**The Most Lucrative Path:**
The **Tech and Business Sector** (UX Research, Market Research) offers the highest earning potential, with senior roles paying significantly more than both clinical and corporate HR paths.

**Source:** *The Egyptian Psychology Career Landscape (2025-2026): A Critical Analysis*`,
      public_sectorContent: `### The Public Sector Collapse & The "Brain Drain"

The economic disincentives in the clinical track are the "pull" factors for emigration. The catastrophic state of public healthcare provides the "push."

**The Public Sector Crisis:**
*   **Mass Resignations:** A "doctors' exodus" is underway, with over 21,000 physicians resigning from the public sector between 2020-2025, citing poor working conditions and burnout.
*   **Effective Privatization:** In 2025, a ministerial decree increased service fees at public psychiatric hospitals by up to **900%**, introducing fees for previously free services. This effectively dismantles the public sector as a viable career path dedicated to serving the most vulnerable.

**The 10x Salary "Escape Pod":**
The "brain drain" to Gulf countries is an overwhelming economic force. A psychologist in the UAE can earn, on average, **10 to 15 times the salary** of their colleague in Egypt.
*   **Avg. Clinical Psychologist Salary (Egypt):** ~EGP 320,000
*   **Avg. Clinical Psychologist Salary (Dubai, UAE):** ~EGP 3,241,000 (equivalent)

This option, however, requires a Master's degree, 2+ years of experience, and navigating a highly bureaucratic foreign licensing process (e.g., Dubai's DHA).

**Source:** *The Egyptian Psychology Career Landscape (2025-2026): A Critical Analysis*`,
      digital_pathwayContent: `### The Digital 'Third Pathway': A Market-Based Solution

The failure of the state and the traditional market has created a vacuum, now being filled by digital tele-psychology platforms like **Shezlong**, **O7 Therapy**, and **Estaraht**.

**Why They Are Succeeding:**
These platforms are a direct market response to Egypt's primary barriers to care:
*   They bypass social **stigma** by offering anonymity.
*   They solve the **geographic** rural-urban access crisis.
*   They are built for **Arabic-speaking users**, understanding cultural nuances.

**A New Career Model & Divergent Standards:**
In the absence of state licensing, platforms have become regulators.
*   **Curated Model (O7 Therapy):** Highly selective (20% acceptance rate), requires a Master's degree, and has its own in-house supervision institute (O7 Academy) that new professionals must complete. This is a private, market-based solution to the public supervision failure.
*   **Open Marketplace Model (Shezlong):** A broader platform inviting professionals worldwide, relying more on user reviews and practitioner-provided credentials.

**The Unresolved Risk:**
This entire sector operates under the shadow of state surveillance. The ethical and legal challenge of guaranteeing patient confidentiality in Egypt's complex digital environment is a significant, unresolved risk for both practitioners and clients.

**Source:** *The Egyptian Psychology Career Landscape (2025-2026): A Critical Analysis*`,
      educationContent: `### The Educational Foundation: A Fundamental Split

Your choice of university can pre-define your career path. The system is split into two distinct tracks:

*   **Public Universities (The "Scientist" Model):**
    *   **Institutions:** Ain Shams University, Cairo University.
    *   **Focus:** Research-oriented, designed to create academics.
    *   **Language:** Arabic.
    *   **Outcome:** Prepares graduates for the (now collapsing) public sector and academic research.

*   **Private Universities (The "Professional Practitioner" Model):**
    *   **Institutions:** The American University in Cairo (AUC), The British University in Egypt (BUE).
    *   **Focus:** Practitioner-oriented, with a non-thesis Master's option (at AUC) designed for clinical practice.
    *   **Language:** English, with international accreditation.
    *   **Outcome:** Prepares graduates for private practice, international NGOs, and corporate roles. The high tuition (e.g., ~$9,500/year for AUC's MA) also acts as a significant socioeconomic filter.

**Source:** *Mapping a Profession: A Strategic Blueprint for Data-Insight Guides*`,
    },
    
    ourReport: `This guide is built upon a comprehensive research report, **"The Egyptian Psychology Career Landscape (2025-2026): A Critical Analysis"**, prepared by the PsyEgypt community team. This report synthesizes data from academic journals, governmental publications, salary aggregators, and professional organizations to provide a clear and realistic view of the profession. Below are the primary sources used in its creation:

### Part 1: Regulatory & Legal Framework
*   [Adsero - Ragy Soliman & Partners. (2025). Egypt Introduces Comprehensive Law on Medical Liability and Patient Safety.](https://adsero.me/egypt-introduces-comprehensive-law-on-medical-liability-and-patient-safety/)
*   [Zawia 3. (2025). Psychotherapy: Ministerial Decree Raises Service Prices in Psychiatric Hospitals by 900%.](https://zawia3.com/en/psychotherapy/)
*   [TherapyRoute. (2025). Mental Health Licensing & Regulation in Egypt: 2025 Guide.](https://www.therapyroute.com/article/mental-health-licensing-regulation-in-egypt-2025-guide-by-therapyroute)
*   [Daily News Egypt. (2024). Egypt to tighten regulations on private mental health facilities.](https://www.dailynewsegypt.com/2024/07/29/egypt-to-tighten-regulations-on-private-mental-health-facilities/)
*   [Amnesty International. (2024). Egypt: New law threatens to reduce access to healthcare for millions.](https://www.amnesty.org/en/latest/news/2024/07/egypt-new-law-threatens-to-reduce-access-to-healthcare-for-millions/)

### Part 2: Workforce Crisis & Stigma
*   [Ministry of Health and Population. (2024). The National Health Strategy for the Arab Republic of Egypt (2024-2030).](https://www.100millionseha.eg/download/Egypt_National_Health_Strategy_2024-2030.pdf)
*   [Abolfotouh, M. A., et al. (2020). Electronic Mental Health in Egypt: A Cross-Sectional Survey of Egyptian Psychiatrists.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7453323/)
*   [Okasha, T., et al. (2025). Mental health services in Egypt, the Middle East, and North Africa.](https://www.tandfonline.com/doi/full/10.1080/09540261.2024.2400143)
*   [El-Ghamry, S. M., et al. (2025). Perceived stigma toward individuals with mental illness and their families.](https://www.researchgate.net/publication/395767228_Perceived_stigma_toward_individuals_with_mental_illness_and_their_families_perspectives_of_patients'_relatives_in_a_multicentric_Egyptian_study)

### Part 3: Economic Realities & Salary
*   [SalaryExpert (ERI). (2025). Various Salary Reports for Psychologists in Egypt.](https://www.salaryexpert.com/salary/job/clinical-psychologist/egypt)
*   [ERI Economic Research Institute. (2025). Psychologist Salary in Egypt.](https://www.erieri.com/salary/job/psychologist/egypt)
*   [Wise. (2025). Cost of Living in Cairo.](https://wise.com/gb/cost-of-living/egypt/cairo)

### Part 4: Public vs. Private Sector & Brain Drain
*   [Zawia 3. (2025). Doctors' Exodus: Why are 12 Doctors Resigning Daily?](https://zawia3.com/en/doctors-5/)
*   [AUC, APS. (2025). Addressing the Doctors' Exodus.](https://aps.aucegypt.edu/en/articles/1488/addressing-the-doctors-exodus-retaining-egypts-talent-and-harnessing-global-expertise)
*   [Konrad-Adenauer-Stiftung (KAS). (2025). Highly Skilled Migration from Egypt to the Gulf States.](https://www.kas.de/en/web/rpg/detail/-/content/highly-skilled-migration-from-egypt-to-the-gulf-states)
*   [SalaryExpert (ERI). (2025). Salary Reports for Psychologists in UAE.](https://www.salaryexpert.com/salary/job/clinical-psychologist/united-arab-emirates/dubai)
*   [Dubai Health Authority (DHA). (2025). Professional Qualification Requirements (PQR).](https://services.dha.gov.ae/sheryan/wps/contenthandler/war/SheryanHomeThemeStatic/themes/Portal8.5/docs/PQR_April_2025.pdf)

### Part 5: The "Third Pathway" (Digital Health)
*   [O7 Therapy. (2025). O7 Academy.](https://www.o7therapy.com/academy)
*   [The Business Research Company. (2024). Online Psychology Counseling Global Market Report.](https://www.thebusinessresearchcompany.com/report/online-psychology-counseling-global-market-report)
*   [Freedom House. (2024). Freedom on the Net 2024: Egypt.](https://freedomhouse.org/country/egypt/freedom-net/2024)

### Part 6: Job Market Analysis
*   [Wuzzuf. (2025). Various Job Postings for Psychologists in Egypt.](https://wuzzuf.net/a/Clinical-Psychologist-Jobs-in-Egypt)
*   [NGO Jobs in Africa. (2025). Psychologist - Alexandria, Egypt.](https://ngojobsinafrica.com/job/psychologist-alexandria-egypt/)
`,

    aboutUsContent: `This Career Pathfinder was developed by **PsyEgypt (مجتمع علم النفس في مصر)**, the pioneering platform for psychology in Egypt.

This is an independent educational tool that utilizes publicly available data and frameworks from the American Psychological Association (APA) and other research bodies. **Please note: This website is an independent initiative and is not officially affiliated with, endorsed by, or a product of the APA.**

Inspired by the vision of **Professor Jaye Van Kirk**, we are dedicated to challenging the myth that a graduate degree is the only path to a successful career in psychology. This tool is designed to illuminate the diverse and exciting career opportunities available to you right now, with your Bachelor's degree.

Our mission is to empower you with clarity and confidence, bridging the gap between your academic knowledge and its powerful application in the real world.`,
      
    quickNav: {
      main_menu: "Main Menu",
      discovery_quiz: "Standard Career Quiz",
      training: "Training",
    },

    placeholders: {
      menu: "Select an option or click the icons below...",
    },

    team: {
        prompt: "Meet the team behind the PsyEgypt Career Pathfinder. Our mission combines deep academic expertise with innovative technology to support your journey. Who would you like to learn about?",
        menu: {
            jaye: "Prof. Jaye Van Kirk (Mentor)",
            marco: "Marco Magdy (Creator)"
        },
        jaye: {
            title: "Professor Jaye Van Kirk, Mentor",
            subtitle: "Professor Emeritus of Psychology, San Diego Mesa College | Past National President, Psi Beta",
            bio: "With over 15 years of experience teaching a dedicated 'Careers in Psychology' course, Professor Van Kirk is a leading expert in helping students navigate their professional journey. Her approach is grounded in research-based evidence from sources like the APA's Center for Workforce Studies, aiming to provide students with a realistic and empowering view of their career options.",
            mission: "To debunk the pervasive myth that a graduate degree is the only path to a successful career in psychology. Professor Van Kirk is passionate about empowering students to recognize the immense value and marketability of their Bachelor's degree, equipping them with the knowledge to confidently enter the workforce.",
            quote: "The data is clear: you are highly employable *now*. Be proactive. Seek out undergraduate research opportunities, volunteer, and conduct informational interviews. These experiences, combined with the skills from your degree, will make you a standout candidate."
        },
        marco: {
            title: "Marco Magdy Abdelmaseh, Creator & Developer",
            subtitle: "Founder of PsyEgypt | AI Specialist",
            bio: "Marco's journey into psychology wasn't linear. After starting in a different field, he made a courageous career shift, driven by a newfound passion for understanding the human mind. However, he quickly discovered that the path for aspiring psychologists in Egypt was filled with obstacles: a lack of clear guidance, limited mentorship, and a gap between academic theory and real-world careers. This personal struggle wasn't a dead end; it became his mission. He founded PsyEgypt to build the very resource he wished he'd had.",
            mission: "Marco is dedicated to bridging the gap between international resources and local students. His mission is to use technology to democratize career knowledge, making the route into psychology clearer, more accessible, and less intimidating for the next generation of leaders in Egypt.",
            quote: "I built this tool to be the supportive guide I never had. My vision is to use technology to bridge the gap between academic knowledge and real-world opportunity, empowering you to forge your own unique career with confidence."
        }
    },

    careerDiscoveryQuiz: {
        startMessage: "This simple activity will help you discover career paths that match your interests. **This is not a formal assessment**, but a tool to suggest a starting point for your exploration. Let's begin by understanding where you are in your educational journey. What is your current or highest level of education?",
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
            header: "Based on your answers, here are the top career clusters that seem to align with your interests. **This is a starting point for exploration, not a definitive career assignment.** Use these results to begin discovering the detailed paths available to you.",
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

    whatsNewTitle: "✨ Membership Resources",
    whatsNewContent: "This week, we're highlighting a special offer! As a referred member, you’re invited to take advantage of an exclusive opportunity to [join APA—for free](https://click.info.apa.org/?qs=280a7ec07bbe607469afc6752b3eaa283615a5f3e15695b4778926d2a7822aa6e64bc3c073813a4ccd1dc51a23b96deee8b44eb3911c049e)! *Offer valid for first-time APA members only.*",
    
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
The journey starts with a Bachelor's degree in Psychology. In Egypt, a Master's degree is the minimum requirement to practice, often followed by specialized diplomas. For full licensure as a 'Psychologist' and more autonomy, a PhD or PsyD is typically necessary. To learn more about specialties, explore [APA Division 12 (Society of Clinical Psychology)](https://www.div12.org/).

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
    // FIX: Replaced truncated template literal with full content.
    bachelorsPathOverview: `This is the most common path, taken by the vast majority of psychology graduates—around 90% according to [APA workforce studies](https://www.apa.org/workforce/data-tools/bachelors-workforce). It's a common misconception that a graduate degree is required for a successful career, but the skills you learn in your Bachelor's program are highly sought after across many industries.

**Key Insight:** You are not just learning about psychology; you are learning how to understand people, analyze data, communicate complex ideas, and solve problems—skills every employer wants.

**Potential Career Fields:**
*   **Human Resources:** Roles in recruiting, training, and employee relations.
*   **Market Research:** Analyzing consumer behavior to inform business strategy.
*   **User Experience (UX):** This field blends psychology and tech to make products more user-friendly.
*   **Social & Community Services:** Working as a case manager or in non-profits to support communities.
*   **Sales & Marketing:** Using principles of persuasion and communication to connect with customers.

For a deeper look, the APA has an excellent guide on what you can do with your degree: [Careers for Psychology Majors](https://www.apa.org/education-career/guide/careers).`,
    bachelorsSkillsContent: `The skills you gain from a psychology degree are your 'superpower' in the job market. The most critical is **Critical Thinking**—the ability to analyze information objectively and make reasoned judgments.

Another is **Communication**. This isn't just about speaking or writing well, but also about active listening and understanding non-verbal cues.

Finally, there's **Data Literacy**. Your training in research methods and statistics, even at a basic level, is a huge asset.

These are all detailed in the APA's guide on [Transferable Skills (PDF)](https://www.apa.org/education-career/guide/transferable-skills.pdf). Focusing on how to present these skills on your resume is a crucial next step.`,


    underConstruction: "This is an important area. This interactive module is currently under development, but I can offer you our main resources now.",

    feedbackQuestion: 'Was this conversation helpful?',
    yes: '👍 Yes',
    no: '👎 No',
    pollQuestion: "After our chat, how much clearer do you feel about your career path in psychology?\n\n(1 = Not Clear at all, 5 = Very Clear)",
    pollThanks: "Thank you for your feedback! Your input is valuable.",
    quizProgressText: "Question {current} of {total}",
    feedbackThanks: "Thank you for your feedback! To help us improve, could you answer one quick question?",
    challengeTitle: "Weekly Pathfinder Challenge",
    challengeText: "Spend 15 minutes researching one Egyptian professional on LinkedIn who has the career you want. Send them a polite, professional connection request. This is the first step to building your network!",
    
    navigationPrompt: "What's next?",
    navigation: {
        main_menu: "Main Menu",
        start_over: "Restart",
        end_chat: "End Chat",
        back_to_clinical: "Back to Clinical Path",
        back_to_academic: "Back to Academic Path",
        back_to_explore: "Back to Career Paths",
        back_to_bachelors: "Back to BA/BSc Path",
        back_to_insights: "Back to Data & Insights",
        compare_academic: "Compare with Academic",
        compare_clinical: "Compare with Clinical",
    },
    endChatPrompt: "Thank you for using the Pathfinder! We wish you the best in your career journey. Before you go, would you like to provide more detailed feedback?",
};

export default content;

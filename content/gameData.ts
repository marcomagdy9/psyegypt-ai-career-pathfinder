import { SpecialtyId } from "../types";

export interface DossierProfile {
    title: string;
    role_definition: string;
    tactics: string[];
    market_status: string;
    market_color: string; // 'text-green-400' | 'text-yellow-400' | 'text-blue-400'
}

export const SPECIALTY_DOSSIERS: Record<SpecialtyId, { en: DossierProfile; ar: DossierProfile }> = {
    SPORTS: {
        en: {
            title: "Sports Psychologist",
            role_definition: "Enhances performance and well-being of athletes and teams.",
            tactics: [
                "Goal Setting & Visualization",
                "Focus & Attention Control",
                "Stress Management"
            ],
            market_status: "Private Sector / High Niche",
            market_color: "text-yellow-400"
        },
        ar: {
            title: "أخصائي النفس الرياضي",
            role_definition: "تعزيز الأداء والرفاهية النفسية للرياضيين والفرق.",
            tactics: [
                "تحديد الأهداف والتصور الذهني",
                "التحكم في الانتباه والتركيز",
                "إدارة الضغوط التنافسية"
            ],
            market_status: "قطاع خاص / تخصص دقيق",
            market_color: "text-yellow-400"
        }
    },
    FORENSIC: {
        en: {
            title: "Forensic Psychologist",
            role_definition: "Operates at the intersection of psychology and the legal system.",
            tactics: [
                "Criminal Investigations Profiling",
                "Courtroom Expert Testimony",
                "Offender Risk Assessment"
            ],
            market_status: "Government / Specialized Sector",
            market_color: "text-blue-400"
        },
        ar: {
            title: "أخصائي النفس الجنائي",
            role_definition: "يعمل في نقطة التقاء علم النفس والنظام القضائي والقانوني.",
            tactics: [
                "التنميط الجنائي في التحقيقات",
                "شهادة الخبير أمام المحكمة",
                "تقييم مخاطر الجناة"
            ],
            market_status: "قطاع حكومي / قطاع متخصص",
            market_color: "text-blue-400"
        }
    },
    CONSUMER: {
        en: {
            title: "Consumer Psychologist",
            role_definition: "Analyzes buying behavior, decision-making, and brand perception.",
            tactics: [
                "Analyzing Brand Perception",
                "Mapping Purchase Motivations",
                "Cultural & Emotional Influence"
            ],
            market_status: "Corporate Sector / High Potential",
            market_color: "text-green-400"
        },
        ar: {
            title: "أخصائي نفس المستهلك",
            role_definition: "تحليل سلوك الشراء، اتخاذ القرار، والصورة الذهنية للعلامات التجارية.",
            tactics: [
                "تحليل إدراك العلامة التجارية",
                "رسم خرائط دوافع الشراء",
                "التأثير الثقافي والعاطفي"
            ],
            market_status: "قطاع الشركات / نمو عالي",
            market_color: "text-green-400"
        }
    },
    SCHOOL: {
        en: {
            title: "School Psychologist",
            role_definition: "Supports students' ability to learn and teachers' ability to teach.",
            tactics: [
                "Assessing Academic Needs",
                "Designing Behavioral Interventions",
                "Collaborating with Teachers/Parents"
            ],
            market_status: "Licensing Required / Healthcare",
            market_color: "text-blue-400"
        },
        ar: {
            title: "الأخصائي النفسي المدرسي",
            role_definition: "دعم قدرة الطلاب على التعلم وقدرة المعلمين على التدريس.",
            tactics: [
                "تقييم الاحتياجات الأكاديمية",
                "تصميم التدخلات السلوكية",
                "التعاون مع المعلمين وأولياء الأمور"
            ],
            market_status: "يتطلب ترخيص / قطاع رعاية صحية",
            market_color: "text-blue-400"
        }
    },
    MILITARY: {
        en: {
            title: "Military Psychologist",
            role_definition: "Supports the mental health and effectiveness of personnel.",
            tactics: [
                "Personnel Selection & Screening",
                "Resilience Training",
                "PTSD Treatment & Transition Support"
            ],
            market_status: "Government / Specialized Sector",
            market_color: "text-blue-400"
        },
        ar: {
            title: "أخصائي النفس العسكري",
            role_definition: "دعم الصحة النفسية والفعالية للأفراد.",
            tactics: [
                "اختيار وفحص الأفراد",
                "تدريب المرونة النفسية",
                "علاج الصدمات ودعم الانتقال"
            ],
            market_status: "قطاع حكومي / قطاع متخصص",
            market_color: "text-blue-400"
        }
    },
    COUNSELING: {
        en: {
            title: "Counseling Psychologist",
            role_definition: "Focuses on facilitating personal and interpersonal functioning across the lifespan.",
            tactics: [
                "Developing Coping Strategies",
                "Career & Vocational Development",
                "Fostering Resilience"
            ],
            market_status: "Licensing Required / Healthcare",
            market_color: "text-green-400"
        },
        ar: {
            title: "أخصائي النفس الإرشادي",
            role_definition: "التركيز على تسهيل الأداء الشخصي والاجتماعي عبر مراحل الحياة.",
            tactics: [
                "تطوير استراتيجيات التكيف",
                "التطوير المهني والوظيفي",
                "تعزيز المرونة النفسية"
            ],
            market_status: "يتطلب ترخيص / قطاع رعاية صحية",
            market_color: "text-green-400"
        }
    },
    IO: {
        en: {
            title: "I/O Psychologist",
            role_definition: "Applies psychological principles to workplace behavior and productivity.",
            tactics: [
                "Productivity Enhancement",
                "Leadership Development",
                "Organizational Design & Culture"
            ],
            market_status: "Corporate Sector / High Potential",
            market_color: "text-green-400"
        },
        ar: {
            title: "أخصائي النفس الصناعي والتنظيمي",
            role_definition: "تطبيق المبادئ النفسية على سلوك مكان العمل والإنتاجية.",
            tactics: [
                "تحسين الإنتاجية",
                "تطوير القيادة",
                "التصميم والثقافة التنظيمية"
            ],
            market_status: "قطاع الشركات / نمو عالي",
            market_color: "text-green-400"
        }
    }
};
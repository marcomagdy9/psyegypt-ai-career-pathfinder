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
            title: "The Guardian (Al-Hami)",
            role_definition: "Focuses on 'Boundaried Responsibility'. Protects the athlete's mental state and focus without domination.",
            tactics: [
                "Focus Regulation",
                "Performance Protection",
                "Stress Management"
            ],
            market_status: "Private Sector / High Niche",
            market_color: "text-yellow-400"
        },
        ar: {
            title: "الحامي (مدرب الأبطال)",
            role_definition: "مش بس بيدرب عضلات.. ده اللي بيحمي 'الفورمة' النفسية للاعب، ويخليه يركز في الملعب وينسى دوشة الجمهور.",
            tactics: [
                "تظبيط الدماغ قبل الماتش",
                "حماية التركيز",
                "إدارة الضغط العصبي"
            ],
            market_status: "قطاع خاص / تخصص دقيق",
            market_color: "text-yellow-400"
        }
    },
    FORENSIC: {
        en: {
            title: "The Navigator (Al-Dalil)",
            role_definition: "Possesses 'Basira' (Insight). Sees patterns in criminal behavior where others see chaos. A truth-seeker.",
            tactics: [
                "Pattern Recognition",
                "Truth Seeking",
                "Risk Assessment"
            ],
            market_status: "Government / Specialized Sector",
            market_color: "text-blue-400"
        },
        ar: {
            title: "الدليل (قارئ الأفكار)",
            role_definition: "بيشوف اللي غيره مايشوفوش. بيعرف يقرأ ما وراء الجريمة، ويحلل شخصية اللي قدامه عشان يوصل للحقيقة.",
            tactics: [
                "قراءة لغة الجسد",
                "كشف الكذب",
                "تقييم الخطر"
            ],
            market_status: "قطاع حكومي / قطاع متخصص",
            market_color: "text-blue-400"
        }
    },
    CONSUMER: {
        en: {
            title: "The Agile Bricoleur (Al-Mubtakir)",
            role_definition: "Expert in Adaptive Resource Management. Understands value perception in scarcity economies.",
            tactics: [
                "Market Sensing",
                "Cognitive Flexibility",
                "Value Framing"
            ],
            market_status: "Corporate Sector / High Potential",
            market_color: "text-green-400"
        },
        ar: {
            title: "المبتكر المرن (فنان البيع)",
            role_definition: "بيفهم 'دماغ الزبون'. بيعرف إيه اللي يخلي الناس تشتري حتى لو الظروف صعبة، ويحول الحاجة لقيمة.",
            tactics: [
                "فهم السوق",
                "لعب على الوتر الحساس",
                "عرض القيمة بذكاء"
            ],
            market_status: "قطاع الشركات / نمو عالي",
            market_color: "text-green-400"
        }
    },
    SCHOOL: {
        en: {
            title: "The Anchor (Al-Watad)",
            role_definition: "Provides 'Sanad' (Support) and stability for students in a fragmented system.",
            tactics: [
                "Building Safety Nets",
                "Emotional Regulation",
                "Intervention Design"
            ],
            market_status: "Licensing Required / Healthcare",
            market_color: "text-blue-400"
        },
        ar: {
            title: "الوتد (سند الطلبة)",
            role_definition: "هو 'الأمان' في المدرسة. بيحتوي مشاكل الطلبة، ويقف جنبهم لما الدنيا تملطش معاهم (تنمر، مشاكل بيت، مذاكرة).",
            tactics: [
                "احتواء المشاكل",
                "بناء الثقة",
                "الدعم النفسي"
            ],
            market_status: "يتطلب ترخيص / قطاع رعاية صحية",
            market_color: "text-blue-400"
        }
    },
    MILITARY: {
        en: {
            title: "The Guardian (Al-Hami) - Defense",
            role_definition: "Restores the Guardian instinct after trauma. Focus on Resilience (Sumoud).",
            tactics: [
                "Trauma Recovery",
                "Resilience Training",
                "Transition Support"
            ],
            market_status: "Government / Specialized Sector",
            market_color: "text-blue-400"
        },
        ar: {
            title: "الحامي (درع الصمود)",
            role_definition: "بيرجع 'الروح' للمقاتل بعد الصدمة. بيعلمهم ازاي يقفوا على رجليهم تاني بعد ما شافوا الموت بعينهم.",
            tactics: [
                "علاج صدمات الحرب",
                "بناء الصلابة النفسية",
                "التعافي والعودة"
            ],
            market_status: "قطاع حكومي / قطاع متخصص",
            market_color: "text-blue-400"
        }
    },
    COUNSELING: {
        en: {
            title: "The Peer Companion (Al-Rafiq)",
            role_definition: "Moves from authority to partnership. Facilitates healing through validation and empathy.",
            tactics: [
                "Active Listening",
                "Validating Toil",
                "Fostering Resilience"
            ],
            market_status: "Licensing Required / Healthcare",
            market_color: "text-green-400"
        },
        ar: {
            title: "الرفيق (صاحب الطريق)",
            role_definition: "مش دكتور ببالطو، ده 'صاحب جدع' بس بعلم. بيسمع من غير ما يحكم، ويمشي معاك رحلة التعافي خطوة بخطوة.",
            tactics: [
                "السمع بقلب",
                "الطبطبة بذكاء",
                "بناء المرونة"
            ],
            market_status: "يتطلب ترخيص / قطاع رعاية صحية",
            market_color: "text-green-400"
        }
    },
    IO: {
        en: {
            title: "The Agile Bricoleur (Al-Mubtakir)",
            role_definition: "Focuses on 'Engineering Organizational Culture' and 'Adaptive Resource Management'.",
            tactics: [
                "Productivity Design",
                "Organizational Culture",
                "Leadership Development"
            ],
            market_status: "Corporate Sector / High Potential",
            market_color: "text-green-400"
        },
        ar: {
            title: "المبتكر المرن (مهندس الأنظمة)",
            role_definition: "مش مجرد مدير.. ده اللي بيعرف يحل مشاكل الروتين، و'يولف' الموارد عشان الشغل يمشي والناس ترتاح.",
            tactics: [
                "تسليك مسارات الشغل",
                "استغلال المتاح بذكاء",
                "تحسين جو الشركة"
            ],
            market_status: "قطاع الشركات / نمو عالي",
            market_color: "text-green-400"
        }
    }
};
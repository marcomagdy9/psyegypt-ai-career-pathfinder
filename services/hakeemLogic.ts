import { HakeemMetrics } from "../types";

/**
 * THE HAKEEM ENGINE 2.0: CORE ALGORITHMS
 * Framework: "Decolonizing the Nile" & "Operationalizing the Egyptian Psyche"
 */

// 1. SCARCITY FILTER (Tunneling Detection)
// Detects high-urgency keywords that indicate depleted cognitive bandwidth.
const TUNNELING_MARKERS = [
    'urgent', 'debt', 'now', 'broke', 'money', 'fast', 
    'بسرعة', 'ديون', 'مخنوق', 'الحقني', 'عايز حل', 'مش عارف', 'فلوس'
];

export const detectScarcityMode = (inputText: string): boolean => {
    const tokens = inputText.toLowerCase().split(/\s+/);
    // If 1 or more markers are present, trigger Low-Load Mode (Tunneling)
    const hitCount = tokens.filter(t => TUNNELING_MARKERS.includes(t)).length;
    return hitCount >= 1;
};

// 2. RADA (CONTENTMENT) ALGORITHM - The "Merciful" Formula
// Formula: RawScore = (((SpiritualCoping + SelfEfficacy) / 2) * 20) - (Distress * 4)
// Inputs are normalized 1-5 scales.
export const calculateRada = (
    spiritualCoping: number, // 1-5 (Trust/Tawakkul)
    selfEfficacy: number,    // 1-5 (Agency/Asbab)
    emotionalDistress: number // 1-5 (Anxiety/Jaza')
): { score: number; status: 'Active Acceptance' | 'Passive Fatalism' | 'Distress' } => {
    
    // Calculate average positive strength
    const averageStrength = (spiritualCoping + selfEfficacy) / 2;
    
    // Scale to base 100
    const baseScore = averageStrength * 20; 
    
    // Apply "Merciful" penalty (Distress reduces score, but doesn't divide it)
    const penalty = emotionalDistress * 4; 
    
    const rawScore = baseScore - penalty;
    
    // Clamp between 0 and 100
    const normalizedScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    let status: 'Active Acceptance' | 'Passive Fatalism' | 'Distress' = 'Active Acceptance';

    if (spiritualCoping > 3 && selfEfficacy < 2) {
        status = 'Passive Fatalism'; // Tawaakul (Lazy reliance)
    } else if (normalizedScore < 50) {
        status = 'Distress'; // Jaza'
    }

    return { score: normalizedScore, status };
};

// 3. RESILIENCE (SUMOUD) INDEX
// Based on Arabic CD-RISC-25 Factor Weights
export const calculateResilience = (
    competence: number, // 1-5 (Personal Competence)
    trust: number,      // 1-5 (Trust/Tolerance)
    change: number,     // 1-5 (Acceptance of Change)
    control: number     // 1-5 (Control/Spirituality)
): number => {
    // Weighted Sum based on Research Paper
    const score = (competence * 0.40) + 
                  (trust * 0.30) + 
                  (change * 0.20) + 
                  (control * 0.10);
    
    // Normalize to 0-100 (Max score is 5)
    return Math.round((score / 5) * 100);
};

// 4. JADA'ANA (HUSTLE) SCORING
// Maps informal economy behaviors (bricolage) to formal skills
export const interpretHustle = (gigs: number, diversity: number): string => {
    if (gigs > 3 && diversity > 2) return "High Adaptive Capacity (Al-Mubtakir)";
    if (gigs > 5 && diversity < 2) return "Burnout Risk (High Toil/Low Reward)";
    return "Developing Bricolage";
};
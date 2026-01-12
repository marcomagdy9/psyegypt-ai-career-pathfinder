
export type SpecialtyId = 'SPORTS' | 'FORENSIC' | 'CONSUMER' | 'SCHOOL' | 'MILITARY' | 'COUNSELING' | 'IO';

export type HakeemArchetype = 
    | 'AL_HAMI'      // The Guardian (formerly Fahl)
    | 'AL_DALIL'     // The Navigator (formerly Darwish)
    | 'AL_MUBTAKIR'  // The Agile Bricoleur (formerly Fahlawi)
    | 'AL_WATAD'     // The Anchor (formerly Sitt)
    | 'AL_RAIDA'     // The Trailblazer
    | 'AL_ASIL'      // The Rooted Authenticator
    | 'AL_WASITA';   // The Resilient Mediator

export interface HakeemMetrics {
    radaScore: number; // 0-100
    resilienceIndex: number; // 0-100
    isScarcityMode: boolean; // Tunneling detected
    hustleIndex: number; // Jada'ana Score
}

export interface MissionData {
    id: string;
    target_id: SpecialtyId; 
    target_specialty: string; 
    alert_text: string;
    correct_reasoning: string;
    learn_more_key?: string; 
    archetype_focus?: HakeemArchetype; // New field for Archetype alignment
    scarcity_trigger?: boolean; // If true, use binary choices
}

export interface GameState {
    active: boolean;
    loading: boolean;
    currentMission: MissionData | null;
    score: number;
    streak: number;
    feedback: { status: 'success' | 'failure'; text: string; learnMoreKey?: string } | null;
    missionQueue: SpecialtyId[];
}
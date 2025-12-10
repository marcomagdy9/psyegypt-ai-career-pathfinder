
export type SpecialtyId = 'SPORTS' | 'FORENSIC' | 'CONSUMER' | 'SCHOOL' | 'MILITARY' | 'COUNSELING' | 'IO';

export interface MissionData {
    id: string;
    target_id: SpecialtyId; // Strict Enum for logic matching
    target_specialty: string; // Display name (localized by AI)
    alert_text: string;
    correct_reasoning: string;
    learn_more_key?: string; // Payload for the Career Bridge
}

export interface GameState {
    active: boolean;
    loading: boolean;
    currentMission: MissionData | null;
    score: number;
    streak: number;
    feedback: { status: 'success' | 'failure'; text: string; learnMoreKey?: string } | null;
}

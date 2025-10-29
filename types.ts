
import type { ReactNode } from 'react';

export type Sender = 'user' | 'ai';

export interface Choice {
  // FIX: Allow ReactNode for choice text to support complex button content.
  text: ReactNode;
  payload: string;
  type?: 'primary' | 'secondary';
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Message {
  id: number;
  // FIX: Use ReactNode type which is now imported.
  text: ReactNode;
  sender: Sender;
  timestamp: string;
  choices?: Choice[];
  sources?: GroundingSource[];
}
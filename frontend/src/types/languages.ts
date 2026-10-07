export type LanguageTier = 'TIER_1_SIMULATED' | 'TIER_2_ROADMAP';

export interface LanguageMetadata {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  region: string;
  tier: LanguageTier;
  samplePrompt: string;
  sampleIntent: string;
  isScheduled22: boolean;
}

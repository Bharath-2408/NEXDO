/**
 * NEXDO Extensible Multilingual Architecture
 * Central Language Registry for Voice Assistant, STT, TTS, and Prompt Generation.
 * Supported active modes for this phase: English & Tamil.
 */

export type AppLanguage = 'ta' | 'en';

export interface LanguageVoiceConfig {
  code: AppLanguage;
  name: string;
  nativeName: string;
  sttLocale: string;
  ttsLocale: string;
  defaultGreeting: string;
  switchGreeting: string;
  statusPrompts: {
    idleTitle: string;
    idleDescription: string;
    listeningTitle: string;
    listeningDescription: string;
    understandingTitle: string;
    processingTitle: string;
    confirmationTitle: string;
  };
}

export const LANGUAGE_REGISTRY: Record<AppLanguage, LanguageVoiceConfig> = {
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    sttLocale: 'ta-IN',
    ttsLocale: 'ta-IN',
    defaultGreeting: 'சொல்லுங்க, உங்களுக்கு என்ன சேவை வேண்டும்?',
    switchGreeting: 'சரி, இனி உங்களுடன் தமிழில் பேசுகிறேன். உங்களுக்கு என்ன உதவி வேண்டும்?',
    statusPrompts: {
      idleTitle: 'உங்களுக்கு என்ன தேவை என்று சொல்லுங்கள்',
      idleDescription: 'மைக்ரோஃபோனைத் தட்டவும் அல்லது தமிழில் இயல்பாகப் பேசவும்',
      listeningTitle: 'கேட்கிறேன்...',
      listeningDescription: 'உங்கள் தேவையை தமிழில் இயல்பாக பேசுங்கள் (உதா: "AC repair வேணும்" அல்லது "என் bookings காட்டு")',
      understandingTitle: 'புரிந்துகொள்கிறேன்...',
      processingTitle: 'உங்கள் தேவையை சரிபார்க்கிறேன்...',
      confirmationTitle: 'உறுதிப்படுத்த வேண்டும்',
    },
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    sttLocale: 'en-IN',
    ttsLocale: 'en-IN',
    defaultGreeting: 'Just say what you need. How can I help you?',
    switchGreeting: "Sure, I'll speak with you in English from now on. How can I help you?",
    statusPrompts: {
      idleTitle: 'Just say what you need',
      idleDescription: 'Tap microphone or speak naturally in English',
      listeningTitle: 'Listening...',
      listeningDescription: 'Speak naturally in English (e.g. "I need an AC technician" or "Show my bookings")',
      understandingTitle: 'Understanding...',
      processingTitle: 'Analyzing your request...',
      confirmationTitle: 'Confirmation Required',
    },
  },
};

export function getLanguageConfig(lang?: string): LanguageVoiceConfig {
  if (lang && lang.toLowerCase().startsWith('ta')) {
    return LANGUAGE_REGISTRY.ta;
  }
  return LANGUAGE_REGISTRY.en;
}

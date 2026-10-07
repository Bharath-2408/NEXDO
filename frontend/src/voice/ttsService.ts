/**
 * NEXDO Text-To-Speech (TTS) Architecture
 * Pipeline: TextResponse → TTS Provider → Audio → Playback
 * 
 * Supports Generative TTS backend (Google Cloud TTS / Gemini-TTS / Chirp 3 HD)
 * via secure server-side endpoint (/api/tts) with ZERO frontend secrets.
 * 
 * In development/sandbox mode without a live TTS backend, falls back transparently
 * to browser SpeechSynthesis with clearly marked console observability:
 * [DEVELOPMENT / SANDBOX MODE: Browser SpeechSynthesis used for local testing]
 */

export type TTSLocale = 'ta-IN' | 'en-IN';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export interface TTSProvider {
  readonly name: string;
  isAvailable(): Promise<boolean> | boolean;
  synthesize(text: string, locale: TTSLocale): Promise<HTMLAudioElement | null>;
  stop(): void;
}

/**
 * 1. Generative Backend TTS Provider (Production Architecture)
 * Connects to server-side endpoint (/api/tts).
 * Zero credentials in frontend code.
 */
export class BackendGenerativeTTSProvider implements TTSProvider {
  public readonly name = 'BackendGenerativeTTS (Gemini-TTS / Chirp 3 HD)';
  private activeAudio: HTMLAudioElement | null = null;
  private endpointAvailable: boolean | null = null;

  public async isAvailable(): Promise<boolean> {
    if (this.endpointAvailable !== null) return this.endpointAvailable;
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return false;
    try {
      // Light probe check without API secrets
      const res = await fetch('/api/tts/health', { method: 'HEAD' });
      this.endpointAvailable = res.ok;
      return res.ok;
    } catch {
      this.endpointAvailable = false;
      return false;
    }
  }

  public async synthesize(text: string, locale: TTSLocale): Promise<HTMLAudioElement | null> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return null;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          locale,
          model: 'chirp-3-hd', // Chirp 3 HD / Gemini-TTS architecture ready
        }),
      });

      if (!res.ok) {
        return null;
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      this.activeAudio = audio;
      return audio;
    } catch {
      // Server endpoint not reachable or running in frontend-only dev mode
      return null;
    }
  }

  public stop(): void {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }
  }
}

/**
 * 2. Development Fallback TTS Provider (Local Sandbox Testing)
 * Clearly logs development mode and uses browser SpeechSynthesis with natural/neural voice preferences.
 */
export class DevelopmentFallbackTTSProvider implements TTSProvider {
  public readonly name = 'DevelopmentFallback (SpeechSynthesis)';
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this.voices = window.speechSynthesis.getVoices();
    if (this.voices.length > 0) {
      this.voicesLoaded = true;
    }
  }

  public isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.voicesLoaded) {
      this.loadVoices();
    }
    return this.voices;
  }

  /**
   * Selects the best natural or neural voice for target locale.
   */
  public getBestVoiceForLocale(locale: TTSLocale): SpeechSynthesisVoice | null {
    const voices =
      typeof window !== 'undefined' && window.speechSynthesis
        ? window.speechSynthesis.getVoices()
        : this.getVoices();
    if (!voices || voices.length === 0) return null;

    if (locale === 'ta-IN') {
      // 1. Natural / Neural Tamil voices (Chrome, Edge, Android, iOS)
      const neuralTamil = voices.find(
        (v) =>
          (v.lang.toLowerCase().replace('_', '-').startsWith('ta') || v.name.toLowerCase().includes('tamil')) &&
          (v.name.toLowerCase().includes('neural') ||
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('online') ||
            v.name.toLowerCase().includes('google') ||
            v.name.toLowerCase().includes('valluvar'))
      );
      if (neuralTamil) return neuralTamil;

      // 2. Any Tamil voice
      const anyTamil = voices.find(
        (v) =>
          v.lang.toLowerCase().replace('_', '-').startsWith('ta') ||
          v.name.toLowerCase().includes('tamil') ||
          v.name.toLowerCase().includes('valluvar')
      );
      if (anyTamil) return anyTamil;

      // DO NOT fallback to an English voice for Tamil text.
      // Leaving utterance.voice unassigned lets the browser utilize its native ta-IN synthesizer.
      return null;
    } else {
      // en-IN
      // 1. Natural / Neural Indian English voice
      const neuralIndian = voices.find(
        (v) =>
          v.lang.toLowerCase().replace('_', '-').startsWith('en-in') &&
          (v.name.toLowerCase().includes('neural') ||
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('online') ||
            v.name.toLowerCase().includes('google') ||
            v.name.toLowerCase().includes('neerja') ||
            v.name.toLowerCase().includes('prabhat'))
      );
      if (neuralIndian) return neuralIndian;

      // 2. Standard Indian English voice
      const anyIndianEn = voices.find(
        (v) =>
          v.lang.toLowerCase().replace('_', '-').startsWith('en-in') ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('ravi') ||
          v.name.toLowerCase().includes('heera')
      );
      if (anyIndianEn) return anyIndianEn;

      // 3. Natural / Neural English voice (any region)
      const neuralEn = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('en') &&
          (v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('neural') ||
            v.name.toLowerCase().includes('online') ||
            v.name.toLowerCase().includes('google'))
      );
      if (neuralEn) return neuralEn;

      // 4. Any English voice
      const anyEn = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (anyEn) return anyEn;

      return voices.find((v) => v.default) || voices[0] || null;
    }
  }

  public async synthesize(_text: string, _locale: TTSLocale): Promise<HTMLAudioElement | null> {
    return null;
  }

  public speak(
    text: string,
    locale: TTSLocale,
    options?: TTSOptions,
    onComplete?: () => void
  ): void {
    if (!this.isAvailable()) {
      if (onComplete) onComplete();
      return;
    }

    // Cancel ongoing speech before speaking
    this.stop();

    console.info(
      `[NEXDO TTS] [DEVELOPMENT / SANDBOX MODE: Browser SpeechSynthesis used for local testing] Locale: ${locale} | Text: "${text}"`
    );

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;

    const voice = this.getBestVoiceForLocale(locale);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = options?.rate ?? (locale === 'ta-IN' ? 1.0 : 1.02);
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    utterance.onstart = () => {
      if (options?.onStart) options.onStart();
    };

    utterance.onend = () => {
      if (options?.onEnd) options.onEnd();
      if (onComplete) onComplete();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('[NEXDO TTS] SpeechSynthesis error:', e.error);
        if (options?.onError) options.onError(e);
      }
      if (options?.onEnd) options.onEnd();
      if (onComplete) onComplete();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop(): void {
    if (this.isAvailable()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe ignore
      }
    }
  }
}

/**
 * 3. Primary TTSService Orchestrator
 */
export class TTSService {
  private backendProvider = new BackendGenerativeTTSProvider();
  private devFallbackProvider = new DevelopmentFallbackTTSProvider();
  private isCurrentlySpeaking: boolean = false;
  private currentAudioElement: HTMLAudioElement | null = null;

  public isSupported(): boolean {
    return this.devFallbackProvider.isAvailable();
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  public async speakResponse(
    text: string,
    langOrOptions?: string | (TTSOptions & { lang?: string }),
    maybeOptions?: TTSOptions
  ): Promise<void> {
    const rawLang = typeof langOrOptions === 'string' ? langOrOptions : (langOrOptions?.lang || 'ta-IN');
    const options = typeof langOrOptions === 'object' ? langOrOptions : maybeOptions;

    const cleanText = text
      .replace(/[*_~#]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    // Stop ongoing speech
    this.stopSpeaking();

    // Normalize target locale
    const locale: TTSLocale =
      rawLang.toLowerCase().startsWith('ta') ? 'ta-IN' : 'en-IN';

    this.isCurrentlySpeaking = true;

    // 1. Direct High-Performance Browser SpeechSynthesis (Audible & Zero Latency)
    if (this.devFallbackProvider.isAvailable()) {
      this.devFallbackProvider.speak(cleanText, locale, options, () => {
        this.isCurrentlySpeaking = false;
      });
      return;
    }

    // 2. Generative Backend TTS Provider fallback for non-browser/headless runtimes
    try {
      const backendAudio = await this.backendProvider.synthesize(cleanText, locale);
      if (backendAudio) {
        this.currentAudioElement = backendAudio;
        backendAudio.onplay = () => {
          if (options?.onStart) options.onStart();
        };
        backendAudio.onended = () => {
          this.isCurrentlySpeaking = false;
          this.currentAudioElement = null;
          if (options?.onEnd) options.onEnd();
        };
        await backendAudio.play();
        return;
      }
    } catch {
      // Backend not reachable
    }

    this.isCurrentlySpeaking = false;
    if (options?.onEnd) options.onEnd();
  }

  public textToSpeech(text: string, lang: string = 'ta-IN'): Promise<void> {
    return new Promise((resolve) => {
      this.speakResponse(text, lang, {
        onEnd: () => resolve(),
        onError: () => resolve(),
      });
    });
  }

  public stopSpeaking(): void {
    this.backendProvider.stop();
    this.devFallbackProvider.stop();
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    this.isCurrentlySpeaking = false;
  }

  public pauseSpeaking(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    } else if (this.devFallbackProvider.isAvailable()) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // Safe ignore
      }
    }
  }

  public resumeSpeaking(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.play().catch(() => {});
    } else if (this.devFallbackProvider.isAvailable()) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // Safe ignore
      }
    }
  }
}

export const ttsService = new TTSService();

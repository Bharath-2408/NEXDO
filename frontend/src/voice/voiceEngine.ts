

export interface SpeechRecognitionHandlers {
  onStart: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

// Web Audio API subtle chime generator (no external audio files required)
export class VoiceAudioFeedback {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playListeningChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Ignore audio policy restriction
    }
  }

  playSuccessChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Ignore
    }
  }

  playErrorChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Ignore
    }
  }
}

export const audioFeedback = new VoiceAudioFeedback();

export class SpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
          };
        }
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  start(lang: string, handlers: SpeechRecognitionHandlers) {
    if (!this.recognition) {
      handlers.onError('Browser speech recognition not supported. Using interactive text fallback.');
      return;
    }

    try {
      this.recognition.lang = lang.toLowerCase().startsWith('ta') ? 'ta-IN' : 'en-IN';
      this.recognition.onstart = () => {
        this.isListening = true;
        audioFeedback.playListeningChime();
        handlers.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        handlers.onResult(final || interim, Boolean(final));
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        handlers.onError(event.error || 'Microphone capture error');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        handlers.onEnd();
      };

      this.recognition.start();
    } catch (err: any) {
      handlers.onError(err.message || 'Speech recognition initialization failed');
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Safe ignore
      }
      this.isListening = false;
    }
  }

  speak(text: string, lang: string = 'en-IN', onEnd?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLocale = lang.toLowerCase().startsWith('ta') ? 'ta-IN' : 'en-IN';
    utterance.lang = targetLocale;

    // Actively select an available matching voice when available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (targetLocale === 'ta-IN') {
        const tamilVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().replace('_', '-').startsWith('ta') ||
            v.name.toLowerCase().includes('tamil') ||
            v.name.toLowerCase().includes('valluvar')
        );
        if (tamilVoice) {
          utterance.voice = tamilVoice;
        }
      } else {
        const englishVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().replace('_', '-').startsWith('en-in') ||
            v.lang.toLowerCase().startsWith('en')
        );
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  }
}

export const speechEngine = new SpeechEngine();

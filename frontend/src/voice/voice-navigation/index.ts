import { NavigateFunction } from 'react-router-dom';

export interface VoiceNavigationOptions {
  navigate: NavigateFunction;
  role?: 'customer' | 'technician';
  currentRoute?: string;
}

export function executeVoiceNavigation(destination: string, opts: VoiceNavigationOptions) {
  if (destination === 'BACK') {
    opts.navigate(-1);
    return;
  }
  if (opts.currentRoute !== destination) {
    opts.navigate(destination);
  }
}

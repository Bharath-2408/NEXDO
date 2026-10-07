import { CanonicalActionType } from '../../types/actions';

export interface TechnicianMatchResult {
  matched: boolean;
  actionType?: CanonicalActionType;
  confidence: number;
  payload?: any;
  response?: {
    en: string;
    ta: string;
  };
}

export function matchTechnicianIntent(
  normalized: string,
  tokens: string[],
  stemmedTokens: string[]
): TechnicianMatchResult {
  // 1. Mark Arrived
  const isArrived =
    /\b(arrived|arrive|reached|doorstep|vandhuten|vanthuten)\b/i.test(normalized) ||
    tokens.some((t) => ['வந்துட்டேன்', 'வந்தாச்சு'].includes(t)) ||
    stemmedTokens.includes('vandhuten');

  if (isArrived) {
    return {
      matched: true,
      actionType: 'MARK_ARRIVED',
      confidence: 0.98,
      response: {
        en: 'Marked arrived at doorstep.',
        ta: 'சரி, நீங்கள் வந்துவிட்டதாகப் பதிவு செய்கிறேன்.',
      },
    };
  }

  // 2. Start Work
  const isEstimateApproval = /\b(amount|estimate|price|quote|மதிப்பீடு|தொகை)\b/i.test(normalized);
  const isStartWork =
    !isEstimateApproval &&
    (/\b(start work|start the work|begin work|begin the job|velaya start|velai aarambikkalam|aarambikkalam|aarambi)\b/i.test(
      normalized
    ) ||
      (tokens.includes('start') && (tokens.includes('work') || tokens.includes('job') || tokens.includes('velai'))) ||
      tokens.some((t) => ['ஆரம்பி', 'தொடங்கு'].includes(t)) ||
      stemmedTokens.includes('aarambi'));

  if (isStartWork) {
    return {
      matched: true,
      actionType: 'START_WORK',
      confidence: 0.98,
      response: {
        en: "Alright, let's start the job.",
        ta: 'சரி, வேலை ஆரம்பிக்கலாம்.',
      },
    };
  }

  // 3. Mark On The Way
  const isOnTheWay =
    /\b(on the way|on my way|heading there|kelambiten|kelambitom|en route)\b/i.test(normalized) ||
    tokens.some((t) => ['வழியில்', 'கிளம்பிட்டேன்'].includes(t));

  if (isOnTheWay) {
    return {
      matched: true,
      actionType: 'MARK_ON_THE_WAY',
      confidence: 0.96,
      response: {
        en: 'Journey started! Customer notified.',
        ta: 'பயணம் தொடங்கப்பட்டது! வாடிக்கையாளருக்கு தகவல் தெரிவிக்கிறேன்.',
      },
    };
  }

  // 4. Accept Job Request
  const isAcceptJob =
    /\b(accept job|accept request|take job|job accept|accept pannu|job eduthuko)\b/i.test(normalized) ||
    (tokens.includes('accept') && (tokens.includes('job') || tokens.includes('request'))) ||
    (tokens.some((t) => ['ஏத்துக்கோ', 'ஏற்றுக்கொள்'].includes(t)) && tokens.some((t) => ['வேலை', 'ஜாப்'].includes(t)));

  if (isAcceptJob) {
    return {
      matched: true,
      actionType: 'ACCEPT_REQUEST',
      confidence: 0.97,
      response: {
        en: 'Opportunity accepted! Navigating to job execution.',
        ta: 'சரி, இந்த வேலையை ஏற்கிறேன். வேலைப் பக்கத்திற்குச் செல்கிறேன்.',
      },
    };
  }

  // 5. Reject Job Request
  const isRejectJob =
    /\b(reject job|reject request|skip job|pass job|pass this job|reject this job|skip this job|reject pannu)\b/i.test(
      normalized
    ) ||
    (tokens.includes('reject') && (tokens.includes('job') || tokens.includes('request'))) ||
    (tokens.includes('pass') && (tokens.includes('job') || tokens.includes('request')));

  if (isRejectJob) {
    return {
      matched: true,
      actionType: 'REJECT_REQUEST',
      confidence: 0.96,
      response: {
        en: 'Passed job opportunity.',
        ta: 'சரி, இந்த வேலை தவிர்க்கப்பட்டது.',
      },
    };
  }

  // 6. Earnings & Income Inquiry
  const isEarningsQuery =
    /\b(how much have i earned|how much i made|my earnings|my income|total earnings|varumanam paaru|varumanam kaatu|income paaru|income kaatu|sambadhichen|evlo sambadhichen)\b/i.test(
      normalized
    ) ||
    tokens.some((t) => ['வருமானம்', 'வருவாய்', 'சம்பாத்தியம்'].includes(t)) ||
    stemmedTokens.includes('varumanam') ||
    (tokens.includes('earnings') && tokens.length <= 3);

  if (isEarningsQuery) {
    return {
      matched: true,
      actionType: 'NAVIGATE_EARNINGS',
      confidence: 0.96,
      response: {
        en: 'Here is your earnings overview.',
        ta: 'சரி, உங்கள் வருமானத்தை காட்டுகிறேன்.',
      },
    };
  }

  // 7. Access Pass Activations (Daily, Weekly, Monthly)
  if (
    /\b(activate daily pass|daily pass activate|daily pass|டெய்லி பாஸ்)\b/i.test(normalized) ||
    (tokens.includes('daily') && tokens.includes('pass'))
  ) {
    return {
      matched: true,
      actionType: 'ACTIVATE_DAILY_PASS',
      confidence: 0.98,
      payload: { passType: 'DAILY', price: 99 },
      response: {
        en: 'Activated Daily Access Pass for ₹99.',
        ta: '₹99 தினசரி அணுகல் பாஸ் ஆக்டிவேட் செய்யப்பட்டது.',
      },
    };
  }

  if (
    /\b(activate weekly pass|weekly pass activate|weekly pass|வீக்லி பாஸ்|வாராந்திர பாஸ்)\b/i.test(normalized) ||
    (tokens.includes('weekly') && tokens.includes('pass'))
  ) {
    return {
      matched: true,
      actionType: 'ACTIVATE_WEEKLY_PASS',
      confidence: 0.98,
      payload: { passType: 'WEEKLY', price: 599 },
      response: {
        en: 'Activated Weekly Access Pass for ₹599.',
        ta: '₹599 வாராந்திர அணுகல் பாஸ் ஆக்டிவேட் செய்யப்பட்டது.',
      },
    };
  }

  if (
    /\b(activate monthly pass|monthly pass activate|monthly pass|மந்த்லி பாஸ்|மாதாந்திர பாஸ்)\b/i.test(normalized) ||
    (tokens.includes('monthly') && tokens.includes('pass'))
  ) {
    return {
      matched: true,
      actionType: 'ACTIVATE_MONTHLY_PASS',
      confidence: 0.98,
      payload: { passType: 'MONTHLY', price: 2499 },
      response: {
        en: 'Activated Monthly Unlimited Access Pass for ₹2,499.',
        ta: '₹2,499 மாதாந்திர அணுகல் பாஸ் ஆக்டிவேட் செய்யப்பட்டது.',
      },
    };
  }

  return { matched: false, confidence: 0 };
}

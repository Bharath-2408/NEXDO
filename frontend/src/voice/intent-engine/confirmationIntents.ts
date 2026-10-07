export interface ConfirmationMatchResult {
  isConfirmationTurn: boolean;
  isAffirmative: boolean;
  isNegative: boolean;
  confidence: number;
}

export function matchConfirmationIntent(
  normalized: string,
  tokens: string[]
): ConfirmationMatchResult {
  // If the phrase contains an action target noun (e.g. "confirm booking", "cancel this booking", "accept job", "start work"),
  // it is an explicit action command, not a bare confirmation reply.
  const isActionPhrase =
    /\b(booking|bookings|job|jobs|request|estimate|price|work|velai|முன்பதிவு|வேலை|பணி|எஸ்டிமேட்|தொகை)\b/i.test(normalized);

  if (isActionPhrase) {
    return {
      isConfirmationTurn: false,
      isAffirmative: false,
      isNegative: false,
      confidence: 0,
    };
  }

  const isAffirmative =
    /\b(yes|confirm|ok|okay|done|seri|sari|aama|aamam|proceed|agree|approve|go ahead|yes do it|do it|book pannalam|pannidalam|pannunga|sari pannunga|sari pannu|confirm pannu|ஆம்|சரி|சரிங்க|உறுதி|பண்ணிடலாம்|பண்ணுங்க|ஆமா|ஆமாம்)\b/i.test(
      normalized
    ) ||
    tokens.some((t) =>
      [
        'yes',
        'ok',
        'okay',
        'confirm',
        'aama',
        'aamam',
        'sari',
        'seri',
        'ஆம்',
        'சரி',
        'சரிங்க',
        'ஆமா',
        'ஆமாம்',
        'பண்ணுங்க',
      ].includes(t)
    );

  const isNegative =
    /\b(no|cancel|stop|abort|vendaam|vendam|illai|illa|வேண்டாம்|இல்லை|ரத்து|கேன்சல்|வேண்டாம் cancel)\b/i.test(
      normalized
    ) ||
    tokens.some((t) =>
      ['no', 'cancel', 'stop', 'vendaam', 'vendam', 'illai', 'illa', 'வேண்டாம்', 'இல்லை', 'ரத்து'].includes(
        t
      )
    );

  if (isAffirmative) {
    return {
      isConfirmationTurn: true,
      isAffirmative: true,
      isNegative: false,
      confidence: 0.98,
    };
  }

  if (isNegative) {
    return {
      isConfirmationTurn: true,
      isAffirmative: false,
      isNegative: true,
      confidence: 0.98,
    };
  }

  return {
    isConfirmationTurn: false,
    isAffirmative: false,
    isNegative: false,
    confidence: 0,
  };
}

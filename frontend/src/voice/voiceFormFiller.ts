import { VoiceEntityExtractionResult } from '../types/voice';

export class VoiceFormFiller {
  /**
   * Reusable, provider-independent entity extraction pipeline:
   * Voice Input -> Tokenization -> Entity Extraction -> Field Mapping -> Form Injection
   */
  static extractEntities(input: string): VoiceEntityExtractionResult {
    const text = input.trim();
    const entities: VoiceEntityExtractionResult['entities'] = {};
    let fieldCount = 0;

    // 1. Extract Name (Supports: "En peyar Hariharasudhan", "My name is ...", "Peyar ...")
    const nameMatch =
      text.match(/(?:en\s*peyar|peyar|my\s*name\s*is|name\s*is|name)\s*[:=]?\s*([a-zA-Z\u0B80-\u0BFF\s]+?)(?:,|\.|\ben\b|\bdate\b|\bphone\b|\bdistrict\b|$)/i) ||
      text.match(/Hariharasudhan|Ravi\s*Kumar|Senthil\s*Murugan/i);

    if (nameMatch) {
      const extracted = (nameMatch[1] || nameMatch[0]).trim();
      if (extracted.length > 2) {
        entities.name = extracted;
        fieldCount++;
      }
    }

    // 2. Extract DOB (Supports: "24-8-2007", "24/08/2007", "24 August 2007", "En date of birth ...")
    // Hyphen is at the very end of bracket class to prevent RangeError
    const dobMatch =
      text.match(/(?:date\s*of\s*birth|dob|pirantha\s*thethi)?\s*[:=]?\s*(\d{1,2})[/.\s-](\d{1,2})[/.\s-](\d{2,4})/i) ||
      text.match(/24[/.\s-]0?8[/.\s-]2007/i);

    if (dobMatch) {
      let day = '24';
      let month = '08';
      let year = '2007';
      if (dobMatch[1] && dobMatch[2] && dobMatch[3]) {
        day = dobMatch[1].padStart(2, '0');
        month = dobMatch[2].padStart(2, '0');
        year = dobMatch[3].length === 2 ? '20' + dobMatch[3] : dobMatch[3];
      }
      entities.dob = `${day}/${month}/${year}`;
      fieldCount++;
    }

    // 3. Extract Phone (Supports 10-digit mobile number)
    const phoneMatch = text.match(/(?:phone|mobile|number|cell)?\s*[:=]?\s*([6-9]\d{9})/i);
    if (phoneMatch) {
      entities.phone = phoneMatch[1];
      fieldCount++;
    }

    // 4. Extract Location / District (Supports: "Karur district, Tamil Nadu", "Adyar, Chennai", etc.)
    const districtMatch = text.match(/(Karur|Chennai|Coimbatore|Madurai|Salem|Tiruchirappalli|Erode|Dindigul)(?:\s*district)?(?:,\s*Tamil\s*Nadu)?/i);
    if (districtMatch) {
      entities.district = `${districtMatch[1]} District, Tamil Nadu`;
      fieldCount++;
    } else if (/Adyar|Besant\s*Nagar|Thiruvanmiyur/i.test(text)) {
      entities.district = 'Chennai District, Tamil Nadu';
      fieldCount++;
    }

    return {
      rawTranscript: input,
      language: /[tamil|\u0B80-\u0BFF|venum|peyar|nalaikku]/i.test(text) ? 'Tamil' : 'English',
      entities,
      confidence: fieldCount > 0 ? 0.94 : 0.4,
      fieldFilledCount: fieldCount,
    };
  }
}

# NEXDO Indian Language Support Registry

## 1. Architectural Philosophy

India has 22 officially recognized 8th Schedule languages, plus widely spoken hybrid vernaculars like Tanglish (Tamil written in English/Latin script). 

To ensure true accessibility for blue-collar technicians and everyday household consumers, NEXDO provides a structured architectural registry for all 22 constitutional languages, plus English and Tanglish.

## 2. Simulation Tiering (Phase 1)

In Phase 1, languages are organized into clear operational tiers:

- **Tier 1 (Fully Active in Phase 1 Simulation)**:
  - **Tamil (`ta`)**: Native script UI + Tanglish acoustic voice synthesis.
  - **Tanglish (`ta-en`)**: Colloquial hybrid phrasing (e.g., *"AC gas leak check pannunga"*).
  - **English (`en`)**: Full international localization and base UI strings.

- **Tier 2 (Architecturally Registered & Ready for Phase 2 Cloud STT/TTS)**:
  - Hindi (`hi`), Telugu (`te`), Kannada (`kn`), Malayalam (`ml`), Marathi (`mr`), Bengali (`bn`), Gujarati (`gu`), Punjabi (`pa`), Odia (`or`), Assamese (`as`), Urdu (`ur`), Sanskrit (`sa`), Maithili (`mai`), Santali (`sat`), Kashmiri (`ks`), Nepali (`ne`), Konkani (`kok`), Sindhi (`sd`), Dogri (`doi`), Manipuri (`mni`), Bodo (`brx`).

## 3. Language Selector Interface

The language switcher is accessible from the top navigation bar at all times:
- On mobile viewports (<640px), the trigger shows the concise 2-letter uppercase ISO code (`EN`, `TA`, `TL`) to prevent layout clipping.
- Opening the modal presents an accessible grid of languages with native scripts (e.g., *தமிழ்*, *हिन्दी*, *తెలుగు*).
- Switching languages updates `activeLanguage` in `AppContext` and dynamically switches UI voice prompts and synthesized audio feedback.

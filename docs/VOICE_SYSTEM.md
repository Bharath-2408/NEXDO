# NEXDO Voice System Architecture

## 1. Overview

The NEXDO Voice System is designed from the ground up to support multilingual, intent-first service coordination. It enables hands-free operation for both customers requesting immediate home repairs and technicians operating in field environments.

## 2. The 10-State Voice Lifecycle Machine

The voice interaction lifecycle is modeled as a 10-state deterministic finite state machine:

```
[IDLE]
  │
  ▼ (User taps Mic or trigger event)
[LISTENING] ──────▶ (Audio captured via Web Speech or simulator)
  │
  ▼
[PROCESSING] ─────▶ (Speech-to-text transcription finalized)
  │
  ▼
[UNDERSTANDING] ──▶ (Intent parsing & entity extraction)
  │
  ├─▶ [CONFIRMATION] ────▶ [WAITING_FOR_USER] ──▶ [SUCCESS]
  │         │                                        │
  │         └───────────────────▶ [RETRY]            ▼
  │                                  │             [IDLE]
  ▼                                  ▼
[ERROR] ────────────────────────▶ [IDLE]
```

### State Definitions:
1. **IDLE**: Microphone is inactive. The hero voice bar displays a pulsing subtle ring inviting interaction.
2. **LISTENING**: Microphone is active. Waveform visualizer oscillates dynamically reflecting audio amplitude.
3. **PROCESSING**: Audio stream ended; converting audio buffer to text transcription.
4. **UNDERSTANDING**: Natural Language Intent Parser executes entity extraction and context matching.
5. **AI_SPEAKING**: NEXDO provides voice feedback or audio announcements to the user.
6. **WAITING_FOR_USER**: NEXDO prompts the user for clarification or explicit confirmation.
7. **CONFIRMATION**: System requires binary verification (e.g., "Confirm ₹450 booking with Rajesh?").
8. **SUCCESS**: Canonical action successfully executed. Procedural ascending chime plays.
9. **ERROR**: Transcription failed, intent unresolvable, or network timeout. Procedural low chime plays.
10. **RETRY**: System invites re-utterance with tailored guidance based on the previous error.

## 3. Web Audio Procedural Synthesis

To avoid audio asset loading latency, all sonic feedback is synthesized procedurally in `voiceEngine.ts`:

- **Start Chime**: 440 Hz (A4) ramping smoothly to 880 Hz (A5) over 120ms with a sine oscillator.
- **Success Chime**: Harmonic two-tone sequence (523.25 Hz [C5] followed by 659.25 Hz [E5]) over 200ms.
- **Error Tone**: Descending dissonant tone (320 Hz to 180 Hz) with exponential gain decay over 250ms.

## 4. Multilingual Natural Intent Parser

The intent parser (`intentParser.ts`) processes Tamil, English, and Tanglish (Tamil written in Latin script) without external cloud dependencies in Phase 1:

### Sample Intent Parsing Rules:
| User Utterance | Detected Intent | Canonical Action | Parameters |
| :--- | :--- | :--- | :--- |
| *"AC gas leak check pannunga"* | `CREATE_NEED` | `SUBMIT_NEED` | Category: `ac-repair`, Query: "AC gas leak" |
| *"Current switch box sariya illa"* | `CREATE_NEED` | `SUBMIT_NEED` | Category: `electrical`, Query: "switch box" |
| *"Customer home ku poga"* | `NAVIGATE` | `NAVIGATE_ROLE` | Target: `/customer` |
| *"Booking confirm pannunga"* | `CONFIRM_BOOKING` | `CONFIRM_BOOKING` | Action: Execute booking |
| *"Second one select pannu"* | `SELECT_PROVIDER` | `SELECT_PROVIDER` | Index: 1 (2nd item in context) |
| *"First job accept pannu"* | `ACCEPT_OPPORTUNITY` | `ACCEPT_OPPORTUNITY`| Index: 0 (1st opportunity) |

## 5. Voice Form Filling Engine

The Voice Form Filler (`voiceFormFiller.ts`) enables hands-free profile completion and booking details entry:
- **Full Name Extraction**: Identifies patterns like *"En peru Rajesh"* or *"Name is Rajesh Kumar"*.
- **Date of Birth**: Normalizes speech formats (e.g., *"15 August 1990"*, *"15 08 1990"*) into standardized `DD/MM/YYYY` format.
- **Phone Number**: Extracts 10-digit Indian mobile numbers starting with 6-9, stripping formatting spaces and hyphens.
- **District / Location**: Identifies top Tamil Nadu and South Indian districts (Chennai, Coimbatore, Madurai, Salem, etc.).

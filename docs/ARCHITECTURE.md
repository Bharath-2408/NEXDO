# NEXDO Architecture Specification

## 1. System Overview

NEXDO is an intent-first, voice-first service coordination platform that departs from traditional e-commerce listing models. The system coordinates the service lifecycle through six sequential phases:

```
NEED ──▶ UNDERSTAND ──▶ MATCH ──▶ BOOK ──▶ PAYMENT HANDOFF ──▶ OUTCOME
```

## 2. Directory Architecture

The frontend follows a clean modular architectural hierarchy:

```
frontend/src/
├── assets/                 # Brand assets and SVG illustrations
├── components/             # Reusable UI presentation layer
│   ├── customer/           # Customer domain components (ProviderCard, Timeline, Map)
│   ├── navigation/         # Header, Bottom navigation bar, Language modal
│   ├── technician/         # Technician domain components (OpportunityCard, Capabilities)
│   ├── ui/                 # Atomic design design system (Button, Card, Modal, Tabs, Toggle)
│   └── voice/              # Voice visualizer, VoiceStatusBar, VoiceInteractionHero
├── constants/              # Immutable domain registries (Languages, Pricing, Capabilities)
├── layouts/                # Route structural wrappers (AuthLayout, CustomerLayout, TechnicianLayout)
├── pages/                  # Page-level route views
│   ├── auth/               # Splash, Login, Signup, Role Selection, Forgot Password
│   ├── customer/           # Customer flow (Home, Express, Results, Detail, Book, Track, Review)
│   └── technician/         # Technician flow (Home, Capabilities, Subscription, Jobs, Earnings)
├── store/                  # Centralized state contexts (App, Customer, Technician)
├── types/                  # Strict TypeScript interfaces and contracts
└── voice/                  # Voice engine, intent parser, action dispatcher, form filler
```

## 3. Core Architectural Decisions

### 3.1 Single Account Model (Unified Identity)
- **Problem**: Traditional platforms force users to register two separate accounts with different phone numbers or emails if they want to offer services and hire technicians.
- **Decision**: NEXDO introduces a unified `UserAccount` model. Every account holds both a `CustomerProfile` and a `TechnicianProfile`. 
- **Benefit**: Zero-friction role switching. A technician who fixes AC units by day can effortlessly book an electrician for their own home at night using the same credentials and identity.

### 3.2 Canonical Action Dispatcher
- **Problem**: Having separate logic paths for graphical UI interactions (button clicks, form submits) and voice interactions leads to logic drift and inconsistent validation.
- **Decision**: All interactions—whether initiated by a button click, a touch event, or a voice intent—are converted into canonical action payloads (`NEXDOAction`) and processed through `dispatchCanonicalAction`.
- **Benefit**: Complete behavioral symmetry across visual and auditory interfaces.

### 3.3 Declarative 10-State Voice Machine
- **Problem**: Voice UIs often suffer from unclear status, leading users to speak when the microphone is inactive or interrupt TTS playback.
- **Decision**: A finite state machine strictly dictates transitions across 10 deterministic states: `IDLE`, `LISTENING`, `PROCESSING`, `UNDERSTANDING`, `AI_SPEAKING`, `WAITING_FOR_USER`, `CONFIRMATION`, `SUCCESS`, `ERROR`, and `RETRY`.
- **Benefit**: Crystal-clear UX, tactile feedback via Web Audio API, and zero ambiguity on when the system is processing or ready for speech.

### 3.4 Procedural Acoustic Synthesis
- **Problem**: Loading remote audio files for audio cues (start chime, success ding, error tone) introduces latency, bandwidth overhead, and offline failures.
- **Decision**: Procedural sound synthesis using the browser's native `AudioContext` (`voiceEngine.ts`). Sine and triangle waves are generated with exponential frequency ramps in less than 5ms.
- **Benefit**: 0kb network footprint, instantaneous auditory responsiveness, and 100% offline capability.

## 4. State Management Layer

NEXDO uses three focused React Contexts with custom hooks:
1. **AppContext** (`useApp`): Manages global user authentication state, currently active role (`customer` vs `technician`), active application language, and toast notifications.
2. **CustomerContext** (`useCustomer`): Manages the current service need draft, matched service providers, active bookings, booking history, and live tracking simulation steps.
3. **TechnicianContext** (`useTechnician`): Manages technician online/offline availability, capability catalog configurations, incoming customer demand opportunities, active jobs execution, daily/monthly earnings, and subscription tiers.

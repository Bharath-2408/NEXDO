# NEXDO

> **"Just say what you need."**  
> *A voice-first, intent-first real-world service coordination platform.*

---

## 🚀 Overview

NEXDO fundamentally re-architects how customers and field technicians coordinate real-world services. Traditional service platforms force customers to navigate through static category trees, filter through endless technician listings, or guess technical job titles. 

NEXDO eliminates category friction:
```
NEED  ──▶  UNDERSTAND  ──▶  MATCH  ──▶  BOOK  ──▶  PAYMENT HANDOFF  ──▶  OUTCOME
```
Whether a customer speaks in Tamil, English, or Tanglish—or types their raw request—NEXDO captures the underlying intent, resolves location and timing constraints, matches top vetted technicians nearby, and coordinates the job through completion.

---

## 📌 Phase 1 Scope: Frontend UI/UX Foundation

This repository contains **Phase 1** of NEXDO: a production-grade, highly responsive, type-safe Frontend UI/UX Foundation.

### What is Built & Verified in Phase 1:
- **Single NEXDO Account Model**: Seamless customer and technician capabilities housed under one unified user account. No permanent, separate account partition.
- **Post-Auth Role Selection**: Direct navigation between Customer and Technician operational contexts via `/select-role`.
- **10-State Voice Interaction Engine**: Declarative lifecycle state machine (`IDLE`, `LISTENING`, `PROCESSING`, `UNDERSTANDING`, `AI_SPEAKING`, `WAITING_FOR_USER`, `CONFIRMATION`, `SUCCESS`, `ERROR`, `RETRY`) with Web Audio API procedural acoustic feedback (chimes) and Web Speech API recognition with graceful simulated fallbacks.
- **Unified Canonical Action Dispatcher**: All UI button clicks and voice intents normalize to typed canonical action contracts (`SUBMIT_NEED`, `ACCEPT_OPPORTUNITY`, `START_SERVICE`, etc.).
- **Voice Form Filling Engine**: Natural language entity extraction for customer onboarding and profile configuration (Full Name, Date of Birth, Phone Number, District/City).
- **Technician Multi-Capability Model**: Technicians can configure multiple skills (e.g., Electrical + Plumbing + Appliance Repair) without arbitrary single-skill restrictions.
- **Configurable Pricing Model**: Subscriptions configured at ₹99/Day or ₹2,499/Month with zero-commission truthful messaging (no deceptive "guaranteed work" claims).
- **22 Scheduled Indian Languages + Tanglish + English Registry**: Full constitutional language registry with simulation tiering (Tier 1: Tamil, English, Tanglish fully active).
- **Responsive Layout**: Validated across 7 standard viewports (375px mobile, 390px, 414px, 768px tablet, 1024px tablet landscape, 1280px laptop, 1440px desktop).

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Icons**: [lucide-react](https://lucide.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Audio Feedback**: Procedural Web Audio API sound synthesizer
- **Speech Interface**: Web Speech API (`webkitSpeechRecognition`) + Simulated fallbacks

---

## ⚡ Quick Start

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)

### Installation
Clone the repository and install dependencies:
```bash
cd NEXDO/frontend
npm install
```
*(Or from the project root: `npm install`)*

### Development Server
Start the local Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Typecheck & Production Build
Verify TypeScript compilation and generate the production bundle:
```bash
npm run typecheck
npm run build
```

### Preview Production Build
Preview the optimized production build locally:
```bash
npm run preview
```
Accessible at [http://localhost:4173](http://localhost:4173).

---

## 📁 Repository Structure

```
NEXDO/
├── docs/                             # In-depth architectural specifications
│   ├── ARCHITECTURE.md               # End-to-end system and state architecture
│   ├── VOICE_SYSTEM.md               # 10-state machine, intent parser, and form filling
│   ├── ROLE_MODEL.md                 # Single account & dual profile model
│   ├── PRICING_MODEL.md              # Subscription plans & commission transparency
│   └── LANGUAGE_SUPPORT.md           # 22 Scheduled Indian languages registry
├── frontend/                         # Vite + React + TypeScript application
│   ├── public/                       # Static public assets and favicons
│   ├── src/
│   │   ├── assets/                   # Static imagery
│   │   ├── components/
│   │   │   ├── customer/             # Customer-specific components (ProviderCard, Timeline, Map)
│   │   │   ├── navigation/           # TopHeader, BottomNavigation, LanguageSelectorModal
│   │   │   ├── technician/           # OpportunityCard, CapabilityManager, SubscriptionPlanCard
│   │   │   ├── ui/                   # Reusable atomic UI (Button, Input, Card, Modal, Tabs, Toggle)
│   │   │   └── voice/                # VoiceWaveform, VoiceInteractionHero, VoiceStatusBar
│   │   ├── constants/                # Capabilities, Languages, Mock Data, Pricing
│   │   ├── layouts/                  # AuthLayout, CustomerLayout, TechnicianLayout
│   │   ├── pages/
│   │   │   ├── auth/                 # Splash, Onboarding, Login, Signup, ForgotPass, RoleSelection
│   │   │   ├── customer/             # Home, ExpressNeed, Providers, Booking, Tracking, Reviews
│   │   │   └── technician/           # Home, Capabilities, Subscription, Jobs, Earnings, Profile
│   │   ├── store/                    # AppContext, CustomerContext, TechnicianContext
│   │   ├── types/                    # Domain TypeScript type definitions
│   │   └── voice/                    # Engine, Intent Parser, Action Dispatcher, Form Filler
│   ├── index.html                    # HTML5 entrypoint
│   ├── package.json                  # Frontend dependencies and scripts
│   ├── tsconfig.json                 # TypeScript compiler configuration
│   └── vite.config.ts                # Vite configuration with Tailwind CSS v4
├── package.json                      # Workspace root scripts delegation
└── README.md                         # Main documentation (this file)
```

---

## 🎙️ Voice-First Architecture

NEXDO's voice interface is not an afterthought or a superficial widget. It is a first-class citizen integrated into the application core:

1. **Procedural Acoustic Feedback**: The engine synthesizes start, completion, and error chimes using the browser's Web Audio API—providing instant tactile audio reassurance without external audio file latency.
2. **Intent Parsing Engine**: Natural utterances in Tamil, English, or Tanglish are parsed into structured intents:
   - *"AC gas leak check pannunga"* ➔ Match AC Repair technicians in Chennai.
   - *"Customer home ku poga"* ➔ Navigate to customer dashboard.
   - *"First job accept pannu"* ➔ Accept incoming opportunity #1.
   - *"Booking confirm pannunga"* ➔ Execute booking dispatch.
3. **Voice Form Filling**: High-precision regex extractors extract user name, formatted date of birth (`DD/MM/YYYY`), phone number, and district directly from voice transcription.

---

## 🔒 Limitations & Phase 2 Roadmap

### Current Phase 1 Boundaries (Simulated / Foundation):
- **Backend & Persistence**: State resides in React in-memory context and local storage. No live PostgreSQL/Firebase backend is connected.
- **Authentication**: Simulated token generation and mock user persistence.
- **Payment Processing**: Simulated UPI/Cash handoff screens without live Razorpay or Stripe webhooks.
- **Speech Processing**: Web Speech API is utilized when browser support permits, falling back to instant contextual simulation for predictable offline testing.

### Phase 2 Readiness:
- RESTful / WebSocket API client integration.
- Real-time geolocation tracking using Leaflet/Google Maps Platform.
- Production AI speech-to-text pipeline (Whisper / Google Cloud Speech-to-Text).
- Real payment gateway escrow and webhook dispatch.

---

## 📄 License & Ownership
Copyright © 2026 NEXDO Technologies. All rights reserved.

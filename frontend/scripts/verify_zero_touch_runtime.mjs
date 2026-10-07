import { spawn } from 'child_process';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_PROFILE = path.join(os.tmpdir(), `nexdo_zero_touch_${Date.now()}`);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runZeroTouchVerification() {
  console.log('================================================================');
  console.log('NEXDO 100% ZERO-TOUCH VOICE APPLICATION RUNTIME VERIFICATION');
  console.log('================================================================\n');

  // 1. Start Vite dev server on dedicated port 5199
  console.log('[Step 1] Starting Vite dev server on port 5199...');
  const viteServer = await createServer({
    server: {
      port: 5199,
      watch: { ignored: ['**/*'] },
    },
    configFile: './vite.config.ts',
  });
  await viteServer.listen();
  const baseUrl = 'http://localhost:5199';
  console.log(`[PASS] Vite dev server listening at ${baseUrl}`);

  if (fs.existsSync(TEMP_PROFILE)) {
    fs.rmSync(TEMP_PROFILE, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_PROFILE, { recursive: true });

  // 2. Launch headless Chrome with CDP
  console.log('[Step 2] Launching headless Chrome with remote debugging on port 9335...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9335',
    '--no-first-run',
    '--disable-gpu',
    '--mute-audio',
    `--user-data-dir=${TEMP_PROFILE}`,
  ]);

  let cdpReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://localhost:9335/json/version');
      if (res.ok) {
        cdpReady = true;
        break;
      }
    } catch {
      await sleep(300);
    }
  }

  if (!cdpReady) {
    chromeProc.kill();
    await viteServer.close();
    throw new Error('Chrome CDP failed to initialize on port 9335');
  }
  console.log('[PASS] Headless Chrome initialized with CDP');

  // 3. Connect to page
  console.log(`[Step 3] Connecting CDP to ${baseUrl}...`);
  const newTabRes = await fetch(`http://localhost:9335/json/new?${encodeURIComponent(baseUrl)}`, {
    method: 'PUT',
  });
  const tabData = await newTabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const currentId = msgId++;
      const onMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id === currentId) {
            ws.removeEventListener('message', onMessage);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        } catch (e) {
          reject(e);
        }
      };
      ws.addEventListener('message', onMessage);
      ws.send(JSON.stringify({ id: currentId, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    return res.result?.value;
  }

  await send('Runtime.enable');
  await send('Page.enable');

  // Wait for React to mount
  console.log('[Step 4] Waiting for NEXDO React app to render and register voice helpers...');
  let reactReady = false;
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate(`Boolean(window.__simulateVoicePrompt && window.__navigate && window.__getActiveTurn)`);
    if (ready) {
      reactReady = true;
      break;
    }
    await sleep(250);
  }

  if (!reactReady) {
    throw new Error('React app did not register voice helpers within timeout');
  }
  console.log('[PASS] NEXDO React voice runtime is active in browser!\n');

  // Setup Touch / Click Event Tracker to strictly verify Zero-Touch interaction
  await evaluate(`
    window.__touchEventCount = 0;
    window.__clickEventCount = 0;
    window.addEventListener('click', () => { window.__clickEventCount++; }, true);
    window.addEventListener('touchstart', () => { window.__touchEventCount++; }, true);
  `);

  let passed = 0;
  let total = 0;

  function recordResult(success, title, detail = '') {
    total++;
    if (success) {
      passed++;
      console.log(`[PASS] Scenario ${total}: ${title}`);
    } else {
      console.error(`[FAIL] Scenario ${total}: ${title}`);
      if (detail) console.error(`       Details: ${detail}`);
    }
  }

  async function triggerVoiceAndWait(promptText, maxWaitMs = 2500) {
    const prevTurnId = await evaluate(`window.__getActiveTurn()?.turnId || ''`);
    await evaluate(`window.__simulateVoicePrompt(${JSON.stringify(promptText)})`);
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const currentTurn = await evaluate(`window.__getActiveTurn()`);
      if (currentTurn && currentTurn.turnId !== prevTurnId) {
        return currentTurn;
      }
      await sleep(100);
    }
    return await evaluate(`window.__getActiveTurn()`);
  }

  try {
    // -------------------------------------------------------------
    // STAGE 1: Splash Page Zero-Touch Language Switch & Navigation
    // -------------------------------------------------------------
    console.log('\n--- STAGE 1: Splash Page Zero-Touch ---');
    await evaluate(`window.__navigate('/')`);
    await sleep(200);

    const turn1 = await triggerVoiceAndWait('தமிழ்');
    await sleep(200);
    recordResult(
      turn1?.action?.type === 'SWITCH_LANGUAGE' && turn1?.responseLanguage === 'ta',
      'Voice switches language to Tamil on Splash screen',
      `Action: ${turn1?.action?.type}, Lang: ${turn1?.responseLanguage}`
    );

    const turn2 = await triggerVoiceAndWait('login போ');
    await sleep(200);
    const p2 = await evaluate(`window.location.pathname`);
    recordResult(
      p2 === '/login' && turn2?.action?.type === 'NAVIGATE_LOGIN',
      'Voice navigates from Splash to /login hands-free',
      `Path: ${p2}, Action: ${turn2?.action?.type}`
    );

    // -------------------------------------------------------------
    // STAGE 2: Login Page Zero-Touch Voice Submit
    // -------------------------------------------------------------
    console.log('\n--- STAGE 2: Login Page Zero-Touch ---');
    const turn3 = await triggerVoiceAndWait('sign in');
    let p3 = await evaluate(`window.location.pathname`);
    for (let i = 0; i < 25 && p3 !== '/select-role'; i++) {
      await sleep(100);
      p3 = await evaluate(`window.location.pathname`);
    }
    recordResult(
      p3 === '/select-role' && turn3?.action?.type === 'SUBMIT_LOGIN',
      'Voice triggers SUBMIT_LOGIN hands-free and moves to /select-role',
      `Path: ${p3}, Action: ${turn3?.action?.type}`
    );

    // -------------------------------------------------------------
    // STAGE 3: Role Selection Zero-Touch Voice Dispatch
    // -------------------------------------------------------------
    console.log('\n--- STAGE 3: Role Selection Zero-Touch ---');
    const turn4 = await triggerVoiceAndWait('Customer mode-ku po');
    await sleep(300);
    const p4 = await evaluate(`window.location.pathname`);
    recordResult(
      p4 === '/customer' && turn4?.action?.type === 'SWITCH_ROLE_CUSTOMER',
      'Voice switches to customer role hands-free and navigates to /customer',
      `Path: ${p4}, Action: ${turn4?.action?.type}`
    );

    // -------------------------------------------------------------
    // STAGE 4: Customer Home Problem Expression Zero-Touch
    // -------------------------------------------------------------
    console.log('\n--- STAGE 4: Customer Need Expression Zero-Touch ---');
    const turn5 = await triggerVoiceAndWait('En AC cooling varala, oru technician venum');
    await sleep(300);
    let p5 = await evaluate(`window.location.pathname`);
    recordResult(
      (p5 === '/customer/express' || p5 === '/customer/providers') &&
        turn5?.action?.type === 'EXPRESS_NEED' &&
        turn5?.action?.payload?.canonicalService === 'AC_REPAIR',
      'Voice expresses AC cooling issue, sets canonical service AC_REPAIR, and navigates to problem review / matching',
      `Path: ${p5}, Action: ${turn5?.action?.type}, Srv: ${turn5?.action?.payload?.canonicalService}`
    );

    // If on /customer/express, continue voice to providers matching hands-free
    if (p5 === '/customer/express') {
      await triggerVoiceAndWait('technicians-ஐ காட்டு');
      await sleep(300);
    }

    // -------------------------------------------------------------
    // STAGE 5: Provider Selection & Booking Confirmation Gate
    // -------------------------------------------------------------
    console.log('\n--- STAGE 5: Provider Search & Booking Gate Zero-Touch ---');
    const turn6 = await triggerVoiceAndWait('அடுத்த technician காட்டு');
    await sleep(200);
    recordResult(
      turn6?.action?.type === 'SHOW_NEXT_TECHNICIAN',
      'Voice navigates next technician in list hands-free',
      `Action: ${turn6?.action?.type}`
    );

    const turn7 = await triggerVoiceAndWait('இவரோட details சொல்லு');
    await sleep(200);
    recordResult(
      turn7?.action?.type === 'DESCRIBE_SELECTED_TECHNICIAN' && !/[\u0900-\u097F]/.test(turn7?.responseText || ''),
      'Voice describes pro details with 0% Hindi characters',
      `Action: ${turn7?.action?.type}, Response: ${turn7?.responseText}`
    );

    const turn8 = await triggerVoiceAndWait('இந்த technician-ஐ book பண்ணு');
    await sleep(200);
    const needsConfirm = await evaluate(`Boolean(window.__getStatusInfo()?.state === 'CONFIRMATION_REQUIRED' || window.__getStatusInfo()?.state === 'CONFIRMATION' || window.__getStatusInfo()?.state === 'AWAITING_CONFIRMATION')`);
    recordResult(
      needsConfirm && turn8?.action?.type === 'CONFIRM_BOOKING',
      'Voice book command triggers confirmation gate and requests verbal authorization',
      `State: ${needsConfirm}, Action: ${turn8?.action?.type}`
    );

    // Confirm verbally
    const _turn9 = await triggerVoiceAndWait('ஆமா');
    await sleep(300);
    const p9 = await evaluate(`window.location.pathname`);
    recordResult(
      p9.startsWith('/customer/book') || p9 === '/customer/book',
      'Verbal "ஆமா" confirms booking and hands-free routes to /customer/book/...',
      `Path: ${p9}`
    );

    // -------------------------------------------------------------
    // STAGE 6: Booking Configuration (Modes, Slots, Notes Manipulation)
    // -------------------------------------------------------------
    console.log('\n--- STAGE 6: Booking Flow Zero-Touch Form Filling ---');
    if (!p9.startsWith('/customer/book')) {
      await evaluate(`window.__navigate('/customer/book/prov_senthil')`);
      await sleep(200);
    }

    // A. Direct Service Mode
    const turn10 = await triggerVoiceAndWait('நேரடி சேவை');
    await sleep(200);
    recordResult(
      turn10?.action?.type === 'SELECT_DIRECT_SERVICE_MODE',
      'Voice selects Direct Service Mode (₹0 upfront diagnosis fee)',
      `Action: ${turn10?.action?.type}`
    );

    // B. Diagnosis Mode
    const turn11 = await triggerVoiceAndWait('diagnosis mode');
    await sleep(200);
    recordResult(
      turn11?.action?.type === 'SELECT_DIAGNOSIS_MODE',
      'Voice selects Diagnosis Mode (₹149 diagnosis fee)',
      `Action: ${turn11?.action?.type}`
    );

    // C. Slot Selection
    const turn12 = await triggerVoiceAndWait('நாளைக்கு மாலை 6 மணிக்கு');
    await sleep(200);
    recordResult(
      turn12?.action?.type === 'SELECT_BOOKING_SLOT' && turn12?.action?.payload?.slot === 'Tomorrow · 6:00 PM',
      'Voice selects preferred appointment slot "Tomorrow · 6:00 PM"',
      `Action: ${turn12?.action?.type}, Slot: ${turn12?.action?.payload?.slot}`
    );

    // D. Notes Setting & Appending
    const _turn13 = await triggerVoiceAndWait('AC cooling வரல');
    await sleep(200);
    const turn14 = await triggerVoiceAndWait('சத்தமும் வருது');
    await sleep(200);
    recordResult(
      turn14?.action?.type === 'APPEND_PROBLEM_DESCRIPTION',
      'Voice appends follow-up observation to problem notes',
      `Action: ${turn14?.action?.type}`
    );

    // E. Notes Removal & Clearing
    const turn15 = await triggerVoiceAndWait('கடைசி வரியை நீக்கு');
    await sleep(200);
    recordResult(
      turn15?.action?.type === 'REMOVE_LAST_SENTENCE',
      'Voice removes last sentence from notes hands-free',
      `Action: ${turn15?.action?.type}`
    );

    const turn16 = await triggerVoiceAndWait('clear notes');
    await sleep(200);
    recordResult(
      turn16?.action?.type === 'CLEAR_PROBLEM_DESCRIPTION',
      'Voice clears notes completely hands-free',
      `Action: ${turn16?.action?.type}`
    );

    // F. Confirm Booking
    const _turn17 = await triggerVoiceAndWait('book பண்ணு');
    await sleep(200);
    const _turn18 = await triggerVoiceAndWait('ஆமா');
    await sleep(400);
    const p18 = await evaluate(`window.location.pathname`);
    recordResult(
      p18.startsWith('/customer/booking-confirmation'),
      'Verbal confirmation successfully submits booking and navigates to booking confirmation',
      `Path: ${p18}`
    );

    // -------------------------------------------------------------
    // STAGE 7: Payment Verbal Authorization Hands-Free
    // -------------------------------------------------------------
    console.log('\n--- STAGE 7: Payment Verbal Authorization Hands-Free ---');
    await evaluate(`window.__navigate('/customer/payment/bk_01')`);
    await sleep(300);

    const turn19 = await triggerVoiceAndWait('Test UPI');
    await sleep(200);
    recordResult(
      turn19?.action?.type === 'SELECT_PAYMENT_METHOD' && turn19?.action?.payload?.method === 'UPI',
      'Voice selects Test UPI payment method hands-free',
      `Action: ${turn19?.action?.type}, Method: ${turn19?.action?.payload?.method}`
    );

    const turn20 = await triggerVoiceAndWait('pay 149');
    await sleep(200);
    const payStateGated = await evaluate(`Boolean(window.__getStatusInfo()?.state === 'CONFIRMATION_REQUIRED' || window.__getStatusInfo()?.state === 'CONFIRMATION')`);
    recordResult(
      turn20?.action?.type === 'CONFIRM_PAYMENT' && (turn20?.requiresConfirmation === true || payStateGated),
      'Voice initiates payment and triggers verbal authorization gate',
      `Action: ${turn20?.action?.type}, RequiresConfirm: ${turn20?.requiresConfirmation}, Gated: ${payStateGated}`
    );

    const turn21 = await triggerVoiceAndWait('ஆமா');
    await sleep(400);
    recordResult(
      turn21?.action?.type === 'CONFIRM_PAYMENT',
      'Verbal "ஆமா" authorizes payment transaction hands-free',
      `Action: ${turn21?.action?.type}`
    );

    // -------------------------------------------------------------
    // STAGE 8: Bookings Navigation & Tab Switching
    // -------------------------------------------------------------
    console.log('\n--- STAGE 8: Bookings Tabs Navigation Hands-Free ---');
    await evaluate(`window.__navigate('/customer/bookings')`);
    await sleep(200);

    const turn22 = await triggerVoiceAndWait('past bookings');
    await sleep(200);
    recordResult(
      turn22?.action?.type === 'SWITCH_TAB' && turn22?.action?.payload?.tab === 'past',
      'Voice switches tab to "past bookings" hands-free',
      `Action: ${turn22?.action?.type}, Tab: ${turn22?.action?.payload?.tab}`
    );

    const turn23 = await triggerVoiceAndWait('active requests');
    await sleep(200);
    recordResult(
      turn23?.action?.type === 'SWITCH_TAB' && turn23?.action?.payload?.tab === 'active',
      'Voice switches tab to "active requests" hands-free',
      `Action: ${turn23?.action?.type}, Tab: ${turn23?.action?.payload?.tab}`
    );

    // -------------------------------------------------------------
    // STAGE 9: Technician Persona Full Flow Hands-Free
    // -------------------------------------------------------------
    console.log('\n--- STAGE 9: Technician Persona Hands-Free ---');
    const turn24 = await triggerVoiceAndWait('technician mode-ku po');
    await sleep(300);
    const p24 = await evaluate(`window.location.pathname`);
    recordResult(
      p24 === '/technician' && turn24?.action?.type === 'SWITCH_ROLE_TECHNICIAN',
      'Voice switches persona to technician mode hands-free',
      `Path: ${p24}, Action: ${turn24?.action?.type}`
    );

    const turn25 = await triggerVoiceAndWait('வருமானம் பாரு');
    await sleep(200);
    const p25 = await evaluate(`window.location.pathname`);
    recordResult(
      p25 === '/technician/earnings' && turn25?.action?.type === 'NAVIGATE_EARNINGS',
      'Voice navigates technician to earnings dashboard',
      `Path: ${p25}, Action: ${turn25?.action?.type}`
    );

    const turn26 = await triggerVoiceAndWait('weekly pass activate பண்ணு');
    await sleep(200);
    recordResult(
      turn26?.action?.type === 'ACTIVATE_WEEKLY_PASS' && turn26?.action?.payload?.price === 599,
      'Voice activates Weekly Pass at mandatory ₹599 without price alteration',
      `Action: ${turn26?.action?.type}, Price: ₹${turn26?.action?.payload?.price}`
    );

    const turn27 = await triggerVoiceAndWait('jobs kaatu');
    await sleep(200);
    const p27 = await evaluate(`window.location.pathname`);
    recordResult(
      p27 === '/technician/jobs' && turn27?.action?.type === 'NAVIGATE_JOBS',
      'Voice navigates technician to jobs list',
      `Path: ${p27}, Action: ${turn27?.action?.type}`
    );

    const turn28 = await triggerVoiceAndWait('naan vandhuten');
    await sleep(200);
    recordResult(
      turn28?.action?.type === 'MARK_ARRIVED',
      'Voice marks technician arrived at doorstep',
      `Action: ${turn28?.action?.type}`
    );

    const turn29 = await triggerVoiceAndWait('velaya start pannalam');
    await sleep(200);
    recordResult(
      turn29?.action?.type === 'START_WORK',
      'Voice starts job work hands-free',
      `Action: ${turn29?.action?.type}`
    );

    const turn30 = await triggerVoiceAndWait('வேலை முடிந்தது');
    await sleep(200);
    recordResult(
      turn30?.action?.type === 'COMPLETE_JOB',
      'Voice completes job hands-free',
      `Action: ${turn30?.action?.type}`
    );

    const turn31 = await triggerVoiceAndWait('offline போ');
    await sleep(200);
    recordResult(
      turn31?.action?.type === 'GO_OFFLINE',
      'Voice sets technician availability to offline',
      `Action: ${turn31?.action?.type}`
    );

    const turn32 = await triggerVoiceAndWait('logout');
    await sleep(300);
    const p32 = await evaluate(`window.location.pathname`);
    recordResult(
      p32 === '/login' && turn32?.action?.type === 'LOGOUT',
      'Voice logs out user and returns to /login',
      `Path: ${p32}, Action: ${turn32?.action?.type}`
    );

    // -------------------------------------------------------------
    // STAGE 10: Strict Zero-Touch Validation
    // -------------------------------------------------------------
    console.log('\n--- STAGE 10: Strict Zero-Touch Validation ---');
    const touchCount = await evaluate(`window.__touchEventCount`);
    const clickCount = await evaluate(`window.__clickEventCount`);
    recordResult(
      touchCount === 0 && clickCount === 0,
      'ZERO physical touch/click events registered across the entire test session (100% Hands-Free)',
      `Touches: ${touchCount}, Clicks: ${clickCount}`
    );

  } finally {
    ws.close();
    chromeProc.kill();
    await viteServer.close();
    if (fs.existsSync(TEMP_PROFILE)) {
      try {
        fs.rmSync(TEMP_PROFILE, { recursive: true, force: true });
      } catch {}
    }
  }

  console.log('\n================================================================');
  console.log(`ZERO-TOUCH RUNTIME RESULTS: ${passed} / ${total} SCENARIOS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runZeroTouchVerification().catch((err) => {
  console.error('[FATAL] Zero-touch verification failed:', err);
  process.exit(1);
});

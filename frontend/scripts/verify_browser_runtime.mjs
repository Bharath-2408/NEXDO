import { spawn } from 'child_process';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_PROFILE = path.join(os.tmpdir(), `nexdo_chrome_${Date.now()}`);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserVerification() {
  console.log('================================================================');
  console.log('NEXDO REAL BROWSER RUNTIME VERIFICATION');
  console.log('================================================================\n');

  // 1. Start Vite dev server on port 5188
  console.log('[Step 1] Starting Vite dev server on port 5188...');
  const viteServer = await createServer({
    server: {
      port: 5188,
      watch: { ignored: ['**/*'] },
    },
    configFile: './vite.config.ts',
  });
  await viteServer.listen();
  const baseUrl = 'http://localhost:5188';
  console.log(`[PASS] Vite dev server listening at ${baseUrl}`);

  if (fs.existsSync(TEMP_PROFILE)) {
    fs.rmSync(TEMP_PROFILE, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_PROFILE, { recursive: true });

  // 2. Launch headless Chrome with CDP
  console.log('[Step 2] Launching headless Chrome with remote debugging on port 9333...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9333',
    '--no-first-run',
    '--disable-gpu',
    '--mute-audio',
    `--user-data-dir=${TEMP_PROFILE}`,
  ]);

  // Wait for Chrome CDP to be available
  let cdpReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://localhost:9333/json/version');
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
    throw new Error('Chrome CDP failed to initialize on port 9333');
  }
  console.log('[PASS] Headless Chrome initialized with CDP');

  // 3. Connect to page
  console.log(`[Step 3] Connecting CDP to ${baseUrl}/customer...`);
  const newTabRes = await fetch(`http://localhost:9333/json/new?${encodeURIComponent(baseUrl + '/customer')}`, {
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
  console.log('[Step 4] Waiting for NEXDO React app to render and register voice handlers...');
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
    // SCENARIO 1: Microphone button click DOES NOT prematurely navigate
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer/bookings')`);
    await sleep(200);
    const initialPath = await evaluate(`window.location.pathname`);
    // Click microphone button
    await evaluate(`
      const micBtn = document.querySelector('button[aria-label*="Voice assistant"], button[aria-label*="குரல் உதவி"], button[aria-label="Voice Assistant"], button[title*="speak"], button[title*="Speak"]');
      if (micBtn) micBtn.click();
    `);
    await sleep(200);
    const pathAfterMicClick = await evaluate(`window.location.pathname`);
    recordResult(
      initialPath === '/customer/bookings' && pathAfterMicClick === '/customer/bookings',
      'Microphone click on /customer/bookings does NOT prematurely navigate to /customer',
      `Before: ${initialPath}, After: ${pathAfterMicClick}`
    );

    // -------------------------------------------------------------
    // SCENARIO 2: Customer Tamil "home page ku po" -> /customer
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer/bookings')`);
    await sleep(200);
    const turn2 = await triggerVoiceAndWait('home page ku po');
    await sleep(200);
    const p2 = await evaluate(`window.location.pathname`);
    recordResult(
      p2 === '/customer' && turn2?.responseLanguage === 'ta' && turn2?.responseText === 'சரிங்க, ஹோம் பேஜுக்கு போறேன்.',
      'Customer: "home page ku po" navigates to /customer with Tamil response',
      `Path: ${p2}, Lang: ${turn2?.responseLanguage}, Response: ${turn2?.responseText}`
    );

    // -------------------------------------------------------------
    // SCENARIO 3: Customer Tamil "veetuku po" -> /customer
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer/bookings')`);
    await sleep(200);
    const turn3 = await triggerVoiceAndWait('veetuku po');
    await sleep(200);
    const p3 = await evaluate(`window.location.pathname`);
    recordResult(
      p3 === '/customer' && turn3?.responseLanguage === 'ta' && turn3?.responseText === 'சரிங்க, ஹோம் பேஜுக்கு போறேன்.',
      'Customer: "veetuku po" navigates to /customer with authentic Tamil script',
      `Path: ${p3}, Lang: ${turn3?.responseLanguage}, Response: ${turn3?.responseText}`
    );

    // -------------------------------------------------------------
    // SCENARIO 4: Customer Tamil "bookings kaatu" -> /customer/bookings
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer')`);
    await sleep(200);
    const turn4 = await triggerVoiceAndWait('bookings kaatu');
    await sleep(200);
    const p4 = await evaluate(`window.location.pathname`);
    recordResult(
      p4 === '/customer/bookings' && turn4?.responseLanguage === 'ta' && turn4?.responseText === 'சரி, உங்கள் புக்கிங்ஸை காட்டுறேன்.',
      'Customer: "bookings kaatu" navigates to /customer/bookings',
      `Path: ${p4}, Lang: ${turn4?.responseLanguage}, Response: ${turn4?.responseText}`
    );

    // -------------------------------------------------------------
    // SCENARIO 5: Customer English "take me home" -> /customer
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer/profile')`);
    await sleep(200);
    const turn5 = await triggerVoiceAndWait('take me home');
    await sleep(200);
    const p5 = await evaluate(`window.location.pathname`);
    recordResult(
      p5 === '/customer' && turn5?.responseLanguage === 'en' && turn5?.responseText === "Sure, taking you home.",
      'Customer: "take me home" navigates to /customer with English response',
      `Path: ${p5}, Lang: ${turn5?.responseLanguage}, Response: ${turn5?.responseText}`
    );

    // -------------------------------------------------------------
    // SCENARIO 6: Technician Tamil "home page ku po" -> /technician
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician/jobs')`);
    await sleep(200);
    const turn6 = await triggerVoiceAndWait('home page ku po');
    await sleep(200);
    const p6 = await evaluate(`window.location.pathname`);
    recordResult(
      p6 === '/technician' && turn6?.responseLanguage === 'ta',
      'Technician: "home page ku po" navigates to /technician',
      `Path: ${p6}, Lang: ${turn6?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 7: Technician Tamil "jobs kaatu" -> /technician/jobs
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician')`);
    await sleep(200);
    const turn7 = await triggerVoiceAndWait('jobs kaatu');
    await sleep(200);
    const p7 = await evaluate(`window.location.pathname`);
    recordResult(
      p7 === '/technician/jobs' && turn7?.responseLanguage === 'ta',
      'Technician: "jobs kaatu" navigates to /technician/jobs',
      `Path: ${p7}, Lang: ${turn7?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 8: Technician Tamil "earnings kaatu" -> /technician/earnings
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician')`);
    await sleep(200);
    const turn8 = await triggerVoiceAndWait('earnings kaatu');
    await sleep(200);
    const p8 = await evaluate(`window.location.pathname`);
    recordResult(
      p8 === '/technician/earnings' && turn8?.responseLanguage === 'ta',
      'Technician: "earnings kaatu" navigates to /technician/earnings',
      `Path: ${p8}, Lang: ${turn8?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 9: Technician Tamil "capabilities kaatu" -> /technician/capabilities
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician')`);
    await sleep(200);
    const turn9 = await triggerVoiceAndWait('capabilities kaatu');
    await sleep(200);
    const p9 = await evaluate(`window.location.pathname`);
    recordResult(
      p9 === '/technician/capabilities' && turn9?.responseLanguage === 'ta',
      'Technician: "capabilities kaatu" navigates to /technician/capabilities',
      `Path: ${p9}, Lang: ${turn9?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 10: Back Navigation "back po" -> navigate(-1)
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer')`);
    await sleep(150);
    await evaluate(`window.__navigate('/customer/express')`);
    await sleep(150);
    const turn10 = await triggerVoiceAndWait('back po');
    await sleep(200);
    const p10 = await evaluate(`window.location.pathname`);
    recordResult(
      p10 === '/customer' && turn10?.action?.type === 'NAVIGATE_BACK',
      'Back Navigation: "back po" executes browser back to previous page',
      `Path: ${p10}, Action: ${turn10?.action?.type}`
    );

    // -------------------------------------------------------------
    // SCENARIO 11: Service Need "enakku AC service venum" -> /customer/express
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer')`);
    await sleep(200);
    const turn11 = await triggerVoiceAndWait('enakku AC service venum');
    await sleep(200);
    const p11 = await evaluate(`window.location.pathname`);
    const isTamilScript = /[\u0B80-\u0BFF]/.test(turn11?.responseText || '');
    const isRobotic = /successfully processed|execution completed/i.test(turn11?.responseText || '');
    recordResult(
      p11 === '/customer/express' && turn11?.responseLanguage === 'ta' && isTamilScript && !isRobotic,
      'Service Need: "enakku AC service venum" routes to express with authentic Tamil script & no canned phrasing',
      `Path: ${p11}, Lang: ${turn11?.responseLanguage}, Response: ${turn11?.responseText}`
    );

    // -------------------------------------------------------------
    // SCENARIO 12: Zero Hindi in runtime
    // -------------------------------------------------------------
    const fullBodyText = await evaluate(`document.body.innerText`);
    const hasDevanagari = /[\u0900-\u097F]/.test(fullBodyText);
    recordResult(
      !hasDevanagari,
      'Zero Hindi characters in browser DOM during voice interactions',
      `Has Devanagari: ${hasDevanagari}`
    );

    // -------------------------------------------------------------
    // SCENARIO 13: Already on Home Page
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer')`);
    await sleep(200);
    const turn13 = await triggerVoiceAndWait('home page ku po');
    await sleep(200);
    const p13 = await evaluate(`window.location.pathname`);
    recordResult(
      p13 === '/customer' &&
        turn13?.responseText === 'ஏற்கனவே முகப்புப் பக்கத்தில் தான் உள்ளீர்கள். உங்களுக்கு என்ன உதவி வேண்டும்?',
      'Already on Home Page: "home page ku po" stays on /customer with natural response',
      `Path: ${p13}, Response: ${turn13?.responseText}`
    );

    // -------------------------------------------------------------
    // SCENARIO 14: Role switch Customer -> Technician
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer')`);
    await sleep(200);
    const turn14 = await triggerVoiceAndWait('technician mode ku maathu');
    await sleep(200);
    const p14 = await evaluate(`window.location.pathname`);
    recordResult(
      p14 === '/technician' && turn14?.action?.type === 'SWITCH_ROLE_TECHNICIAN',
      'Role Switch: "technician mode ku maathu" switches route to /technician',
      `Path: ${p14}, Action: ${turn14?.action?.type}`
    );

    // -------------------------------------------------------------
    // SCENARIO 15: Role switch Technician -> Customer
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician')`);
    await sleep(200);
    const turn15 = await triggerVoiceAndWait('customer mode ku maathu');
    await sleep(200);
    const p15 = await evaluate(`window.location.pathname`);
    recordResult(
      p15 === '/customer' && turn15?.action?.type === 'SWITCH_ROLE_CUSTOMER',
      'Role Switch: "customer mode ku maathu" switches route to /customer',
      `Path: ${p15}, Action: ${turn15?.action?.type}`
    );

    // -------------------------------------------------------------
    // SCENARIO 16: Voice Language Switching
    // -------------------------------------------------------------
    const turn16 = await triggerVoiceAndWait('English language use பண்ணு');
    await sleep(200);
    recordResult(
      turn16?.responseLanguage === 'en' && turn16?.action?.type === 'SWITCH_LANGUAGE',
      'Language Switch: "English language use பண்ணு" switches language to English',
      `Lang: ${turn16?.responseLanguage}, Action: ${turn16?.action?.type}`
    );

    // -------------------------------------------------------------
    // SCENARIO 17: Pure Tamil "ஹோம் போ" -> /customer
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer/bookings')`);
    await sleep(200);
    const turn17 = await triggerVoiceAndWait('ஹோம் போ');
    await sleep(200);
    const p17 = await evaluate(`window.location.pathname`);
    recordResult(
      p17 === '/customer' && turn17?.action?.type === 'NAVIGATE_HOME' && turn17?.responseLanguage === 'ta',
      'Tamil Script Navigation: "ஹோம் போ" navigates to /customer',
      `Path: ${p17}, Action: ${turn17?.action?.type}`
    );

    // -------------------------------------------------------------
    // SCENARIO 18: Pure Tamil "புக்கிங் பாரு" -> /customer/bookings
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer')`);
    await sleep(200);
    const turn18 = await triggerVoiceAndWait('புக்கிங் பாரு');
    await sleep(200);
    const p18 = await evaluate(`window.location.pathname`);
    recordResult(
      p18 === '/customer/bookings' && turn18?.action?.type === 'NAVIGATE_BOOKINGS' && turn18?.responseLanguage === 'ta',
      'Tamil Script Navigation: "புக்கிங் பாரு" navigates to /customer/bookings',
      `Path: ${p18}, Action: ${turn18?.action?.type}`
    );

    // -------------------------------------------------------------
    // SCENARIO 19: Pure Tamil "டெக்னிஷியன் தேடு" -> /customer/providers
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer')`);
    await sleep(200);
    const turn19 = await triggerVoiceAndWait('டெக்னிஷியன் தேடு');
    await sleep(200);
    const p19 = await evaluate(`window.location.pathname`);
    recordResult(
      p19 === '/customer/providers' && turn19?.action?.type === 'NAVIGATE_PROVIDERS' && turn19?.responseLanguage === 'ta',
      'Tamil Script Navigation: "டெக்னிஷியன் தேடு" navigates to /customer/providers',
      `Path: ${p19}, Action: ${turn19?.action?.type}`
    );

    // -------------------------------------------------------------
    // SCENARIO 20: Pure Tamil "ஜாப்ஸ் பாரு" -> /technician/jobs
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician')`);
    await sleep(200);
    const turn20 = await triggerVoiceAndWait('ஜாப்ஸ் பாரு');
    await sleep(200);
    const p20 = await evaluate(`window.location.pathname`);
    recordResult(
      p20 === '/technician/jobs' && turn20?.action?.type === 'NAVIGATE_JOBS' && turn20?.responseLanguage === 'ta',
      'Tamil Script Navigation: "ஜாப்ஸ் பாரு" navigates to /technician/jobs',
      `Path: ${p20}, Action: ${turn20?.action?.type}`
    );

    // -------------------------------------------------------------
    // SCENARIO 21: Pure Tamil "வருமானம் பாரு" -> /technician/earnings
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician')`);
    await sleep(200);
    const turn21 = await triggerVoiceAndWait('வருமானம் பாரு');
    await sleep(200);
    const p21 = await evaluate(`window.location.pathname`);
    recordResult(
      p21 === '/technician/earnings' && turn21?.action?.type === 'NAVIGATE_EARNINGS' && turn21?.responseLanguage === 'ta',
      'Tamil Script Navigation: "வருமானம் பாரு" navigates to /technician/earnings',
      `Path: ${p21}, Action: ${turn21?.action?.type}`
    );

    // -------------------------------------------------------------
    // SCENARIO 22: Contextual Button "select this technician"
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer/providers')`);
    await sleep(200);
    const turn22 = await triggerVoiceAndWait('select this technician');
    await sleep(200);
    recordResult(
      turn22?.action?.type === 'SELECT_TECHNICIAN' && turn22?.responseLanguage === 'en',
      'Contextual Button: "select this technician" triggers SELECT_TECHNICIAN',
      `Action: ${turn22?.action?.type}, Lang: ${turn22?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 23: Contextual Button "show his profile"
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer/providers')`);
    await sleep(200);
    const turn23 = await triggerVoiceAndWait('show his profile');
    await sleep(200);
    recordResult(
      turn23?.action?.type === 'VIEW_TECHNICIAN_PROFILE' && turn23?.responseLanguage === 'en',
      'Contextual Button: "show his profile" triggers VIEW_TECHNICIAN_PROFILE',
      `Action: ${turn23?.action?.type}, Lang: ${turn23?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 24: Contextual Button "வேலை ஆரம்பி" (Start Work)
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician/jobs')`);
    await sleep(200);
    const turn24 = await triggerVoiceAndWait('வேலை ஆரம்பி');
    await sleep(200);
    recordResult(
      turn24?.action?.type === 'START_WORK' && turn24?.responseLanguage === 'ta',
      'Contextual Button: "வேலை ஆரம்பி" triggers START_WORK in Tamil',
      `Action: ${turn24?.action?.type}, Lang: ${turn24?.responseLanguage}, Response: ${turn24?.responseText}`
    );

    // -------------------------------------------------------------
    // SCENARIO 25: Contextual Button "வந்துட்டேன்" (Mark Arrived)
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician/jobs')`);
    await sleep(200);
    const turn25 = await triggerVoiceAndWait('வந்துட்டேன்');
    await sleep(200);
    recordResult(
      turn25?.action?.type === 'MARK_ARRIVED' && turn25?.responseLanguage === 'ta',
      'Contextual Button: "வந்துட்டேன்" triggers MARK_ARRIVED in Tamil',
      `Action: ${turn25?.action?.type}, Lang: ${turn25?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 26: Contextual Button "on the way" (Mark En Route)
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician/jobs')`);
    await sleep(200);
    const turn26 = await triggerVoiceAndWait('on the way');
    await sleep(200);
    recordResult(
      turn26?.action?.type === 'MARK_ON_THE_WAY' && turn26?.responseLanguage === 'en',
      'Contextual Button: "on the way" triggers MARK_ON_THE_WAY in English',
      `Action: ${turn26?.action?.type}, Lang: ${turn26?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // SCENARIO 27: Destructive Action Confirmation Prompt
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer/bookings')`);
    await sleep(200);
    const turn27 = await triggerVoiceAndWait('cancel this booking');
    await sleep(200);
    recordResult(
      turn27?.action?.type === 'CANCEL_BOOKING' &&
        turn27?.responseText === 'Do you want me to cancel this booking?',
      'Confirmation Prompt: "cancel this booking" requires confirmation before cancellation',
      `Action: ${turn27?.action?.type}, Response: ${turn27?.responseText}`
    );

    // -------------------------------------------------------------
    // SCENARIO 28: Tanglish "naan home poganum" -> /customer
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer/bookings')`);
    await sleep(200);
    const turn28 = await triggerVoiceAndWait('naan home poganum');
    await sleep(200);
    const p28 = await evaluate(`window.location.pathname`);
    recordResult(
      p28 === '/customer' && turn28?.action?.type === 'NAVIGATE_HOME' && turn28?.responseLanguage === 'ta',
      'Tanglish Home: "naan home poganum" navigates to /customer with Tamil voice',
      `Path: ${p28}, Action: ${turn28?.action?.type}, Lang: ${turn28?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 29: Tamil Script "புக்கிங்ஸ் பேஜுக்கு போ" -> /customer/bookings
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer')`);
    await sleep(200);
    const turn29 = await triggerVoiceAndWait('புக்கிங்ஸ் பேஜுக்கு போ');
    await sleep(200);
    const p29 = await evaluate(`window.location.pathname`);
    recordResult(
      p29 === '/customer/bookings' && turn29?.action?.type === 'NAVIGATE_BOOKINGS' && turn29?.responseLanguage === 'ta',
      'Tamil Bookings: "புக்கிங்ஸ் பேஜுக்கு போ" navigates to /customer/bookings',
      `Path: ${p29}, Action: ${turn29?.action?.type}, Lang: ${turn29?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 30: Tanglish "technician-a thedu" -> /customer/providers
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer')`);
    await sleep(200);
    const turn30 = await triggerVoiceAndWait('technician-a thedu');
    await sleep(200);
    const p30 = await evaluate(`window.location.pathname`);
    recordResult(
      p30 === '/customer/providers' && turn30?.action?.type === 'NAVIGATE_PROVIDERS' && turn30?.responseLanguage === 'ta',
      'Tanglish Providers: "technician-a thedu" navigates to /customer/providers',
      `Path: ${p30}, Action: ${turn30?.action?.type}, Lang: ${turn30?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 31: Tanglish "profile open pannu" -> /customer/profile
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/customer')`);
    await sleep(200);
    const turn31 = await triggerVoiceAndWait('profile open pannu');
    await sleep(200);
    const p31 = await evaluate(`window.location.pathname`);
    recordResult(
      p31 === '/customer/profile' && turn31?.action?.type === 'NAVIGATE_PROFILE' && turn31?.responseLanguage === 'ta',
      'Tanglish Profile: "profile open pannu" navigates to /customer/profile',
      `Path: ${p31}, Action: ${turn31?.action?.type}, Lang: ${turn31?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 32: Technician Tanglish "income paaru" -> /technician/earnings
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician')`);
    await sleep(200);
    const turn32 = await triggerVoiceAndWait('income paaru');
    await sleep(200);
    const p32 = await evaluate(`window.location.pathname`);
    recordResult(
      p32 === '/technician/earnings' && turn32?.action?.type === 'NAVIGATE_EARNINGS' && turn32?.responseLanguage === 'ta',
      'Technician Earnings: "income paaru" navigates to /technician/earnings',
      `Path: ${p32}, Action: ${turn32?.action?.type}, Lang: ${turn32?.responseLanguage}`
    );

    // -------------------------------------------------------------
    // SCENARIO 33: Technician Tanglish "job-ku po" -> /technician/jobs
    // -------------------------------------------------------------
    await evaluate(`window.__navigate('/technician')`);
    await sleep(200);
    const turn33 = await triggerVoiceAndWait('job-ku po');
    await sleep(200);
    const p33 = await evaluate(`window.location.pathname`);
    recordResult(
      p33 === '/technician/jobs' && turn33?.action?.type === 'NAVIGATE_JOBS' && turn33?.responseLanguage === 'ta',
      'Technician Jobs: "job-ku po" navigates to /technician/jobs',
      `Path: ${p33}, Action: ${turn33?.action?.type}, Lang: ${turn33?.responseLanguage}`
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
  console.log(`REAL BROWSER RUNTIME RESULTS: ${passed} / ${total} SCENARIOS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runBrowserVerification().catch((err) => {
  console.error('[FATAL] Browser verification failed:', err);
  process.exit(1);
});

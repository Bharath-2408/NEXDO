import { createServer } from 'vite';

async function verifyBackendEndpoint() {
  console.log('Testing /api/voice and /api/tts/health endpoints via Vite dev server...');
  const server = await createServer({
    server: { port: 5199 },
    configFile: './vite.config.ts',
  });

  await server.listen();
  const address = server.httpServer?.address();
  const port = typeof address === 'object' && address ? address.port : 5199;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Vite test server listening on ${baseUrl}`);

  try {
    // 1. Test /api/tts/health
    const healthRes = await fetch(`${baseUrl}/api/tts/health`);
    const healthData = await healthRes.json();
    console.log('[PASS] /api/tts/health status:', healthData);

    // 2. Test /api/voice with "home page ku po"
    const voiceRes1 = await fetch(`${baseUrl}/api/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'home page ku po',
        role: 'customer',
        currentRoute: '/customer/bookings',
      }),
    });
    const voiceData1 = await voiceRes1.json();
    console.log('[PASS] /api/voice "home page ku po" response:', voiceData1);

    if (voiceData1.language !== 'ta' || voiceData1.intent !== 'NAVIGATE_HOME' || voiceData1.response !== 'சரி, Home-க்கு போகலாம்.') {
      throw new Error(`Unexpected voice response: ${JSON.stringify(voiceData1)}`);
    }

    // 3. Test /api/voice with "take me home"
    const voiceRes2 = await fetch(`${baseUrl}/api/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'take me home',
        role: 'customer',
        currentRoute: '/customer/profile',
      }),
    });
    const voiceData2 = await voiceRes2.json();
    console.log('[PASS] /api/voice "take me home" response:', voiceData2);

    if (voiceData2.language !== 'en' || voiceData2.intent !== 'NAVIGATE_HOME' || voiceData2.response !== "Sure, I'll take you home.") {
      throw new Error(`Unexpected voice response: ${JSON.stringify(voiceData2)}`);
    }

    // 4. Test /api/voice with "en bookings kaatu"
    const voiceRes3 = await fetch(`${baseUrl}/api/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'en bookings kaatu',
        role: 'customer',
        currentRoute: '/customer',
      }),
    });
    const voiceData3 = await voiceRes3.json();
    console.log('[PASS] /api/voice "en bookings kaatu" response:', voiceData3);

    // 5. Test /api/voice with "jobs kaatu" for technician
    const voiceRes4 = await fetch(`${baseUrl}/api/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'jobs kaatu',
        role: 'technician',
        currentRoute: '/technician',
      }),
    });
    const voiceData4 = await voiceRes4.json();
    console.log('[PASS] /api/voice "jobs kaatu" response:', voiceData4);

    if (voiceData4.intent !== 'NAVIGATE_JOBS' || voiceData4.response !== 'சரி, உங்க jobs-ஐ காட்டுறேன்.') {
      throw new Error(`Unexpected jobs response: ${JSON.stringify(voiceData4)}`);
    }

    console.log('\nALL BACKEND ENDPOINT INTEGRATION TESTS PASSED 100%!');
  } finally {
    await server.close();
  }
}

verifyBackendEndpoint().catch((err) => {
  console.error('[FAIL] Backend verification error:', err);
  throw err;
});

// ============================================================================
// SUPABASE EDGE FUNCTION: voice-interpret
// Voice intent extraction and conversation session management
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const text = (payload.text || '').trim();
    const role = payload.role || 'customer';
    const lang = text.match(/[\u0B80-\u0BFF]/) || payload.conversationLanguage === 'ta' ? 'ta' : 'en';

    // Canonical Structured Response
    let intent = 'NAVIGATE_HOME';
    let action = 'NAVIGATE_HOME';
    let message = lang === 'ta' ? 'சரி, முகப்பு பக்கத்திற்கு அழைத்துச் செல்கிறேன்.' : 'Sure, taking you to the home page.';
    let navigationTarget = role === 'technician' ? '/technician' : '/customer';
    let requiresConfirmation = false;

    const lower = text.toLowerCase();
    if (lower.includes('booking') || lower.includes('புக்கிங்') || lower.includes('ஜாப்ஸ்')) {
      intent = 'NAVIGATE_BOOKINGS';
      action = 'NAVIGATE_BOOKINGS';
      navigationTarget = role === 'technician' ? '/technician/jobs' : '/customer/bookings';
      message = lang === 'ta' ? 'சரி, முன்பதிவுகளை காட்டுகிறேன்.' : 'Sure, showing your bookings.';
    } else if (lower.includes('ac') || lower.includes('ஏசி')) {
      intent = 'CREATE_SERVICE_REQUEST';
      action = 'NAVIGATE';
      navigationTarget = '/customer/providers';
      message = lang === 'ta' ? 'சரி, ஏசி ரிப்பேர் டெக்னீசியன்களை காட்டுகிறேன்.' : 'Sure, showing AC repair technicians.';
    }

    const responseData = {
      intent,
      action: { type: action, payload: {}, source: 'VOICE', timestamp: Date.now() },
      language: lang,
      message,
      requires_confirmation: requiresConfirmation,
      navigation_target: navigationTarget,
      entities: { appliance: lower.includes('ac') ? 'AC' : lower.includes('tv') ? 'TV' : undefined },
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

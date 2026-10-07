// ============================================================================
// SUPABASE EDGE FUNCTION: service-requests
// Handles service request creation and technician matching
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
    const serviceRequest = {
      id: crypto.randomUUID(),
      service_code: payload.serviceCode || 'AC_REPAIR',
      raw_transcript: payload.rawTranscript || '',
      service_mode: payload.serviceMode || 'DIAGNOSIS',
      status: 'OPEN',
      created_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ serviceRequest }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

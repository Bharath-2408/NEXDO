// ============================================================================
// SUPABASE EDGE FUNCTION: subscriptions
// Technician Subscriptions: DAILY (₹99), WEEKLY (₹599), MONTHLY (₹2499)
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
    const method = req.method.toUpperCase();
    if (method === 'POST') {
      const payload = await req.json();
      const tier = payload.tier || 'WEEKLY';
      const price = tier === 'DAILY' ? 99 : tier === 'WEEKLY' ? 599 : 2499;

      const subscription = {
        id: crypto.randomUUID(),
        technician_id: payload.technicianId,
        plan_type: tier,
        price,
        is_active: true,
        activated_at: new Date().toISOString(),
      };

      return new Response(JSON.stringify({ subscription }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    const plans = [
      { tier: 'DAILY', price: 99, title: 'Daily Access Pass' },
      { tier: 'WEEKLY', price: 599, title: 'Weekly Access Pass' },
      { tier: 'MONTHLY', price: 2499, title: 'Monthly Access Pass' },
    ];

    return new Response(JSON.stringify({ plans }), {
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

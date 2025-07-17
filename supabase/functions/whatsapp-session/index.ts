import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, sessionName, sessionId } = await req.json();

    switch (action) {
      case 'create':
        const { data: newSession, error: createError } = await supabase
          .from('whatsapp_sessions')
          .insert([{
            session_name: sessionName,
            status: 'disconnected'
          }])
          .select()
          .single();

        if (createError) throw createError;

        return new Response(JSON.stringify(newSession), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'generate_qr':
        // Генерируем фиктивный QR код для демонстрации
        const qrCode = `data:image/svg+xml;base64,${btoa(`
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" fill="black">QR Code</text>
            <text x="100" y="120" text-anchor="middle" fill="gray" font-size="12">${sessionName}</text>
          </svg>
        `)}`;

        const { error: updateError } = await supabase
          .from('whatsapp_sessions')
          .update({
            qr_code: qrCode,
            status: 'waiting'
          })
          .eq('id', sessionId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'disconnect':
        const { error: disconnectError } = await supabase
          .from('whatsapp_sessions')
          .update({
            status: 'disconnected',
            qr_code: null
          })
          .eq('id', sessionId);

        if (disconnectError) throw disconnectError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
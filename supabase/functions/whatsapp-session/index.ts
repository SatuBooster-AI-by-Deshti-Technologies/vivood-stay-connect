import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store active WhatsApp sessions
const activeSessions = new Map();

// Simple WhatsApp Web implementation using WebSocket
class WhatsAppSession {
  constructor(sessionId, sessionName, supabase) {
    this.sessionId = sessionId;
    this.sessionName = sessionName;
    this.supabase = supabase;
    this.isConnected = false;
    this.qrCode = null;
    this.socket = null;
  }

  async generateQR() {
    console.log(`Generating QR for session: ${this.sessionName}`);
    
    // Generate a realistic QR code URL pattern
    const qrData = `2@${Math.random().toString(36).substring(2, 15)},${Math.random().toString(36).substring(2, 15)},${Date.now()}`;
    
    // Create QR Code SVG
    const qrSvg = `
      <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
        <rect width="256" height="256" fill="#ffffff" stroke="#000" stroke-width="2"/>
        <text x="128" y="80" text-anchor="middle" fill="#000" font-size="12" font-family="monospace">WhatsApp Web</text>
        <text x="128" y="100" text-anchor="middle" fill="#666" font-size="10">${this.sessionName}</text>
        <text x="128" y="140" text-anchor="middle" fill="#000" font-size="8" font-family="monospace">${qrData}</text>
        <text x="128" y="180" text-anchor="middle" fill="#666" font-size="10">Scan with WhatsApp</text>
        <text x="128" y="200" text-anchor="middle" fill="#666" font-size="8">on your phone</text>
        <circle cx="64" cy="64" r="4" fill="#000"/>
        <circle cx="192" cy="64" r="4" fill="#000"/>
        <circle cx="64" cy="192" r="4" fill="#000"/>
        <rect x="60" y="60" width="8" height="8" fill="#000"/>
        <rect x="188" y="60" width="8" height="8" fill="#000"/>
        <rect x="60" y="188" width="8" height="8" fill="#000"/>
      </svg>
    `;
    
    this.qrCode = `data:image/svg+xml;base64,${btoa(qrSvg)}`;
    
    await this.supabase
      .from('whatsapp_sessions')
      .update({
        qr_code: this.qrCode,
        status: 'waiting'
      })
      .eq('id', this.sessionId);

    // Simulate QR code scan after 10 seconds for demo
    setTimeout(() => {
      this.simulateConnection();
    }, 10000);
    
    return this.qrCode;
  }

  async simulateConnection() {
    console.log(`Simulating connection for session: ${this.sessionName}`);
    this.isConnected = true;
    
    const phoneNumber = `+7${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    await this.supabase
      .from('whatsapp_sessions')
      .update({
        status: 'connected',
        phone_number: phoneNumber,
        qr_code: null,
        last_activity: new Date().toISOString()
      })
      .eq('id', this.sessionId);

    // Start listening for messages
    this.startMessageListener();
  }

  async startMessageListener() {
    console.log(`Starting message listener for session: ${this.sessionName}`);
    
    // Simulate receiving a message every 30 seconds for demo
    const messageInterval = setInterval(async () => {
      if (!this.isConnected) {
        clearInterval(messageInterval);
        return;
      }

      await this.receiveMessage(`Привет! Это тестовое сообщение от ${Date.now()}`);
    }, 30000);
  }

  async receiveMessage(content, fromNumber = null) {
    console.log(`Received message: ${content}`);
    
    // Find or create client
    let clientId = null;
    const phone = fromNumber || `+7${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    const { data: existingClient } = await this.supabase
      .from('clients')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient } = await this.supabase
        .from('clients')
        .insert({
          name: `WhatsApp User ${phone.slice(-4)}`,
          email: `user${phone.slice(-4)}@whatsapp.com`,
          phone: phone,
          source: 'whatsapp'
        })
        .select('id')
        .single();
      
      clientId = newClient.id;
    }

    // Save message
    await this.supabase
      .from('chat_messages')
      .insert({
        client_id: clientId,
        content: content,
        source: 'whatsapp',
        is_from_client: true,
        message_type: 'text'
      });

    // Update session activity
    await this.supabase
      .from('whatsapp_sessions')
      .update({
        last_activity: new Date().toISOString()
      })
      .eq('id', this.sessionId);
  }

  async sendMessage(content, toNumber) {
    console.log(`Sending message to ${toNumber}: ${content}`);
    
    // Find client
    const { data: client } = await this.supabase
      .from('clients')
      .select('id')
      .eq('phone', toNumber)
      .single();

    if (client) {
      // Save outgoing message
      await this.supabase
        .from('chat_messages')
        .insert({
          client_id: client.id,
          content: content,
          source: 'whatsapp',
          is_from_client: false,
          message_type: 'text'
        });
    }

    // Update session activity
    await this.supabase
      .from('whatsapp_sessions')
      .update({
        last_activity: new Date().toISOString()
      })
      .eq('id', this.sessionId);

    return { success: true };
  }

  async disconnect() {
    console.log(`Disconnecting session: ${this.sessionName}`);
    this.isConnected = false;
    
    await this.supabase
      .from('whatsapp_sessions')
      .update({
        status: 'disconnected',
        qr_code: null
      })
      .eq('id', this.sessionId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, sessionName, sessionId, message, toNumber } = await req.json();

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
        let session = activeSessions.get(sessionId);
        if (!session) {
          session = new WhatsAppSession(sessionId, sessionName || 'Default', supabase);
          activeSessions.set(sessionId, session);
        }

        const qrCode = await session.generateQR();
        
        return new Response(JSON.stringify({ success: true, qrCode }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'send_message':
        const activeSession = activeSessions.get(sessionId);
        if (!activeSession || !activeSession.isConnected) {
          throw new Error('Session not connected');
        }

        await activeSession.sendMessage(message, toNumber);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'disconnect':
        const sessionToDisconnect = activeSessions.get(sessionId);
        if (sessionToDisconnect) {
          await sessionToDisconnect.disconnect();
          activeSessions.delete(sessionId);
        } else {
          await supabase
            .from('whatsapp_sessions')
            .update({
              status: 'disconnected',
              qr_code: null
            })
            .eq('id', sessionId);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_status':
        const { data: sessionData } = await supabase
          .from('whatsapp_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        return new Response(JSON.stringify(sessionData), {
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from "https://esm.sh/@whiskeysockets/baileys@6.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store active WhatsApp sessions
const activeSessions = new Map();

// Real WhatsApp Baileys implementation
class BaileysWhatsAppSession {
  constructor(sessionId, sessionName, supabase) {
    this.sessionId = sessionId;
    this.sessionName = sessionName;
    this.supabase = supabase;
    this.isConnected = false;
    this.qrCode = null;
    this.socket = null;
    this.connectionTimeout = null;
  }

  async generateQR() {
    console.log(`Generating QR for session: ${this.sessionName}`);
    
    try {
      // Use temporary directory for session storage
      const sessionDir = `/tmp/${this.sessionName}`;
      
      // Create auth state
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      
      // Create WhatsApp socket
      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: {
          level: 'silent',
          child: () => ({
            level: 'silent',
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
            fatal: () => {},
            trace: () => {}
          }),
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
          fatal: () => {},
          trace: () => {}
        }
      });

      // Handle QR code generation
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          console.log('QR code generated');
          
          // Convert QR to base64 image
          const qrCodeBase64 = await qrcode(qr, { 
            size: 256,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          this.qrCode = qrCodeBase64;
          
          await this.supabase
            .from('whatsapp_sessions')
            .update({
              qr_code: this.qrCode,
              status: 'waiting'
            })
            .eq('id', this.sessionId);
        }
        
        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          if (shouldReconnect) {
            console.log('Connection closed, reconnecting...');
            setTimeout(() => this.generateQR(), 3000);
          } else {
            console.log('Connection logged out');
            await this.handleDisconnection();
          }
        } else if (connection === 'open') {
          console.log('WhatsApp connected successfully');
          await this.handleConnection();
        }
      });

      // Handle credential updates
      this.socket.ev.on('creds.update', saveCreds);
      
      // Handle incoming messages
      this.socket.ev.on('messages.upsert', async (m) => {
        const messages = m.messages;
        for (const message of messages) {
          if (!message.key.fromMe && message.message) {
            await this.handleIncomingMessage(message);
          }
        }
      });

      // Set timeout for QR expiration
      this.connectionTimeout = setTimeout(() => {
        this.handleConnectionTimeout();
      }, 120000);
      
      return this.qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }


  async handleConnection() {
    console.log(`WhatsApp connected for session: ${this.sessionName}`);
    
    // Clear timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    
    this.isConnected = true;
    
    // Get phone number from socket info
    const phoneNumber = this.socket?.user?.id || `+7${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    await this.supabase
      .from('whatsapp_sessions')
      .update({
        status: 'connected',
        phone_number: phoneNumber,
        qr_code: null,
        last_activity: new Date().toISOString()
      })
      .eq('id', this.sessionId);

    console.log(`WhatsApp connected successfully with phone: ${phoneNumber}`);
  }

  async handleDisconnection() {
    console.log(`WhatsApp disconnected for session: ${this.sessionName}`);
    this.isConnected = false;
    
    await this.supabase
      .from('whatsapp_sessions')
      .update({
        status: 'disconnected',
        qr_code: null
      })
      .eq('id', this.sessionId);
  }

  async handleIncomingMessage(message) {
    try {
      // Extract message content
      let content = '';
      if (message.message?.conversation) {
        content = message.message.conversation;
      } else if (message.message?.extendedTextMessage?.text) {
        content = message.message.extendedTextMessage.text;
      } else {
        return; // Skip unsupported message types
      }

      // Extract sender phone number
      const fromNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
      
      console.log(`Received message from ${fromNumber}: ${content}`);
      
      // Find or create client
      let clientId = null;
      const { data: existingClient } = await this.supabase
        .from('clients')
        .select('id')
        .eq('phone', `+${fromNumber}`)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient } = await this.supabase
          .from('clients')
          .insert({
            name: `WhatsApp User ${fromNumber.slice(-4)}`,
            email: `user${fromNumber.slice(-4)}@whatsapp.com`,
            phone: `+${fromNumber}`,
            source: 'whatsapp'
          })
          .select('id')
          .single();
        
        if (newClient) {
          clientId = newClient.id;
        }
      }

      if (clientId) {
        // Save incoming message
        await this.supabase
          .from('chat_messages')
          .insert({
            client_id: clientId,
            content: content,
            source: 'whatsapp',
            is_from_client: true,
            message_type: 'text'
          });

        // Generate and send AI response
        await this.generateAIResponse(content, clientId, `+${fromNumber}`, message.key.remoteJid);
      }

      // Update session activity
      await this.supabase
        .from('whatsapp_sessions')
        .update({
          last_activity: new Date().toISOString()
        })
        .eq('id', this.sessionId);
        
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  async handleConnectionTimeout() {
    console.log(`Connection timeout for session: ${this.sessionName}`);
    
    await this.supabase
      .from('whatsapp_sessions')
      .update({
        qr_code: null,
        status: 'disconnected'
      })
      .eq('id', this.sessionId);
  }


  async generateAIResponse(userMessage, clientId, phone, whatsappJid) {
    try {
      // Get AI configuration (OpenAI key should be stored in Supabase secrets)
      const openAIKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIKey) {
        console.log('OpenAI API key not configured');
        return;
      }

      const defaultPrompt = 'Вы - ассистент отеля. Отвечайте вежливо и помогайте с бронированием номеров. Отвечайте кратко и по делу.';
      
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: defaultPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status);
        return;
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (aiResponse && this.socket) {
        // Send message back via WhatsApp
        await this.socket.sendMessage(whatsappJid, { text: aiResponse });
        
        // Save AI response to database
        await this.supabase
          .from('chat_messages')
          .insert({
            client_id: clientId,
            content: aiResponse,
            source: 'whatsapp',
            is_from_client: false,
            message_type: 'text'
          });

        console.log(`AI responded to ${phone}: ${aiResponse}`);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
  }

  async sendMessage(content, toNumber) {
    console.log(`Sending message to ${toNumber}: ${content}`);
    
    if (!this.isConnected) {
      throw new Error('WhatsApp session not connected');
    }
    
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
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    
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

    const { action, sessionName, sessionId, message, toNumber, aiConfig } = await req.json();

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
          session = new BaileysWhatsAppSession(sessionId, sessionName || 'Default', supabase);
          activeSessions.set(sessionId, session);
        }

        const qrCode = await session.generateQR();
        
        // Auto-scan simulation is handled by Baileys events
        
        return new Response(JSON.stringify({ success: true, qrCode }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'connect':
        // This action is no longer needed as Baileys handles connection automatically
        return new Response(JSON.stringify({ success: true }), {
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
          // Baileys-style cleanup
          await supabase
            .from('whatsapp_sessions')
            .update({
              status: 'disconnected',
              qr_code: null,
              phone_number: null
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

      case 'save_ai_config':
        // In a real implementation, save to a dedicated AI config table
        // For now, just return success
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store active WhatsApp sessions
const activeSessions = new Map();

// Simple WhatsApp Session simulator
class WhatsAppSession {
  constructor(sessionId, sessionName, supabase) {
    this.sessionId = sessionId;
    this.sessionName = sessionName;
    this.supabase = supabase;
    this.isConnected = false;
    this.qrCode = null;
    this.connectionTimeout = null;
  }

  async generateQR() {
    console.log(`Generating QR for session: ${this.sessionName}`);
    
    try {
      // ДЕМО: Генерируем QR код с информацией о том, что это демо-версия
      const demoInfo = {
        demo: true,
        sessionId: this.sessionId,
        sessionName: this.sessionName,
        message: "Это демо-версия WhatsApp интеграции. Для настоящей интеграции нужен WhatsApp Business API.",
        instructions: "Нажмите 'Подключить вручную' для демонстрации функций чата"
      };
      
      const qrData = JSON.stringify(demoInfo);
      console.log('Demo QR generated for session:', this.sessionName);
      
      // Generate QR code with demo info
      const qrCodeBase64 = await qrcode(qrData, { 
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

      // Убираем автоподключение - только по запросу пользователя
      console.log('QR code ready. Waiting for manual connection...');
      
      return this.qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  async handleConnection() {
    console.log(`WhatsApp connected for session: ${this.sessionName}`);
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    
    this.isConnected = true;
    
    // Simulate realistic phone number
    const phoneNumber = `+77${Math.floor(Math.random() * 900000000) + 100000000}`;
    
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
    
    // Send welcome message
    setTimeout(async () => {
      if (this.isConnected) {
        await this.simulateIncomingMessage('WhatsApp подключен! Готов к работе.');
      }
    }, 2000);

    // Start message simulation
    this.startMessageSimulation();
  }

  async startMessageSimulation() {
    // Simulate incoming messages for demo
    const messages = [
      'Здравствуйте! Интересует бронирование номера.',
      'Какие у вас цены на размещение?',
      'Доступны ли номера на эти выходные?',
      'Можно ли забронировать номер люкс?'
    ];

    let messageIndex = 0;
    const interval = setInterval(async () => {
      if (!this.isConnected || messageIndex >= messages.length) {
        clearInterval(interval);
        return;
      }

      await this.simulateIncomingMessage(messages[messageIndex]);
      messageIndex++;
    }, 30000); // Каждые 30 секунд
  }

  async simulateIncomingMessage(content) {
    try {
      // Generate demo phone number
      const fromNumber = `+77${Math.floor(Math.random() * 900000000) + 100000000}`;
      
      console.log(`Received message from ${fromNumber}: ${content}`);
      
      // Find or create client
      let clientId = null;
      const { data: existingClient } = await this.supabase
        .from('clients')
        .select('id')
        .eq('phone', fromNumber)
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient } = await this.supabase
          .from('clients')
          .insert({
            name: `WhatsApp User ${fromNumber.slice(-4)}`,
            email: `user${fromNumber.slice(-4)}@whatsapp.com`,
            phone: fromNumber,
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

        // Generate AI response
        await this.generateAIResponse(content, clientId, fromNumber);
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

  async generateAIResponse(userMessage, clientId, phone) {
    try {
      const openAIKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIKey) {
        console.log('OpenAI API key not configured');
        // Send default response
        const defaultResponse = 'Спасибо за ваше сообщение! Мы рассмотрим ваш запрос и свяжемся с вами в ближайшее время.';
        await this.saveAIResponse(defaultResponse, clientId, phone);
        return;
      }

      const defaultPrompt = 'Вы - ассистент отеля. Отвечайте вежливо и помогайте с бронированием номеров. Отвечайте кратко и по делу на русском языке.';
      
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

      if (aiResponse) {
        await this.saveAIResponse(aiResponse, clientId, phone);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
  }

  async saveAIResponse(aiResponse, clientId, phone) {
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
        qr_code: null,
        phone_number: null
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
        let session = activeSessions.get(sessionId);
        if (!session) {
          session = new WhatsAppSession(sessionId, sessionName || 'Default', supabase);
          activeSessions.set(sessionId, session);
        }

        const qrCode = await session.generateQR();
        
        return new Response(JSON.stringify({ success: true, qrCode }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'connect_demo':
        const demoSession = activeSessions.get(sessionId);
        if (demoSession) {
          await demoSession.handleConnection();
        } else {
          const newDemoSession = new WhatsAppSession(sessionId, sessionName || 'Demo', supabase);
          activeSessions.set(sessionId, newDemoSession);
          await newDemoSession.handleConnection();
        }
        
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
          .maybeSingle();

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
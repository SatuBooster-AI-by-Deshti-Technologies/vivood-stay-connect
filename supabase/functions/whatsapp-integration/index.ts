import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Инициализация Supabase клиента
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'save_session':
        return await saveWhatsAppSession(data);
      case 'save_message':
        return await saveMessage(data);
      case 'get_session':
        return await getSession(data.phone_number);
      case 'update_session_stage':
        return await updateSessionStage(data);
      case 'create_booking':
        return await createBookingFromWhatsApp(data);
      case 'generate_payment_link':
        return await generatePaymentLink(data);
      case 'verify_payment':
        return await verifyPayment(data);
      case 'send_marketing_message':
        return await sendMarketingMessage(data);
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in whatsapp-integration:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Сохранить или обновить WhatsApp сессию
async function saveWhatsAppSession(data: any) {
  const { 
    phone_number, 
    client_name = null, 
    email = null, 
    check_in_date = null, 
    check_out_date = null,
    guests = null,
    accommodation_type = null,
    session_stage = 'initial',
    notes = null
  } = data;

  // Проверяем существующую сессию
  const { data: existingSession } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone_number', phone_number)
    .single();

  let sessionResult;
  
  if (existingSession) {
    // Обновляем существующую сессию
    sessionResult = await supabase
      .from('whatsapp_sessions')
      .update({
        client_name: client_name || existingSession.client_name,
        email: email || existingSession.email,
        check_in_date: check_in_date || existingSession.check_in_date,
        check_out_date: check_out_date || existingSession.check_out_date,
        guests: guests || existingSession.guests,
        accommodation_type: accommodation_type || existingSession.accommodation_type,
        session_stage,
        last_interaction: new Date().toISOString(),
        notes: notes || existingSession.notes
      })
      .eq('id', existingSession.id)
      .select()
      .single();
  } else {
    // Создаем новую сессию
    sessionResult = await supabase
      .from('whatsapp_sessions')
      .insert({
        phone_number,
        client_name,
        email,
        check_in_date,
        check_out_date,
        guests,
        accommodation_type,
        session_stage,
        notes
      })
      .select()
      .single();
  }

  return new Response(JSON.stringify(sessionResult), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Сохранить сообщение
async function saveMessage(data: any) {
  const { session_id, message_type, content, is_from_client = true, ai_response = null } = data;

  const { data: message, error } = await supabase
    .from('whatsapp_messages')
    .insert({
      session_id,
      message_type,
      content,
      is_from_client,
      ai_response
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Получить сессию по номеру телефона
async function getSession(phone_number: string) {
  const { data: session, error } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone_number', phone_number)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return new Response(JSON.stringify({ session }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Обновить стадию сессии
async function updateSessionStage(data: any) {
  const { phone_number, session_stage, additional_data = {} } = data;

  const updateData: any = {
    session_stage,
    last_interaction: new Date().toISOString(),
    ...additional_data
  };

  const { data: session, error } = await supabase
    .from('whatsapp_sessions')
    .update(updateData)
    .eq('phone_number', phone_number)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, session }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Создать бронирование из WhatsApp
async function createBookingFromWhatsApp(data: any) {
  const { session_id } = data;

  // Получаем данные сессии
  const { data: session, error: sessionError } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('id', session_id)
    .single();

  if (sessionError) throw sessionError;

  if (!session.client_name || !session.check_in_date || !session.check_out_date || !session.accommodation_type) {
    throw new Error('Недостаточно данных для создания бронирования');
  }

  // Создаем клиента если не существует
  let clientId = session.client_id;
  
  if (!clientId) {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: session.client_name,
        phone: session.phone_number,
        email: session.email || `${session.phone_number}@whatsapp.user`,
        source: 'whatsapp'
      })
      .select()
      .single();

    if (clientError) throw clientError;
    clientId = client.id;

    // Обновляем сессию с client_id
    await supabase
      .from('whatsapp_sessions')
      .update({ client_id: clientId })
      .eq('id', session.id);
  }

  // Создаем бронирование
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      name: session.client_name,
      email: session.email || `${session.phone_number}@whatsapp.user`,
      phone: session.phone_number,
      accommodation_type: session.accommodation_type,
      check_in: session.check_in_date,
      check_out: session.check_out_date,
      guests: session.guests || 1,
      total_price: session.total_price || 0,
      status: 'pending'
    })
    .select()
    .single();

  if (bookingError) throw bookingError;

  // Обновляем сессию
  await supabase
    .from('whatsapp_sessions')
    .update({ 
      booking_id: booking.id,
      session_stage: 'booking_pending'
    })
    .eq('id', session.id);

  return new Response(JSON.stringify({ success: true, booking }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Генерировать ссылку на оплату
async function generatePaymentLink(data: any) {
  const { booking_id, session_id, amount } = data;

  // Здесь можно интегрировать с платежной системой
  // Для примера создаем простую ссылку
  const paymentUrl = `https://pay.kaspi.kz/pay/${booking_id}?amount=${amount}`;

  const { data: paymentLink, error } = await supabase
    .from('payment_links')
    .insert({
      booking_id,
      session_id,
      payment_url: paymentUrl,
      amount,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 часа
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, payment_link: paymentLink }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Проверить оплату
async function verifyPayment(data: any) {
  const { payment_link_id, payment_screenshot } = data;

  const { data: paymentLink, error } = await supabase
    .from('payment_links')
    .update({
      payment_screenshot,
      status: 'paid' // В реальности здесь должна быть проверка
    })
    .eq('id', payment_link_id)
    .select()
    .single();

  if (error) throw error;

  // Обновляем статус бронирования
  if (paymentLink.booking_id) {
    await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', paymentLink.booking_id);
  }

  return new Response(JSON.stringify({ success: true, verified: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Отправить маркетинговое сообщение
async function sendMarketingMessage(data: any) {
  const { campaign_id, phone_number, message } = data;

  // Находим сессию
  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('id')
    .eq('phone_number', phone_number)
    .single();

  if (session) {
    // Записываем отправленное сообщение
    await supabase
      .from('marketing_messages')
      .insert({
        campaign_id,
        session_id: session.id
      });
  }

  // Отправляем сообщение через WhatsApp API
  const whatsappResponse = await fetch(`http://194.32.141.216:3003/send?to=${phone_number}&text=${encodeURIComponent(message)}`);

  return new Response(JSON.stringify({ success: true, sent: whatsappResponse.ok }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
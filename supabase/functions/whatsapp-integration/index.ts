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
      case 'check_booking_match':
        return await checkBookingMatch(data);
      case 'send_payment_request':
        return await sendPaymentRequest(data);
      case 'upload_payment_receipt':
        return await uploadPaymentReceipt(data);
      case 'confirm_payment':
        return await confirmPayment(data);
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

// Сохранить или обновить WhatsApp сессию (только для консультаций)
async function saveWhatsAppSession(data: any) {
  const { 
    phone_number, 
    session_stage = 'consultation',
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

// Проверить совпадение бронирования с WhatsApp
async function checkBookingMatch(data: any) {
  const { booking_id } = data;

  // Получаем бронирование
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single();

  if (bookingError) throw bookingError;

  // Ищем WhatsApp сессию с таким же номером телефона
  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone_number', booking.phone)
    .single();

  if (session) {
    // Обновляем сессию - связываем с бронированием
    await supabase
      .from('whatsapp_sessions')
      .update({ 
        booking_id: booking.id,
        client_name: booking.name,
        email: booking.email,
        check_in_date: booking.check_in,
        check_out_date: booking.check_out,
        guests: booking.guests,
        accommodation_type: booking.accommodation_type,
        total_price: booking.total_price,
        session_stage: 'booking_confirmed'
      })
      .eq('id', session.id);

    // Отправляем сообщение клиенту
    const message = `🎉 Ваша заявка на бронирование получена!\n\n` +
      `📋 Детали:\n` +
      `• ${booking.accommodation_type}\n` +
      `• ${booking.check_in} - ${booking.check_out}\n` +
      `• ${booking.guests} гостей\n` +
      `• Сумма: ${booking.total_price} ₸\n\n` +
      `💰 Для подтверждения брони необходима предоплата 50% (${Math.round(booking.total_price * 0.5)} ₸)\n\n` +
      `Ссылка для оплаты будет отправлена в следующем сообщении.`;

    await fetch(`http://194.32.141.216:3003/send?to=${booking.phone}&text=${encodeURIComponent(message)}`);

    return new Response(JSON.stringify({ success: true, session_found: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, session_found: false }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Отправить запрос на оплату
async function sendPaymentRequest(data: any) {
  const { booking_id } = data;

  // Получаем бронирование
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single();

  if (bookingError) throw bookingError;

  // Получаем сессию
  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('booking_id', booking_id)
    .single();

  if (!session) throw new Error('Session not found');

  // Создаем ссылку на оплату
  const prepaymentAmount = Math.round(booking.total_price * 0.5);
  const paymentUrl = `https://pay.kaspi.kz/pay/vivoodtau?amount=${prepaymentAmount}&ref=${booking_id}`;

  const { data: paymentLink, error } = await supabase
    .from('payment_links')
    .insert({
      booking_id: booking.id,
      session_id: session.id,
      payment_url: paymentUrl,
      amount: prepaymentAmount,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Отправляем ссылку на оплату
  const message = `💳 Ссылка для предоплаты (${prepaymentAmount} ₸):\n\n${paymentUrl}\n\n` +
    `После оплаты пришлите скриншот чека в этот чат для подтверждения.`;

  await fetch(`http://194.32.141.216:3003/send?to=${booking.phone}&text=${encodeURIComponent(message)}`);

  // Обновляем стадию сессии
  await supabase
    .from('whatsapp_sessions')
    .update({ session_stage: 'payment_pending' })
    .eq('id', session.id);

  return new Response(JSON.stringify({ success: true, payment_link: paymentLink }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Загрузить чек оплаты
async function uploadPaymentReceipt(data: any) {
  const { session_id, receipt_url } = data;

  // Получаем сессию
  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('id', session_id)
    .single();

  if (!session) throw new Error('Session not found');

  // Обновляем ссылку на оплату с чеком
  await supabase
    .from('payment_links')
    .update({
      payment_screenshot: receipt_url,
      status: 'receipt_uploaded'
    })
    .eq('session_id', session_id);

  // Обновляем стадию сессии
  await supabase
    .from('whatsapp_sessions')
    .update({ session_stage: 'payment_verification' })
    .eq('id', session_id);

  // Отправляем подтверждение
  const message = `✅ Чек получен! Ваша оплата проверяется администратором. Мы свяжемся с вами в ближайшее время.`;
  await fetch(`http://194.32.141.216:3003/send?to=${session.phone_number}&text=${encodeURIComponent(message)}`);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Подтвердить оплату
async function confirmPayment(data: any) {
  const { payment_link_id, verified_by } = data;

  // Обновляем статус оплаты
  const { data: paymentLink, error } = await supabase
    .from('payment_links')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by
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

  // Обновляем стадию сессии
  await supabase
    .from('whatsapp_sessions')
    .update({ session_stage: 'payment_confirmed' })
    .eq('session_id', paymentLink.session_id);

  // Получаем данные бронирования для отправки подтверждения
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', paymentLink.booking_id)
    .single();

  if (booking) {
    const message = `🎉 Отличные новости! Ваша оплата подтверждена!\n\n` +
      `✅ Бронирование подтверждено:\n` +
      `• ${booking.accommodation_type}\n` +
      `• ${booking.check_in} - ${booking.check_out}\n` +
      `• ${booking.guests} гостей\n\n` +
      `Мы ждем вас! При заселении доплатите оставшуюся сумму: ${booking.total_price - paymentLink.amount} ₸`;

    await fetch(`http://194.32.141.216:3003/send?to=${booking.phone}&text=${encodeURIComponent(message)}`);
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
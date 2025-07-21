<?php
// Модифицированный webhook.php для интеграции с Supabase CRM

file_put_contents("check1.txt", "Webhook стартует\n", FILE_APPEND);
file_put_contents("headers.txt", print_r(getallheaders(), true), FILE_APPEND);

$raw = file_get_contents("php://input");
file_put_contents("log.txt", date("Y-m-d H:i:s") . ' | ' . $raw . "\n", FILE_APPEND);
$input = json_decode($raw, true);

$message = $input['entry'][0]['changes'][0]['value']['messages'][0] ?? null;
$from = $message['from'] ?? '';
$hasAudio = isset($message['audio']['data']);
$text = $message['text']['body'] ?? ($message['conversation'] ?? '');
$managerNumber = '77018189683';
$managerJid = $managerNumber . '@c.us';

$fromMe = $message['key']['fromMe'] ?? false;
$remoteJid = $message['key']['remoteJid'] ?? $from;
$senderJid = $message['key']['participant'] ?? $message['key']['remoteJid'] ?? $from;

function normalizeJid($jid) {
    return preg_replace('/[^0-9]/', '', $jid);
}

$normalizedSender = normalizeJid($senderJid);
$normalizedManager = normalizeJid($managerJid);

$isManager = false;
if ($fromMe && $normalizedSender === $normalizedManager) {
    $isManager = true;
}

// Проверяем, кто был последний
$lastSender = @file_get_contents("last_sender_$from.txt");
if ($lastSender === 'manager' && !$isManager) {
    exit;
}

file_put_contents("last_sender_$from.txt", $isManager ? 'manager' : 'client');

// Блокируем ИИ если менеджер сам написал
if ($isManager && $from) {
    file_put_contents("blocked_$from.txt", time());
    exit;
}

if (!$from || (!$text && !$hasAudio)) exit;

file_put_contents("last_seen_$from.txt", time());
file_put_contents("followup_stage_$from.txt", "0");

function isBlocked($from) {
    $file = "blocked_$from.txt";
    return file_exists($file) && (time() - (int)file_get_contents($file) < 900);
}

$baseUrl = "http://194.32.141.216:3003/send";
$firstTime = !in_array($from, file_exists("sent_clients.txt") ? file("sent_clients.txt", FILE_IGNORE_NEW_LINES) : []);

// URL для интеграции с Supabase
$supabaseUrl = "https://ltosbjwmwhcljzgcwcre.functions.supabase.co/whatsapp-integration";

// === Функции для работы с CRM ===
function saveToSupabase($action, $data) {
    global $supabaseUrl;
    
    $postData = json_encode([
        'action' => $action,
        'data' => $data
    ]);
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $supabaseUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postData,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3Niandtd2hjbGp6Z2N3Y3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTQyNTksImV4cCI6MjA2ODMzMDI1OX0.BiCX6By6S3BxHvJJnKQVYM9PvPs_INeG2cetNlbAS3E'
        ]
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

function extractBookingInfo($text) {
    $info = [];
    
    // Извлекаем дату заезда
    if (preg_match('/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})/', $text, $matches)) {
        $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
        $year = strlen($matches[3]) == 2 ? '20' . $matches[3] : $matches[3];
        $info['check_in_date'] = "$year-$month-$day";
    }
    
    // Извлекаем количество гостей
    if (preg_match('/(\d+)\s*(адам|человек|гость)/ui', $text, $matches)) {
        $info['guests'] = (int)$matches[1];
    }
    
    // Извлекаем тип размещения
    $accommodationTypes = [
        'глэмпинг' => 'глэмпинг',
        'glamping' => 'глэмпинг', 
        'домик' => 'квадрат домик',
        'квадрат' => 'квадрат домик',
        'vip' => 'VIP капсула',
        'капсула' => 'VIP капсула',
        'юрта' => 'юрта',
        'тапчан' => 'тапчан'
    ];
    
    foreach ($accommodationTypes as $key => $value) {
        if (stripos($text, $key) !== false) {
            $info['accommodation_type'] = $value;
            break;
        }
    }
    
    // Извлекаем имя
    if (preg_match('/меня зовут\s+([а-яё\s]+)/ui', $text, $matches) ||
        preg_match('/мен\s+([а-яё\s]+)/ui', $text, $matches) ||
        preg_match('/имя\s+([а-яё\s]+)/ui', $text, $matches)) {
        $info['client_name'] = trim($matches[1]);
    }
    
    return $info;
}

function calculatePrice($accommodationType, $checkIn, $checkOut, $guests = 1) {
    $prices = [
        'глэмпинг' => ['weekday' => 50000, 'weekend' => 60000],
        'квадрат домик' => ['weekday' => 35000, 'weekend' => 40000],
        'VIP капсула' => ['weekday' => 100000, 'weekend' => 120000],
        'юрта' => ['full_day' => 50000, 'partial' => 30000],
        'тапчан' => ['price' => 15000]
    ];
    
    if (!isset($prices[$accommodationType])) return 0;
    
    // Простая логика расчета (можно усложнить)
    $basePrice = $prices[$accommodationType]['weekday'] ?? $prices[$accommodationType]['price'] ?? 50000;
    
    // Дополнительные гости
    if ($accommodationType === 'глэмпинг' && $guests > 4) {
        $basePrice += ($guests - 4) * 10000;
    }
    
    return $basePrice;
}

// === Обработка аудио ===
if ($hasAudio && !isBlocked($from)) {
    $audioData = base64_decode($message['audio']['data']);
    $file = "audio_" . time() . ".webm";
    file_put_contents($file, $audioData);

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://api.openai.com/v1/audio/transcriptions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => ['file' => new CURLFile(realpath($file), 'audio/webm', 'audio.webm'), 'model' => 'whisper-1'],
        CURLOPT_HTTPHEADER => [
          "Authorization: Bearer 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"
        ]
    ]);
    $response = curl_exec($curl);
    curl_close($curl);
    unlink($file);

    $recognized = json_decode($response, true)['text'] ?? '';
    
    if ($recognized) {
        // Сохраняем сообщение в CRM
        $sessionResponse = saveToSupabase('get_session', ['phone_number' => $from]);
        $sessionId = $sessionResponse['session']['id'] ?? null;
        
        if ($sessionId) {
            saveToSupabase('save_message', [
                'session_id' => $sessionId,
                'message_type' => 'audio',
                'content' => $recognized,
                'is_from_client' => true
            ]);
        }
        
        $reply = getAIReply($recognized, $firstTime, $from);
    } else {
        $reply = "Кешіріңіз, дауыс анықталмады. Қайталап жазыңыз.";
    }
    
    sleep(rand(3, 4));
    file_get_contents("$baseUrl?to=" . urlencode($from) . "&text=" . urlencode($reply));
    exit;
}

// === Текст + AI ===
if ($text && !isBlocked($from)) {
    $cacheFile = "pending_messages_$from.txt";
    $now = time();
    $previous = [];

    if (file_exists($cacheFile)) {
        $previous = json_decode(file_get_contents($cacheFile), true) ?: [];
        $previous = array_filter($previous, fn($msg) => $now - $msg['time'] < 60);
    }

    $previous[] = ['text' => $text, 'time' => $now];
    file_put_contents($cacheFile, json_encode($previous));
    $combined = implode(" ", array_column($previous, 'text'));
    
    if (trim($combined) === '') exit;
    
    // Сохраняем/обновляем сессию в CRM
    $bookingInfo = extractBookingInfo($combined);
    
    // Создаем или обновляем сессию
    $sessionData = array_merge(['phone_number' => $from], $bookingInfo);
    $sessionResponse = saveToSupabase('save_session', $sessionData);
    $sessionId = $sessionResponse['data']['id'] ?? null;
    
    // Сохраняем сообщение
    if ($sessionId) {
        saveToSupabase('save_message', [
            'session_id' => $sessionId,
            'message_type' => 'text',
            'content' => $combined,
            'is_from_client' => true
        ]);
    }
    
    $reply = getAIReply($combined, $firstTime, $from);
    unlink($cacheFile);
    
    // Сохраняем ответ ИИ
    if ($sessionId) {
        saveToSupabase('save_message', [
            'session_id' => $sessionId,
            'message_type' => 'text',
            'content' => '',
            'is_from_client' => false,
            'ai_response' => $reply
        ]);
    }
    
    sleep(rand(3, 4));
    file_get_contents("$baseUrl?to=" . urlencode($from) . "&text=" . urlencode($reply));

    if ($firstTime) file_put_contents("sent_clients.txt", $from . "\n", FILE_APPEND);
    exit;
}

// === Функция OpenAI с интеграцией CRM ===
function getAIReply($userText, $isReturningClient, $phoneNumber) {
    global $supabaseUrl;
    
    // Получаем текущую сессию для контекста
    $sessionResponse = saveToSupabase('get_session', ['phone_number' => $phoneNumber]);
    $session = $sessionResponse['session'] ?? null;
    
    $apiKey = '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';
    
    $contextInfo = "";
    if ($session) {
        $contextInfo = "Контекст клиента:\n";
        if ($session['client_name']) $contextInfo .= "Имя: {$session['client_name']}\n";
        if ($session['check_in_date']) $contextInfo .= "Дата заезда: {$session['check_in_date']}\n";
        if ($session['check_out_date']) $contextInfo .= "Дата выезда: {$session['check_out_date']}\n";
        if ($session['accommodation_type']) $contextInfo .= "Тип размещения: {$session['accommodation_type']}\n";
        if ($session['guests']) $contextInfo .= "Количество гостей: {$session['guests']}\n";
        $contextInfo .= "Стадия: {$session['session_stage']}\n\n";
    }
    
    $prompt = <<<PROMPT
$contextInfo

Сен Vivood_tau глэмпингінің виртуалды ассистентісің. Сөйлеу стилің — достық, сенімді, қазақша және орысша аралас болуы мүмкін.

ВАЖНО! Когда клиент готов бронировать, собери всю информацию:
1. Имя полностью
2. Дата заезда и выезда  
3. Количество гостей
4. Тип размещения

После сбора всех данных, отправь клиента на сайт для окончательного бронирования:
"Барлық қажетті мәліметтер жиналды! Қазір ресми сайтымызға өтіп бронь расталаңыз: https://your-booking-site.com"

Если у клиента есть вопросы об оплате - объясни что после бронирования на сайте ему придет ссылка на оплату.

🌄 Vivood Tau — Жалпы ақпарат

🛖 ТҰРҒЫН ҮЙ ТҮРЛЕРІ: 3 түрлі үйлер бар 

Глэмпинг (дөңгелек домик)
🗓 Жұмыс күндері: 50 000 тг
🗓 Демалыс/мереке күндері: 60 000 тг
👥 2 ересек + 2 бала немесе 4 ересек (қыздар немесе жігіттер — бөлек ұйықтайтын орын жоқ)
🍽 Таңғы ас кіреді
🚿 Душ, туалет бар
➕ Артық ересек адам — 10 000 тг/адам
➕ Бала (детский) — 5 000 тг/бала

Квадрат домик (2 адамға)
🗓 Жұмыс күндері: 35 000 тг
🗓 Демалыс/мереке күндері: 40 000 тг
👥 2 адамға
🍽 Таңғы ас кіреді
🚿 Душ, туалет бар
❗️ 3 немесе 4 адам сыймайды

VIP Капсула КИНОТЕАТОРЫМЕН (панорамалық орын)
🗓 Жұмыс күндері: 100 000 тг
🗓 Демалыс/мереке күндері: 120 000 тг
👥 2 адамға арналған
🍽️ Таңғы ас кіреді
🚿Душ, туалет бар 
Ванный халат,одноразовый тапочка,шампунь,сабын.
❗️3 немесе 4 адам сыймайды 

Юрта (көпшілікке арналған)
⏰ Таңнан кешке дейін: 30 000 тг
🕛 Тәулікке: 50 000 тг

Тапчан
💰 15 000 тг

🕰 Орналасу тәртібі:
Чек-ин: 14:00
Чек-аут: келесі күні 12:00
Таңғы ас — келесі күні таңертең беріледі

🔥 Тамақтану:
Қазан, ошақ, мангал — тегін
Отын/көмір — өзіңізбен немесе бізден алуға болады
Тамақ жасап беру — ақылы (адам санына байланысты)
Спирттік ішімдіктер мен азық-түлік — өзіңізбен алып келуге болады
Кафе, ресторан — жоқ

📍 Орналасқан жер:
Каскасудан жоғары, Сайрам-Өгем Ұлттық паркінің ішінде
Шымкенттен 80 км
2ГИС: Vivood_tau деп теріңіз
Соңғы 2 км — топырақ жол (жеңіл көлік өте алады)
Түркістан облысындағы ең биік демалыс орны
Панорамалық көрініс: Сайрам шыңы — 4236 м

🚕 Трансфер:
Шымкенттен және таудан — 25 000 тг (бір көлікке, 3-4 адам)

🐎 Қосымша қызметтер:
Атпен серуендеу — 5 000 тг/сағ
Қымыз — 1 500 тг/литр
Садақ ату — 3 000 тг (30 минут)
Форель — таза бұлақта өсіріліп жатыр
Шомылу орны — бұлақ суынан
Баня парилка— 3 сағат / 20 000 тг

🌐 Байланыс:
Wi-Fi бар
Ұялы байланыс ұстамайды (тек Wi-Fi арқылы байланыс)

PROMPT;

    if ($isReturningClient) {
        $prompt .= "\n\nЕскерту: бұл клиент бұрын жазған. Амандаспа қайтадан. Бірден жауап бер.";
    }

    $data = [
        "model" => "gpt-4o",
        "temperature" => 0.7,
        "messages" => [
            ["role" => "system", "content" => $prompt],
            ["role" => "user", "content" => $userText]
        ]
    ];

    $ch = curl_init("https://api.openai.com/v1/chat/completions");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Authorization: Bearer $apiKey"
        ],
        CURLOPT_POSTFIELDS => json_encode($data)
    ]);
    $response = curl_exec($ch);
    
    if (curl_errno($ch)) {
        file_put_contents("openai_error.txt", curl_error($ch), FILE_APPEND);
    }
    curl_close($ch);

    $res = json_decode($response, true);
    file_put_contents("openai_debug.txt", print_r($res, true), FILE_APPEND);

    $aiReply = $res['choices'][0]['message']['content'] ?? 'Қайталап жазыңызшы.';
    
    // Проверяем, нужно ли создать бронирование
    if ($session && $session['client_name'] && $session['check_in_date'] && $session['accommodation_type']) {
        // Если данные собраны, обновляем стадию
        if ($session['session_stage'] === 'initial' || $session['session_stage'] === 'collecting_info') {
            saveToSupabase('update_session_stage', [
                'phone_number' => $phoneNumber,
                'session_stage' => 'booking_pending'
            ]);
        }
    }
    
    return $aiReply;
}
?>
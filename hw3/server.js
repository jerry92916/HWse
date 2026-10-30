const express = require('express');
const path = require('node:path');
const { spawn } = require('node:child_process');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const CATEGORIES = ['grammar', 'vocabulary', 'reading', 'listening'];
const PARTS = ['part2', 'part3', 'part4', 'part5', 'part6', 'part7'];
const PART_CATEGORIES = {
  part2: ['listening'],
  part3: ['listening'],
  part4: ['listening'],
  part5: ['grammar', 'vocabulary'],
  part6: ['grammar', 'vocabulary'],
  part7: ['reading'],
};
const ACCENTS = {
  'en-US': 'American',
  'en-GB': 'British',
  'en-AU': 'Australian',
  'en-CA': 'Canadian',
};
const WINDOWS_SPEECH_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  '$request = [Console]::In.ReadToEnd() | ConvertFrom-Json',
  'Add-Type -AssemblyName System.Speech',
  '$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer',
  '$voice = @($synth.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -eq $request.accent }) | Select-Object -First 1',
  'if ($null -eq $voice) { [Console]::Error.WriteLine("No installed speech voice for " + $request.accent); exit 3 }',
  '$synth.SelectVoice($voice.VoiceInfo.Name)',
  '$synth.Rate = -1',
  '$audio = New-Object System.IO.MemoryStream',
  '$synth.SetOutputToWaveStream($audio)',
  '$synth.Speak($request.text)',
  '$audio.Position = 0',
  '$audio.CopyTo([Console]::OpenStandardOutput())',
  '$audio.Dispose()',
  '$synth.Dispose()',
].join('\n');

const demoQuestions = [
  {
    id: 'p5-subject-verb',
    part: 'part5',
    category: 'grammar',
    prompt: 'The marketing team _____ the campaign results every Monday.',
    options: ['review', 'reviews', 'reviewing', 'to review'],
    answerIndex: 1,
    explanation: '主詞 The marketing team 是單數，因此現在簡單式動詞要加 -s：reviews。',
  },
  {
    id: 'p5-tense',
    part: 'part5',
    category: 'grammar',
    prompt: 'Ms. Chen _____ the revised proposal before the client arrived yesterday.',
    options: ['finishes', 'has finished', 'had finished', 'will finish'],
    answerIndex: 2,
    explanation: '「完成提案」發生在過去另一件事（客戶抵達）之前，使用過去完成式 had finished。',
  },
  {
    id: 'p5-preposition',
    part: 'part5',
    category: 'grammar',
    prompt: 'Please submit your travel receipts _____ Friday afternoon.',
    options: ['by', 'during', 'between', 'among'],
    answerIndex: 0,
    explanation: 'by Friday 表示「最晚於星期五前」，符合截止期限的語意。',
  },
  {
    id: 'p5-vocabulary',
    part: 'part5',
    category: 'vocabulary',
    prompt: 'The new scheduling system will _____ the time employees spend on routine tasks.',
    options: ['reduce', 'resign', 'occur', 'attend'],
    answerIndex: 0,
    explanation: 'reduce time 表示「減少所花的時間」；其他選項的詞性或語意不合。',
  },
  {
    id: 'p5-collocation',
    part: 'part5',
    category: 'vocabulary',
    prompt: 'The supplier offered a _____ discount for orders placed before June 1.',
    options: ['consider', 'considerable', 'considerably', 'consideration'],
    answerIndex: 1,
    explanation: 'discount 前需要形容詞修飾；considerable 是形容詞，意思是「相當可觀的」。',
  },
  {
    id: 'p7-announcement',
    part: 'part7',
    category: 'reading',
    passage: 'To: All staff\nSubject: Office network maintenance\nThe IT department will upgrade the office network from 7:00 to 9:00 P.M. on Thursday. During this period, employees may not be able to access shared drives. Please save your work before leaving for the day.',
    prompt: 'What are employees asked to do before leaving?',
    options: ['Turn off the office lights', 'Save their work', 'Contact the supplier', 'Move to another office'],
    answerIndex: 1,
    explanation: '公告明確提醒員工離開前先 save your work，以免網路維護期間無法存取共用磁碟。',
  },
  {
    id: 'p7-inference',
    part: 'part7',
    category: 'reading',
    passage: 'BrightPath Consulting will host a free webinar on project planning next Wednesday. Registration closes on Monday, and registered participants will receive the meeting link by e-mail the day before the event.',
    prompt: 'When should a registered participant expect to receive the meeting link?',
    options: ['On Monday', 'On Tuesday', 'On Wednesday', 'After the webinar'],
    answerIndex: 1,
    explanation: '活動在星期三，參加者會在活動前一天收到連結，所以是星期二。',
  },
  {
    id: 'p7-purpose',
    part: 'part7',
    category: 'reading',
    passage: 'Dear customers, our downtown store will close at 4 P.M. this Saturday for staff training. Online orders will continue to be processed as usual. The store will reopen at its regular time on Sunday.',
    prompt: 'Why will the store close early on Saturday?',
    options: ['To complete an inventory', 'For staff training', 'Because of a holiday', 'To renovate the building'],
    answerIndex: 1,
    explanation: '信件直接說明提早打烊是為了 staff training（員工訓練）。',
  },
  {
    id: 'p7-schedule',
    part: 'part7',
    category: 'reading',
    passage: 'The product demonstration begins at 10:30 A.M. in Conference Room B. Guests may collect a visitor badge at the reception desk starting at 10:00 A.M. Light refreshments will be available after the presentation.',
    prompt: 'Where should guests collect a visitor badge?',
    options: ['Conference Room A', 'The reception desk', 'The cafeteria', 'The loading area'],
    answerIndex: 1,
    explanation: '通知指出訪客可以在 reception desk（接待櫃台）領取識別證。',
  },
  {
    id: 'p7-registration',
    part: 'part7',
    category: 'reading',
    passage: 'The Lakeside Business Forum will take place on August 12 at the Civic Center. Attendees who register by July 20 will receive a complimentary program guide. Space is limited, so early registration is recommended.',
    prompt: 'What will people receive if they register by July 20?',
    options: ['A complimentary program guide', 'A parking permit', 'A hotel reservation', 'A refund on their fee'],
    answerIndex: 0,
    explanation: '公告說明在 7 月 20 日前報名的參加者會收到免費的活動手冊。',
  },
  {
    id: 'p3-meeting',
    part: 'part3',
    category: 'listening',
    audioScript: 'Woman: Are we still meeting with the design team at two? Man: They asked to move it to three because their client call is running late. Woman: That works. I will update the calendar.',
    prompt: 'What will the woman do?',
    options: ['Call a client', 'Update the calendar', 'Meet at two o’clock', 'Contact the design team tomorrow'],
    answerIndex: 1,
    explanation: '女子說 I will update the calendar，表示她會更新行事曆。',
  },
  {
    id: 'p3-delivery',
    part: 'part3',
    category: 'listening',
    audioScript: 'Man: The printer paper order was supposed to arrive this morning. Woman: The courier called. The delivery is delayed until tomorrow because of the weather. Man: Thanks for letting me know.',
    prompt: 'When is the paper expected to arrive?',
    options: ['This morning', 'This afternoon', 'Tomorrow', 'Next week'],
    answerIndex: 2,
    explanation: '物流因天候延遲，對話說明貨品預計 tomorrow（明天）送達。',
  },
  {
    id: 'p3-location',
    part: 'part3',
    category: 'listening',
    audioScript: 'Woman: Excuse me, where is the training session? Man: It was moved from the main hall to Room 204 on the second floor. Woman: Thanks. I will take the stairs.',
    prompt: 'Where will the training session take place?',
    options: ['In the main hall', 'In Room 204', 'On the first floor', 'At the reception desk'],
    answerIndex: 1,
    explanation: '男子說訓練改到二樓的 Room 204。',
  },
  {
    id: 'p3-deadline',
    part: 'part3',
    category: 'listening',
    audioScript: 'Man: Have you sent the quarterly report to Finance? Woman: Not yet. I am waiting for the sales figures, but I will send everything before noon. Man: Great, the review starts at one.',
    prompt: 'When does the woman plan to send the report?',
    options: ['Before noon', 'At one o’clock', 'After the review', 'Tomorrow morning'],
    answerIndex: 0,
    explanation: '女子表示等收到銷售數字後，會在 before noon（中午前）寄出報告。',
  },
  {
    id: 'p3-project',
    part: 'part3',
    category: 'listening',
    audioScript: 'Woman: Did you book a table for the visiting engineers? Man: Yes, at the restaurant across from the station for six thirty. Woman: Perfect. I will tell them after the afternoon session.',
    prompt: 'What did the man do?',
    options: ['Booked a restaurant table', 'Changed the afternoon session', 'Called the engineers', 'Reserved a conference room'],
    answerIndex: 0,
    explanation: '男子已經在車站對面的餐廳訂了六點半的位子。',
  },
  {
    id: 'p2-meeting-room',
    part: 'part2',
    category: 'listening',
    audioScript: 'Where will the budget meeting be held?',
    prompt: 'Choose the most appropriate response.',
    options: ['In Conference Room A.', 'The budget was approved.', 'At three o’clock yesterday.', 'I sent the report.'],
    answerIndex: 0,
    explanation: '問句詢問會議地點，In Conference Room A 直接回答地點。',
  },
  {
    id: 'p2-report',
    part: 'part2',
    category: 'listening',
    audioScript: 'When is the updated sales report due?',
    prompt: 'Choose the most appropriate response.',
    options: ['The sales team is very busy.', 'By the end of the day.', 'It includes three charts.', 'At the downtown branch.'],
    answerIndex: 1,
    explanation: 'When 詢問時間，By the end of the day 回答截止時間。',
  },
  {
    id: 'p2-client',
    part: 'part2',
    category: 'listening',
    audioScript: 'Who is leading the presentation this afternoon?',
    prompt: 'Choose the most appropriate response.',
    options: ['In the large auditorium.', 'For about twenty minutes.', 'Our regional director.', 'The presentation was useful.'],
    answerIndex: 2,
    explanation: 'Who 詢問人物，Our regional director 回答負責簡報的人。',
  },
  {
    id: 'p2-shipping',
    part: 'part2',
    category: 'listening',
    audioScript: 'Could you send the contract to the supplier?',
    prompt: 'Choose the most appropriate response.',
    options: ['Sure, I will e-mail it now.', 'The supplier is across the street.', 'It was signed last month.', 'A new shipping address.'],
    answerIndex: 0,
    explanation: 'Could you ... 是請求，Sure, I will e-mail it now 表示接受並回應行動。',
  },
  {
    id: 'p2-lunch',
    part: 'part2',
    category: 'listening',
    audioScript: 'Why was the afternoon training session postponed?',
    prompt: 'Choose the most appropriate response.',
    options: ['In the training center.', 'Because the instructor is ill.', 'It lasts two hours.', 'The afternoon schedule.'],
    answerIndex: 1,
    explanation: 'Why 詢問原因，Because the instructor is ill 說明延期原因。',
  },
  {
    id: 'p4-announcement',
    part: 'part4',
    category: 'listening',
    audioScript: 'Attention, passengers. The 8:15 express train to Central Station will depart from Platform 6 today. Please allow extra time to reach the platform, as it is at the far end of the station.',
    prompt: 'Which platform will the train leave from?',
    options: ['Platform 2', 'Platform 4', 'Platform 6', 'Platform 8'],
    answerIndex: 2,
    explanation: '廣播明確指出開往 Central Station 的列車將從 Platform 6 出發。',
  },
  {
    id: 'p4-store',
    part: 'part4',
    category: 'listening',
    audioScript: 'Hello, shoppers. This week our home office collection is twenty percent off. Visit the display near the main entrance to see our new desk chairs and adjustable lamps. The offer ends Sunday.',
    prompt: 'Where can shoppers find the discounted collection?',
    options: ['Near the main entrance', 'On the second floor', 'At the customer service desk', 'In the parking garage'],
    answerIndex: 0,
    explanation: '廣播說商品展示區在 near the main entrance（主要入口附近）。',
  },
  {
    id: 'p4-weather',
    part: 'part4',
    category: 'listening',
    audioScript: 'Good morning, team. Today’s product demonstration has been moved to 2:30 P.M. because the equipment delivery is running late. We will meet in the usual training room, and refreshments will be provided.',
    prompt: 'Why was the demonstration rescheduled?',
    options: ['The presenter is traveling.', 'The equipment delivery is late.', 'The training room is unavailable.', 'The meeting ran overtime.'],
    answerIndex: 1,
    explanation: '通知說明設備配送延誤，因此產品展示改到下午兩點半。',
  },
  {
    id: 'p4-tour',
    part: 'part4',
    category: 'listening',
    audioScript: 'Thank you for calling Greenway Hotel. Our front desk is available around the clock. For reservations, press one. To speak with our events coordinator about conference facilities, press two.',
    prompt: 'Which callers should press two?',
    options: ['Guests asking about breakfast', 'People making a room reservation', 'Callers asking about conferences', 'Employees requesting the front desk'],
    answerIndex: 2,
    explanation: '電話選單指示詢問會議設施的來電者按二。',
  },
  {
    id: 'p4-office',
    part: 'part4',
    category: 'listening',
    audioScript: 'This is a reminder that all expense reports for the second quarter must be submitted by June 30. Please attach digital copies of your receipts. If you have questions, contact the Finance Department before the deadline.',
    prompt: 'What should employees attach to their reports?',
    options: ['A project schedule', 'Digital receipt copies', 'A manager’s résumé', 'The original contract'],
    answerIndex: 1,
    explanation: '廣播提醒員工在費用報告中附上收據的電子副本。',
  },
  {
    id: 'p6-event',
    part: 'part6',
    category: 'vocabulary',
    passage: 'To: Business Forum Participants\nSubject: Registration confirmation\nThank you for registering for the annual business forum. The event will begin at 9:00 A.M. on September 14. Please arrive early to collect your name badge. A detailed schedule will be sent to all participants _____ the event.',
    prompt: 'Which word best completes the text?',
    options: ['before', 'beneath', 'despite', 'unless'],
    answerIndex: 0,
    explanation: 'schedule 將在活動前寄出，before 表示「在……之前」，語意及文法均合適。',
  },
  {
    id: 'p6-office',
    part: 'part6',
    category: 'grammar',
    passage: 'The marketing department is pleased to announce a new customer survey. The survey is available online and takes approximately five minutes to complete. Responses _____ confidential and will be reviewed by an independent research firm.',
    prompt: 'Which word best completes the text?',
    options: ['keep', 'will keep', 'will be kept', 'keeping'],
    answerIndex: 2,
    explanation: 'Responses 是「被保密」的對象，需要被動語態 will be kept。',
  },
  {
    id: 'p6-shipping',
    part: 'part6',
    category: 'vocabulary',
    passage: 'Our warehouse has introduced a new ordering system to improve delivery times. Customers can track each shipment through their account page. If an order is delayed, the system will send an e-mail with the latest _____ information.',
    prompt: 'Which word best completes the text?',
    options: ['delivery', 'deliver', 'delivered', 'delivering'],
    answerIndex: 0,
    explanation: 'latest 後面需要名詞修飾 information；delivery information 是「配送資訊」。',
  },
  {
    id: 'p6-hiring',
    part: 'part6',
    category: 'grammar',
    passage: 'Thank you for your interest in the project coordinator position. We have received your application and résumé. Our hiring team will review all materials next week. Candidates selected for an interview _____ by e-mail.',
    prompt: 'Which phrase best completes the text?',
    options: ['will contact', 'will be contacted', 'contacting', 'have contact'],
    answerIndex: 1,
    explanation: 'Candidates 是被聯絡的對象，應使用未來被動式 will be contacted。',
  },
  {
    id: 'p6-library',
    part: 'part6',
    category: 'vocabulary',
    passage: 'The downtown branch will extend its opening hours beginning next month. On weekdays, the office will remain open until 8:00 P.M. This change is intended to make our services more _____ for customers who work during the day.',
    prompt: 'Which word best completes the text?',
    options: ['convenient', 'convenience', 'conveniently', 'convened'],
    answerIndex: 0,
    explanation: 'more 後面需要形容詞，convenient 意為「方便的」，修飾 our services。',
  },
  {
    id: 'p6-meeting',
    part: 'part6',
    category: 'grammar',
    passage: 'Please note that the quarterly planning meeting has been moved to Thursday, October 10. The location remains Conference Room C. Team leaders should review the attached agenda and share any additional topics with the organizer _____ the meeting begins.',
    prompt: 'Which word best completes the text?',
    options: ['while', 'before', 'since', 'although'],
    answerIndex: 1,
    explanation: '與會者應在會議開始前分享議題，before 符合時間先後關係。',
  },
];

app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function isNonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function validateQuestion(question) {
  return question
    && typeof question === 'object'
    && PARTS.includes(question.part)
    && CATEGORIES.includes(question.category)
    && PART_CATEGORIES[question.part].includes(question.category)
    && isNonEmptyString(question.prompt, 500)
    && Array.isArray(question.options)
    && question.options.length === 4
    && question.options.every((option) => isNonEmptyString(option, 300))
    && Number.isInteger(question.answerIndex)
    && question.answerIndex >= 0
    && question.answerIndex < question.options.length
    && isNonEmptyString(question.explanation, 1500)
    && (!question.passage || (typeof question.passage === 'string' && question.passage.length <= 3000))
    && (!question.audioScript || (typeof question.audioScript === 'string' && question.audioScript.length <= 3000))
    && (!['part6', 'part7'].includes(question.part) || isNonEmptyString(question.passage, 3000))
    && (!['part2', 'part3', 'part4'].includes(question.part) || isNonEmptyString(question.audioScript, 3000));
}

async function openAiChat(messages, maxTokens = 1800) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      messages,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI chat request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('OpenAI chat response did not contain a message');
  }

  let result;
  try {
    result = JSON.parse(content);
  } catch {
    throw new Error('OpenAI chat response was not valid JSON');
  }
  return result;
}

async function generateQuestions({ part, topic, category, count }) {
  const formatHint = {
    part2: 'Part 2 question-response: a short spoken workplace question or request in audioScript and four brief spoken responses as the answer choices. Do not include the correct response in the prompt.',
    part3: 'Part 3 conversation: a natural original workplace conversation of 2-3 turns in audioScript and one comprehension question.',
    part4: 'Part 4 talk: an original workplace announcement, voicemail, or short talk in audioScript and one comprehension question.',
    part5: 'Part 5: one original business-English sentence with a single blank and four concise answer choices.',
    part6: 'Part 6: one original short workplace e-mail, notice, or memo (50-100 words) with exactly one _____ blank and four word or phrase choices.',
    part7: 'Part 7: one original business e-mail, notice, or memo (50-100 words) and one comprehension question.',
  }[part];
  if (!formatHint) throw new Error(`Unsupported question type: ${part}`);
  const data = await openAiChat([
    {
      role: 'system',
      content: [
        'Create original English-learning practice questions, not copied from any exam, book, or website.',
        'Return a JSON object with a "questions" array. Every item must contain: part, category, prompt, options (exactly four strings), answerIndex (0-3), explanation (Traditional Chinese), passage (string or empty), audioScript (string or empty).',
        'Allowed category values are grammar, vocabulary, reading, listening. The part must exactly match the requested part.',
        'For Part 2-4, use category listening and put the original spoken question, dialogue, or talk in audioScript. Part 2 answer choices are short spoken responses. For Part 5, use category grammar or vocabulary and an empty passage and audioScript. For Part 6, put the cloze text with a _____ blank in passage. For Part 7, put the reading text in passage.',
        'The correct answer must be unambiguous and the explanation must explain why it is correct.',
      ].join(' '),
    },
    {
      role: 'user',
      content: `Generate ${count} questions. Format: ${formatHint} Topic: ${topic}. Focus category: ${category || 'any suitable category'}.`,
    },
  ]);

  if (!Array.isArray(data.questions) || data.questions.length !== count || !data.questions.every(validateQuestion)) {
    throw new Error('OpenAI generated questions that did not match the required format');
  }

  return data.questions.map((question, index) => ({
    ...question,
    id: `ai-${Date.now()}-${index}`,
    passage: question.passage || '',
    audioScript: question.audioScript || '',
  }));
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function generateWindowsSpeech(text, accent) {
  const encodedScript = Buffer.from(WINDOWS_SPEECH_SCRIPT, 'utf16le').toString('base64');
  const child = spawn('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-EncodedCommand',
    encodedScript,
  ], { windowsHide: true });

  return new Promise((resolve, reject) => {
    const output = [];
    const errors = [];
    let outputSize = 0;
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill();
      finish(new Error('Windows speech synthesis timed out'));
    }, 30000);

    function finish(error, audio) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(audio);
    }

    child.stdout.on('data', (chunk) => {
      outputSize += chunk.length;
      if (outputSize > 20 * 1024 * 1024) {
        child.kill();
        finish(new Error('Windows speech output exceeded the size limit'));
        return;
      }
      output.push(chunk);
    });
    child.stderr.on('data', (chunk) => errors.push(chunk));
    child.on('error', (error) => finish(error));
    child.stdin.on('error', (error) => finish(error));
    child.on('close', (code) => {
      const audio = Buffer.concat(output);
      if (code !== 0 || audio.length < 44 || audio.toString('ascii', 0, 4) !== 'RIFF'
        || audio.toString('ascii', 8, 12) !== 'WAVE') {
        const detail = Buffer.concat(errors).toString('utf8').trim();
        const error = new Error(detail || `Windows speech synthesis exited with code ${code}`);
        if (code === 3) error.code = 'SPEECH_VOICE_UNAVAILABLE';
        finish(error);
        return;
      }
      finish(null, audio);
    });
    child.stdin.end(JSON.stringify({ text, accent }));
  });
}

function getDemoQuestions({ part, category, count }) {
  const questions = demoQuestions.filter((question) => question.part === part);
  const focused = category ? questions.filter((question) => question.category === category) : [];
  const selected = shuffle(focused);
  for (const question of shuffle(questions)) {
    if (selected.length >= count) break;
    if (!selected.some((item) => item.id === question.id)) selected.push(question);
  }
  return selected.slice(0, count);
}

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    aiEnabled: Boolean(process.env.OPENAI_API_KEY),
    localSpeech: process.platform === 'win32',
  });
});

app.post('/api/questions/generate', async (request, response) => {
  const { part, category, count = 5 } = request.body || {};
  const rawTopic = request.body?.topic === undefined ? 'workplace and business' : request.body.topic;
  if (!PARTS.includes(part)) {
    return response.status(400).json({ error: `part must be one of: ${PARTS.join(', ')}` });
  }
  if (category !== undefined && !PART_CATEGORIES[part].includes(category)) {
    return response.status(400).json({ error: 'category is not supported' });
  }
  if (!Number.isInteger(count) || count < 1 || count > 5) {
    return response.status(400).json({ error: 'count must be an integer from 1 to 5' });
  }
  if (!isNonEmptyString(rawTopic, 80)) {
    return response.status(400).json({ error: 'topic must be a non-empty string of at most 80 characters' });
  }
  const topic = rawTopic.trim();

  if (!process.env.OPENAI_API_KEY) {
    return response.json({
      source: 'demo',
      questions: getDemoQuestions({ part, category, count }),
    });
  }

  try {
    const questions = await generateQuestions({ part, topic: topic.trim(), category, count });
    return response.json({ source: 'openai', questions });
  } catch (error) {
    console.error('Question generation failed:', error.message);
    return response.status(502).json({ error: 'AI question generation failed. Please try again later.' });
  }
});

app.post('/api/explanations', async (request, response) => {
  const { question, selectedIndex } = request.body || {};
  if (!validateQuestion(question) || !Number.isInteger(selectedIndex)
    || selectedIndex < 0 || selectedIndex >= question.options.length) {
    return response.status(400).json({ error: 'question or selectedIndex is invalid' });
  }

  const correctAnswer = question.options[question.answerIndex];
  const selectedAnswer = question.options[selectedIndex];
  if (!process.env.OPENAI_API_KEY) {
    const result = selectedIndex === question.answerIndex
      ? `答對了！正確答案是「${correctAnswer}」。${question.explanation}`
      : `你選了「${selectedAnswer}」，正確答案是「${correctAnswer}」。${question.explanation}`;
    return response.json({ explanation: result, source: 'demo' });
  }

  try {
    const data = await openAiChat([
      {
        role: 'system',
        content: '你是親切、精準的繁體中文商務英文家教。只根據提供的題目解釋正解與使用者選項的差異；若題目資訊不足要明說，不要編造文法規則。回傳 JSON：{"explanation":"..."}。',
      },
      {
        role: 'user',
        content: JSON.stringify({
          part: question.part,
          passage: question.passage || '',
          prompt: question.prompt,
          options: question.options,
          correctAnswer,
          selectedAnswer,
          baseExplanation: question.explanation,
        }),
      },
    ], 700);
    if (!isNonEmptyString(data.explanation, 2000)) {
      throw new Error('OpenAI explanation response did not match the required format');
    }
    return response.json({ explanation: data.explanation, source: 'openai' });
  } catch (error) {
    console.error('Explanation generation failed:', error.message);
    return response.status(502).json({ error: 'AI explanation failed. Please try again later.' });
  }
});

app.post('/api/speech', async (request, response) => {
  const { text, accent } = request.body || {};
  if (!isNonEmptyString(text, 3000) || !Object.prototype.hasOwnProperty.call(ACCENTS, accent)) {
    return response.status(400).json({ error: 'text or accent is invalid' });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    if (process.platform !== 'win32') {
      return response.status(503).json({ error: 'Cloud speech is not configured and local speech is unavailable' });
    }
    try {
      const audio = await generateWindowsSpeech(text, accent);
      response.set('Content-Type', 'audio/wav');
      response.set('Cache-Control', 'no-store');
      response.set('X-Speech-Source', 'local');
      return response.send(audio);
    } catch (error) {
      if (error.code === 'SPEECH_VOICE_UNAVAILABLE') {
        return response.status(503).json({ error: `No Windows speech voice is installed for ${accent}. Select an installed accent or configure OPENAI_API_KEY for cloud TTS.` });
      }
      console.error('Local speech generation failed:', error.message);
      return response.status(502).json({ error: 'Local speech generation failed. Please try again later.' });
    }
  }

  try {
    const speechResponse = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: 'alloy',
        input: text,
        instructions: `Speak clearly in a natural ${ACCENTS[accent]} English accent.`,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!speechResponse.ok) {
      throw new Error(`OpenAI speech request failed with HTTP ${speechResponse.status}`);
    }
    response.set('Content-Type', speechResponse.headers.get('content-type') || 'audio/mpeg');
    response.set('Cache-Control', 'no-store');
    return response.send(Buffer.from(await speechResponse.arrayBuffer()));
  } catch (error) {
    console.error('Speech generation failed:', error.message);
    return response.status(502).json({ error: 'Cloud speech generation failed. Please try again later.' });
  }
});

app.use((error, _request, response, _next) => {
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Request body is too large' });
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON' });
  }
  console.error('Request failed:', error.message);
  return response.status(500).json({ error: 'An unexpected server error occurred' });
});

if (require.main === module) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Adaptive TOEIC practice is available at http://127.0.0.1:${PORT}`);
  });
}

module.exports = { app, demoQuestions, getDemoQuestions, validateQuestion };
